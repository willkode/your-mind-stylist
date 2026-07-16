import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * checkAudiobookAccess — comprehensive audiobook access check.
 *
 * Checks ALL possible ownership paths:
 * 1. Free / ungated audiobook → always allowed
 * 2. Manager/admin bypass → always allowed for admin or creator-manager
 * 3. Direct product ownership: user.purchased_product_ids contains audiobook.product_id
 * 4. Variant lookup: any Product whose purchase_options has audiobook_id == this audiobook → check if user owns that variant product_id
 * 5. Parent product fallback: call checkProductOwnership for audiobook.product_id (covers course enrollment, bundle, webinar, subscription checks)
 *
 * Accepts { audiobook_id } or { audiobook_ids: [...] } for batch checks.
 * Returns { access: { [audiobook_id]: boolean } }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const ids = body.audiobook_ids || (body.audiobook_id ? [body.audiobook_id] : []);

    if (ids.length === 0) {
      return Response.json({ error: 'audiobook_id or audiobook_ids required' }, { status: 400 });
    }

    // Admin always has access
    const isAdmin = user.role === 'admin';

    // Get user's purchased product IDs (the primary ownership signal)
    const purchasedIds = user.purchased_product_ids || [];

    // Fetch all audiobooks requested
    const allAudiobooks = await base44.entities.Audiobook.filter({});
    const requestedAudiobooks = allAudiobooks.filter(ab => ids.includes(ab.id));

    // Pre-fetch all products with purchase_options that reference any of these audiobooks
    // This resolves the variant/parent relationship
    const allProducts = await base44.entities.Product.filter({});

    // Build reverse map: audiobook_id → set of product IDs that grant access
    // This captures variant products referenced in purchase_options
    const audiobookToGrantingProductIds = {};
    for (const ab of requestedAudiobooks) {
      const grantingIds = new Set();

      // 1. The audiobook's own product_id
      if (ab.product_id) {
        grantingIds.add(ab.product_id);
      }

      // 2. Any product whose purchase_options lists this audiobook's audiobook_id
      for (const product of allProducts) {
        if (!product.purchase_options || product.purchase_options.length === 0) continue;
        for (const opt of product.purchase_options) {
          if (opt.audiobook_id === ab.id) {
            // The variant product_id that the user actually buys
            if (opt.product_id) {
              grantingIds.add(opt.product_id);
            }
            // The bundle_product_id if it's a bundle variant
            if (opt.bundle_product_id) {
              grantingIds.add(opt.bundle_product_id);
            }
            // The parent product itself (in case user bought the parent directly)
            grantingIds.add(product.id);
          }
        }
      }

      // 3. Any product whose purchase_options has a product_id matching the audiobook's product_id
      // (reverse: audiobook.product_id is a variant, and user might own the parent)
      if (ab.product_id) {
        for (const product of allProducts) {
          if (!product.purchase_options || product.purchase_options.length === 0) continue;
          for (const opt of product.purchase_options) {
            if (opt.product_id === ab.product_id || opt.bundle_product_id === ab.product_id) {
              grantingIds.add(product.id);
            }
          }
          // Also check bundled_product_ids
          if (product.bundled_product_ids?.includes(ab.product_id)) {
            grantingIds.add(product.id);
          }
        }
      }

      audiobookToGrantingProductIds[ab.id] = grantingIds;
    }

    // Build access result
    const access = {};

    for (const ab of requestedAudiobooks) {
      // Free audiobooks
      if (ab.access_level === 'free' || !ab.product_id) {
        access[ab.id] = true;
        continue;
      }

      // Admin bypass
      if (isAdmin) {
        access[ab.id] = true;
        continue;
      }

      // Manager bypass: creator of this audiobook
      if (user.role === 'manager' && ab.created_by === user.email) {
        access[ab.id] = true;
        continue;
      }

      // Check purchased_product_ids against all granting product IDs
      const grantingIds = audiobookToGrantingProductIds[ab.id] || new Set();
      const hasDirect = purchasedIds.some(pid => grantingIds.has(pid));

      if (hasDirect) {
        access[ab.id] = true;
        continue;
      }

      // Fallback: use checkProductOwnership for deeper checks
      // (course enrollment, webinar access, subscription, etc.)
      let hasDeep = false;
      for (const grantId of grantingIds) {
        // Verify the product still exists before checking
        const productExists = allProducts.some(p => p.id === grantId);
        if (!productExists) continue;

        const result = await base44.functions.invoke('checkProductOwnership', {
          product_id: grantId,
        });
        if (result.data?.owns_product || result.data?.has_access) {
          hasDeep = true;
          break;
        }
      }

      access[ab.id] = hasDeep;
    }

    // Fill in any IDs that weren't found as audiobooks
    for (const id of ids) {
      if (!(id in access)) {
        access[id] = false;
      }
    }

    return Response.json({ access });

  } catch (error) {
    console.error('checkAudiobookAccess error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});