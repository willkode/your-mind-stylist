import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

export default function AIRewriter({ originalText, onTextRewritten }) {
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewrittenText, setRewrittenText] = useState("");
  const [rewriteMode, setRewriteMode] = useState("improve");
  const [copied, setCopied] = useState(false);

  const rewriteModes = [
    { value: "improve", label: "Improve", description: "Enhance clarity and flow" },
    { value: "simplify", label: "Simplify", description: "Make it easier to understand" },
    { value: "professional", label: "Professional", description: "More formal tone" },
    { value: "casual", label: "Casual", description: "More conversational" },
    { value: "expand", label: "Expand", description: "Add more detail" },
    { value: "shorten", label: "Shorten", description: "Make it more concise" },
  ];

  const handleRewrite = async () => {
    if (!originalText?.trim()) {
      toast.error("Please provide text to rewrite");
      return;
    }

    setIsRewriting(true);
    try {
      const prompts = {
        improve: "Improve the clarity, flow, and impact of this text while maintaining its core message:",
        simplify: "Simplify this text to make it easier to understand, using plain language:",
        professional: "Rewrite this text in a more professional and formal tone:",
        casual: "Rewrite this text in a more casual and conversational tone:",
        expand: "Expand this text with more detail, examples, and depth while keeping the same message:",
        shorten: "Shorten this text to be more concise while preserving the key points:",
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${prompts[rewriteMode]}

Original text:
${originalText}

Provide only the rewritten text, without explanations or meta-commentary.`,
      });

      setRewrittenText(response);
    } catch (error) {
      console.error("Rewrite error:", error);
      toast.error("Failed to rewrite text");
    } finally {
      setIsRewriting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rewrittenText);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (onTextRewritten) {
      onTextRewritten(rewrittenText);
      toast.success("Text applied");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles size={20} className="text-[#D8B46B]" />
          AI Rewriter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rewrite Mode Selection */}
        <div>
          <p className="text-sm text-[#2B2725]/60 mb-3">Rewrite mode:</p>
          <div className="grid grid-cols-3 gap-2">
            {rewriteModes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setRewriteMode(mode.value)}
                className={`p-3 rounded border-2 transition-all text-left ${
                  rewriteMode === mode.value
                    ? "border-[#D8B46B] bg-[#D8B46B]/10"
                    : "border-[#E4D9C4] hover:border-[#D8B46B]/50"
                }`}
              >
                <p className="text-sm font-medium text-[#1E3A32]">{mode.label}</p>
                <p className="text-xs text-[#2B2725]/60">{mode.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Original Text Preview */}
        <div>
          <Label className="text-sm text-[#2B2725]/60 mb-2 block">Original text:</Label>
          <div className="p-3 bg-[#F9F5EF] rounded text-sm text-[#2B2725] max-h-32 overflow-y-auto">
            {originalText || <span className="text-[#2B2725]/40">No text provided</span>}
          </div>
        </div>

        {/* Rewrite Button */}
        <Button
          onClick={handleRewrite}
          disabled={isRewriting || !originalText?.trim()}
          className="w-full bg-[#1E3A32] hover:bg-[#2B2725]"
        >
          {isRewriting ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Rewriting...
            </>
          ) : (
            <>
              <RefreshCw size={16} className="mr-2" />
              Rewrite Text
            </>
          )}
        </Button>

        {/* Rewritten Text */}
        {rewrittenText && (
          <div className="space-y-3 pt-4 border-t border-[#E4D9C4]">
            <div className="flex items-center justify-between">
              <Badge className="bg-green-100 text-green-800">Rewritten</Badge>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </Button>
                {onTextRewritten && (
                  <Button
                    size="sm"
                    onClick={handleApply}
                    className="bg-[#1E3A32] hover:bg-[#2B2725]"
                  >
                    Apply
                  </Button>
                )}
              </div>
            </div>
            <Textarea
              value={rewrittenText}
              onChange={(e) => setRewrittenText(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Label({ children, className, ...props }) {
  return (
    <label className={`text-sm font-medium ${className || ""}`} {...props}>
      {children}
    </label>
  );
}