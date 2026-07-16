import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Headphones } from "lucide-react";

export default function AudiobookPicker({ audiobookId, onChange }) {
  const { data: audiobooks = [] } = useQuery({
    queryKey: ["audiobooks-for-picker"],
    queryFn: () => base44.entities.Audiobook.list(),
  });

  const linked = audiobookId ? audiobooks.find((a) => a.id === audiobookId) : null;

  if (linked) {
    return (
      <div className="mt-2 border border-[#6E4F7D]/30 bg-[#6E4F7D]/5 rounded p-3">
        <Label className="text-xs">Linked Audiobook</Label>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2 min-w-0">
            <Headphones size={16} className="text-[#6E4F7D] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1E3A32] truncate">{linked.title}</p>
              <p className="text-xs text-[#2B2725]/60">
                {linked.chapters?.length || 0} chapters • {linked.file_format?.toUpperCase() || "MP3"}
                {linked.file_size_mb ? ` • ${linked.file_size_mb} MB` : ""}
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange("")}
            className="text-xs flex-shrink-0"
          >
            Change
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 border border-[#E4D9C4] bg-[#F9F5EF] rounded p-3 space-y-2">
      <Label className="text-xs">Link Audiobook</Label>
      <p className="text-xs text-[#2B2725]/50">
        Select an audiobook to grant player access when this variant is purchased.
      </p>
      {audiobooks.length === 0 ? (
        <p className="text-xs text-[#2B2725]/40 italic">
          No audiobooks found. Create one in the Audiobook Manager first.
        </p>
      ) : (
        <Select value={audiobookId || ""} onValueChange={onChange}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Choose an audiobook..." />
          </SelectTrigger>
          <SelectContent>
            {audiobooks.map((ab) => (
              <SelectItem key={ab.id} value={ab.id}>
                {ab.title} ({ab.chapters?.length || 0} chapters)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}