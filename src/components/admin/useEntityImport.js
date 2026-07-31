import { base44 } from "@/api/base44Client";

const BUILT_INS = ["id", "created_date", "updated_date", "created_by_id"];

function clean(record) {
  const copy = { ...record };
  BUILT_INS.forEach((k) => delete copy[k]);
  return copy;
}

// Accepts either a plain array (single-entity export) or the
// { data: { EntityName: [...] } } bundle produced by "Export everything".
export function parseImportFile(text) {
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return { kind: "single", records: parsed };
  if (parsed && typeof parsed.data === "object") {
    const groups = Object.entries(parsed.data)
      .filter(([, v]) => Array.isArray(v) && v.length > 0)
      .map(([entity, records]) => ({ entity, records }));
    return { kind: "bundle", groups };
  }
  throw new Error("Unrecognized file format — expected an export from the Data Export page.");
}

export async function importRecords(entityName, records, onProgress) {
  const api = base44.entities[entityName];
  if (!api) throw new Error(`Unknown collection: ${entityName}`);

  const rows = records.map(clean);
  const chunkSize = 100;
  let created = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    try {
      await api.bulkCreate(chunk);
      created += chunk.length;
    } catch (err) {
      errors.push(`Rows ${i + 1}–${i + chunk.length}: ${err?.message || err}`);
    }
    onProgress?.(Math.min(i + chunkSize, rows.length), rows.length);
  }

  return { created, errors };
}