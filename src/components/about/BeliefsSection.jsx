import React from "react";
import CmsText from "../cms/CmsText";

export default function BeliefsSection() {
  const beliefs = [
    {
      icon: "✦",
      title: "You are not broken.",
      description: "You are simply patterned by experiences and beliefs that no longer fit who you're becoming.",
    },
    {
      icon: "✦",
      title: "Emotional intelligence is a superpower.",
      description: "It's not about being emotional — it's about understanding the meaning behind your reactions.",
    },
    {
      icon: "✦",
      title: "Your mind is designed to protect you, not punish you.",
      description: "Once you understand its mechanics, everything changes.",
    },
    {
      icon: "✦",
      title: "Change doesn't require force.",
      description: "It requires awareness, safety, and alignment.",
    },
    {
      icon: "✦",
      title: "When you edit your internal story, your entire life restyles itself.",
      description: "Relationships shift. Work changes. Confidence expands. Decisions become clearer.",
    },
  ];

  return (
    <div className="space-y-8">
      {beliefs.map((belief, index) => (
        <div key={index} className="border-l-2 border-[#D8B46B] pl-6 md:pl-8">
          <h3 className="font-serif text-xl md:text-2xl text-[#F9F5EF] mb-3 flex items-start gap-3">
            <span className="text-[#D8B46B]">{belief.icon}</span>
            <CmsText 
              contentKey={`about.beliefs.item${index + 1}.title`}
              page="About"
              blockTitle={`Core Principle ${index + 1} - Title`}
              fallback={belief.title}
              contentType="short_text"
              className="text-[#F9F5EF]"
            />
          </h3>
          <CmsText 
            contentKey={`about.beliefs.item${index + 1}.description`}
            page="About"
            blockTitle={`Core Principle ${index + 1} - Description`}
            fallback={belief.description}
            contentType="rich_text"
            className="text-[#F9F5EF]/70 text-lg leading-relaxed"
          />
        </div>
      ))}
    </div>
  );
}