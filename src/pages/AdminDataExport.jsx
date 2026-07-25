import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Loader2, ShieldAlert } from "lucide-react";
import { ENTITY_NAMES } from "@/components/admin/entityList";
import { exportEntity, exportAll } from "@/components/admin/useEntityExport";

export default function AdminDataExport() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const handleOne = async (name) => {
    setBusy(name);
    setStatus("");
    try {
      const count = await exportEntity(name);
      setStatus(`Downloaded ${name} — ${count} records.`);
    } catch (err) {
      setStatus(`Could not export ${name}: ${err.message}`);
    }
    setBusy(null);
  };

  const handleAll = async () => {
    setBusy("__all__");
    try {
      const { count, failed } = await exportAll(ENTITY_NAMES, (n) => setStatus(`Exporting ${n}…`));
      setStatus(`Downloaded a single file with ${count} entities${failed.length ? ` (${failed.length} skipped)` : ""}.`);
    } catch (err) {
      setStatus(`Export failed: ${err.message}`);
    }
    setBusy(null);
  };

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-[#1E3A32]">Loading…</div>;
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-[#1E3A32] px-6 text-center">
        <ShieldAlert className="w-10 h-10 text-[#D8B46B]" />
        <h1 className="font-serif text-2xl">Admins only</h1>
        <p className="text-sm text-[#2B2725]/70">You don't have permission to export data.</p>
      </div>
    );
  }

  const filtered = ENTITY_NAMES.filter((n) => n.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F9F5EF] px-6 py-10 max-w-5xl mx-auto">
      <h1 className="font-serif text-3xl text-[#1E3A32] mb-2">Data Export</h1>
      <p className="text-sm text-[#2B2725]/70 mb-6">Download any collection as a JSON file.</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          placeholder="Search collections…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white"
        />
        <Button onClick={handleAll} disabled={!!busy} className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF] whitespace-nowrap">
          {busy === "__all__" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Export everything
        </Button>
      </div>

      {status && <p className="text-sm text-[#1E3A32] mb-4 bg-[#E4D9C4]/50 px-4 py-2 rounded">{status}</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((name) => (
          <div key={name} className="flex items-center justify-between gap-2 bg-white border border-[#E4D9C4] rounded px-4 py-3">
            <span className="text-sm text-[#2B2725] truncate">{name}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={!!busy}
              onClick={() => handleOne(name)}
              className="border-[#1E3A32]/30 text-[#1E3A32]"
            >
              {busy === name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </Button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-[#2B2725]/60 mt-6">No collections match "{search}".</p>
      )}
    </div>
  );
}