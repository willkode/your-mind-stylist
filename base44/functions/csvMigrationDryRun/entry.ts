import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { parse } from 'npm:csv-parse@5.5.3/sync';

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
  'jane@doe.com',
  'xfggrre@gmxb.com',
  '66@dianabykiris.fun',
  '4@arianabymishel.fun',
]);

// High-confidence typo corrections (confirmed by matching identity across files)
const TYPO_CORRECTIONS = {
  'haley@ilovevagas.com': 'haley@ilovevegas.com',
};

const PURCHASE_MAP = {
  // Exact matches
  'Pocket Mindset™': { match: 'exact', platform_item: 'Pocket Mindset™ (Subscription)', type: 'product', protected: false },
  'Cleaning Out Your Closet™': { match: 'exact', platform_item: 'Cleaning Out Your Closet™', type: 'product', protected: false },
  'LENS™': { match: 'exact', platform_item: 'LENS™ Framework', type: 'course', protected: false },
  // Likely matches
  'Hypnosis Bundle': { match: 'likely', platform_item: 'FARE Hypnosis Training Bundle', type: 'course', protected: true },
  'FARE Hypnosis Training Bundle': { match: 'likely', platform_item: 'FARE Hypnosis Training Bundle', type: 'course', protected: true },
  'Hypnosis Training Bundle': { match: 'likely', platform_item: 'FARE Hypnosis Training Bundle', type: 'course', protected: true },
  'Mind Styling Hypnosis 1.0': { match: 'likely', platform_item: 'Mind Styling Hypnosis Training', type: 'course', protected: true },
  'Webinar - Quantum Leaping Through Thought': { match: 'exact', platform_item: 'Quantum Leaping Through Thought', type: 'course' },
  'Webinar - Imposter Syndrome and Other Myths to Ditch': { match: 'exact', platform_item: 'Imposter Syndrome and Other Myths to Ditch', type: 'course' },
};

function normalizeEmail(email) {
  if (!email) return '';
  let e = email.trim().toLowerCase();
  // Apply typo corrections
  if (TYPO_CORRECTIONS[e]) e = TYPO_CORRECTIONS[e];
  return e;
}

function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

function normalizeName(name) {
  if (!name) return '';
  return name.trim().replace(/\s+/g, ' ');
}

function parsePurchases(text) {
  if (!text) return [];
  return text.split(',').map(s => s.trim()).filter(Boolean);
}

function editDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
    }
  }
  return dp[m][n];
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  // 1. Fetch and parse all CSVs
  const allRows = [];
  const fileStats = [];

  for (const file of CSV_FILES) {
    const resp = await fetch(file.url);
    const text = await resp.text();
    const records = parse(text, { columns: true, skip_empty_lines: true, trim: true, bom: true });
    fileStats.push({ name: file.name, rowCount: records.length, columns: records.length > 0 ? Object.keys(records[0]) : [] });
    
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      // Normalize column names (Source -> source)
      const normalized = {};
      for (const [key, val] of Object.entries(row)) {
        normalized[key.toLowerCase().trim()] = val;
      }
      allRows.push({
        ...normalized,
        _csv_file: file.name,
        _csv_default_source: file.defaultSource,
        _csv_row_index: i,
        _raw: { ...row },
      });
    }
  }

  // 2. Process each row
  const excluded = [];
  const malformed = [];
  const sharedEmailConflicts = [];
  const mergedRecords = new Map(); // email -> merged record
  const multiEmailRows = [];

  for (const row of allRows) {
    let rawEmail = (row.email || '').trim();
    
    // Check for multi-email rows
    if (rawEmail.includes(',')) {
      const emails = rawEmail.split(',').map(e => e.trim());
      multiEmailRows.push({
        csv_file: row._csv_file,
        row_index: row._csv_row_index,
        emails,
        first_name: row.first_name,
        last_name: row.last_name,
        reason: 'Multiple emails in single field — needs manual split',
      });
      // Process first email only, flag the rest
      rawEmail = emails[0];
    }

    const email = normalizeEmail(rawEmail);

    // Check exclusions
    if (EXCLUDED_EMAILS.has(email)) {
      excluded.push({ email, name: `${row.first_name || ''} ${row.last_name || ''}`.trim(), csv_file: row._csv_file, reason: 'junk_test_spam' });
      continue;
    }

    // Check malformed
    if (!isValidEmail(email)) {
      malformed.push({ raw_email: rawEmail, name: `${row.first_name || ''} ${row.last_name || ''}`.trim(), csv_file: row._csv_file, reason: !rawEmail ? 'missing_email' : 'malformed_email' });
      continue;
    }

    const firstName = normalizeName(row.first_name);
    const lastName = normalizeName(row.last_name);
    const phone = normalizePhone(row.phone);
    const source = row._csv_default_source;
    const inColumnSource = (row.source || '').trim();
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
      // Merge into existing
      const existing = mergedRecords.get(email);
      
      // Track ALL name appearances for this email (for conflict detection later)
      existing._all_name_appearances = existing._all_name_appearances || [
        { file: existing.original_csv_rows[0]?.file, first_name: existing.first_name, last_name: existing.last_name }
      ];
      existing._all_name_appearances.push({ file: row._csv_file, first_name: firstName, last_name: lastName });
      
      // Append source
      if (source && !existing.import_sources.includes(source)) {
        existing.import_sources.push(source);
      }
      if (inColumnSource && !existing._in_column_sources.includes(inColumnSource)) {
        existing._in_column_sources.push(inColumnSource);
      }
      
      // Merge purchases
      if (whatBought && !existing.original_purchase_texts.includes(whatBought)) {
        existing.original_purchase_texts.push(whatBought);
      }
      
      // Fill blanks
      if (!existing.phone && phone) existing.phone = phone;
      if (!existing.address_line1 && address) existing.address_line1 = address;
      if (!existing.city && city) existing.city = city;
      if (!existing.state && state) existing.state = state;
      if (!existing.zip && zip) existing.zip = zip;
      if (!existing.what_inquired_about && whatInquired) existing.what_inquired_about = whatInquired;
      if (!existing.date_of_purchase && datePurchase) existing.date_of_purchase = datePurchase;
      if (followUp && existing.follow_up_actions !== followUp) {
        existing.follow_up_actions = [existing.follow_up_actions, followUp].filter(Boolean).join(' | ');
      }
      if (notes && existing.notes !== notes) {
        existing.notes = [existing.notes, notes].filter(Boolean).join(' | ');
      }
      
      // Store raw row
      existing.original_csv_rows.push({ file: row._csv_file, row_index: row._csv_row_index, data: row._raw });
      existing._merge_count++;
    } else {
      // New record
      mergedRecords.set(email, {
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        address_line1: address,
        city,
        state,
        zip,
        what_inquired_about: whatInquired,
        what_they_bought: '', // Will be built from original_purchase_texts
        date_of_purchase: datePurchase,
        follow_up_actions: followUp,
        notes,
        import_sources: source ? [source] : [],
        _in_column_sources: inColumnSource ? [inColumnSource] : [],
        original_purchase_texts: whatBought ? [whatBought] : [],
        original_csv_rows: [{ file: row._csv_file, row_index: row._csv_row_index, data: row._raw }],
        _name_conflicts: [],
        _merge_count: 1,
      });
    }
  }

  // 3. Identify EXACT same-email conflicts (different names on identical normalized email)
  const exactEmailConflicts = [];
  for (const [email, rec] of mergedRecords) {
    const appearances = rec._all_name_appearances;
    if (!appearances || appearances.length < 2) continue;

    // Get unique first/last names (lowercased, trimmed, non-empty)
    const uniqueFirstNames = [...new Set(appearances.map(a => a.first_name.toLowerCase().trim()).filter(Boolean))];
    const uniqueLastNames = [...new Set(appearances.map(a => a.last_name.toLowerCase().trim()).filter(Boolean))];

    // Only flag if there are actually different names — not just casing/whitespace
    if (uniqueFirstNames.length <= 1 && uniqueLastNames.length <= 1) continue;

    // Build purchases for this email
    const allPurchasesRaw = [];
    for (const text of rec.original_purchase_texts) {
      allPurchasesRaw.push(...parsePurchases(text));
    }
    const uniquePurchases = [...new Set(allPurchasesRaw)];

    // Classify using edit distance for accurate typo detection
    let recommendation = 'manual_review';
    let reason = '';

    // Case A: First/last name swapped (e.g., "Christine Chapin" vs "Chapin Christine")
    if (uniqueFirstNames.length === 2 && uniqueLastNames.length === 2) {
      const fn = uniqueFirstNames, ln = uniqueLastNames;
      if ((fn[0] === ln[1] && fn[1] === ln[0]) || fn.some(f => ln.includes(f))) {
        recommendation = 'safe_merge';
        reason = `First/last swapped: "${fn.join('" / "')}" ↔ "${ln.join('" / "')}" — same person.`;
      }
    }

    // Case B: Same last name(s), different first names
    if (recommendation === 'manual_review' && uniqueFirstNames.length >= 2 && uniqueLastNames.length <= 1) {
      // Check all pairs of first names
      let allClose = true;
      const pairReasons = [];
      for (let i = 0; i < uniqueFirstNames.length; i++) {
        for (let j = i + 1; j < uniqueFirstNames.length; j++) {
          const a = uniqueFirstNames[i], b = uniqueFirstNames[j];
          const dist = editDistance(a, b);
          const longer = Math.max(a.length, b.length);
          const isSubstring = a.includes(b) || b.includes(a);
          if (dist <= 2 || isSubstring) {
            pairReasons.push(`"${a}" ↔ "${b}" (edit dist ${dist}${isSubstring ? ', substring' : ''})`);
          } else {
            allClose = false;
          }
        }
      }
      if (allClose && pairReasons.length > 0) {
        recommendation = 'safe_merge';
        reason = `First name variant(s): ${pairReasons.join('; ')} — same last name "${uniqueLastNames[0]}".`;
      }
    }

    // Case C: Same first name(s), different last names
    if (recommendation === 'manual_review' && uniqueLastNames.length >= 2 && uniqueFirstNames.length <= 1) {
      let allClose = true;
      const pairReasons = [];
      for (let i = 0; i < uniqueLastNames.length; i++) {
        for (let j = i + 1; j < uniqueLastNames.length; j++) {
          const a = uniqueLastNames[i], b = uniqueLastNames[j];
          const dist = editDistance(a, b);
          const isSubstring = a.includes(b) || b.includes(a);
          if (dist <= 2 || isSubstring) {
            pairReasons.push(`"${a}" ↔ "${b}" (edit dist ${dist}${isSubstring ? ', substring' : ''})`);
          } else {
            allClose = false;
          }
        }
      }
      if (allClose && pairReasons.length > 0) {
        recommendation = 'safe_merge';
        reason = `Last name variant(s): ${pairReasons.join('; ')} — same first name "${uniqueFirstNames[0] || '(empty)'}".`;
      }
    }

    // Case D: Both first AND last differ — check if it's a close variant on both axes
    if (recommendation === 'manual_review' && uniqueFirstNames.length >= 2 && uniqueLastNames.length >= 2) {
      // Already checked swap in Case A. If we're here, it's genuinely different.
      recommendation = 'exclude_shared_email';
      reason = `Different first AND last names: [${uniqueFirstNames.join(', ')}] × [${uniqueLastNames.join(', ')}] — likely different people.`;
    }

    // Case E: Remaining manual_review — only first OR only last differs, but too far to auto-merge
    if (recommendation === 'manual_review') {
      if (uniqueFirstNames.length > 1) {
        recommendation = 'exclude_shared_email';
        reason = `Distinct first names: [${uniqueFirstNames.join(', ')}] with last [${uniqueLastNames.join(', ')}] — too different to auto-merge.`;
      } else {
        recommendation = 'exclude_shared_email';
        reason = `Distinct last names: [${uniqueLastNames.join(', ')}] with first [${uniqueFirstNames.join(', ')}] — too different to auto-merge.`;
      }
    }

    exactEmailConflicts.push({
      email,
      all_name_appearances: appearances,
      unique_first_names: uniqueFirstNames,
      unique_last_names: uniqueLastNames,
      source_files: rec.import_sources,
      purchases: uniquePurchases,
      recommendation,
      reason,
    });
  }

  // 3b. Detect possible same-person/different-email matches (separate section, does NOT block import)
  // Build name→emails index for cross-email matching
  const nameIndex = new Map(); // "firstname|lastname" -> [{email, file}]
  for (const [email, rec] of mergedRecords) {
    const key = `${rec.first_name.toLowerCase().trim()}|${rec.last_name.toLowerCase().trim()}`;
    if (!key || key === '|') continue;
    if (!nameIndex.has(key)) nameIndex.set(key, []);
    nameIndex.get(key).push({ email, files: rec.import_sources });
  }
  const possibleCrossEmailMatches = [];
  for (const [nameKey, entries] of nameIndex) {
    if (entries.length <= 1) continue;
    const uniqueEmails = [...new Set(entries.map(e => e.email))];
    if (uniqueEmails.length <= 1) continue;
    const [firstName, lastName] = nameKey.split('|');
    possibleCrossEmailMatches.push({
      name: `${firstName} ${lastName}`,
      emails: uniqueEmails,
      files: [...new Set(entries.flatMap(e => e.files))],
      note: 'Same name, different emails — may be same person with multiple accounts. Import as separate records unless manually merged.',
    });
  }

  // 4. Build normalized purchase map
  const allPurchaseTexts = new Set();
  const purchaseEnrollmentSummary = {};
  const unmappedPurchases = new Set();

  for (const [email, rec] of mergedRecords) {
    const allPurchases = [];
    for (const text of rec.original_purchase_texts) {
      const items = parsePurchases(text);
      allPurchases.push(...items);
    }
    // Dedupe purchases for this person
    const uniquePurchases = [...new Set(allPurchases)];
    rec.what_they_bought = uniquePurchases.join(', ');
    rec._parsed_purchases = uniquePurchases;
    
    for (const item of uniquePurchases) {
      allPurchaseTexts.add(item);
      const mapping = PURCHASE_MAP[item];
      if (mapping) {
        purchaseEnrollmentSummary[item] = purchaseEnrollmentSummary[item] || { ...mapping, count: 0 };
        purchaseEnrollmentSummary[item].count++;
      } else {
        unmappedPurchases.add(item);
      }
    }
  }

  // 5. Cross-check against existing Users and Leads
  const existingUsers = await base44.asServiceRole.entities.User.list();
  const existingUserMap = new Map();
  for (const u of existingUsers) {
    existingUserMap.set(u.email?.toLowerCase(), u);
  }

  let existingLeadCount = 0;
  const existingLeadMap = new Map();
  let leadPage = await base44.asServiceRole.entities.Lead.list('-created_date', 50);
  while (leadPage.length > 0) {
    for (const l of leadPage) {
      const e = l.email?.toLowerCase();
      if (e) existingLeadMap.set(e, l);
    }
    existingLeadCount += leadPage.length;
    if (leadPage.length < 50) break;
    leadPage = await base44.asServiceRole.entities.Lead.list('-created_date', 50, existingLeadCount);
  }

  // 6. Classify each merged record
  const willCreate = [];
  const willUpdateLead = [];
  const willUpdateUser = [];
  const alreadyExists = [];

  for (const [email, rec] of mergedRecords) {
    const existingUser = existingUserMap.get(email);
    const existingLead = existingLeadMap.get(email);

    if (existingUser) {
      willUpdateUser.push({
        email,
        name: `${rec.first_name} ${rec.last_name}`.trim(),
        user_id: existingUser.id,
        existing_name: existingUser.full_name,
        new_sources: rec.import_sources,
        purchases: rec._parsed_purchases,
        action: 'append_sources_to_existing_user',
      });
    } else if (existingLead) {
      willUpdateLead.push({
        email,
        name: `${rec.first_name} ${rec.last_name}`.trim(),
        lead_id: existingLead.id,
        existing_name: `${existingLead.first_name || ''} ${existingLead.last_name || ''}`.trim(),
        new_sources: rec.import_sources,
        purchases: rec._parsed_purchases,
        action: 'update_existing_lead',
      });
    } else {
      willCreate.push({
        email,
        name: `${rec.first_name} ${rec.last_name}`.trim(),
        sources: rec.import_sources,
        purchases: rec._parsed_purchases,
        merge_count: rec._merge_count,
      });
    }
  }

  // 7. Source breakdown
  const sourceBreakdown = {};
  for (const [email, rec] of mergedRecords) {
    for (const src of rec.import_sources) {
      sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
    }
  }

  // 8. Check for mode parameter
  const body = await req.json().catch(() => ({}));
  const mode = body.mode || 'full';

  // Conflict sub-counts
  const safeMergeCount = exactEmailConflicts.filter(r => r.recommendation === 'safe_merge').length;
  const excludeCount = exactEmailConflicts.filter(r => r.recommendation === 'exclude_shared_email').length;
  const manualReviewCount = exactEmailConflicts.filter(r => r.recommendation === 'manual_review').length;

  if (mode === 'conflicts_only') {
    return Response.json({
      exact_email_conflicts: {
        total: exactEmailConflicts.length,
        safe_merge: safeMergeCount,
        exclude_shared_email: excludeCount,
        manual_review: manualReviewCount,
        records: exactEmailConflicts,
      },
      possible_cross_email_matches: {
        total: possibleCrossEmailMatches.length,
        records: possibleCrossEmailMatches,
        note: 'These are different emails that share the same name. They do NOT block import. Each imports as a separate record.',
      },
    });
  }

  // Full report
  const report = {
    summary: {
      total_raw_rows: allRows.length,
      total_unique_normalized_emails: mergedRecords.size,
      total_excluded_junk: excluded.length,
      total_malformed_emails: malformed.length,
      total_multi_email_rows: multiEmailRows.length,
      total_merged_from_multiple_csvs: [...mergedRecords.values()].filter(r => r._merge_count > 1).length,
      exact_email_conflicts: {
        total: exactEmailConflicts.length,
        safe_merge: safeMergeCount,
        exclude_shared_email: excludeCount,
        manual_review: manualReviewCount,
      },
      possible_cross_email_matches: possibleCrossEmailMatches.length,
      will_create_new_leads: willCreate.length,
      will_update_existing_leads: willUpdateLead.length,
      will_update_existing_users: willUpdateUser.length,
      existing_users_in_system: existingUsers.length,
      existing_leads_in_system: existingLeadCount,
    },
    source_breakdown: sourceBreakdown,
    purchase_mapping: {
      exact_matches: Object.entries(purchaseEnrollmentSummary).filter(([,v]) => v.match === 'exact').map(([k,v]) => ({ csv_value: k, platform_item: v.platform_item, type: v.type, count: v.count, protected: v.protected || false })),
      likely_matches: Object.entries(purchaseEnrollmentSummary).filter(([,v]) => v.match === 'likely').map(([k,v]) => ({ csv_value: k, platform_item: v.platform_item, type: v.type, count: v.count, protected: v.protected || false })),
      unmapped: [...unmappedPurchases],
    },
    exclusions: excluded,
    malformed_emails: malformed,
    exact_email_conflicts: exactEmailConflicts,
    possible_cross_email_matches: possibleCrossEmailMatches,
    multi_email_rows: multiEmailRows,
    will_create_sample: willCreate.slice(0, 20),
    will_create_total: willCreate.length,
    will_update_leads: willUpdateLead,
    will_update_users: willUpdateUser,
    file_stats: fileStats,
  };

  return Response.json(report);
});