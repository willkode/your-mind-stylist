import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * provisionPendingAccess
 * 
 * Reads pending_access_grants from a Lead record and provisions actual access
 * on the corresponding User account. Idempotent — skips already-provisioned grants.
 * 
 * Input: { email: string }
 * 
 * For each pending grant:
 *   - grant_product  → adds product ID to User.purchased_product_ids
 *   - enroll_course  → creates UserCourseProgress record
 *   - grant_webinar  → creates UserWebinarAccess record
 * 
 * Does NOT send any emails.
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const caller = await base44.auth.me();
  if (caller?.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const email = (body.email || '').toLowerCase().trim();
  if (!email) {
    return Response.json({ error: 'email is required' }, { status: 400 });
  }

  const nowISO = new Date().toISOString();
  const results = {
    email,
    grants_before: [],
    grants_after: [],
    actions: [],
    errors: [],
  };

  // ── 1. Find Lead ────────────────────────────────────────────────────
  const leads = await base44.asServiceRole.entities.Lead.filter({ email });
  if (leads.length === 0) {
    return Response.json({ error: `No Lead found for ${email}` }, { status: 404 });
  }
  const lead = leads[0];
  const grants = lead.pending_access_grants || [];
  results.lead_id = lead.id;
  results.grants_before = JSON.parse(JSON.stringify(grants));

  if (grants.length === 0) {
    return Response.json({ ...results, message: 'No pending_access_grants on this Lead.' });
  }

  // ── 2. Find User ────────────────────────────────────────────────────
  const users = await base44.asServiceRole.entities.User.filter({ email });
  if (users.length === 0) {
    return Response.json({ error: `No User account found for ${email}. They must accept the invite first.` }, { status: 404 });
  }
  const targetUser = users[0];
  results.user_id = targetUser.id;

  // Current purchased product IDs on the user
  let purchasedIds = targetUser.purchased_product_ids || [];

  // ── 3. Process each grant ───────────────────────────────────────────
  for (let i = 0; i < grants.length; i++) {
    const grant = grants[i];

    // Skip already provisioned
    if (grant.status === 'provisioned') {
      results.actions.push({
        index: i,
        item: grant.platform_item_name,
        action: 'skipped',
        reason: 'already provisioned',
      });
      continue;
    }

    // Skip protected items (require manual approval)
    if (grant.protected) {
      results.actions.push({
        index: i,
        item: grant.platform_item_name,
        action: 'skipped',
        reason: 'protected — requires manual approval',
      });
      continue;
    }

    try {
      if (grant.action_type === 'grant_product' && grant.product_id) {
        // ── Grant Product ──────────────────────────────────────
        if (purchasedIds.includes(grant.product_id)) {
          results.actions.push({
            index: i,
            item: grant.platform_item_name,
            action: 'skipped_duplicate',
            reason: 'User already has this product',
          });
        } else {
          purchasedIds = [...purchasedIds, grant.product_id];
          results.actions.push({
            index: i,
            item: grant.platform_item_name,
            action: 'granted_product',
            product_id: grant.product_id,
          });
        }

        // ── Auto-enroll in linked courses if product has them ──
        const product = await base44.asServiceRole.entities.Product.get(grant.product_id);
        if (product) {
          const courseIdsToEnroll = [];
          if (product.related_course_id) courseIdsToEnroll.push(product.related_course_id);
          if (product.access_grants?.length > 0) courseIdsToEnroll.push(...product.access_grants);

          for (const courseId of courseIdsToEnroll) {
            const existingEnroll = await base44.asServiceRole.entities.UserCourseProgress.filter({
              user_id: targetUser.id,
              course_id: courseId,
            });
            if (existingEnroll.length === 0) {
              await base44.asServiceRole.entities.UserCourseProgress.create({
                user_id: targetUser.id,
                course_id: courseId,
                status: 'not_started',
                completion_percentage: 0,
                started_date: nowISO,
              });
              results.actions.push({
                index: i,
                item: grant.platform_item_name,
                action: 'auto_enrolled_course',
                course_id: courseId,
                reason: 'Product has related_course_id or access_grants',
              });
            }
          }

          // ── Auto-grant webinar access if product has related_webinar_id ──
          if (product.related_webinar_id) {
            const existingWebinar = await base44.asServiceRole.entities.UserWebinarAccess.filter({
              user_email: email,
              webinar_id: product.related_webinar_id,
            });
            if (existingWebinar.length === 0) {
              await base44.asServiceRole.entities.UserWebinarAccess.create({
                user_email: email,
                webinar_id: product.related_webinar_id,
                access_type: 'purchased',
                granted_date: nowISO,
              });
              results.actions.push({
                index: i,
                item: grant.platform_item_name,
                action: 'auto_granted_webinar',
                webinar_id: product.related_webinar_id,
              });
            }
          }
        }

        // Mark provisioned either way
        grants[i] = {
          ...grant,
          status: 'provisioned',
          provisioned_at: nowISO,
          provisioned_user_id: targetUser.id,
        };

      } else if (grant.action_type === 'enroll_course' && grant.course_id) {
        // ── Enroll Course ──────────────────────────────────────
        const existing = await base44.asServiceRole.entities.UserCourseProgress.filter({
          user_id: targetUser.id,
          course_id: grant.course_id,
        });
        if (existing.length > 0) {
          results.actions.push({
            index: i,
            item: grant.platform_item_name,
            action: 'skipped_duplicate',
            reason: 'Already enrolled',
          });
        } else {
          await base44.asServiceRole.entities.UserCourseProgress.create({
            user_id: targetUser.id,
            course_id: grant.course_id,
            status: 'not_started',
            completion_percentage: 0,
            started_date: nowISO,
          });
          results.actions.push({
            index: i,
            item: grant.platform_item_name,
            action: 'enrolled_course',
            course_id: grant.course_id,
          });
        }
        grants[i] = {
          ...grant,
          status: 'provisioned',
          provisioned_at: nowISO,
          provisioned_user_id: targetUser.id,
        };

      } else if (grant.action_type === 'grant_webinar' && grant.webinar_id) {
        // ── Grant Webinar Access ───────────────────────────────
        const existing = await base44.asServiceRole.entities.UserWebinarAccess.filter({
          user_email: email,
          webinar_id: grant.webinar_id,
        });
        if (existing.length > 0) {
          results.actions.push({
            index: i,
            item: grant.platform_item_name,
            action: 'skipped_duplicate',
            reason: 'Already has webinar access',
          });
        } else {
          await base44.asServiceRole.entities.UserWebinarAccess.create({
            user_email: email,
            webinar_id: grant.webinar_id,
            access_type: 'purchased',
            granted_date: nowISO,
          });
          results.actions.push({
            index: i,
            item: grant.platform_item_name,
            action: 'granted_webinar',
            webinar_id: grant.webinar_id,
          });
        }
        grants[i] = {
          ...grant,
          status: 'provisioned',
          provisioned_at: nowISO,
          provisioned_user_id: targetUser.id,
        };

      } else {
        // Unknown grant type or missing ID
        results.actions.push({
          index: i,
          item: grant.platform_item_name,
          action: 'skipped',
          reason: `Unknown action_type '${grant.action_type}' or missing ID`,
        });
        grants[i] = { ...grant, status: 'failed' };
      }
    } catch (err) {
      console.error(`[provisionPendingAccess] Error on grant ${i}:`, err.message);
      results.errors.push({ index: i, item: grant.platform_item_name, error: err.message });
      grants[i] = { ...grant, status: 'failed' };
    }
  }

  // ── 4. Save updated purchased_product_ids on User ───────────────────
  const originalIds = targetUser.purchased_product_ids || [];
  const newIds = purchasedIds.filter(id => !originalIds.includes(id));
  if (newIds.length > 0) {
    await base44.asServiceRole.entities.User.update(targetUser.id, {
      purchased_product_ids: purchasedIds,
    });
    console.log(`[provisionPendingAccess] Added ${newIds.length} product(s) to User ${targetUser.id}`);
  }

  // ── 5. Save updated grants back to Lead ─────────────────────────────
  await base44.asServiceRole.entities.Lead.update(lead.id, {
    pending_access_grants: grants,
  });

  results.grants_after = grants;
  results.products_added_to_user = newIds;
  results.total_provisioned = grants.filter(g => g.status === 'provisioned').length;
  results.total_skipped = results.actions.filter(a => a.action === 'skipped' || a.action === 'skipped_duplicate').length;
  results.total_failed = results.errors.length;
  results.emails_sent = 0; // Explicitly zero — no emails during provisioning

  console.log(`[provisionPendingAccess] Done: ${results.total_provisioned} provisioned, ${results.total_skipped} skipped, ${results.total_failed} failed`);
  return Response.json(results);
});