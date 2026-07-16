import React from "react";
import { BarChart3, Clock, CheckCircle } from "lucide-react";

export default function WebAnalyticsEmptyState() {
  return (
    <div className="bg-white rounded-xl border border-[#E4D9C4] p-8 md:p-12 text-center">
      <div className="w-16 h-16 bg-[#D8B46B]/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <BarChart3 size={28} className="text-[#D8B46B]" />
      </div>
      <h3 className="font-serif text-xl font-bold text-[#1E3A32] mb-3">
        Collecting Your Website Data
      </h3>
      <p className="text-[#2B2725]/70 max-w-md mx-auto mb-8 leading-relaxed">
        Google Analytics 4 was just installed on your website. It typically takes 24–48 hours for data to begin appearing here. 
        As visitors browse your site, you'll see traffic metrics, top pages, and visitor sources populate this dashboard.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[#2B2725]/60">
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-green-500" />
          <span>GA4 tracking installed</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-green-500" />
          <span>Analytics connected</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[#D8B46B]" />
          <span>Waiting for first visitors</span>
        </div>
      </div>
    </div>
  );
}