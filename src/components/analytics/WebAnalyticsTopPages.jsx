import React from "react";
import { FileText } from "lucide-react";

export default function WebAnalyticsTopPages({ pages }) {
  if (!pages || pages.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E4D9C4] p-6">
        <h3 className="font-serif text-lg font-bold text-[#1E3A32] mb-4">Top Pages</h3>
        <p className="text-sm text-[#2B2725]/50">No page data available yet.</p>
      </div>
    );
  }

  const maxViews = Math.max(...pages.map(p => p.pageViews));

  return (
    <div className="bg-white rounded-xl border border-[#E4D9C4] p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={18} className="text-[#1E3A32]" />
        <h3 className="font-serif text-lg font-bold text-[#1E3A32]">Top Pages</h3>
      </div>
      <div className="space-y-3">
        {pages.map((page, index) => (
          <div key={index} className="group">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-[#2B2725] truncate max-w-[60%] font-medium" title={page.path}>
                {page.path === '/' ? 'Homepage' : page.path}
              </span>
              <div className="flex items-center gap-4 text-[#2B2725]/60 text-xs">
                <span>{page.pageViews.toLocaleString()} views</span>
                <span>{page.users.toLocaleString()} users</span>
              </div>
            </div>
            <div className="w-full bg-[#F9F5EF] rounded-full h-2">
              <div
                className="bg-[#1E3A32] h-2 rounded-full transition-all duration-500"
                style={{ width: `${(page.pageViews / maxViews) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}