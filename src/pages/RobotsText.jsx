import React from "react";

export default function RobotsText() {
  return (
    <div className="min-h-screen bg-[#F9F5EF] pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="font-serif text-4xl text-[#1E3A32] mb-8">Robots.txt Preview</h1>
        
        <div className="bg-[#D8B46B]/10 border border-[#D8B46B]/30 rounded-lg p-6 mb-8">
          <p className="text-[#1E3A32] font-medium mb-2">ℹ️ This is a preview page only</p>
          <p className="text-[#2B2725]/70 text-sm leading-relaxed">
            This page is for internal reference. The actual robots.txt file that search engines use 
            is served automatically at{" "}
            <a 
              href="https://yourmindstylist.com/robots.txt" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#1E3A32] underline hover:text-[#D8B46B]"
            >
              yourmindstylist.com/robots.txt
            </a>
            {" "}and does not require this page.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg">
          <h2 className="font-serif text-xl text-[#1E3A32] mb-4">Current Configuration</h2>
          <p className="text-sm text-[#2B2725]/70 mb-3">
            The robots.txt file allows all public marketing pages and blocks all admin, manager, studio, 
            client portal, and authentication routes from search engine crawlers.
          </p>
          <p className="text-sm text-[#2B2725]/70">
            Canonical sitemap reference:{" "}
            <code className="bg-[#F0EBE3] px-2 py-0.5 rounded text-[#1E3A32] text-xs">
              Sitemap: https://yourmindstylist.com/sitemap.xml
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}