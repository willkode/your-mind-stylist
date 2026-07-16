import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { parse } from 'npm:csv-parse@5.5.3/sync';

// ═══════════════════════════════════════════════════════════════════════════
// CSV MIGRATION — LIVE IMPORT
// Approved constraints:
//   ✅ Create new Lead records
//   ✅ Update existing Lead records (append sources, fill blanks)
//   ✅ Append import metadata to existing User-linked profiles
//   🔴 NO emails, invites, enrollments, or product grants
//   🔴 Exclude 18 shared-email conflicts
//   🔴 Import cross-email same-name records as SEPARATE people
// ═══════════════════════════════════════════════════════════════════════════

const CSV_FILES = [
  { name: 'Acuity list', url: 'https://media.base44.com/files/public/693a98b3e154ab3b36c88ebb/305b10461_Acuitylist.csv', defaultSource: 'Acuity list' },
  { name: 'CRM Conscious Nap', url: 'https://media.base44.com/files/public/693a98b3e154ab3b36c88ebb/ba0baaaed_CRMConsciousNap.csv', defaultSource: 'CRM Conscious Nap' },
  { name: 'CRM Contact: Colleagues', url: 'https://media.base44.com/files/public/693a98b3e154ab3b36c88ebb/b943b01ad_CRMContactColleagues.csv', defaultSource: 'CRM Contact: Colleagues' },
  { name: 'Linda Clients', url: 'https://media.base44.com/files/public/693a98b3e154ab3b36c88ebb/def5a1464_LindaClients.csv', defaultSource: 'Linda Clients' },
  { name: 'Roberta Updated 3/2026', url: 'https://media.base44.com/files/public/693a98b3e154ab3b36c88ebb/54a61e0f0_Roberta-Updated32026.csv', defaultSource: 'Roberta Updated 3/2026' },
  { name: 'LENS Students', url: 'https://media.base44.com/files/public/693a98b3e154ab3b36c88ebb/176acb139_LENSStudents.csv', defaultSource: 'LENS Students' },
  { name: 'Hypnosis Students', url: 'https://media.base44.com/files/public/693a98b3e154ab3b36c88ebb/09f5f051a_HypnosisStudents.csv', defaultSource: 'Hypnosis Students' },
];

const EXCLUDED_EMAILS = new Set([
  'jane@doe.com', 'xfggrre@gmxb.com', '66@dianabykiris.fun', '4@arianabymishel.fun',
]);

const TYPO_CORRECTIONS = { 'haley@ilovevagas.com': 'haley@ilovevegas.com' };

// ── Helpers ────────────────────────────────────────────────────────────────

function normalizeEmail(email) {
  if (!email) return '';
  let e = email.trim().toLowerCase();
  if (TYPO_CORRECTIONS[e]) e = TYPO_CORRECTIONS[e];
  return e;
}

function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePhone(phone) { return phone ? phone.replace(/[^\d+]/g, '') : ''; }
function normalizeName(name) { return name ? name.trim().replace(/\s+/g, ' ') : ''; }
function parsePurchases(text) { return text ? text.split(',').map(s => s.trim()).filter(Boolean) : []; }

function editDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function classifyConflict(appearances) {
  const uniqueFirstNames = [...new Set(appearances.map(a => a.first_name.toLowerCase().trim()).filter(Boolean))];
  const uniqueLastNames = [...new Set(appearances.map(a => a.last_name.toLowerCase().trim()).filter(Boolean))];
  if (uniqueFirstNames.length <= 1 && uniqueLastNames.length <= 1) return { isConflict: false };

  let recommendation = 'manual_review';

  // Swap
  if (uniqueFirstNames.length === 2 && uniqueLastNames.length === 2) {
    const fn = uniqueFirstNames, ln = uniqueLastNames;
    if ((fn[0] === ln[1] && fn[1] === ln[0]) || fn.some(f => ln.includes(f))) {
      recommendation = 'safe_merge';
    }
  }

  // Same last, different first
  if (recommendation === 'manual_review' && uniqueFirstNames.length >= 2 && uniqueLastNames.length <= 1) {
    let allClose = true;
    for (let i = 0; i < uniqueFirstNames.length && allClose; i++) {
      for (let j = i + 1; j < uniqueFirstNames.length && allClose; j++) {
        const a = uniqueFirstNames[i], b = uniqueFirstNames[j];
        if (editDistance(a, b) > 2 && !a.includes(b) && !b.includes(a)) allClose = false;
      }
    }
    if (allClose) recommendation = 'safe_merge';
  }

  // Same first, different last
  if (recommendation === 'manual_review' && uniqueLastNames.length >= 2 && uniqueFirstNames.length <= 1) {
    let allClose = true;
    for (let i = 0; i < uniqueLastNames.length && allClose; i++) {
      for (let j = i + 1; j < uniqueLastNames.length && allClose; j++) {
        const a = uniqueLastNames[i], b = uniqueLastNames[j];
        if (editDistance(a, b) > 2 && !a.includes(b) && !b.includes(a)) allClose = false;
      }
    }
    if (allClose) recommendation = 'safe_merge';
  }

  // Anything remaining is exclude
  if (recommendation === 'manual_review') recommendation = 'exclude_shared_email';

  return { isConflict: true, recommendation, uniqueFirstNames, uniqueLastNames };
}

// ── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const BATCH_ID = `csv-import-${Date.now()}`;
  const IMPORTED_AT = new Date().toISOString();
  const sourceCounters = {};

  // ═════════════════════════════════════════════════════════════════════════
  // PHASE 1: Parse & merge all CSVs (identical to dry run)
  // ═════════════════════════════════════════════════════════════════════════
  const allRows = [];
  for (const file of CSV_FILES) {
    const resp = await fetch(file.url);
    const text = await resp.text();
    const records = parse(text, { columns: true, skip_empty_lines: true, trim: true, bom: true });
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const normalized = {};
      for (const [key, val] of Object.entries(row)) {
        normalized[key.toLowerCase().trim()] = val;
      }
      allRows.push({ ...normalized, _csv_file: file.name, _csv_default_source: file.defaultSource, _csv_row_index: i, _raw: { ...row } });
    }
  }

  const mergedRecords = new Map();
  const excluded = [];
  const malformed = [];

  for (const row of allRows) {
    let rawEmail = (row.email || '').trim();
    if (rawEmail.includes(',')) rawEmail = rawEmail.split(',')[0].trim();
    const email = normalizeEmail(rawEmail);

    if (EXCLUDED_EMAILS.has(email)) { excluded.push(email); continue; }
    if (!isValidEmail(email)) { malformed.push(rawEmail); continue; }

    const firstName = normalizeName(row.first_name);
    const lastName = normalizeName(row.last_name);
    const phone = normalizePhone(row.phone);
    const source = row._csv_default_source;
    const whatBought = (row.what_they_bought || '').trim();
    const whatInquired = (row.what_inquired_about || '').trim();
    const datePurchase = (row.date_of_purchase || '').trim();
    const followUp = (row.follow_up_actions || '').trim();
    const notes = (row.notes || '').trim();
    const address = (row.address_line1 || '').trim();
    const city = (row.city || '').trim();
    const state = (row.state || '').trim();
    const zip = (row.zip || '').trim();

    if (mergedRecords.has(email)) {
      const ex = mergedRecords.get(email);
      ex._all_name_appearances.push({ file: row._csv_file, first_name: firstName, last_name: lastName });
      if (source && !ex.import_sources.includes(source)) ex.import_sources.push(source);
      if (whatBought && !ex.original_purchase_texts.includes(whatBought)) ex.original_purchase_texts.push(whatBought);
      if (!ex.phone && phone) ex.phone = phone;
      if (!ex.address_line1 && address) ex.address_line1 = address;
      if (!ex.city && city) ex.city = city;
      if (!ex.state && state) ex.state = state;
      if (!ex.zip && zip) ex.zip = zip;
      if (!ex.what_inquired_about && whatInquired) ex.what_inquired_about = whatInquired;
      if (!ex.date_of_purchase && datePurchase) ex.date_of_purchase = datePurchase;
      if (followUp && ex.follow_up_actions !== followUp) {
        ex.follow_up_actions = [ex.follow_up_actions, followUp].filter(Boolean).join(' | ');
      }
      if (notes && ex.notes !== notes) {
        ex.notes = [ex.notes, notes].filter(Boolean).join(' | ');
      }
      ex.original_csv_rows.push({ file: row._csv_file, row_index: row._csv_row_index, data: row._raw });
    } else {
      mergedRecords.set(email, {
        email, first_name: firstName, last_name: lastName, phone,
        address_line1: address, city, state, zip,
        what_inquired_about: whatInquired, what_they_bought: '',
        date_of_purchase: datePurchase, follow_up_actions: followUp, notes,
        import_sources: source ? [source] : [],
        original_purchase_texts: whatBought ? [whatBought] : [],
        original_csv_rows: [{ file: row._csv_file, row_index: row._csv_row_index, data: row._raw }],
        _all_name_appearances: [{ file: row._csv_file, first_name: firstName, last_name: lastName }],
      });
    }
  }

  // Build purchases
  for (const [, rec] of mergedRecords) {
    const all = [];
    for (const text of rec.original_purchase_texts) all.push(...parsePurchases(text));
    rec.what_they_bought = [...new Set(all)].join(', ');
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PHASE 2: Classify conflicts & partition records
  // ═════════════════════════════════════════════════════════════════════════
  const excludedConflicts = [];
  const importableEmails = new Set();

  for (const [email, rec] of mergedRecords) {
    const appearances = rec._all_name_appearances;
    if (appearances.length >= 2) {
      const result = classifyConflict(appearances);
      if (result.isConflict && result.recommendation === 'exclude_shared_email') {
        excludedConflicts.push({
          email,
          unique_first_names: result.uniqueFirstNames,
          unique_last_names: result.uniqueLastNames,
          source_files: rec.import_sources,
          purchases: rec.what_they_bought,
          appearances,
        });
        continue; // Skip this record
      }
    }
    importableEmails.add(email);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PHASE 3: Fetch existing Users and Leads
  // ═════════════════════════════════════════════════════════════════════════
  const existingUsers = await base44.asServiceRole.entities.User.list();
  const existingUserMap = new Map();
  for (const u of existingUsers) {
    if (u.email) existingUserMap.set(u.email.toLowerCase(), u);
  }

  const existingLeadMap = new Map();
  let leadOffset = 0;
  let leadPage = await base44.asServiceRole.entities.Lead.list('-created_date', 50);
  while (leadPage.length > 0) {
    for (const l of leadPage) {
      if (l.email) existingLeadMap.set(l.email.toLowerCase(), l);
    }
    leadOffset += leadPage.length;
    if (leadPage.length < 50) break;
    leadPage = await base44.asServiceRole.entities.Lead.list('-created_date', 50, leadOffset);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PHASE 4: Execute writes
  // ═════════════════════════════════════════════════════════════════════════
  let createdCount = 0;
  let updatedLeadCount = 0;
  let updatedUserLinkedCount = 0;
  let skippedExisting = 0;
  let sampleCreated = null;
  let sampleUpdatedLead = null;
  let sampleUpdatedUser = null;
  const errors = [];

  // Collect records to bulk-create
  const toCreate = [];

  for (const email of importableEmails) {
    const rec = mergedRecords.get(email);
    const existingUser = existingUserMap.get(email);
    const existingLead = existingLeadMap.get(email);

    // Track source counters
    for (const src of rec.import_sources) {
      sourceCounters[src] = (sourceCounters[src] || 0) + 1;
    }

    if (existingUser) {
      // ── Update existing User-linked Lead (or create one) ───────────
      if (existingLead) {
        // Lead already exists for this User — append sources and fill blanks
        const updates = {};
        const existingSources = existingLead.import_sources || existingLead.sources || [];
        const newSources = rec.import_sources.filter(s => !existingSources.includes(s));
        if (newSources.length > 0) updates.sources = [...new Set([...(existingLead.sources || []), ...rec.import_sources])];
        updates.import_sources = [...new Set([...existingSources, ...rec.import_sources])];
        updates.imported_from_csv = true;
        updates.imported_at = IMPORTED_AT;
        updates.migration_batch_id = BATCH_ID;
        updates.migration_source_files = [...new Set([...(existingLead.migration_source_files || []), ...rec.import_sources])];
        // Fill blank fields only
        if (!existingLead.phone && rec.phone) updates.phone = rec.phone;
        if (!existingLead.address_line1 && rec.address_line1) updates.address_line1 = rec.address_line1;
        if (!existingLead.city && rec.city) updates.city = rec.city;
        if (!existingLead.state && rec.state) updates.state = rec.state;
        if (!existingLead.zip && rec.zip) updates.zip = rec.zip;
        if (!existingLead.what_inquired_about && rec.what_inquired_about) updates.what_inquired_about = rec.what_inquired_about;
        if (!existingLead.what_they_bought && rec.what_they_bought) updates.what_they_bought = rec.what_they_bought;
        else if (rec.what_they_bought && existingLead.what_they_bought) {
          // Append new purchase texts that aren't already there
          const existingPurchases = parsePurchases(existingLead.what_they_bought);
          const newPurchases = parsePurchases(rec.what_they_bought).filter(p => !existingPurchases.includes(p));
          if (newPurchases.length > 0) updates.what_they_bought = [...existingPurchases, ...newPurchases].join(', ');
        }
        if (!existingLead.date_of_purchase && rec.date_of_purchase) updates.date_of_purchase = rec.date_of_purchase;
        // Append original_purchase_texts
        updates.original_purchase_texts = [...new Set([...(existingLead.original_purchase_texts || []), ...rec.original_purchase_texts])];
        // Append original_csv_rows
        updates.original_csv_rows = [...(existingLead.original_csv_rows || []), ...rec.original_csv_rows];

        await base44.asServiceRole.entities.Lead.update(existingLead.id, updates);
        updatedUserLinkedCount++;
        if (!sampleUpdatedUser) sampleUpdatedUser = { email, lead_id: existingLead.id, user_id: existingUser.id, updates_applied: Object.keys(updates) };
      } else {
        // User exists but no Lead — create a Lead record linked to the user
        const leadData = buildLeadData(rec, existingUser.id, BATCH_ID, IMPORTED_AT);
        toCreate.push(leadData);
        if (!sampleCreated) sampleCreated = leadData;
      }
    } else if (existingLead) {
      // ── Update existing Lead ──────────────────────────────────────
      const updates = {};
      const existingSources = existingLead.import_sources || existingLead.sources || [];
      updates.import_sources = [...new Set([...existingSources, ...rec.import_sources])];
      updates.sources = [...new Set([...(existingLead.sources || []), ...rec.import_sources])];
      updates.imported_from_csv = true;
      updates.imported_at = IMPORTED_AT;
      updates.migration_batch_id = BATCH_ID;
      updates.migration_source_files = [...new Set([...(existingLead.migration_source_files || []), ...rec.import_sources])];
      // Fill blank fields only
      if (!existingLead.first_name && rec.first_name) updates.first_name = rec.first_name;
      if (!existingLead.last_name && rec.last_name) updates.last_name = rec.last_name;
      if (!existingLead.full_name && (rec.first_name || rec.last_name)) {
        updates.full_name = `${rec.first_name} ${rec.last_name}`.trim();
      }
      if (!existingLead.phone && rec.phone) updates.phone = rec.phone;
      if (!existingLead.address_line1 && rec.address_line1) updates.address_line1 = rec.address_line1;
      if (!existingLead.city && rec.city) updates.city = rec.city;
      if (!existingLead.state && rec.state) updates.state = rec.state;
      if (!existingLead.zip && rec.zip) updates.zip = rec.zip;
      if (!existingLead.what_inquired_about && rec.what_inquired_about) updates.what_inquired_about = rec.what_inquired_about;
      if (!existingLead.what_they_bought && rec.what_they_bought) updates.what_they_bought = rec.what_they_bought;
      else if (rec.what_they_bought && existingLead.what_they_bought) {
        const existingPurchases = parsePurchases(existingLead.what_they_bought);
        const newPurchases = parsePurchases(rec.what_they_bought).filter(p => !existingPurchases.includes(p));
        if (newPurchases.length > 0) updates.what_they_bought = [...existingPurchases, ...newPurchases].join(', ');
      }
      if (!existingLead.date_of_purchase && rec.date_of_purchase) updates.date_of_purchase = rec.date_of_purchase;
      if (!existingLead.notes && rec.notes) updates.notes = rec.notes;
      else if (rec.notes && existingLead.notes && existingLead.notes !== rec.notes) {
        updates.notes = `${existingLead.notes} | ${rec.notes}`;
      }
      if (!existingLead.follow_up_actions && rec.follow_up_actions) updates.follow_up_actions = rec.follow_up_actions;
      updates.original_purchase_texts = [...new Set([...(existingLead.original_purchase_texts || []), ...rec.original_purchase_texts])];
      updates.original_csv_rows = [...(existingLead.original_csv_rows || []), ...rec.original_csv_rows];

      await base44.asServiceRole.entities.Lead.update(existingLead.id, updates);
      updatedLeadCount++;
      if (!sampleUpdatedLead) sampleUpdatedLead = { email, lead_id: existingLead.id, updates_applied: Object.keys(updates) };
    } else {
      // ── Create new Lead ───────────────────────────────────────────
      const leadData = buildLeadData(rec, null, BATCH_ID, IMPORTED_AT);
      toCreate.push(leadData);
      if (!sampleCreated) sampleCreated = leadData;
    }
  }

  // Bulk create in batches of 25
  for (let i = 0; i < toCreate.length; i += 25) {
    const batch = toCreate.slice(i, i + 25);
    await base44.asServiceRole.entities.Lead.bulkCreate(batch);
    createdCount += batch.length;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PHASE 5: Build response
  // ═════════════════════════════════════════════════════════════════════════
  return Response.json({
    status: 'completed',
    migration_batch_id: BATCH_ID,
    imported_at: IMPORTED_AT,
    counts: {
      created: createdCount,
      updated_leads: updatedLeadCount,
      updated_user_linked: updatedUserLinkedCount,
      total_writes: createdCount + updatedLeadCount + updatedUserLinkedCount,
      skipped_excluded_junk: excluded.length,
      skipped_malformed: malformed.length,
      skipped_conflict_excluded: excludedConflicts.length,
    },
    source_counts: sourceCounters,
    conflict_report: {
      total_excluded: excludedConflicts.length,
      records: excludedConflicts,
    },
    samples: {
      created: sampleCreated,
      updated_lead: sampleUpdatedLead,
      updated_user_linked: sampleUpdatedUser,
    },
    safety_confirmations: {
      emails_sent: 0,
      invites_sent: 0,
      enrollments_created: 0,
      product_grants_created: 0,
      note: 'CONFIRMED: Zero emails, zero invites, zero enrollments, zero product grants were executed during this import.',
    },
    errors: errors.length > 0 ? errors : null,
  });
});

// ── Build Lead data for new record ──────────────────────────────────────────

function buildLeadData(rec, userId, batchId, importedAt) {
  const data = {
    email: rec.email,
    first_name: rec.first_name,
    last_name: rec.last_name,
    full_name: `${rec.first_name} ${rec.last_name}`.trim(),
    phone: rec.phone || undefined,
    address_line1: rec.address_line1 || undefined,
    city: rec.city || undefined,
    state: rec.state || undefined,
    zip: rec.zip || undefined,
    stage: 'new',
    source: 'csv_import',
    sources: rec.import_sources,
    lead_status: 'active',
    invite_status: 'not_invited',
    what_inquired_about: rec.what_inquired_about || undefined,
    what_they_bought: rec.what_they_bought || undefined,
    date_of_purchase: rec.date_of_purchase || undefined,
    follow_up_actions: rec.follow_up_actions || undefined,
    notes: rec.notes || undefined,
    imported_from_csv: true,
    imported_at: importedAt,
    import_sources: rec.import_sources,
    migration_batch_id: batchId,
    migration_source_files: rec.import_sources,
    original_purchase_texts: rec.original_purchase_texts,
    original_csv_rows: rec.original_csv_rows,
  };

  if (userId) {
    data.user_id = userId;
    data.converted_to_client = true;
  }

  // Remove undefined keys
  for (const key of Object.keys(data)) {
    if (data[key] === undefined) delete data[key];
  }

  return data;
}