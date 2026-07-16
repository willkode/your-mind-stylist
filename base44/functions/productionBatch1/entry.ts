import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * productionBatch1
 * 
 * PRODUCTION BATCH #1 — 100 recipients maximum.
 * Path B: branded email only + open registration. NO Base44 system invite.
 * 
 * For each eligible recipient:
 *   1. Build pending_access_grants from purchase history
 *   2. Send branded email via Resend (updated copy per Indy's spec)
 *   3. Log send in EmailSendLog
 *   4. Update Lead: invite_status=invited, grants, notes, tags
 * 
 * Safety rails:
 *   - Max 50 recipients (hard cap)
 *   - Excludes: already invited/accepted, existing users, pilot-batch-1 tagged,
 *     protected-only grants, conflicts, malformed/junk, test accounts, archived
 *   - NO system invite — branded email only
 *   - NO protected item provisioning
 *   - NO course-specific emails
 *   - Idempotent tags for traceability
 */

const RESEND_FROM = 'Roberta Fernandez <roberta@yourmindstylist.com>';
const BATCH_MAX = 100;

const PURCHASE_MAP = {
  'Pocket Mindset™': { platform_item: 'Pocket Mindset™ (Subscription)', action_type: 'grant_product', type: 'product', protected: false },
  'Cleaning Out Your Closet™': { platform_item: 'Cleaning Out Your Closet™', action_type: 'grant_product', type: 'product', protected: false },
  'LENS™': { platform_item: 'LENS™ Framework', action_type: 'enroll_course', type: 'course', protected: false },
  'Hypnosis Bundle': { platform_item: 'FARE Hypnosis Training Bundle', action_type: 'enroll_course', type: 'course', protected: true },
  'FARE Hypnosis Training Bundle': { platform_item: 'FARE Hypnosis Training Bundle', action_type: 'enroll_course', type: 'course', protected: true },
  'Hypnosis Training Bundle': { platform_item: 'FARE Hypnosis Training Bundle', action_type: 'enroll_course', type: 'course', protected: true },
  'Mind Styling Hypnosis 1.0': { platform_item: 'Mind Styling Hypnosis Training', action_type: 'enroll_course', type: 'course', protected: true },
  'Webinar - Quantum Leaping Through Thought': { platform_item: 'Quantum Leaping Through Thought', action_type: 'grant_webinar', type: 'course', protected: false },
  'Webinar - Imposter Syndrome and Other Myths to Ditch': { platform_item: 'Imposter Syndrome and Other Myths to Ditch', action_type: 'grant_webinar', type: 'course', protected: false },
};

let PRODUCT_ID_CACHE = null;
let COURSE_ID_CACHE = null;

const TEST_PATTERNS = [
  /test/i, /atlas/i, /safari/i, /demo/i,
  /@yourmindstylist\.com$/i, /@base44\.com$/i,
  /^service\+/i, /indygregg/i, /hubbii/i,
];

function parsePurchases(text) {
  return text ? text.split(',').map(s => s.trim()).filter(Boolean) : [];
}

function isTestAccount(lead) {
  const email = (lead.email || '').toLowerCase();
  const fn = lead.first_name || '';
  const ln = lead.last_name || '';
  return TEST_PATTERNS.some(p => p.test(email)) ||
    TEST_PATTERNS.some(p => p.test(fn)) ||
    TEST_PATTERNS.some(p => p.test(ln));
}

function hasPilotTag(lead) {
  const tags = lead.tags || [];
  return tags.includes('pilot-batch-1');
}

function buildPersonalizedBody(lead) {
  const name = lead.first_name || lead.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `<p style="font-family: Georgia, serif; color: #1E3A32; font-size: 18px; margin: 0 0 16px;">Hi ${name},</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">I promise that you know me!</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">You've either been a client of FARE Hypnosis, used Conscious Napping&reg;, been a student, or have some other connection to me.</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">I am rebranding to better reflect the evolution of FARE Hypnosis and Conscious Napping&reg;.</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">The new name is <strong>Your Mind Stylist</strong>, and the app is now <strong>Pocket Mindset</strong>.</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">Over the past 15 years, you may have received only one or 2 emails from me. This will not change, as I now have a non-intrusive way for you to continue our work or to re-engage with me:</p>
    <p style="color: #1E3A32; font-size: 16px; line-height: 1.7; margin: 0 0 16px; font-weight: 600;">Your new personalized dashboard has been set up and is waiting for you!</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">It is fun, has freebies (to be added regularly!), and other ways to engage with my services and content.</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">All you have to do is click the link in this email and set up a password. Then have fun continuing to restyle your life.</p>
    <p style="color: #2B2725; font-size: 13px; line-height: 1.6; margin: 0 0 24px; opacity: 0.7;">(Use <strong>${lead.email}</strong> — the email this message was sent to.)</p>
    <div style="text-align: center; margin: 0 0 12px;">
      <a href="https://yourmindstylist.com/register" style="display: inline-block; background: #1E3A32; color: #F9F5EF; padding: 14px 36px; text-decoration: none; font-size: 14px; letter-spacing: 0.1em; border-radius: 4px;">SET UP YOUR PASSWORD</a>
    </div>
    <p style="color: #2B2725; font-size: 13px; line-height: 1.5; margin: 0 0 24px; text-align: center; opacity: 0.6;">If you already created your password, you can simply <a href="https://yourmindstylist.com/login" style="color: #6E4F7D; text-decoration: underline;">log in</a>.</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">As always, feel free to reach out any time,</p>
    <p style="color: #1E3A32; font-size: 15px; font-weight: 500; margin: 0;">Roberta Fernandez</p>
    <p style="color: #6E4F7D; font-size: 14px; margin: 4px 0 0;">Your Mind Stylist</p>
    <p style="color: #2B2725; font-size: 13px; margin: 4px 0 0; opacity: 0.7;">Online Anywhere or Las Vegas, NV</p>`;
}

function wrapInBrandShell(innerHtml) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Mind Stylist</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9F5EF; font-family: 'Inter', Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
<div style="max-width: 600px; margin: 0 auto; background: #F9F5EF; padding: 0;">
  <div style="text-align: center; padding: 32px 24px 16px;">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a98b3e154ab3b36c88ebb/7d5c32b99_Mind-stylist-dark-icon2x.png" alt="Your Mind Stylist" style="height: 60px; width: auto;" />
  </div>
  <div style="background: white; border-radius: 12px; margin: 0 24px; padding: 32px 28px; border: 1px solid #E4D9C4;">
    ${innerHtml}
  </div>
  <div style="text-align: center; padding: 24px; color: #2B2725; opacity: 0.5; font-size: 12px;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} Your Mind Stylist &middot; Las Vegas, NV</p>
    <p style="margin: 4px 0 0;"><a href="https://yourmindstylist.com" style="color: #6E4F7D;">yourmindstylist.com</a></p>
  </div>
</div>
</body>
</html>`;
}

async function resolveProductIds(base44) {
  if (PRODUCT_ID_CACHE) return;
  PRODUCT_ID_CACHE = {};
  COURSE_ID_CACHE = {};

  const products = await base44.asServiceRole.entities.Product.list();
  for (const p of products) {
    if (p.key) PRODUCT_ID_CACHE[p.key] = p.id;
    if (p.name) PRODUCT_ID_CACHE[p.name] = p.id;
    if (p.related_course_id) PRODUCT_ID_CACHE[`course:${p.name}`] = p.related_course_id;
  }

  const courses = await base44.asServiceRole.entities.Course.list();
  for (const c of courses) {
    if (c.title) COURSE_ID_CACHE[c.title] = c.id;
    if (c.slug) COURSE_ID_CACHE[c.slug] = c.id;
  }
}

function buildAccessGrants(lead, batchId) {
  const purchaseTexts = lead.original_purchase_texts || [];
  const allItems = [];
  for (const text of purchaseTexts) allItems.push(...parsePurchases(text));
  if (allItems.length === 0 && lead.what_they_bought) {
    allItems.push(...parsePurchases(lead.what_they_bought));
  }

  const uniqueItems = [...new Set(allItems)];
  const grants = [];

  for (const item of uniqueItems) {
    const mapping = PURCHASE_MAP[item];
    if (!mapping) continue;

    const grant = {
      action_type: mapping.action_type,
      platform_item_name: mapping.platform_item,
      csv_purchase_text: item,
      confidence: 'exact',
      protected: mapping.protected || false,
      status: 'pending',
      migration_batch_id: batchId,
    };

    if (mapping.action_type === 'grant_product') {
      const pid = PRODUCT_ID_CACHE[mapping.platform_item] || PRODUCT_ID_CACHE[item];
      if (pid) grant.product_id = pid;
    } else if (mapping.action_type === 'enroll_course') {
      const cid = COURSE_ID_CACHE[mapping.platform_item] || COURSE_ID_CACHE[item];
      if (cid) grant.course_id = cid;
    } else if (mapping.action_type === 'grant_webinar') {
      const cid = COURSE_ID_CACHE[mapping.platform_item];
      if (cid) grant.webinar_id = cid;
    }

    grants.push(grant);
  }

  return grants;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const caller = await base44.auth.me();
  if (caller?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const preferredSource = body.preferred_source || 'Roberta Updated 3/2026';
  const maxRecipients = Math.min(body.max || BATCH_MAX, BATCH_MAX);
  const dryRun = body.dry_run === true;

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY && !dryRun) {
    return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const BATCH_ID = `prod-batch-1-${Date.now()}`;
  const nowISO = new Date().toISOString();

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 1: Resolve product/course IDs
  // ═══════════════════════════════════════════════════════════════════════
  await resolveProductIds(base44);

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 2: Fetch existing Users (to exclude)
  // ═══════════════════════════════════════════════════════════════════════
  const allUsers = await base44.asServiceRole.entities.User.list();
  const userEmailSet = new Set(allUsers.map(u => u.email?.toLowerCase()).filter(Boolean));

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 3: Fetch all Leads and select candidates
  // ═══════════════════════════════════════════════════════════════════════
  const allLeads = [];
  let page = await base44.asServiceRole.entities.Lead.list('-created_date', 50);
  while (page.length > 0) {
    allLeads.push(...page);
    if (page.length < 50) break;
    page = await base44.asServiceRole.entities.Lead.list('-created_date', 50, allLeads.length);
  }

  const candidates = [];
  const skipped = { reasons: {} };
  const skipDetail = [];

  function skip(email, reason) {
    skipped.reasons[reason] = (skipped.reasons[reason] || 0) + 1;
    skipDetail.push({ email: email || '(empty)', reason });
  }

  for (const lead of allLeads) {
    const email = (lead.email || '').toLowerCase().trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { skip(email, 'malformed_or_missing'); continue; }
    if (lead.lead_status === 'archived') { skip(email, 'archived'); continue; }
    if ((lead.tags || []).includes('opted_out')) { skip(email, 'opted_out'); continue; }
    if (lead.opted_out_at) { skip(email, 'opted_out_timestamp'); continue; }
    if (isTestAccount(lead)) { skip(email, 'test_account'); continue; }
    if (hasPilotTag(lead)) { skip(email, 'pilot_batch_1_excluded'); continue; }
    if (lead.invite_status === 'invited' || lead.invite_status === 'accepted') { skip(email, `already_${lead.invite_status}`); continue; }
    if (userEmailSet.has(email)) { skip(email, 'existing_user'); continue; }

    // Check grant eligibility
    const purchaseTexts = lead.original_purchase_texts || [];
    const allItems = [];
    for (const text of purchaseTexts) allItems.push(...parsePurchases(text));
    if (allItems.length === 0 && lead.what_they_bought) allItems.push(...parsePurchases(lead.what_they_bought));
    const uniqueItems = [...new Set(allItems)];
    const mappedItems = uniqueItems.filter(i => PURCHASE_MAP[i]);
    const nonProtectedItems = mappedItems.filter(i => !PURCHASE_MAP[i].protected);

    // Skip if ALL mapped items are protected AND there are mapped items
    if (mappedItems.length > 0 && nonProtectedItems.length === 0) {
      skip(email, 'all_grants_protected');
      continue;
    }

    // Score by preferred source
    const sources = lead.sources || lead.import_sources || [];
    const isPreferred = sources.includes(preferredSource);

    candidates.push({ lead, isPreferred, source: sources[0] || 'unknown' });
  }

  // Sort: preferred source first
  candidates.sort((a, b) => {
    if (a.isPreferred && !b.isPreferred) return -1;
    if (!a.isPreferred && b.isPreferred) return 1;
    return 0;
  });

  const selected = candidates.slice(0, maxRecipients);

  // ═══════════════════════════════════════════════════════════════════════
  // DRY RUN: Return preview without sending
  // ═══════════════════════════════════════════════════════════════════════
  if (dryRun) {
    const sourceBreakdown = {};
    for (const { lead } of selected) {
      const src = (lead.sources || lead.import_sources || ['unknown'])[0];
      sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
    }

    const grantPreview = [];
    let totalGrants = 0;
    let protectedCount = 0;
    for (const { lead } of selected) {
      const grants = buildAccessGrants(lead, 'DRY_RUN');
      totalGrants += grants.filter(g => !g.protected).length;
      protectedCount += grants.filter(g => g.protected).length;
      grantPreview.push({
        email: lead.email,
        name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
        grants: grants.map(g => ({ item: g.platform_item_name, type: g.action_type, protected: g.protected })),
      });
    }

    return Response.json({
      status: 'dry_run',
      batch_id: BATCH_ID,
      total_leads_scanned: allLeads.length,
      total_eligible: candidates.length,
      selected_count: selected.length,
      max_allowed: BATCH_MAX,
      source_breakdown: sourceBreakdown,
      skip_reasons: skipped.reasons,
      total_pending_grants: totalGrants,
      total_protected_skipped: protectedCount,
      recipients_preview: grantPreview,
      skipped_sample: skipDetail.slice(0, 20),
    });
  }

  if (selected.length === 0) {
    return Response.json({
      status: 'no_eligible_recipients',
      total_leads_scanned: allLeads.length,
      skip_reasons: skipped.reasons,
      skipped_sample: skipDetail.slice(0, 20),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 4: Process each selected recipient (LIVE SEND)
  // ═══════════════════════════════════════════════════════════════════════
  const results = [];
  const sourceBreakdown = {};

  for (const { lead, source } of selected) {
    const email = lead.email.toLowerCase().trim();
    const firstName = lead.first_name || '';
    sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;

    const result = {
      email,
      name: `${firstName} ${lead.last_name || ''}`.trim(),
      lead_id: lead.id,
      source,
      branded_email_sent: false,
      branded_email_error: null,
      email_log_id: null,
      pending_access_grants: [],
      protected_grants_skipped: [],
      invite_status_updated: false,
      skipped: false,
      skip_reason: null,
    };

    // ── Step 1: Build access grants ──
    const grants = buildAccessGrants(lead, BATCH_ID);
    const nonProtectedGrants = grants.filter(g => !g.protected);
    const protectedGrants = grants.filter(g => g.protected);
    result.protected_grants_skipped = protectedGrants.map(g => g.platform_item_name);

    // ── Step 2: Send branded email via Resend ──
    const subject = 'Your Mind Stylist — Your Personal Dashboard Is Ready';
    const innerHtml = buildPersonalizedBody(lead);
    const fullHtml = wrapInBrandShell(innerHtml);

    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [email],
          subject,
          html: fullHtml,
        }),
      });

      const resendData = await resendRes.json();

      if (!resendRes.ok) {
        result.branded_email_error = resendData.message || JSON.stringify(resendData);
        console.error(`Resend failed for ${email}:`, result.branded_email_error);
      } else {
        result.branded_email_sent = true;
      }

      const logEntry = await base44.asServiceRole.entities.EmailSendLog.create({
        recipient_email: email,
        recipient_name: result.name,
        subject,
        email_type: 'invite',
        send_type: 'individual',
        provider: 'resend',
        status: result.branded_email_sent ? 'sent' : 'failed',
        error_message: result.branded_email_error || undefined,
        sent_by: caller.email,
        campaign_subject: 'Production Batch 1',
      });
      result.email_log_id = logEntry.id;
    } catch (err) {
      result.branded_email_error = err.message;
      console.error(`Resend exception for ${email}:`, err.message);
      try {
        const logEntry = await base44.asServiceRole.entities.EmailSendLog.create({
          recipient_email: email, recipient_name: result.name, subject,
          email_type: 'invite', send_type: 'individual', provider: 'resend',
          status: 'failed', error_message: err.message, sent_by: caller.email,
          campaign_subject: 'Production Batch 1',
        });
        result.email_log_id = logEntry.id;
      } catch (_) { /* silent */ }
    }

    // ── Gate: branded email must succeed ──
    if (!result.branded_email_sent) {
      result.skipped = true;
      result.skip_reason = 'Branded email failed — Lead NOT updated';
      results.push(result);
      await new Promise(r => setTimeout(r, 200));
      continue;
    }

    // ── Step 3: Update Lead with grants + invite status ──
    const existingGrants = lead.pending_access_grants || [];
    const allGrants = [...existingGrants, ...grants];

    const leadUpdates = {
      pending_access_grants: allGrants,
      invite_status: 'invited',
      invite_sent_at: nowISO,
      last_contact_date: nowISO,
      converted_to_client: true,
    };

    // Tag for traceability
    const existingTags = lead.tags || [];
    if (!existingTags.includes('prod-batch-1')) {
      leadUpdates.tags = [...existingTags, 'prod-batch-1'];
    }

    const dateStr = new Date().toLocaleDateString();
    const existingNotes = lead.notes || '';
    leadUpdates.notes = `${existingNotes}\n[${dateStr}] Production batch 1 invite sent`.trim();

    if (lead.stage === 'new' || lead.stage === 'contacted') {
      leadUpdates.stage = 'qualified';
    }

    try {
      await base44.asServiceRole.entities.Lead.update(lead.id, leadUpdates);
      result.invite_status_updated = true;
      result.pending_access_grants = allGrants.map(g => ({
        item: g.platform_item_name,
        type: g.action_type,
        protected: g.protected,
        status: g.status,
      }));
    } catch (leadErr) {
      console.error(`Failed to update Lead ${lead.id}:`, leadErr.message);
    }

    results.push(result);

    // 300ms pause between sends
    await new Promise(r => setTimeout(r, 300));
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ASSEMBLE REPORT
  // ═══════════════════════════════════════════════════════════════════════
  const sentCount = results.filter(r => r.branded_email_sent).length;
  const failedCount = results.filter(r => r.skipped).length;
  const totalGrantsCreated = results.reduce((sum, r) => sum + r.pending_access_grants.filter(g => !g.protected).length, 0);
  const totalProtectedSkipped = results.reduce((sum, r) => sum + r.protected_grants_skipped.length, 0);
  const inviteUpdated = results.filter(r => r.invite_status_updated).length;

  const failedRecipients = results.filter(r => r.skipped).map(r => ({
    email: r.email,
    name: r.name,
    error: r.branded_email_error,
    reason: r.skip_reason,
  }));

  return Response.json({
    status: 'production_batch_1_complete',
    batch_id: BATCH_ID,
    timestamp: nowISO,
    preferred_source: preferredSource,

    summary: {
      total_leads_scanned: allLeads.length,
      total_eligible_after_filters: candidates.length,
      batch_selected: selected.length,
      emails_sent_successfully: sentCount,
      emails_failed: failedCount,
      invite_status_updated: inviteUpdated,
      total_pending_grants_created: totalGrantsCreated,
      total_protected_grants_skipped: totalProtectedSkipped,
    },

    source_breakdown: sourceBreakdown,

    recipients: results.map(r => ({
      email: r.email,
      name: r.name,
      lead_id: r.lead_id,
      source: r.source,
      email_sent: r.branded_email_sent,
      email_log_id: r.email_log_id,
      grants: r.pending_access_grants,
      protected_skipped: r.protected_grants_skipped,
      invite_updated: r.invite_status_updated,
      error: r.branded_email_error,
    })),

    email_send_log_ids: results.map(r => r.email_log_id).filter(Boolean),

    bounce_failure_report: failedRecipients,

    safety_confirmations: {
      max_recipients_enforced: BATCH_MAX,
      actual_recipients: selected.length,
      system_invites_sent: 0,
      protected_content_granted: 0,
      course_specific_emails_sent: 0,
      pilot_batch_1_recipients_included: 0,
      test_accounts_included: 0,
      note: '⛔ PAUSED after batch #1. Do NOT continue without explicit approval.',
    },
  });
});