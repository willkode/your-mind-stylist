import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { PenSquare, FileVideo, Headphones, Mail, Download, Target, Sparkles, FileText, Code } from "lucide-react";

const createGroups = [
  {
    title: "Blog & Content",
    items: [
      { icon: PenSquare, label: "New Blog Post", link: "BlogEditor?mode=new" },
      { icon: FileText, label: "Blog Manager", link: "BlogManager" },
    ]
  },
  {
    title: "Content Alchemy",
    items: [
      { icon: Sparkles, label: "Alchemy Suite", link: "ContentStudio" },
      { icon: Target, label: "Social Transformer", link: "ContentStudio" },
      { icon: Download, label: "Lead Magnets", link: "ManagerLeadMagnets" },
    ]
  },
  {
    title: "Courses & Learning",
    items: [
      { icon: FileVideo, label: "Course Manager", link: "CourseManager" },
      { icon: Headphones, label: "Audio Sessions", link: "ManagerAudioSessions" },
    ]
  },
  {
    title: "Email & Sequences",
    items: [
      { icon: Mail, label: "Email Templates", link: "ManagerEmailTemplates" },
      { icon: Mail, label: "Email Sequences", link: "ManagerEmailSequences" },
    ]
  },
  {
    title: "Content Voice",
    items: [
      { icon: Sparkles, label: "Voice Profiles", link: "ManagerVoiceProfiles" },
    ]
  },
  {
    title: "Resources",
    items: [
      { icon: FileText, label: "Resource Library", link: "ManagerResources" },
    ]
  },
];

export default function ManagerDashboardCreate() {
  return (
    <div className="p-6 bg-white border-t border-[#E4D9C4] space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
        {createGroups.map((group, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="text-xs text-[#D8B46B] uppercase tracking-wider font-medium">{group.title}</h3>
            <div className="space-y-2">
              {group.items.map((item, itemIdx) => (
                <Link
                  key={itemIdx}
                  to={createPageUrl(item.link)}
                  className="flex items-center gap-2 p-2 text-[#1E3A32] hover:bg-[#F9F5EF] rounded transition-colors group"
                >
                  <item.icon size={16} className="text-[#2B2725]/40 group-hover:text-[#D8B46B] transition-colors" />
                  <span className="text-sm group-hover:text-[#D8B46B] transition-colors">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}