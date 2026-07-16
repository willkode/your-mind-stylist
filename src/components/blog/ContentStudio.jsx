import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, CheckCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import VisualIntelligence from "./VisualIntelligence";
import LeadMagnetGenerator from "./LeadMagnetGenerator";
import SEOEnchanter from "./SEOEnchanter";
import QuoteHarvester from "./QuoteHarvester";
import SchemaBuilder from "./SchemaBuilder";

export default function ContentStudio({ blogContent, onApplySEO }) {
  return (
    <div className="fixed right-0 top-0 w-[25rem] h-screen bg-white border-l border-[#E4D9C4] shadow-lg overflow-y-auto">
      <div className="p-6 border-b border-[#E4D9C4]">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={20} className="text-[#D8B46B]" />
          <h2 className="font-serif text-xl text-[#1E3A32]">Content Studio</h2>
        </div>
        <p className="text-[#2B2725]/60 text-sm">Transform your blog into social magic</p>
      </div>

      <Tabs defaultValue="social" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
          <TabsTrigger value="social" className="rounded-none border-b-2 data-[state=active]:border-[#D8B46B]">
            Social Media
          </TabsTrigger>
          <TabsTrigger value="visuals" className="rounded-none border-b-2 data-[state=active]:border-[#D8B46B]">
            Visuals
          </TabsTrigger>
          <TabsTrigger value="leads" className="rounded-none border-b-2 data-[state=active]:border-[#D8B46B]">
            Lead Magnets
          </TabsTrigger>
          <TabsTrigger value="quotes" className="rounded-none border-b-2 data-[state=active]:border-[#D8B46B]">
            Quotes
          </TabsTrigger>
          <TabsTrigger value="frameworks" className="rounded-none border-b-2 data-[state=active]:border-[#D8B46B]">
            Frameworks
          </TabsTrigger>
          <TabsTrigger value="seo" className="rounded-none border-b-2 data-[state=active]:border-[#D8B46B]">
            SEO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="social" className="p-6">
          <SocialMediaTransformer blogContent={blogContent} />
        </TabsContent>

        <TabsContent value="visuals" className="p-6">
          <VisualIntelligence blogContent={blogContent} />
        </TabsContent>

        <TabsContent value="leads" className="p-6">
          <LeadMagnetGenerator blogContent={blogContent} />
        </TabsContent>

        <TabsContent value="quotes" className="p-6">
          <QuoteHarvester blogContent={blogContent} />
        </TabsContent>

        <TabsContent value="frameworks" className="p-6">
          <SchemaBuilder blogContent={blogContent} />
        </TabsContent>

        <TabsContent value="seo" className="p-6">
          <SEOEnchanter blogContent={blogContent} onApplySEO={onApplySEO} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SocialMediaTransformer({ blogContent }) {
  const [platform, setPlatform] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const platforms = [
    { id: "linkedin", name: "LinkedIn", icon: "💼", color: "#0A66C2" },
    { id: "instagram", name: "Instagram", icon: "📸", color: "#E4405F" },
    { id: "twitter", name: "Twitter/X", icon: "🐦", color: "#1DA1F2" },
    { id: "facebook", name: "Facebook", icon: "👥", color: "#1877F2" },
  ];

  const generateForPlatform = async (platformId) => {
    setLoading(true);
    setPlatform(platformId);
    setGeneratedContent(null);

    const platformPrompts = {
      linkedin: `Transform this blog post into a professional LinkedIn article or post. Maintain the thoughtful, expert tone. Include a hook, key insights, and a call to action. Keep it between 1000-1500 characters. Add 3-5 relevant hashtags at the end.`,
      instagram: `Transform this blog post into an engaging Instagram caption. Make it warm, relatable, and inspiring. Start with a hook, share the core message in 3-5 short paragraphs with line breaks. End with a thought-provoking question and 10-15 relevant hashtags. Keep under 2200 characters.`,
      twitter: `Transform this blog post into a Twitter/X thread. Create 5-7 tweets that tell a cohesive story. Each tweet should be under 280 characters. Start with a hook tweet, develop the core ideas, and end with a call to action or reflection. Use emojis sparingly.`,
      facebook: `Transform this blog post into a Facebook post. Make it conversational, warm, and engaging. Include the key insights in an easy-to-read format. Add a personal touch and end with a question to spark discussion. Keep it around 500-800 characters.`,
    };

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${platformPrompts[platformId]}

Blog Title: ${blogContent.title}
Blog Category: ${blogContent.category}
Blog Content: ${blogContent.content.replace(/<[^>]*>/g, '')}

Transform this into ${platforms.find(p => p.id === platformId)?.name} content while preserving Roberta's voice: thoughtful, expert, warm, and transformational.`,
      });

      setGeneratedContent(response);
    } catch (error) {
      console.error("Error generating content:", error);
      setGeneratedContent("Error generating content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!blogContent.title || !blogContent.content) {
    return (
      <div className="text-center py-12">
        <p className="text-[#2B2725]/60 text-sm mb-2">No blog content yet</p>
        <p className="text-[#2B2725]/40 text-xs">Add a title and content to start transforming</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-[#1E3A32] mb-3">Choose Platform</h3>
        <div className="grid grid-cols-2 gap-3">
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => generateForPlatform(p.id)}
              disabled={loading}
              className={`p-4 border rounded-lg text-left transition-all hover:shadow-md ${
                platform === p.id ? 'border-[#D8B46B] bg-[#D8B46B]/5' : 'border-[#E4D9C4]'
              }`}
            >
              <div className="text-2xl mb-2">{p.icon}</div>
              <div className="font-medium text-sm text-[#1E3A32]">{p.name}</div>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="bg-[#F9F5EF] p-6 rounded-lg text-center">
          <Loader2 size={32} className="text-[#D8B46B] animate-spin mx-auto mb-3" />
          <p className="text-[#2B2725]/60 text-sm">Crafting your {platforms.find(p => p.id === platform)?.name} post...</p>
        </div>
      )}

      {generatedContent && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-[#1E3A32]">Your {platforms.find(p => p.id === platform)?.name} Post</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={copyToClipboard}
              className="gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle size={16} className="text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy
                </>
              )}
            </Button>
          </div>
          <div className="bg-[#F9F5EF] p-6 rounded-lg">
            <div className="whitespace-pre-wrap text-[#2B2725]/80 text-sm leading-relaxed">
              {generatedContent}
            </div>
          </div>
          <Button
            onClick={() => generateForPlatform(platform)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Sparkles size={16} className="mr-2" />
            Regenerate
          </Button>
        </div>
      )}
    </div>
  );
}