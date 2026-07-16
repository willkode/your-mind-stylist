import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, Search, Check } from "lucide-react";

export default function ResourceAudioPicker({ open, onClose, onSelect }) {
  const [search, setSearch] = useState("");

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["audio-resources"],
    queryFn: () => base44.entities.Resource.filter({ resource_type: "audio" }),
    enabled: open,
  });

  const filtered = resources.filter((r) =>
    !search || r.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[70vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-[#1E3A32]">
            Pick from Resource Library
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audio resources..."
            className="pl-8"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {isLoading ? (
            <p className="text-sm text-[#2B2725]/50 text-center py-8">Loading resources...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-[#2B2725]/50 text-center py-8">
              {search ? "No audio resources match your search" : "No audio resources in your library"}
            </p>
          ) : (
            filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  onSelect(r);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-lg border border-[#E4D9C4] hover:border-[#D8B46B] hover:bg-[#D8B46B]/5 transition-colors flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded bg-[#1E3A32]/10 flex items-center justify-center flex-shrink-0">
                  <Music size={16} className="text-[#1E3A32]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1E3A32] truncate">{r.title}</p>
                  <p className="text-xs text-[#2B2725]/50">
                    {r.category || "Audio"}{r.file_size ? ` • ${r.file_size}` : ""}
                  </p>
                </div>
                <Check size={14} className="text-[#A6B7A3] opacity-0 group-hover:opacity-100" />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}