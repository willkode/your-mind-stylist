import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * productionBatchDryRun
 * 
 * PRODUCTION BATCH DRY RUN — READ-ONLY ANALYSIS
 * 
 * Scans all Lead records to compute the full invite + provisioning plan.
 * Does NOT:
 *   - Send any emails
 *   - Trigger any Base44 invites
 *   - Create or update any records
 *   - Provision any access grants
 * 
 * Returns a comprehensive report with all 10 checkpoints.
 */

const PURCHASE_MAP = {
  'Pocket Mindset™': { platform_item: 'Pocket Mindset™ (Subscription)', type: 'product', protected: false },
  'Cleaning Out Your Closet™': { platform_item: 'Cleaning Out Your Closet™', type: 'product', protected: false },
  'LENS™': { platform_item: 'LENS™ Framework', type: 'course', protected: false },
  'Hypnosis Bundle': { platform_item: 'FARE Hypnosis Training Bundle', type: 'course', protected: true },
  'FARE Hypnosis Training Bundle': { platform_item: 'FARE Hypnosis Training Bundle', type: 'course', protected: true },
  'Hypnosis Training Bundle': { platform_item: 'FARE Hypnosis Training Bundle', type: 'course', protected: true },
  'Mind Styling Hypnosis 1.0': { platform_item: 'Mind Styling Hypnosis Training', type: 'course', protected: true },
  'Webinar - Quantum Leaping Through Thought': { platform_item: 'Quantum Leaping Through Thought', type: 'course', protected: false },
  'Webinar - Imposter Syndrome and Other Myths to Ditch': { platform_item: 'Imposter Syndrome and Other Myths to Ditch', type: 'course', protected: false },
};

function parsePurchases(text) {
  return text ? text.split(',').map(s => s.trim()).filter(Boolean) : [];
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const caller = await base44.auth.me();
  if (caller?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 1: Fetch ALL Leads (paginated)
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

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 2: Fetch ALL Users
  // ═══════════════════════════════════════════════════════════════════════
  const allUsers = await base44.asServiceRole.entities.User.list();
  const userEmailSet = new Set(allUsers.map(u => u.email?.toLowerCase()).filter(Boolean));
  const userByEmail = new Map(allUsers.map(u => [u.email?.toLowerCase(), u]));

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 3: Classify every Lead
  // ═══════════════════════════════════════════════════════════════════════
  const eligible = [];          // Will receive branded email + Base44 invite
  const existingUserLeads = []; // Already have User account — immediate provision candidates
  const skippedAlreadyInvited = [];
  const skippedAlreadyAccepted = [];
  const skippedArchived = [];
  const skippedNoEmail = [];
  const skippedMalformed = [];
  const skippedTestAccounts = [];

  const TEST_PATTERNS = [
    /test/i, /atlas/i, /safari/i, /demo/i,
    /@yourmindstylist\.com$/i, /@base44\.com$/i,
    /^service\+/i,
  ];

  for (const lead of allLeads) {
    const email = (lead.email || '').toLowerCase().trim();
    const status = lead.invite_status || 'not_invited';
    const leadStatus = lead.lead_status || 'active';

    // Skip: no email
    if (!email) {
      skippedNoEmail.push({ id: lead.id, name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() });
      continue;
    }

    // Skip: malformed email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      skippedMalformed.push({ id: lead.id, email, name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() });
      continue;
    }

    // Skip: archived
    if (leadStatus === 'archived') {
      skippedArchived.push({ id: lead.id, email, name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() });
      continue;
    }

    // Skip: test accounts
    if (TEST_PATTERNS.some(p => p.test(email)) || TEST_PATTERNS.some(p => p.test(lead.first_name || '')) || TEST_PATTERNS.some(p => p.test(lead.last_name || ''))) {
      skippedTestAccounts.push({ id: lead.id, email, name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(), reason: 'Test/demo account pattern' });
      continue;
    }

    // Skip: already accepted
    if (status === 'accepted') {
      skippedAlreadyAccepted.push({ id: lead.id, email });
      continue;
    }

    // Skip: already invited (but not accepted)
    if (status === 'invited') {
      skippedAlreadyInvited.push({ id: lead.id, email, name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(), invite_sent_at: lead.invite_sent_at });
      continue;
    }

    // At this point: invite_status === 'not_invited', lead_status === 'active', valid email
    // Check if user already exists
    if (userEmailSet.has(email)) {
      existingUserLeads.push({
        id: lead.id,
        email,
        name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
        user_id: userByEmail.get(email)?.id,
        what_they_bought: lead.what_they_bought || '',
        pending_access_grants: lead.pending_access_grants || [],
      });
    } else {
      eligible.push({
        id: lead.id,
        email,
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
        what_they_bought: lead.what_they_bought || '',
        original_purchase_texts: lead.original_purchase_texts || [],
        sources: lead.sources || lead.import_sources || [],
        pending_access_grants: lead.pending_access_grants || [],
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 4: Compute pending access grants to be created
  // ═══════════════════════════════════════════════════════════════════════
  let totalGrantsToCreate = 0;
  let protectedGrantsSkipped = 0;
  let immediateProvisions = 0;
  const grantBreakdown = {};
  const protectedItems = [];

  const analyzeGrants = (lead, isExistingUser) => {
    // If the lead already has pending_access_grants populated, count those
    if (lead.pending_access_grants && lead.pending_access_grants.length > 0) {
      for (const grant of lead.pending_access_grants) {
        if (grant.protected) {
          protectedGrantsSkipped++;
          if (!protectedItems.find(p => p.platform_item === grant.platform_item_name)) {
            protectedItems.push({ platform_item: grant.platform_item_name, count: 0 });
          }
          const pi = protectedItems.find(p => p.platform_item === grant.platform_item_name);
          if (pi) pi.count++;
          continue;
        }
        if (grant.status === 'provisioned') {
          // Already done
          continue;
        }
        totalGrantsToCreate++;
        if (isExistingUser) immediateProvisions++;
        const key = grant.platform_item_name || grant.action_type;
        grantBreakdown[key] = (grantBreakdown[key] || 0) + 1;
      }
      return;
    }

    // Otherwise, compute from what_they_bought using PURCHASE_MAP
    const purchaseTexts = lead.original_purchase_texts || [];
    const allItems = [];
    for (const text of purchaseTexts) {
      allItems.push(...parsePurchases(text));
    }
    // Fallback to what_they_bought
    if (allItems.length === 0 && lead.what_they_bought) {
      allItems.push(...parsePurchases(lead.what_they_bought));
    }

    const uniqueItems = [...new Set(allItems)];
    for (const item of uniqueItems) {
      const mapping = PURCHASE_MAP[item];
      if (!mapping) continue; // Unmapped — no grant to create

      if (mapping.protected) {
        protectedGrantsSkipped++;
        if (!protectedItems.find(p => p.platform_item === mapping.platform_item)) {
          protectedItems.push({ platform_item: mapping.platform_item, count: 0 });
        }
        const pi = protectedItems.find(p => p.platform_item === mapping.platform_item);
        if (pi) pi.count++;
        continue;
      }

      totalGrantsToCreate++;
      if (isExistingUser) immediateProvisions++;
      grantBreakdown[mapping.platform_item] = (grantBreakdown[mapping.platform_item] || 0) + 1;
    }
  };

  for (const lead of eligible) {
    analyzeGrants(lead, false);
  }
  for (const lead of existingUserLeads) {
    analyzeGrants(lead, true);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 5: Build email preview (dark logo)
  // ═══════════════════════════════════════════════════════════════════════
  const sampleRecipient = eligible.length > 0 ? eligible[0] : null;
  const sampleName = sampleRecipient
    ? (sampleRecipient.first_name || sampleRecipient.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
    : 'Client';

  const emailPreviewHtml = `<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F9F5EF; padding: 0;">
  <div style="text-align: center; padding: 32px 24px 16px;">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a98b3e154ab3b36c88ebb/7d5c32b99_Mind-stylist-dark-icon2x.png" alt="Your Mind Stylist" style="height: 60px; width: auto;" />
  </div>
  <div style="background: white; border-radius: 12px; margin: 0 24px; padding: 32px 28px; border: 1px solid #E4D9C4;">
    <p style="font-family: Georgia, serif; color: #1E3A32; font-size: 18px; margin: 0 0 16px;">Hi ${sampleName},</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">Roberta here. I've created access for you inside Your Mind Stylist so you can access your programs, courses, and resources.</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">Click below, then choose <strong>Sign up</strong> on the login screen using this same email address.</p>
    <p style="color: #2B2725; font-size: 13px; line-height: 1.6; margin: 0 0 24px; opacity: 0.7;">(Use <strong>${sampleRecipient?.email || 'your@email.com'}</strong> — the email this message was sent to.)</p>
    <div style="text-align: center; margin: 0 0 24px;">
      <a href="https://yourmindstylist.com/login" style="display: inline-block; background: #1E3A32; color: #F9F5EF; padding: 14px 36px; text-decoration: none; font-size: 14px; letter-spacing: 0.1em; border-radius: 4px;">SET UP YOUR ACCOUNT</a>
    </div>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">Once inside, you'll be able to find your materials, appointments, and resources in your client area.</p>
    <p style="color: #1E3A32; font-size: 15px; font-weight: 500; margin: 0;">Warmly,</p>
    <p style="color: #1E3A32; font-size: 15px; margin: 4px 0 0;">Roberta Fernandez<br/><span style="color: #6E4F7D; font-size: 13px;">Your Mind Stylist</span></p>
  </div>
  <div style="text-align: center; padding: 24px; color: #2B2725; opacity: 0.5; font-size: 12px;">
    <p style="margin: 0;">&copy; 2026 Your Mind Stylist &middot; Las Vegas, NV</p>
    <p style="margin: 4px 0 0;"><a href="https://yourmindstylist.com" style="color: #6E4F7D;">yourmindstylist.com</a></p>
  </div>
</div>`;

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 6: Sample 5 personalized recipients
  // ═══════════════════════════════════════════════════════════════════════
  const sample5 = eligible.slice(0, 5).map(lead => ({
    email: lead.email,
    name: lead.name,
    first_name: lead.first_name,
    sources: lead.sources,
    what_they_bought: lead.what_they_bought,
    grants_to_create: (() => {
      const items = [];
      const purchaseTexts = lead.original_purchase_texts || [];
      const allPurchases = [];
      for (const text of purchaseTexts) allPurchases.push(...parsePurchases(text));
      if (allPurchases.length === 0 && lead.what_they_bought) allPurchases.push(...parsePurchases(lead.what_they_bought));
      for (const item of [...new Set(allPurchases)]) {
        const mapping = PURCHASE_MAP[item];
        if (mapping) items.push({ csv_value: item, platform_item: mapping.platform_item, protected: mapping.protected });
      }
      return items;
    })(),
    branded_email_greeting: `Hi ${lead.first_name || lead.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())},`,
  }));

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 7: Throttle plan
  // ═══════════════════════════════════════════════════════════════════════
  const BATCH_SIZE = 10;
  const PAUSE_BETWEEN_BATCHES_SEC = 5;
  const FAILURE_THRESHOLD_PERCENT = 20;
  const totalBatches = Math.ceil(eligible.length / BATCH_SIZE);
  const estimatedTimeMinutes = Math.ceil((totalBatches * PAUSE_BETWEEN_BATCHES_SEC) / 60) + Math.ceil(eligible.length * 2 / 60); // ~2s per invite

  // ═══════════════════════════════════════════════════════════════════════
  // ASSEMBLE REPORT
  // ═══════════════════════════════════════════════════════════════════════
  const report = {
    _header: '🔒 DRY RUN ONLY — NO WRITES, NO EMAILS, NO INVITES',
    _timestamp: new Date().toISOString(),

    // 1. Total eligible recipients
    total_eligible_recipients: eligible.length,

    // 2. Existing users vs new invitees
    classification: {
      new_invitees: eligible.length,
      existing_users_with_leads: existingUserLeads.length,
      total_users_in_system: allUsers.length,
      total_leads_in_system: allLeads.length,
    },

    // 3. Skipped records
    skipped: {
      already_invited: {
        count: skippedAlreadyInvited.length,
        sample: skippedAlreadyInvited.slice(0, 5),
      },
      already_accepted: {
        count: skippedAlreadyAccepted.length,
      },
      archived: {
        count: skippedArchived.length,
        sample: skippedArchived.slice(0, 3),
      },
      malformed_or_missing_email: {
        count: skippedMalformed.length + skippedNoEmail.length,
        malformed: skippedMalformed,
        no_email: skippedNoEmail,
      },
      test_accounts: {
        count: skippedTestAccounts.length,
        records: skippedTestAccounts,
      },
    },

    // 4. Pending access grants to be created
    pending_access_grants: {
      total_grants_to_create: totalGrantsToCreate,
      breakdown_by_product: grantBreakdown,
    },

    // 5. Immediate provisions for existing users
    immediate_provisions_for_existing_users: {
      count: immediateProvisions,
      existing_user_leads: existingUserLeads.map(l => ({
        email: l.email,
        name: l.name,
        user_id: l.user_id,
        what_they_bought: l.what_they_bought,
        existing_grants: l.pending_access_grants.length,
      })),
    },

    // 6. Protected grants skipped
    protected_grants: {
      total_skipped: protectedGrantsSkipped,
      items: protectedItems,
      note: 'Protected items require manual approval by Roberta before provisioning.',
    },

    // 7. Email preview with dark logo
    email_preview: {
      logo: 'dark (Mind-stylist-dark-icon2x.png)',
      sample_recipient: sampleRecipient?.email || 'N/A',
      html: emailPreviewHtml,
    },

    // 8. Total expected emails
    expected_emails: {
      branded_pre_invite_emails: eligible.length,
      base44_system_invites: eligible.length,
      total_emails_per_recipient: 2,
      total_emails_sent: eligible.length * 2,
      note: 'Each recipient gets: 1 branded Resend email + 1 Base44 system invite email',
    },

    // 9. Throttle plan
    throttle_plan: {
      batch_size: BATCH_SIZE,
      pause_between_batches_seconds: PAUSE_BETWEEN_BATCHES_SEC,
      total_batches: totalBatches,
      failure_threshold: `${FAILURE_THRESHOLD_PERCENT}% — halt batch if >${Math.ceil(BATCH_SIZE * FAILURE_THRESHOLD_PERCENT / 100)} failures in a single batch`,
      failure_handling: 'Log failed emails, skip to next recipient, continue batch. Halt entire run if failure threshold exceeded in any single batch.',
      estimated_total_time_minutes: estimatedTimeMinutes,
      rollback_strategy: 'Lead invite_status only updated on success. Failed invites remain not_invited for retry.',
    },

    // 10. Sample 5 personalized recipients
    sample_recipients: sample5,
  };

  return Response.json(report);
});