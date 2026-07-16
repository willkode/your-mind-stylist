import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { product_key, product_id } = body;

    if (!product_key && !product_id) {
      return Response.json({ error: 'product_key or product_id is required' }, { status: 400 });
    }

    // Get the product by key or ID
    let products;
    if (product_id) {
      products = await base44.entities.Product.filter({ id: product_id });
    } else {
      products = await base44.entities.Product.filter({ key: product_key });
    }
    if (!products || products.length === 0) {
      return Response.json({ 
        owns_product: false, 
        product_found: false 
      });
    }

    const product = products[0];

    let hasAccess = false;
    let accessDetails = null;

    // Check 1: Direct product ownership via purchased_product_ids on User
    const purchasedIds = user.purchased_product_ids || [];
    if (purchasedIds.includes(product.id)) {
      hasAccess = true;
      accessDetails = {
        type: 'purchased',
        link: 'ClientPortal'
      };
    }

    // Check 1.5: Variant-aware lookup — if this is a parent product with purchase_options,
    // check if the user owns any of the child variant products referenced in those options.
    // This covers the case where user buys "Book Title - Audiobook" (variant) but we're checking
    // access against the parent product ID.
    if (!hasAccess && product.purchase_options?.length > 0 && purchasedIds.length > 0) {
      for (const opt of product.purchase_options) {
        // Check bundle_product_id
        if (opt.bundle_product_id && purchasedIds.includes(opt.bundle_product_id)) {
          hasAccess = true;
          accessDetails = { type: 'purchased_variant', link: 'ClientPortal' };
          break;
        }
        // Check product_id (can be string or array)
        const variantId = opt.product_id;
        if (variantId) {
          if (Array.isArray(variantId)) {
            // Bundle-type option with multiple product IDs — user owns if they have any
            if (variantId.some(id => purchasedIds.includes(id))) {
              hasAccess = true;
              accessDetails = { type: 'purchased_variant', link: 'ClientPortal' };
              break;
            }
          } else if (typeof variantId === 'string') {
            // Could be a JSON-encoded array string or a plain ID
            let ids = [variantId];
            if (variantId.startsWith('[')) {
              try { ids = JSON.parse(variantId); } catch (e) { /* keep as single */ }
            }
            if (ids.some(id => purchasedIds.includes(id))) {
              hasAccess = true;
              accessDetails = { type: 'purchased_variant', link: 'ClientPortal' };
              break;
            }
          }
        }
      }
    }

    // Check 2: Course access via related_course_id OR access_grants
    if (!hasAccess) {
      const courseIdsToCheck = [];
      if (product.related_course_id) courseIdsToCheck.push(product.related_course_id);
      if (product.access_grants?.length > 0) courseIdsToCheck.push(...product.access_grants);

      for (const courseId of courseIdsToCheck) {
        const courseProgress = await base44.entities.UserCourseProgress.filter({
          user_id: user.id,
          course_id: courseId
        });
        if (courseProgress.length > 0) {
          hasAccess = true;
          accessDetails = {
            type: 'course',
            id: courseId,
            link: `CoursePage?id=${courseId}`
          };
          break;
        }
      }
    }

    // Check for webinar access
    if (!hasAccess && product.related_webinar_id) {
      const webinarAccess = await base44.entities.UserWebinarAccess.filter({
        user_email: user.email,
        webinar_id: product.related_webinar_id
      });
      
      if (webinarAccess.length > 0) {
        hasAccess = true;
        accessDetails = {
          type: 'webinar',
          id: product.related_webinar_id,
          link: `WebinarPage?id=${product.related_webinar_id}`
        };
      }
    }

    // Check for active subscription (for Pocket Visualization)
    if (!hasAccess && product.key === 'pocket-visualization') {
      if (user.pocket_visualization_active) {
        hasAccess = true;
        accessDetails = {
          type: 'subscription',
          link: 'StylePauses'
        };
      }
    }

    // Check for bookings (for consultation/certification products)
    if (!hasAccess && ['consultation', 'certification', 'private_sessions'].includes(product.type)) {
      const bookings = await base44.entities.Booking.filter({
        user_email: user.email,
        booking_status: 'confirmed'
      });
      
      if (bookings.length > 0) {
        hasAccess = true;
        accessDetails = {
          type: 'booking',
          link: 'ClientBookings'
        };
      }
    }

    return Response.json({
      owns_product: hasAccess,
      product_found: true,
      product_name: product.name,
      access_details: accessDetails
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});