import React from "react";
import { CheckCircle, Target } from "lucide-react";
import CmsText from "../cms/CmsText";

export default function LearnSectionGrid() {
  const coreSkills = [
    "Understanding the subconscious mind",
    "Safe, ethical trance induction",
    "How to guide clients into focused inner states",
    "Emotional state design (Mind Styling™ foundations)",
    "How to restructure internal narratives",
    "How to work with anxiety, performance, confidence, and habits",
    "How to design custom sessions without scripts",
    "How to incorporate hypnosis into coaching or therapeutic work",
  ];

  const practicalApplications = [
    "Live demos & practice sessions",
    "Client session frameworks",
    "How to create your own recorded hypnosis sessions",
    "Troubleshooting difficult patterns",
    "Creating emotional \"wardrobes\" that genuinely fit the client",
  ];

  return (
    <div className="grid md:grid-cols-2 gap-12">
      {/* Core Skills */}
      <div>
        <h3 className="font-serif text-2xl text-[#1E3A32] mb-6">
          <CmsText 
            contentKey="hypnosis.learn.core.title"
            page="LearnHypnosis"
            blockTitle="Core Skills Title"
            fallback="Core Skills:"
            contentType="short_text"
          />
        </h3>
        <div className="space-y-4">
          {coreSkills.map((skill, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <CheckCircle 
                size={18} 
                className="text-[#6E4F7D] flex-shrink-0 mt-1"
              />
              <p className="text-[#2B2725]/80">
                <CmsText 
                  contentKey={`hypnosis.learn.core.skill${idx + 1}`}
                  page="LearnHypnosis"
                  blockTitle={`Core Skill ${idx + 1}`}
                  fallback={skill}
                  contentType="rich_text"
                  as="span"
                />
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Practical Applications */}
      <div>
        <h3 className="font-serif text-2xl text-[#1E3A32] mb-6">
          <CmsText 
            contentKey="hypnosis.learn.practical.title"
            page="LearnHypnosis"
            blockTitle="Practical Application Title"
            fallback="Practical Application:"
            contentType="short_text"
          />
        </h3>
        <div className="space-y-4">
          {practicalApplications.map((practice, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <Target 
                size={18} 
                className="text-[#D8B46B] flex-shrink-0 mt-1"
              />
              <p className="text-[#2B2725]/80">
                <CmsText 
                  contentKey={`hypnosis.learn.practical.item${idx + 1}`}
                  page="LearnHypnosis"
                  blockTitle={`Practical Application ${idx + 1}`}
                  fallback={practice}
                  contentType="rich_text"
                  as="span"
                />
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}