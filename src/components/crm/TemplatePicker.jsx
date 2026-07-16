import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2 } from "lucide-react";

const CATEGORY_LABELS = {
  marketing: "Marketing",
  newsletter: "Newsletter",
  follow_up: "Follow-Up",
  event: "Event",
  announcement: "Announcement",
};

const CATEGORY_COLORS = {
  marketing: "bg-purple-100 text-purple-800",
  newsletter: "bg-blue-100 text-blue-800",
  follow_up: "bg-amber-100 text-amber-800",
  event: "bg-pink-100 text-pink-800",
  announcement: "bg-emerald-100 text-emerald-800",
};

export default function TemplatePicker({ onSelect, onSkip }) {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["email-templates-active"],
    queryFn: async () => {
      const all = await base44.entities.EmailTemplate.filter({ active: true }, "-created_date", 50);
      // Only show marketing-relevant templates
      return all.filter(t => ["marketing", "newsletter", "follow_up", "event", "announcement"].includes(t.category));
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-[#D8B46B]" size={20} />
      </div>
    );
  }

  if (templates.length === 0) {
    return null; // Don't show picker if no templates
  }

  return (
    <div className="border rounded-lg p-4 bg-[#F9F5EF]/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <FileText size={16} className="text-[#6E4F7D]" />
          Start from a Template
        </h3>
        <Button variant="ghost" size="sm" className="text-xs text-[#2B2725]/50" onClick={onSkip}>
          Skip — write from scratch
        </Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl)}
            className="text-left bg-white border border-[#E4D9C4] rounded-lg p-3 hover:border-[#D8B46B] hover:shadow-sm transition-all"
          >
            <p className="font-medium text-sm text-[#1E3A32] truncate">{tpl.name}</p>
            <p className="text-[10px] text-[#2B2725]/50 truncate mt-0.5">{tpl.subject}</p>
            <Badge className={`text-[9px] mt-2 ${CATEGORY_COLORS[tpl.category] || "bg-gray-100 text-gray-600"}`}>
              {CATEGORY_LABELS[tpl.category] || tpl.category}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}