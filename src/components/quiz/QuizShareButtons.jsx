import React, { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuizShareButtons({ archetype, quiz, quizSlug }) {
  const [copied, setCopied] = useState(false);

  // Build share URL — always point to quiz START page so OG tags work
  const quizUrl = `${window.location.origin}/quiz/${quizSlug}`;

  // Build share text using quiz template or default
  const template = quiz?.share_template || "I'm the [archetype] — what's yours?";
  const shareText = template.replace("[archetype]", archetype?.title || "");

  const fullShareText = `${shareText} Take the quiz: ${quizUrl}`;

  const handleFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(quizUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(quizUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullShareText)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullShareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: shareText, text: shareText, url: quizUrl });
    }
  };

  return (
    <div className="bg-white border border-[#E4D9C4] p-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Share2 size={18} className="text-[#D8B46B]" />
        <p className="text-[#D8B46B] text-xs tracking-[0.2em] uppercase font-medium">Share Your Result</p>
      </div>
      <p className="text-[#2B2725]/70 text-sm mb-5">
        Let your friends discover their archetype too!
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Facebook */}
        <button
          onClick={handleFacebook}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1877F2] text-white text-sm rounded hover:bg-[#1877F2]/90 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          Facebook
        </button>

        {/* LinkedIn */}
        <button
          onClick={handleLinkedIn}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0A66C2] text-white text-sm rounded hover:bg-[#0A66C2]/90 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
          LinkedIn
        </button>

        {/* X / Twitter */}
        <button
          onClick={handleTwitter}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#000] text-white text-sm rounded hover:bg-[#000]/80 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          X
        </button>

        {/* Copy Link */}
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#E4D9C4] text-[#2B2725]/70 text-sm rounded hover:bg-[#E4D9C4]/30 transition-colors"
        >
          {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy Link"}
        </button>

        {/* Native share on mobile */}
        {typeof navigator !== "undefined" && navigator.share && (
          <button
            onClick={handleNativeShare}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#D8B46B] text-[#D8B46B] text-sm rounded hover:bg-[#D8B46B]/10 transition-colors"
          >
            <Share2 size={14} />
            Share
          </button>
        )}
      </div>

      {/* Preview of what gets shared */}
      <div className="mt-5 bg-[#F9F5EF] border border-[#E4D9C4] p-3 rounded text-left">
        <p className="text-xs text-[#2B2725]/50 mb-1">Preview:</p>
        <p className="text-sm text-[#2B2725]/80 italic">"{shareText}"</p>
      </div>
    </div>
  );
}