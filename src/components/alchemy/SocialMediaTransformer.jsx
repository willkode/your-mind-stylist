import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { trackUsage } from "@/components/utils/trackUsage";
import CreditGateBanner from "@/components/credits/CreditGateBanner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check } from "lucide-react";

export default function SocialMediaTransformer() {
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState(["linkedin", "instagram", "twitter"]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState({});

  const handleGenerate = async () => {
    if (!content.trim()) {
      alert("Please enter your content");
      return;
    }

    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a social media expert. Transform the following content into platform-optimized posts for ${platforms.join(", ")}.

Content to transform:
${content}

For each platform, create:
- An engaging post that follows platform best practices
- Appropriate hashtags
- A strong call-to-action
- Optimal formatting for that platform

LinkedIn: Professional, thought-leadership tone, 1-3 paragraphs
Instagram: Visual-first, engaging caption, 5-10 relevant hashtags
Twitter/X: Concise, thread-worthy, max 280 characters per tweet
Facebook: Conversational, community-building, longer form ok

Return a JSON object with keys for each platform containing the optimized post.`,
        response_json_schema: {
          type: "object",
          properties: {
            linkedin: { type: "string" },
            instagram: { type: "string" },
            twitter: { type: "string" },
            facebook: { type: "string" }
          }
        }
      });

      setResults(response);
      trackUsage({ feature: "social_media_transformer", integration_type: "InvokeLLM", details: "4-platform transform" });
    } catch (error) {
      alert("Failed to generate posts: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (platform, text) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [platform]: true });
    setTimeout(() => {
      setCopied({ ...copied, [platform]: false });
    }, 2000);
  };

  return (
    <div className="bg-white p-6 shadow-md">
      <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Social Media Transformer</h2>
      
      <div className="space-y-6">
        <div>
          <Label>Your Content (Blog post, article, or key message)</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your blog post, article excerpt, or key message here..."
            rows={8}
            className="mt-2"
          />
        </div>

        <CreditGateBanner feature="social_media_transformer">
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? "Transforming..." : "Generate Platform Posts"}
          </Button>
        </CreditGateBanner>

        {results && (
          <div className="mt-8">
            <h3 className="font-medium text-[#1E3A32] mb-4">Platform-Optimized Posts</h3>
            <Tabs defaultValue="linkedin" className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
                <TabsTrigger value="instagram">Instagram</TabsTrigger>
                <TabsTrigger value="twitter">Twitter/X</TabsTrigger>
                <TabsTrigger value="facebook">Facebook</TabsTrigger>
              </TabsList>

              {Object.entries(results).map(([platform, post]) => (
                <TabsContent key={platform} value={platform}>
                  <Card className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium text-[#1E3A32] capitalize">{platform}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(platform, post)}
                      >
                        {copied[platform] ? <Check size={16} /> : <Copy size={16} />}
                        {copied[platform] ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                    <div className="bg-[#F9F5EF] p-4 rounded whitespace-pre-wrap">
                      {post}
                    </div>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}