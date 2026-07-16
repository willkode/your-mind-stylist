import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, RefreshCw, ArrowDownToLine, Sparkles } from "lucide-react";

export default function AIOutput({ content, onInsert, onRefine, loading }) {
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [showRefine, setShowRefine] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  const handleRefine = () => {
    if (refinementPrompt.trim()) {
      onRefine(`${refinementPrompt}. Original content: ${content}`);
      setRefinementPrompt("");
      setShowRefine(false);
    }
  };

  return (
    <div className="bg-[#F9F5EF] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-[#6E4F7D]" />
        <span className="text-sm font-medium text-[#2B2725]">AI Output</span>
      </div>

      <div className="bg-white rounded p-4 mb-4 max-h-96 overflow-y-auto">
        <p className="text-[#2B2725] leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Button
          onClick={onInsert}
          className="flex-1 bg-[#1E3A32] hover:bg-[#2B2725] text-white"
          size="sm"
        >
          <ArrowDownToLine size={16} className="mr-2" />
          Insert into Editor
        </Button>
        <Button onClick={handleCopy} variant="outline" size="sm">
          <Copy size={16} className="mr-2" />
          Copy
        </Button>
      </div>

      {!showRefine ? (
        <Button
          onClick={() => setShowRefine(true)}
          variant="ghost"
          size="sm"
          className="w-full text-[#6E4F7D]"
        >
          <RefreshCw size={16} className="mr-2" />
          Refine This
        </Button>
      ) : (
        <div className="space-y-2">
          <Textarea
            value={refinementPrompt}
            onChange={(e) => setRefinementPrompt(e.target.value)}
            placeholder="How would you like to refine this? (e.g., 'Make it shorter', 'Change the tone', 'Add more examples')"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleRefine}
              disabled={loading || !refinementPrompt.trim()}
              size="sm"
              className="flex-1"
            >
              Refine
            </Button>
            <Button onClick={() => setShowRefine(false)} variant="outline" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}