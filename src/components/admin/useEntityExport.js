import { base44 } from "@/api/base44Client";

async function fetchAll(entityName) {
  const api = base44.entities[entityName];
  if (!api) throw new Error(`Unknown entity: ${entityName}`);
  const all = [];
  const pageSize = 500;
  let skip = 0;
  // paginate until a short page comes back
  while (true) {
    const batch = await api.list("-created_date", pageSize, skip);
    if (!batch || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < pageSize) break;
    skip += pageSize;
    if (skip > 20000) break;
  }
  return all;
}

function download(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const stamp = () => new Date().toISOString().slice(0, 10);

export async function exportEntity(entityName) {
  const records = await fetchAll(entityName);
  download(`${entityName}-${stamp()}.json`, records);
  return records.length;
}

export async function exportAll(entityNames, onProgress) {
  const bundle = {};
  const failed = [];
  for (const name of entityNames) {
    onProgress?.(name);
    try {
      bundle[name] = await fetchAll(name);
    } catch (err) {
      failed.push({ entity: name, error: String(err?.message || err) });
    }
  }
  download(`all-entities-${stamp()}.json`, { exported_at: new Date().toISOString(), failed, data: bundle });
  return { count: Object.keys(bundle).length, failed };
}