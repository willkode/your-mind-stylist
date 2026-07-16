import React from "react";
import { Button } from "@/components/ui/button";

export default function AIPromptLibrary({ mode, onSelect }) {
  const prompts = getPromptsForMode(mode);

  return (
    <div>
      <label className="text-sm font-medium text-[#2B2725] mb-3 block">
        Quick Actions
      </label>
      <div className="space-y-2">
        {prompts.map((prompt, index) => (
          <Button
            key={index}
            onClick={() => onSelect(prompt.text)}
            variant="outline"
            className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-[#F9F5EF]"
          >
            <span className="text-sm">{prompt.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

function getPromptsForMode(mode) {
  const promptLibrary = {
    blog: [
      { label: "Draft a Monday Mentions post", text: "Write a 400-word Monday Mentions post about {{topic}}" },
      { label: "Draft a Thursday Thoughts reflection", text: "Write a thoughtful Thursday Thoughts reflection on {{theme}}" },
      { label: "Expand this into a full article", text: "Expand this outline into a 1000-word article: {{content}}" },
      { label: "Shorten this content", text: "Condense this into under 300 words while keeping the core message: {{content}}" },
      { label: "Create 3 title ideas", text: "Suggest 3 compelling titles for this post: {{content}}" },
      { label: "Write a meta description", text: "Write an SEO meta description (155 chars) for: {{content}}" },
    ],
    
    course: [
      { label: "Create a course outline", text: "Create a course outline for {{topic}} with 5 modules" },
      { label: "Write a module description", text: "Write a module description focused on {{outcome}}" },
      { label: "Draft a lesson script", text: "Draft a lesson script based on this outline: {{content}}" },
      { label: "Generate key takeaways", text: "Create 5 key takeaways for this lesson: {{content}}" },
      { label: "Suggest 5 course names", text: "Suggest 5 compelling names for a course about {{topic}}" },
      { label: "Create homework prompts", text: "Create 3 reflection questions for students about {{concept}}" },
    ],
    
    lesson: [
      { label: "Write an intro", text: "Write an engaging intro that sets the tone for {{topic}}" },
      { label: "Create reflection questions", text: "Create reflection questions based on this concept: {{content}}" },
      { label: "Summarize this lesson", text: "Summarize this lesson for a learner: {{content}}" },
      { label: "Write an outro", text: "Write an outro that reinforces the key message: {{content}}" },
      { label: "Create practice exercises", text: "Design 3 practical exercises for {{topic}}" },
    ],
    
    audio: [
      { label: "Write a calming session script", text: "Write a 5-minute calming Inner Rehearsal script for {{emotion}}" },
      { label: "Draft a session description", text: "Write a session description for {{category}} category" },
      { label: "Suggest 3 session titles", text: "Suggest 3 titles for a session about {{theme}}" },
      { label: "Create intro/outro", text: "Write an intro and outro for this session: {{content}}" },
      { label: "Write a grounding script", text: "Create a grounding script focused on {{goal}}" },
    ],
    
    legal: [
      { label: "Create policy outline", text: "Create a structured outline for a policy about {{topic}}" },
      { label: "Summarize section", text: "Summarize this policy section clearly: {{content}}" },
      { label: "Convert to plain language", text: "Rewrite this in plain legal language: {{content}}" },
    ],
    
    devdoc: [
      { label: "Write a feature spec", text: "Write a technical spec for {{feature}}" },
      { label: "Create user stories", text: "Create user stories and acceptance criteria for {{function}}" },
      { label: "Document architecture", text: "Write architecture documentation for {{component}}" },
      { label: "List dependencies", text: "Document dependencies and risks for {{feature}}" },
    ],
  };

  return promptLibrary[mode] || promptLibrary.blog;
}