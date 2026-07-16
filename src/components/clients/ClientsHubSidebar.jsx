import React from "react";
import { Users, Mail, FileText, FolderPlus, BarChart3, Workflow, Send, Clock, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SECTIONS = [
  {
    group: "People",
    items: [
      { key: "leads", label: "Leads", icon: Users },
      { key: "clients", label: "Clients", icon: Heart },
      { key: "pending_invites", label: "Invited — Pending Setup", icon: Clock },
      { key: "users", label: "Active App Users", icon: Users },
    ],
  },
  {
    group: "Email Marketing",
    items: [
      { key: "sequences", label: "Sequences", icon: Workflow },
      { key: "templates", label: "Templates", icon: FileText },
      { key: "campaigns", label: "Campaigns", icon: Send },
      { key: "groups", label: "Groups", icon: FolderPlus },
    ],
  },
  {
    group: "Insights",
    items: [
      { key: "analytics", label: "Email Analytics", icon: BarChart3 },
    ],
  },
];

export default function ClientsHubSidebar({ activeSection, onSectionChange, counts = {} }) {
  return (
    <aside className="w-56 flex-shrink-0 hidden lg:block">
      <nav className="sticky top-28 space-y-6">
        {SECTIONS.map((group) => (
          <div key={group.group}>
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#2B2725]/40 font-semibold mb-2 px-3">
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.key;
                const count = counts[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => onSectionChange(item.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-[#1E3A32] text-white font-medium"
                        : "text-[#2B2725]/70 hover:bg-[#E4D9C4]/50 hover:text-[#1E3A32]"
                    }`}
                  >
                    <Icon size={16} className={isActive ? "text-[#D8B46B]" : ""} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {count !== undefined && count > 0 && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-5 ${
                          isActive ? "border-white/30 text-white/80" : "border-[#E4D9C4] text-[#2B2725]/50"
                        }`}
                      >
                        {count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

// Export sections for mobile dropdown
export { SECTIONS };