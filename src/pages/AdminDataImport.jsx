import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";
import { ENTITY_NAMES } from "@/components/admin/entityList";
import { parseImportFile, importRecords } from "@/components/admin/useEntityImport";

export default function AdminDataImport() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [entity, setEntity] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setParsed(null);
    setResults([]);
    setError("");
    try {
      const text = await f.text();
      const result = parseImportFile(text);
      setParsed(result);
      if (result.kind === "single") {
        const guess = ENTITY_NAMES.find((n) => f.name.toLowerCase().startsWith(n.toLowerCase()));
        setEntity(guess || "");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const runImport = async () => {
    setBusy(true);
    setResults([]);
    setError("");
    const collected = [];
    try {
      const jobs = parsed.kind === "single"
        ? [{ entity, records: parsed.records }]
        : parsed.groups;

      for (const job of jobs) {
        setProgress(`Importing ${job.entity}…`);
        const { created, errors } = await importRecords(job.entity, job.records, (done, total) => {
          setProgress(`Importing ${job.entity} — ${done} of ${total}`);
        });
        collected.push({ entity: job.entity, created, errors });
        setResults([...collected]);
      }
      setProgress("");
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-[#1E3A32]">Loading…</div>;
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-[#1E3A32] px-6 text-center">
        <ShieldAlert className="w-10 h-10 text-[#D8B46B]" />
        <h1 className="font-serif text-2xl">Admins only</h1>
        <p className="text-sm text-[#2B2725]/70">You don't have permission to import data.</p>
      </div>
    );
  }

  const canRun = parsed && !busy && (parsed.kind === "bundle" || entity);

  return (
    <div className="min-h-screen bg-[#F9F5EF] px-6 py-10 max-w-3xl mx-auto">
      <h1 className="font-serif text-3xl text-[#1E3A32] mb-2">Data Import</h1>
      <p className="text-sm text-[#2B2725]/70 mb-6">
        Upload a JSON file created by the Data Export page. Records are added as new entries — existing data is never overwritten or deleted.
      </p>

      <label className="block border-2 border-dashed border-[#D8B46B]/60 rounded-lg bg-white px-6 py-10 text-center cursor-pointer hover:bg-[#E4D9C4]/30 transition-colors">
        <Upload className="w-6 h-6 mx-auto mb-2 text-[#1E3A32]" />
        <span className="text-sm text-[#1E3A32]">{file ? file.name : "Choose a JSON file"}</span>
        <input type="file" accept="application/json,.json" onChange={handleFile} className="hidden" />
      </label>

      {error && (
        <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-4 py-2">{error}</p>
      )}

      {parsed?.kind === "single" && (
        <div className="mt-6">
          <label className="block text-sm text-[#2B2725] mb-2">
            Import {parsed.records.length} records into:
          </label>
          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className="w-full bg-white border border-[#E4D9C4] rounded px-3 py-2 text-sm text-[#2B2725]"
          >
            <option value="">Select a collection…</option>
            {ENTITY_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      )}

      {parsed?.kind === "bundle" && (
        <div className="mt-6 bg-white border border-[#E4D9C4] rounded p-4">
          <p className="text-sm text-[#1E3A32] mb-2 font-medium">
            Full bundle — {parsed.groups.length} collections
          </p>
          <div className="grid sm:grid-cols-2 gap-1 text-xs text-[#2B2725]/70">
            {parsed.groups.map((g) => (
              <span key={g.entity}>{g.entity} — {g.records.length}</span>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={runImport}
        disabled={!canRun}
        className="mt-6 bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
      >
        {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
        Import
      </Button>

      {progress && <p className="mt-4 text-sm text-[#1E3A32]">{progress}</p>}

      {results.length > 0 && (
        <div className="mt-6 space-y-2">
          {results.map((r) => (
            <div key={r.entity} className="bg-white border border-[#E4D9C4] rounded px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-[#1E3A32]">
                {r.errors.length === 0
                  ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                  : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                <span>{r.entity} — {r.created} added</span>
              </div>
              {r.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-700 mt-1 ml-6">{e}</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}