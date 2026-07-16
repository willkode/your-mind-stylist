import React from "react";
import { format } from "date-fns";
import { Clock, User, ArrowRight } from "lucide-react";

export default function RevisionCompare({ currentContent, revisionContent, revision }) {
  // Simple diff highlighting (marks changed words)
  const getDiffHighlight = (current, previous) => {
    const currentWords = current.split(" ");
    const previousWords = previous.split(" ");
    
    return currentWords.map((word, idx) => {
      const isDifferent = previousWords[idx] !== word;
      return (
        <span
          key={idx}
          className={isDifferent ? "bg-yellow-200 px-1" : ""}
        >
          {word}{" "}
        </span>
      );
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-4 p-4 bg-[#F9F5EF] rounded-lg">
      {/* Previous Version */}
      <div className="border border-[#E4D9C4] bg-white rounded p-4">
        <div className="flex items-center gap-2 mb-3 text-xs text-[#2B2725]/60">
          <Clock size={14} />
          <span>{format(new Date(revision.created_date), "PPp")}</span>
        </div>
        <div className="flex items-center gap-2 mb-3 text-xs text-[#2B2725]/60">
          <User size={14} />
          <span>{revision.edited_by}</span>
        </div>
        <div className="mt-3 p-3 bg-[#F9F5EF] rounded">
          <p className="text-sm text-[#2B2725]">{revisionContent}</p>
        </div>
      </div>

      {/* Arrow */}
      <div className="hidden md:flex items-center justify-center">
        <ArrowRight size={24} className="text-[#D8B46B]" />
      </div>

      {/* Current Version */}
      <div className="border-2 border-[#1E3A32] bg-white rounded p-4">
        <div className="mb-3">
          <span className="inline-block px-2 py-1 bg-[#1E3A32] text-white text-xs rounded">
            CURRENT
          </span>
        </div>
        <div className="mt-3 p-3 bg-[#1E3A32]/5 rounded">
          <p className="text-sm text-[#2B2725]">
            {getDiffHighlight(currentContent, revisionContent)}
          </p>
        </div>
      </div>
    </div>
  );
}