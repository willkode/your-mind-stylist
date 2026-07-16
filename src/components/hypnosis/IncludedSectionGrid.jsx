import React from "react";
import { Sparkles } from "lucide-react";
import CmsText from "../cms/CmsText";

export default function IncludedSectionGrid() {
  const includedItems = [
    "Full video-based course taught by Roberta",
    "Hypnosis demonstrations",
    "Practice exercises",
    "Client mapping templates",
    "Hypnosis scripts & customizable frameworks",
    "Office Hours or Q&A opportunities (depending on track)",
    "Access to The Mind Styling Studio™ for live practice",
    "Certificate of Completion (Certification Track only)",
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {includedItems.map((item, idx) => (
        <div key={idx} className="flex items-start gap-3 bg-white p-4">
          <Sparkles 
            size={20} 
            className="text-[#6E4F7D] flex-shrink-0 mt-1"
          />
          <p className="text-[#2B2725]/80">
            <CmsText 
              contentKey={`hypnosis.included.item${idx + 1}`}
              page="LearnHypnosis"
              blockTitle={`Included Item ${idx + 1}`}
              fallback={item}
              contentType="rich_text"
              as="span"
            />
          </p>
        </div>
      ))}
    </div>
  );
}