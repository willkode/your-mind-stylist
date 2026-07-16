import React from "react";

export default function Sitemap() {
  return (
    <div className="min-h-screen bg-[#F9F5EF] pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="font-serif text-4xl text-[#1E3A32] mb-8">Sitemap Preview</h1>
        
        <div className="bg-[#D8B46B]/10 border border-[#D8B46B]/30 rounded-lg p-6 mb-8">
          <p className="text-[#1E3A32] font-medium mb-2">ℹ️ This is a preview page only</p>
          <p className="text-[#2B2725]/70 text-sm leading-relaxed">
            This page is for internal reference. The actual sitemap.xml file that search engines use 
            is served automatically at{" "}
            <a 
              href="https://yourmindstylist.com/sitemap.xml" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#1E3A32] underline hover:text-[#D8B46B]"
            >
              yourmindstylist.com/sitemap.xml
            </a>
            {" "}and does not require this page.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg">
          <h2 className="font-serif text-xl text-[#1E3A32] mb-4">Public Marketing Pages</h2>
          <ul className="space-y-2 text-sm text-[#2B2725]/70">
            {[
              "/", "/About", "/Programs", "/Consultations", "/LENS",
              "/LearnHypnosis", "/CleaningOutYourCloset", "/PocketMindset",
              "/SpeakingTraining", "/FreeMasterclass", "/Contact",
              "/Blog", "/Books", "/Bookings", "/Shop", "/Certification",
              "/Podcast", "/Accessibility"
            ].map(path => (
              <li key={path}>
                <a href={`https://yourmindstylist.com${path}`} className="hover:text-[#1E3A32] underline">
                  yourmindstylist.com{path}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[#2B2725]/50 mt-4">
            Blog posts, book pages, products, and legal pages are also included in the sitemap dynamically.
          </p>
        </div>
      </div>
    </div>
  );
}