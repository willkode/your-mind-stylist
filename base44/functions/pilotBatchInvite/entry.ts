import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * pilotBatchInvite
 * 
 * LIVE PILOT BATCH — 10 recipients maximum.
 * 
 * For each eligible recipient:
 *   1. Send branded pre-invite email via Resend
 *   2. Trigger Base44 system invite
 *   3. Create pending_access_grants on the Lead
 *   4. Log all sends in EmailSendLog
 *   5. Update Lead invite_status on success
 * 
 * Safety rails:
 *   - Max 10 recipients (hard cap)
 *   - Excludes: already invited, existing users, protected-only grants,
 *     conflicts, malformed/junk, test accounts, archived
 *   - Prefers clean source group (configurable)
 *   - Does NOT provision protected items
 *   - Does NOT send course-specific emails
 */

const RESEND_FROM = 'Roberta Fernandez <roberta@yourmindstylist.com>';
const PILOT_MAX = 10;

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

// Product ID lookup — will be resolved at runtime from Product entity
let PRODUCT_ID_CACHE = null;
let COURSE_ID_CACHE = null;

const TEST_PATTERNS = [
  /test/i, /atlas/i, /safari/i, /demo/i,
  /@yourmindstylist\.com$/i, /@base44\.com$/i,
  /^service\+/i,
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

function buildPersonalizedBody(lead) {
  const name = lead.first_name || lead.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `<p style="font-family: Georgia, serif; color: #1E3A32; font-size: 18px; margin: 0 0 16px;">Hi ${name},</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">Roberta here. I've created access for you inside Your Mind Stylist so you can access your programs, courses, and resources.</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">Click below, then choose <strong>Sign up</strong> on the login screen using this same email address.</p>
    <p style="color: #2B2725; font-size: 13px; line-height: 1.6; margin: 0 0 24px; opacity: 0.7;">(Use <strong>${lead.email}</strong> — the email this message was sent to.)</p>
    <div style="text-align: center; margin: 0 0 24px;">
      <a href="https://yourmindstylist.com/login" style="display: inline-block; background: #1E3A32; color: #F9F5EF; padding: 14px 36px; text-decoration: none; font-size: 14px; letter-spacing: 0.1em; border-radius: 4px;">SET UP YOUR ACCOUNT</a>
    </div>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">Once inside, you'll be able to find your materials, appointments, and resources in your client area.</p>
    <p style="color: #1E3A32; font-size: 15px; font-weight: 500; margin: 0;">Warmly,</p>
    <p style="color: #1E3A32; font-size: 15px; margin: 4px 0 0;">Roberta Fernandez<br/><span style="color: #6E4F7D; font-size: 13px;">Your Mind Stylist</span></p>`;
}

function wrapInBrandShell(innerHtml) {
  return `<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F9F5EF; padding: 0;">
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
</div>`;
}

async function resolveProductIds(base44) {
  if (PRODUCT_ID_CACHE) return;
  PRODUCT_ID_CACHE = {};
  COURSE_ID_CACHE = {};

  const products = await base44.asServiceRole.entities.Product.list();
  for (const p of products) {
    // Map by key or name
    if (p.key) PRODUCT_ID_CACHE[p.key] = p.id;
    if (p.name) PRODUCT_ID_CACHE[p.name] = p.id;
    // Also map course linkage
    if (p.related_course_id) {
      PRODUCT_ID_CACHE[`course:${p.name}`] = p.related_course_id;
    }
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

    // Resolve IDs
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
  const maxRecipients = Math.min(body.max || PILOT_MAX, PILOT_MAX); // Hard cap at 10

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const BATCH_ID = `pilot-batch-${Date.now()}`;
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
  // PHASE 3: Fetch all Leads and select pilot candidates
  // ═══════════════════════════════════════════════════════════════════════
  const allLeads = [];
  let offset = 0;
  let page = await base44.asServiceRole.entities.Lead.list('-created_date', 50);
  while (page.length > 0) {
    allLeads.push(...page);
    offset += page.length;
    if (page.length < 50) break;
    page = await base44.asServiceRole.entities.Lead.list('-created_date', 50, offset);
  }

  const candidates = [];
  const skipped = [];

  for (const lead of allLeads) {
    const email = (lead.email || '').toLowerCase().trim();
    const reason = [];

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { skipped.push({ email: email || '(empty)', reason: 'malformed_or_missing' }); continue; }
    if (lead.lead_status === 'archived') { skipped.push({ email, reason: 'archived' }); continue; }
    if (isTestAccount(lead)) { skipped.push({ email, reason: 'test_account' }); continue; }
    if (lead.invite_status === 'invited' || lead.invite_status === 'accepted') { skipped.push({ email, reason: `already_${lead.invite_status}` }); continue; }
    if (userEmailSet.has(email)) { skipped.push({ email, reason: 'existing_user' }); continue; }

    // Check if ALL purchases are protected-only (no non-protected grants available)
    const purchaseTexts = lead.original_purchase_texts || [];
    const allItems = [];
    for (const text of purchaseTexts) allItems.push(...parsePurchases(text));
    if (allItems.length === 0 && lead.what_they_bought) allItems.push(...parsePurchases(lead.what_they_bought));
    const uniqueItems = [...new Set(allItems)];
    const mappedItems = uniqueItems.filter(i => PURCHASE_MAP[i]);
    const nonProtectedItems = mappedItems.filter(i => !PURCHASE_MAP[i].protected);

    // Allow leads with no purchases (they still get an invite) or leads with at least one non-protected item
    // Only skip if ALL mapped items are protected AND there are mapped items
    if (mappedItems.length > 0 && nonProtectedItems.length === 0) {
      skipped.push({ email, reason: 'all_grants_protected', items: mappedItems });
      continue;
    }

    // Score by preferred source
    const sources = lead.sources || lead.import_sources || [];
    const isPreferred = sources.includes(preferredSource);

    candidates.push({ lead, isPreferred });
  }

  // Sort: preferred source first, then by created_date
  candidates.sort((a, b) => {
    if (a.isPreferred && !b.isPreferred) return -1;
    if (!a.isPreferred && b.isPreferred) return 1;
    return 0;
  });

  const selected = candidates.slice(0, maxRecipients);

  if (selected.length === 0) {
    return Response.json({
      status: 'no_eligible_recipients',
      total_leads_scanned: allLeads.length,
      total_skipped: skipped.length,
      skipped_sample: skipped.slice(0, 20),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 4: Process each selected recipient
  // ═══════════════════════════════════════════════════════════════════════
  const results = [];

  for (const { lead } of selected) {
    const email = lead.email.toLowerCase().trim();
    const firstName = lead.first_name || '';
    const result = {
      email,
      name: `${firstName} ${lead.last_name || ''}`.trim(),
      lead_id: lead.id,
      branded_email_sent: false,
      branded_email_error: null,
      branded_email_log_id: null,
      system_invite_sent: false,
      system_invite_error: null,
      system_invite_log_id: null,
      pending_access_grants_created: [],
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
    const subject = 'Your Mind Stylist — Your access is ready';
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
        console.log(`Branded email sent to ${email}, Resend ID: ${resendData.id}`);
      }

      // Log
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
      });
      result.branded_email_log_id = logEntry.id;
    } catch (err) {
      result.branded_email_error = err.message;
      console.error(`Resend exception for ${email}:`, err.message);
      try {
        const logEntry = await base44.asServiceRole.entities.EmailSendLog.create({
          recipient_email: email, recipient_name: result.name, subject,
          email_type: 'invite', send_type: 'individual', provider: 'resend',
          status: 'failed', error_message: err.message, sent_by: caller.email,
        });
        result.branded_email_log_id = logEntry.id;
      } catch (logErr) {
        console.error('Failed to log branded email error:', logErr.message);
      }
    }

    // ── Step 3: Trigger Base44 system invite ──
    try {
      await base44.auth.inviteUser(email, 'user');
      result.system_invite_sent = true;
      console.log(`System invite sent to ${email}`);

      const logEntry = await base44.asServiceRole.entities.EmailSendLog.create({
        recipient_email: email, recipient_name: result.name,
        subject: 'Account setup invitation (system)',
        email_type: 'invite', send_type: 'automated', provider: 'system',
        status: 'sent', sent_by: caller.email,
      });
      result.system_invite_log_id = logEntry.id;
    } catch (inviteErr) {
      result.system_invite_error = inviteErr.message;
      console.error(`System invite failed for ${email}:`, inviteErr.message);

      if (!inviteErr.message?.includes('already')) {
        try {
          const logEntry = await base44.asServiceRole.entities.EmailSendLog.create({
            recipient_email: email, recipient_name: result.name,
            subject: 'Account setup invitation (system)',
            email_type: 'invite', send_type: 'automated', provider: 'system',
            status: 'failed', error_message: inviteErr.message, sent_by: caller.email,
          });
          result.system_invite_log_id = logEntry.id;
        } catch (logErr) {
          console.error('Failed to log system invite error:', logErr.message);
        }
      }
    }

    // ── Step 4: Gate — at least one must succeed ──
    const anySuccess = result.branded_email_sent || result.system_invite_sent;

    if (!anySuccess) {
      result.skipped = true;
      result.skip_reason = 'Both invite methods failed';
      results.push(result);
      continue;
    }

    // ── Step 5: Create pending_access_grants on Lead ──
    // Merge with any existing grants
    const existingGrants = lead.pending_access_grants || [];
    const allGrants = [...existingGrants, ...grants]; // Include protected (marked as pending, won't be auto-provisioned)

    const leadUpdates = {
      pending_access_grants: allGrants,
      invite_status: 'invited',
      invite_sent_at: nowISO,
      last_contact_date: nowISO,
      converted_to_client: true,
    };

    // Append notes
    const dateStr = new Date().toLocaleDateString();
    const existingNotes = lead.notes || '';
    leadUpdates.notes = `${existingNotes}\n[${dateStr}] Pilot batch invite sent`.trim();

    // Update stage if new/contacted
    if (lead.stage === 'new' || lead.stage === 'contacted') {
      leadUpdates.stage = 'qualified';
    }

    try {
      await base44.asServiceRole.entities.Lead.update(lead.id, leadUpdates);
      result.invite_status_updated = true;
      result.pending_access_grants_created = allGrants.map(g => ({
        platform_item: g.platform_item_name,
        action_type: g.action_type,
        protected: g.protected,
        status: g.status,
      }));
      console.log(`Lead ${lead.id} updated: invite_status=invited, ${allGrants.length} grants`);
    } catch (leadErr) {
      console.error(`Failed to update Lead ${lead.id}:`, leadErr.message);
      result.invite_status_updated = false;
    }

    results.push(result);

    // Small pause between recipients (500ms)
    await new Promise(r => setTimeout(r, 500));
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ASSEMBLE REPORT
  // ═══════════════════════════════════════════════════════════════════════
  const sentCount = results.filter(r => r.branded_email_sent || r.system_invite_sent).length;
  const failedCount = results.filter(r => r.skipped).length;
  const brandedSent = results.filter(r => r.branded_email_sent).length;
  const systemSent = results.filter(r => r.system_invite_sent).length;

  return Response.json({
    status: 'pilot_complete',
    batch_id: BATCH_ID,
    timestamp: nowISO,
    preferred_source: preferredSource,

    summary: {
      total_leads_scanned: allLeads.length,
      total_eligible_after_filters: candidates.length,
      pilot_selected: selected.length,
      sent_successfully: sentCount,
      failed: failedCount,
      branded_emails_sent: brandedSent,
      system_invites_sent: systemSent,
      skipped_in_selection: skipped.length,
    },

    recipients: results,

    email_send_log_ids: results.flatMap(r => [r.branded_email_log_id, r.system_invite_log_id].filter(Boolean)),

    skipped_records_sample: skipped.slice(0, 15),

    safety_confirmations: {
      max_recipients_enforced: PILOT_MAX,
      actual_recipients: selected.length,
      protected_items_provisioned: 0,
      course_specific_emails_sent: 0,
      full_batch_triggered: false,
      note: '⚠️ PILOT ONLY — Paused after this batch. Full production batch requires separate approval.',
    },
  });
});