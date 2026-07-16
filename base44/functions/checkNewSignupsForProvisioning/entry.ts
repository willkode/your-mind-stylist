import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * checkNewSignupsForProvisioning
 * 
 * Scheduled automation (every 5 minutes).
 * 
 * Finds Leads with invite_status='invited' that don't yet have a user_id,
 * checks if a User account now exists for that email (they signed up),
 * and if so: links the Lead, marks accepted, provisions all pending_access_grants.
 * 
 * This closes the provisioning loop for Path B (branded-email-only + open registration).
 * 
 * Also callable manually with { email } for single-user provisioning (manager fallback).
 * 
 * Idempotent — safe to run repeatedly.
 * Does NOT send any emails.
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json().catch(() => ({}));
  const nowISO = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString();

  // ── Manual single-user mode ──
  if (body.email) {
    const caller = await base44.auth.me().catch(() => null);
    if (!caller || (caller.role !== 'admin' && caller.custom_role !== 'manager')) {
      return Response.json({ error: 'Admin or manager access required' }, { status: 403 });
    }
    console.log(`[provisionCheck] Manual mode for: ${body.email}`);
    const result = await provisionForEmail(base44, body.email.toLowerCase().trim(), nowISO, dateStr);
    return Response.json(result);
  }

  // ── Scheduled batch mode ──
  console.log('[provisionCheck] Scheduled scan starting...');

  // Find all Leads with invite_status='invited' and no user_id
  const invitedLeads = await base44.asServiceRole.entities.Lead.filter(
    { invite_status: 'invited' }, '-updated_date', 200
  );

  const unlinkedLeads = invitedLeads.filter(l => !l.user_id && l.email);
  console.log(`[provisionCheck] Found ${unlinkedLeads.length} invited leads without user_id`);

  if (unlinkedLeads.length === 0) {
    return Response.json({ status: 'no_pending', scanned: invitedLeads.length, unlinked: 0, provisioned: 0 });
  }

  // Get all users to batch-match
  const allUsers = await base44.asServiceRole.entities.User.list();
  const userByEmail = {};
  for (const u of allUsers) {
    if (u.email) userByEmail[u.email.toLowerCase()] = u;
  }

  const results = [];
  let provisionedCount = 0;

  for (const lead of unlinkedLeads) {
    const email = lead.email.toLowerCase().trim();
    const matchedUser = userByEmail[email];

    if (!matchedUser) continue; // User hasn't signed up yet

    console.log(`[provisionCheck] Found new signup: ${email} → User ${matchedUser.id}`);
    const result = await provisionSingleLead(base44, lead, matchedUser, nowISO, dateStr);
    results.push(result);
    if (result.grants_provisioned > 0 || result.lead_linked) provisionedCount++;
  }

  console.log(`[provisionCheck] Done. Provisioned ${provisionedCount} of ${unlinkedLeads.length} unlinked leads.`);

  return Response.json({
    status: 'scan_complete',
    scanned: invitedLeads.length,
    unlinked: unlinkedLeads.length,
    matched_to_users: results.length,
    provisioned: provisionedCount,
    results,
  });
});

/**
 * Manual fallback: provision by email
 */
async function provisionForEmail(base44, email, nowISO, dateStr) {
  const leads = await base44.asServiceRole.entities.Lead.filter({ email });
  if (leads.length === 0) {
    return { email, error: 'No Lead found' };
  }
  const lead = leads[0];

  const users = await base44.asServiceRole.entities.User.filter({ email });
  if (users.length === 0) {
    return { email, lead_id: lead.id, error: 'No User account found — they may not have signed up yet' };
  }

  return provisionSingleLead(base44, lead, users[0], nowISO, dateStr);
}

/**
 * Core provisioning logic for a single Lead + User pair
 */
async function provisionSingleLead(base44, lead, targetUser, nowISO, dateStr) {
  const email = lead.email.toLowerCase().trim();
  const result = {
    email,
    lead_id: lead.id,
    user_id: targetUser.id,
    lead_linked: false,
    invite_status_updated: false,
    grants_processed: 0,
    grants_provisioned: 0,
    grants_skipped: 0,
    grants_failed: 0,
    protected_skipped: 0,
    products_added: [],
    actions: [],
    errors: [],
  };

  const leadUpdates = {};

  // ── Link Lead → User ──
  if (lead.user_id !== targetUser.id) {
    leadUpdates.user_id = targetUser.id;
    result.lead_linked = true;
  }

  // ── Update invite status ──
  if (lead.invite_status !== 'accepted') {
    leadUpdates.invite_status = 'accepted';
    leadUpdates.invite_accepted_at = nowISO;
    result.invite_status_updated = true;
  }

  // ── Process grants ──
  const grants = lead.pending_access_grants || [];
  result.grants_processed = grants.length;

  if (grants.length === 0) {
    if (Object.keys(leadUpdates).length > 0) {
      const existingNotes = lead.notes || '';
      leadUpdates.notes = `${existingNotes}\n[${dateStr}] Signup detected — lead linked, no grants to provision`.trim();
      await base44.asServiceRole.entities.Lead.update(lead.id, leadUpdates);
    }
    return result;
  }

  let purchasedIds = targetUser.purchased_product_ids || [];
  if (!Array.isArray(purchasedIds)) purchasedIds = [];

  for (let i = 0; i < grants.length; i++) {
    const grant = grants[i];

    if (grant.status === 'provisioned') {
      result.grants_skipped++;
      result.actions.push({ index: i, item: grant.platform_item_name, action: 'skipped', reason: 'already provisioned' });
      continue;
    }

    if (grant.protected) {
      result.protected_skipped++;
      result.actions.push({ index: i, item: grant.platform_item_name, action: 'skipped', reason: 'protected — requires manual approval' });
      continue;
    }

    try {
      if (grant.action_type === 'grant_product' && grant.product_id) {
        if (!purchasedIds.includes(grant.product_id)) {
          purchasedIds = [...purchasedIds, grant.product_id];
          result.actions.push({ index: i, item: grant.platform_item_name, action: 'granted_product', product_id: grant.product_id });
        } else {
          result.actions.push({ index: i, item: grant.platform_item_name, action: 'skipped_duplicate', reason: 'User already has this product' });
        }

        // Auto-enroll in linked courses/webinars
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
        } catch (pErr) {
          console.error(`[provisionCheck] Product lookup error for grant ${i}:`, pErr.message);
        }

        grants[i] = { ...grant, status: 'provisioned', provisioned_at: nowISO, provisioned_user_id: targetUser.id };
        result.grants_provisioned++;

      } else if (grant.action_type === 'enroll_course' && grant.course_id) {
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
          result.actions.push({ index: i, item: grant.platform_item_name, action: 'skipped_duplicate', reason: 'Already has access' });
        }
        grants[i] = { ...grant, status: 'provisioned', provisioned_at: nowISO, provisioned_user_id: targetUser.id };
        result.grants_provisioned++;

      } else {
        result.grants_failed++;
        result.actions.push({ index: i, item: grant.platform_item_name, action: 'skipped', reason: `Unknown type or missing ID` });
        grants[i] = { ...grant, status: 'failed' };
      }
    } catch (err) {
      console.error(`[provisionCheck] Error on grant ${i}:`, err.message);
      result.grants_failed++;
      result.errors.push({ index: i, item: grant.platform_item_name, error: err.message });
      grants[i] = { ...grant, status: 'failed' };
    }
  }

  // ── Save User product IDs ──
  const originalIds = targetUser.purchased_product_ids || [];
  const newIds = purchasedIds.filter(id => !originalIds.includes(id));
  if (newIds.length > 0) {
    await base44.asServiceRole.entities.User.update(targetUser.id, { purchased_product_ids: purchasedIds });
    console.log(`[provisionCheck] Added ${newIds.length} product(s) to User ${targetUser.id}`);
  }
  result.products_added = newIds;

  // ── Save Lead updates ──
  leadUpdates.pending_access_grants = grants;
  const existingNotes = lead.notes || '';
  leadUpdates.notes = `${existingNotes}\n[${dateStr}] Auto-provisioned ${result.grants_provisioned} grant(s) on signup`.trim();
  await base44.asServiceRole.entities.Lead.update(lead.id, leadUpdates);

  console.log(`[provisionCheck] ${email}: ${result.grants_provisioned} provisioned, ${result.grants_skipped} skipped, ${result.protected_skipped} protected, ${result.grants_failed} failed`);
  return result;
}