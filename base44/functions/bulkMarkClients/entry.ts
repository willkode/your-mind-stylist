import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * bulkMarkClients — Phase 6B
 * 
 * Marks eligible Lead records as Clients (converted_to_client=true, stage="won")
 * and appends pending_access_grants for mapped products.
 * 
 * SAFETY GUARANTEES:
 *   - No User accounts created
 *   - No invitations sent
 *   - No emails sent
 *   - No immediate access granted
 *   - No Stripe/Product/Course/Resource records changed
 *   - No authentication logic touched
 *   - Existing pending_access_grants preserved (append-only, dedup)
 *   - Idempotent — safe to run multiple times
 * 
 * Input: { dry_run?: boolean (default true), batch_id?: string }
 * Output: Detailed summary report
 */

// ── Product mapping table ─────────────────────────────────────────────
// Maps normalized purchase label parts → Product entity IDs
// Only "exact" confidence mappings are included here.
// Unmapped labels are reported but NOT granted.
const PRODUCT_MAP = {
  'pocket mindset': {
    product_id: '693d6b978867f6e147e25e8d',
    product_name: 'Pocket Mindset™',
  },
  'cleaning out your closet': {
    product_id: '69a9b0ec1269644b5ea78346',
    product_name: 'Cleaning Out Your Closet™',
  },
  'lens': {
    product_id: '693d6b978867f6e147e25e91',
    product_name: 'LENS™',
  },
  'mind styling hypnosis 1.0': {
    product_id: '69a778cc696a7ebfc4e740f8',
    product_name: 'Mind Styling Hypnosis 1.0',
  },
};

// Labels that are KNOWN unmapped — reported but not granted
const UNMAPPED_LABELS = new Set([
  'hypnosis bundle',
  'hypnosis training bundle',
  'fare hypnosis training bundle',
  'mind styling hypnosis 2.0',
]);

function normalizeLabel(label) {
  return label
    .toLowerCase()
    .replace(/™/g, '')
    .replace(/\u2122/g, '')
    .trim();
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // ── Auth: admin only ──
  const caller = await base44.auth.me();
  if (!caller || caller.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const dryRun = body.dry_run !== false; // Default true
  const batchId = body.batch_id || `phase6b-${new Date().toISOString().slice(0, 10)}`;

  console.log(`[bulkMarkClients] Starting — dry_run=${dryRun}, batch_id=${batchId}`);

  // ── 1. Resolve dynamic product IDs from catalog ──
  const allProducts = await base44.asServiceRole.entities.Product.list('-created_date', 500);
  for (const [key, mapping] of Object.entries(PRODUCT_MAP)) {
    if (!mapping.product_id && mapping.product_key) {
      const match = allProducts.find(p =>
        p.key?.toLowerCase() === mapping.product_key ||
        normalizeLabel(p.name || '') === key
      );
      if (match) {
        mapping.product_id = match.id;
        mapping.resolved_from = 'catalog_lookup';
      }
    }
  }

  // ── 2. Fetch all Leads and Users ──
  const allLeads = await base44.asServiceRole.entities.Lead.list('-created_date', 5000);
  const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 5000);
  const userEmails = new Set(allUsers.map(u => u.email?.toLowerCase()).filter(Boolean));

  // ── 3. Classify leads ──
  const report = {
    dry_run: dryRun,
    batch_id: batchId,
    timestamp: new Date().toISOString(),

    // Counts
    total_leads: allLeads.length,
    total_users: allUsers.length,
    eligible_to_mark: 0,
    already_clients: 0,
    excluded_archived: 0,
    excluded_has_user: 0,
    excluded_opted_out_archived: 0,

    // Product mapping
    with_mapped_products: 0,
    with_unmapped_labels: 0,
    with_no_purchase_data: 0,
    would_receive_new_grants: 0,
    already_have_grants_preserved: 0,
    duplicate_grants_skipped: 0,

    // Tables
    product_mapping_table: [],
    unmapped_labels_table: [],
    sample_updates: [],

    // Execution
    leads_updated: 0,
    grants_appended: 0,
    errors: [],

    // Risk summary
    risk_summary: {
      users_created: 0,
      emails_sent: 0,
      invites_sent: 0,
      access_granted_immediately: 0,
      stripe_changes: 0,
      product_changes: 0,
      course_changes: 0,
      leads_deleted: 0,
    },
  };

  // Build product mapping table for report
  const mappingReport = {};
  const unmappedReport = {};

  // Categorize each lead
  const eligibleLeads = [];

  for (const lead of allLeads) {
    const email = lead.email?.toLowerCase();
    const isArchived = lead.lead_status === 'archived';
    const hasUser = userEmails.has(email);
    const isAlreadyClient = lead.converted_to_client === true;
    const isOptedOut = !!lead.opted_out_at;

    if (isArchived) {
      report.excluded_archived++;
      if (isOptedOut) report.excluded_opted_out_archived++;
      continue;
    }

    if (hasUser) {
      report.excluded_has_user++;
      continue;
    }

    if (isAlreadyClient) {
      report.already_clients++;
      continue;
    }

    // This lead is eligible for marking as client
    eligibleLeads.push(lead);
  }

  report.eligible_to_mark = eligibleLeads.length;

  // ── 4. Analyze product mappings and prepare updates ──
  const updatesToApply = []; // { lead, updates, newGrants, mappingDetails }

  for (const lead of eligibleLeads) {
    const updates = {
      converted_to_client: true,
      stage: 'won',
    };

    const existingGrantProductIds = new Set(
      (lead.pending_access_grants || [])
        .filter(g => g.action_type === 'grant_product' && g.product_id)
        .map(g => g.product_id)
    );

    if (lead.pending_access_grants && lead.pending_access_grants.length > 0) {
      report.already_have_grants_preserved++;
    }

    const newGrants = [];
    const mappingDetails = { mapped: [], unmapped: [], skipped_duplicates: [] };

    if (lead.what_they_bought) {
      const parts = lead.what_they_bought.split(',').map(s => s.trim()).filter(Boolean);

      for (const part of parts) {
        const normalized = normalizeLabel(part);

        // Check if it's a known unmapped label
        if (UNMAPPED_LABELS.has(normalized)) {
          mappingDetails.unmapped.push(part);
          if (!unmappedReport[part]) unmappedReport[part] = 0;
          unmappedReport[part]++;
          continue;
        }

        // Try to find in product map
        const mapping = PRODUCT_MAP[normalized];
        if (mapping && mapping.product_id) {
          // Check for duplicate
          if (existingGrantProductIds.has(mapping.product_id)) {
            mappingDetails.skipped_duplicates.push(part);
            report.duplicate_grants_skipped++;
            continue;
          }

          // Create new grant
          newGrants.push({
            action_type: 'grant_product',
            platform_item_name: mapping.product_name,
            product_id: mapping.product_id,
            course_id: null,
            webinar_id: null,
            csv_purchase_text: part,
            confidence: 'exact',
            protected: false,
            status: 'pending',
            provisioned_at: null,
            migration_batch_id: batchId,
          });
          existingGrantProductIds.add(mapping.product_id); // Prevent dups within same lead

          mappingDetails.mapped.push({ part, product_id: mapping.product_id, product_name: mapping.product_name });
          if (!mappingReport[mapping.product_name]) mappingReport[mapping.product_name] = { product_id: mapping.product_id, count: 0 };
          mappingReport[mapping.product_name].count++;
        } else {
          // Unknown label — not in map and not in known unmapped
          mappingDetails.unmapped.push(part);
          if (!unmappedReport[part]) unmappedReport[part] = 0;
          unmappedReport[part]++;
        }
      }

      if (mappingDetails.mapped.length > 0 || mappingDetails.skipped_duplicates.length > 0) {
        report.with_mapped_products++;
      }
      if (mappingDetails.unmapped.length > 0) {
        report.with_unmapped_labels++;
      }
    } else {
      report.with_no_purchase_data++;
    }

    if (newGrants.length > 0) {
      report.would_receive_new_grants++;
      // Append to existing grants
      updates.pending_access_grants = [...(lead.pending_access_grants || []), ...newGrants];
    }

    updatesToApply.push({ lead, updates, newGrants, mappingDetails });
  }

  // Build report tables
  report.product_mapping_table = Object.entries(mappingReport).map(([name, data]) => ({
    product_name: name,
    product_id: data.product_id,
    leads_matched: data.count,
  }));

  report.unmapped_labels_table = Object.entries(unmappedReport)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, lead_count: count, status: 'NOT_MAPPED — no grant created' }));

  // Sample updates (first 5)
  report.sample_updates = updatesToApply.slice(0, 5).map(({ lead, updates, newGrants, mappingDetails }) => ({
    lead_id: lead.id,
    email: lead.email,
    full_name: lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
    what_they_bought: lead.what_they_bought,
    current_converted: lead.converted_to_client,
    current_stage: lead.stage,
    will_set_converted: updates.converted_to_client,
    will_set_stage: updates.stage,
    existing_grants: (lead.pending_access_grants || []).length,
    new_grants_to_add: newGrants.length,
    mapped: mappingDetails.mapped,
    unmapped: mappingDetails.unmapped,
    skipped_duplicates: mappingDetails.skipped_duplicates,
  }));

  // ── 5. Execute if not dry run ──
  if (!dryRun) {
    console.log(`[bulkMarkClients] EXECUTING — ${updatesToApply.length} leads to update`);

    // Process one-at-a-time with generous throttling to avoid rate limits
    for (let i = 0; i < updatesToApply.length; i++) {
      const { lead, updates, newGrants } = updatesToApply[i];

      let attempts = 0;
      const maxAttempts = 4;
      while (attempts < maxAttempts) {
        try {
          const updatePayload = {
            converted_to_client: true,
            stage: 'won',
          };

          if (newGrants.length > 0) {
            updatePayload.pending_access_grants = [
              ...(lead.pending_access_grants || []),
              ...newGrants,
            ];
          }

          await base44.asServiceRole.entities.Lead.update(lead.id, updatePayload);
          report.leads_updated++;
          report.grants_appended += newGrants.length;
          break; // Success
        } catch (err) {
          attempts++;
          if (err.message?.includes('Rate limit') && attempts < maxAttempts) {
            const delay = 3000 * attempts; // 3s, 6s, 9s backoff
            console.log(`[bulkMarkClients] Rate limited on ${lead.email}, retry ${attempts}/${maxAttempts} after ${delay}ms`);
            await new Promise(r => setTimeout(r, delay));
          } else {
            console.error(`[bulkMarkClients] Error updating lead ${lead.id} (${lead.email}):`, err.message);
            report.errors.push({ lead_id: lead.id, email: lead.email, error: err.message });
            break;
          }
        }
      }

      // 800ms pause between each update
      if (i < updatesToApply.length - 1) {
        await new Promise(r => setTimeout(r, 800));
      }

      // Progress log every 25 records
      if ((i + 1) % 25 === 0) {
        console.log(`[bulkMarkClients] Progress: ${i + 1}/${updatesToApply.length} (${report.leads_updated} success, ${report.errors.length} errors)`);
      }
    }

    console.log(`[bulkMarkClients] DONE — ${report.leads_updated} updated, ${report.grants_appended} grants added, ${report.errors.length} errors`);
  } else {
    console.log(`[bulkMarkClients] DRY RUN — ${updatesToApply.length} leads would be updated`);
  }

  // Finalize report
  report.total_grants_to_append = updatesToApply.reduce((sum, u) => sum + u.newGrants.length, 0);

  return Response.json(report);
});