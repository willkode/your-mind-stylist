import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * autoProvisionOnSignup
 * 
 * Triggered by entity automation on User create.
 * Also callable manually as a "Provision Access Now" fallback.
 * 
 * Flow:
 *   1. Get user email from the trigger payload or manual { email } param
 *   2. Find matching Lead by email
 *   3. Link Lead.user_id → User.id
 *   4. Set Lead.invite_status = 'accepted', invite_accepted_at = now
 *   5. Process all pending_access_grants:
 *      - grant_product → add to User.purchased_product_ids + auto-enroll linked courses
 *      - enroll_course → create UserCourseProgress
 *      - grant_webinar → create UserWebinarAccess
 *   6. Skip protected items, already-provisioned items
 *   7. Mark grants as provisioned on the Lead
 *   8. Idempotent — safe to run multiple times
 *   9. Does NOT send any emails
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  let email = null;
  let userId = null;
  let isAutomation = false;

  // ── Determine source: entity automation or manual call ──
  const body = await req.json().catch(() => ({}));

  if (body.event && body.data) {
    // Entity automation payload
    isAutomation = true;
    email = body.data?.email?.toLowerCase?.()?.trim?.();
    userId = body.event?.entity_id || body.data?.id;
    console.log(`[autoProvisionOnSignup] Automation trigger: User created — ${email} (${userId})`);
  } else if (body.email) {
    // Manual invocation: { email: "..." }
    // Requires admin auth for manual calls
    const caller = await base44.auth.me().catch(() => null);
    if (!caller || (caller.role !== 'admin' && caller.custom_role !== 'manager')) {
      return Response.json({ error: 'Admin or manager access required for manual invocation' }, { status: 403 });
    }
    email = body.email.toLowerCase().trim();
    console.log(`[autoProvisionOnSignup] Manual invocation for: ${email} by ${caller.email}`);
  } else {
    return Response.json({ error: 'No email found in payload' }, { status: 400 });
  }

  if (!email) {
    return Response.json({ error: 'Could not determine user email' }, { status: 400 });
  }

  const nowISO = new Date().toISOString();
  const result = {
    email,
    user_id: userId,
    is_automation: isAutomation,
    lead_found: false,
    lead_id: null,
    lead_linked: false,
    invite_status_updated: false,
    grants_processed: 0,
    grants_provisioned: 0,
    grants_skipped: 0,
    grants_failed: 0,
    protected_skipped: 0,
    actions: [],
    errors: [],
    emails_sent: 0,
  };

  // ── 1. Find the User (if not from automation, we need to look them up) ──
  let targetUser;
  if (userId) {
    try {
      const users = await base44.asServiceRole.entities.User.filter({ email });
      targetUser = users.find(u => u.id === userId) || users[0];
    } catch (e) {
      // If filter fails, try to get by what we have
      const users = await base44.asServiceRole.entities.User.filter({ email });
      targetUser = users[0];
    }
  } else {
    const users = await base44.asServiceRole.entities.User.filter({ email });
    targetUser = users[0];
  }

  if (!targetUser) {
    console.log(`[autoProvisionOnSignup] No User found for ${email} — skipping`);
    return Response.json({ ...result, message: `No User account found for ${email}. They may not have signed up yet.` });
  }
  result.user_id = targetUser.id;

  // ── 2. Find matching Lead ──
  const leads = await base44.asServiceRole.entities.Lead.filter({ email });
  if (leads.length === 0) {
    console.log(`[autoProvisionOnSignup] No Lead found for ${email} — no migration data to provision`);
    return Response.json({ ...result, message: `No Lead record found for ${email}. Nothing to provision.` });
  }
  const lead = leads[0];
  result.lead_found = true;
  result.lead_id = lead.id;

  // ── 3. Link Lead to User ──
  const leadUpdates = {};

  if (lead.user_id !== targetUser.id) {
    leadUpdates.user_id = targetUser.id;
    result.lead_linked = true;
    console.log(`[autoProvisionOnSignup] Linking Lead ${lead.id} → User ${targetUser.id}`);
  }

  // ── 4. Update invite status ──
  if (lead.invite_status !== 'accepted') {
    leadUpdates.invite_status = 'accepted';
    leadUpdates.invite_accepted_at = nowISO;
    result.invite_status_updated = true;
    console.log(`[autoProvisionOnSignup] Marking invite as accepted for ${email}`);
  }

  // ── 5. Process pending_access_grants ──
  const grants = lead.pending_access_grants || [];
  result.grants_processed = grants.length;

  if (grants.length === 0) {
    // Still update lead linkage even if no grants
    if (Object.keys(leadUpdates).length > 0) {
      await base44.asServiceRole.entities.Lead.update(lead.id, leadUpdates);
    }
    console.log(`[autoProvisionOnSignup] No pending grants for ${email} — lead linked, done`);
    return Response.json({ ...result, message: `Lead linked. No pending_access_grants to provision.` });
  }

  let purchasedIds = targetUser.purchased_product_ids || [];
  if (!Array.isArray(purchasedIds)) purchasedIds = [];

  for (let i = 0; i < grants.length; i++) {
    const grant = grants[i];

    // Skip already provisioned
    if (grant.status === 'provisioned') {
      result.grants_skipped++;
      result.actions.push({ index: i, item: grant.platform_item_name, action: 'skipped', reason: 'already provisioned' });
      continue;
    }

    // Skip protected items
    if (grant.protected) {
      result.protected_skipped++;
      result.actions.push({ index: i, item: grant.platform_item_name, action: 'skipped', reason: 'protected — requires manual approval' });
      continue;
    }

    try {
      if (grant.action_type === 'grant_product' && grant.product_id) {
        // ── Grant Product ──
        if (!purchasedIds.includes(grant.product_id)) {
          purchasedIds = [...purchasedIds, grant.product_id];
          result.actions.push({ index: i, item: grant.platform_item_name, action: 'granted_product', product_id: grant.product_id });
        } else {
          result.actions.push({ index: i, item: grant.platform_item_name, action: 'skipped_duplicate', reason: 'User already has this product' });
        }

        // Auto-enroll in linked courses
        try {
          const product = await base44.asServiceRole.entities.Product.get(grant.product_id);
          if (product) {
            const courseIds = [];
            if (product.related_course_id) courseIds.push(product.related_course_id);
            if (product.access_grants?.length > 0) courseIds.push(...product.access_grants);

            for (const courseId of courseIds) {
              const existing = await base44.asServiceRole.entities.UserCourseProgress.filter({
                user_id: targetUser.id, course_id: courseId,
              });
              if (existing.length === 0) {
                await base44.asServiceRole.entities.UserCourseProgress.create({
                  user_id: targetUser.id, course_id: courseId,
                  status: 'not_started', completion_percentage: 0, started_date: nowISO,
                });
                result.actions.push({ index: i, item: grant.platform_item_name, action: 'auto_enrolled_course', course_id: courseId });
              }
            }

            // Auto-grant webinar if product has related_webinar_id
            if (product.related_webinar_id) {
              const existingW = await base44.asServiceRole.entities.UserWebinarAccess.filter({
                user_email: email, webinar_id: product.related_webinar_id,
              });
              if (existingW.length === 0) {
                await base44.asServiceRole.entities.UserWebinarAccess.create({
                  user_email: email, webinar_id: product.related_webinar_id,
                  access_type: 'purchased', granted_date: nowISO,
                });
                result.actions.push({ index: i, item: grant.platform_item_name, action: 'auto_granted_webinar', webinar_id: product.related_webinar_id });
              }
            }
          }
        } catch (productErr) {
          console.error(`[autoProvisionOnSignup] Error looking up product for grant ${i}:`, productErr.message);
        }

        grants[i] = { ...grant, status: 'provisioned', provisioned_at: nowISO, provisioned_user_id: targetUser.id };
        result.grants_provisioned++;

      } else if (grant.action_type === 'enroll_course' && grant.course_id) {
        // ── Enroll Course ──
        const existing = await base44.asServiceRole.entities.UserCourseProgress.filter({
          user_id: targetUser.id, course_id: grant.course_id,
        });
        if (existing.length === 0) {
          await base44.asServiceRole.entities.UserCourseProgress.create({
            user_id: targetUser.id, course_id: grant.course_id,
            status: 'not_started', completion_percentage: 0, started_date: nowISO,
          });
          result.actions.push({ index: i, item: grant.platform_item_name, action: 'enrolled_course', course_id: grant.course_id });
        } else {
          result.actions.push({ index: i, item: grant.platform_item_name, action: 'skipped_duplicate', reason: 'Already enrolled' });
        }
        grants[i] = { ...grant, status: 'provisioned', provisioned_at: nowISO, provisioned_user_id: targetUser.id };
        result.grants_provisioned++;

      } else if (grant.action_type === 'grant_webinar' && grant.webinar_id) {
        // ── Grant Webinar ──
        const existing = await base44.asServiceRole.entities.UserWebinarAccess.filter({
          user_email: email, webinar_id: grant.webinar_id,
        });
        if (existing.length === 0) {
          await base44.asServiceRole.entities.UserWebinarAccess.create({
            user_email: email, webinar_id: grant.webinar_id,
            access_type: 'purchased', granted_date: nowISO,
          });
          result.actions.push({ index: i, item: grant.platform_item_name, action: 'granted_webinar', webinar_id: grant.webinar_id });
        } else {
          result.actions.push({ index: i, item: grant.platform_item_name, action: 'skipped_duplicate', reason: 'Already has webinar access' });
        }
        grants[i] = { ...grant, status: 'provisioned', provisioned_at: nowISO, provisioned_user_id: targetUser.id };
        result.grants_provisioned++;

      } else {
        result.grants_failed++;
        result.actions.push({ index: i, item: grant.platform_item_name, action: 'skipped', reason: `Unknown action_type '${grant.action_type}' or missing ID` });
        grants[i] = { ...grant, status: 'failed' };
      }
    } catch (err) {
      console.error(`[autoProvisionOnSignup] Error on grant ${i}:`, err.message);
      result.grants_failed++;
      result.errors.push({ index: i, item: grant.platform_item_name, error: err.message });
      grants[i] = { ...grant, status: 'failed' };
    }
  }

  // ── 6. Save updated purchased_product_ids on User ──
  const originalIds = targetUser.purchased_product_ids || [];
  const newIds = purchasedIds.filter(id => !originalIds.includes(id));
  if (newIds.length > 0) {
    await base44.asServiceRole.entities.User.update(targetUser.id, {
      purchased_product_ids: purchasedIds,
    });
    console.log(`[autoProvisionOnSignup] Added ${newIds.length} product(s) to User ${targetUser.id}`);
  }
  result.products_added = newIds;

  // ── 7. Save all Lead updates ──
  leadUpdates.pending_access_grants = grants;
  
  // Append provisioning note
  const existingNotes = lead.notes || '';
  const dateStr = new Date().toLocaleDateString();
  const provNote = `[${dateStr}] Auto-provisioned ${result.grants_provisioned} grant(s) on signup`;
  leadUpdates.notes = `${existingNotes}\n${provNote}`.trim();

  await base44.asServiceRole.entities.Lead.update(lead.id, leadUpdates);

  console.log(`[autoProvisionOnSignup] Done for ${email}: ${result.grants_provisioned} provisioned, ${result.grants_skipped} skipped, ${result.protected_skipped} protected, ${result.grants_failed} failed`);
  return Response.json(result);
});