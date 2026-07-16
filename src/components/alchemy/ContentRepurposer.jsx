import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { trackUsage } from "@/components/utils/trackUsage";
import CreditGateBanner from "@/components/credits/CreditGateBanner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shuffle } from "lucide-react";

export default function ContentRepurposer() {
  const [originalContent, setOriginalContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleRepurpose = async () => {
    if (!originalContent.trim()) return;

    setIsLoading(true);
    try {
      const prompt = `You are a content strategist. Take this piece of content and repurpose it into multiple formats for different platforms and audiences.

ORIGINAL CONTENT:
${originalContent}

Create these repurposed versions:
1. LinkedIn Post (1300 chars, professional tone, hook-driven)
2. Twitter Thread (5-7 tweets, each 280 chars max)
3. Instagram Caption (2200 chars, storytelling + emotional, with hashtags)
4. Email Newsletter Segment (conversational, 300-400 words)
5. YouTube Video Description (detailed, SEO-optimized)
6. Pinterest Pin Description (short, inspirational, with keywords)
7. TikTok/Reel Script (60 seconds, hook-first, casual)

Return as JSON:
{
  "linkedin": "string",
  "twitter_thread": ["array of tweets"],
  "instagram": "string",
  "email": "string",
  "youtube": "string",
  "pinterest": "string",
  "tiktok_script": "string"
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            linkedin: { type: "string" },
            twitter_thread: { type: "array", items: { type: "string" } },
            instagram: { type: "string" },
            email: { type: "string" },
            youtube: { type: "string" },
            pinterest: { type: "string" },
            tiktok_script: { type: "string" }
          }
        }
      });

      setResults(response);
      trackUsage({ feature: "content_repurposer", integration_type: "InvokeLLM", details: "7-platform repurpose" });
    } catch (error) {
      console.error(error);
      alert("Failed to repurpose content");
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">Content Repurposer</h2>
        <p className="text-[#2B2725]/70 mb-6">
          Transform one piece of content into 7+ platform-specific formats instantly
        </p>

        <div className="space-y-4">
          <div>
            <Label>Original Content</Label>
            <Textarea
              placeholder="Paste your blog post, article, or main content here..."
              value={originalContent}
              onChange={(e) => setOriginalContent(e.target.value)}
              rows={12}
            />
          </div>

          <CreditGateBanner feature="content_repurposer">
            <Button
              onClick={handleRepurpose}
              disabled={isLoading || !originalContent.trim()}
              className="w-full bg-[#1E3A32]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Repurposing...
                </>
              ) : (
                <>
                  <Shuffle className="mr-2 h-4 w-4" />
                  Repurpose Content
                </>
              )}
            </Button>
          </CreditGateBanner>
        </div>
      </div>

      {results && (
        <div className="bg-white rounded-lg shadow-md">
          <Tabs defaultValue="linkedin" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto bg-[#F9F5EF] p-2 rounded-t-lg">
              <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
              <TabsTrigger value="twitter">Twitter Thread</TabsTrigger>
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
              <TabsTrigger value="pinterest">Pinterest</TabsTrigger>
              <TabsTrigger value="tiktok">TikTok/Reel</TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="linkedin">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>LinkedIn Post</Label>
                    <span className="text-xs text-[#2B2725]/60">{results.linkedin?.length} chars</span>
                  </div>
                  <div className="p-4 bg-[#F9F5EF] rounded border border-[#E4D9C4] whitespace-pre-wrap">
                    {results.linkedin}
                  </div>
                  <Button
                    onClick={() => navigator.clipboard.writeText(results.linkedin)}
                    variant="outline"
                  >
                    Copy
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="twitter">
                <div className="space-y-3">
                  <Label>Twitter Thread ({results.twitter_thread?.length} tweets)</Label>
                  <div className="space-y-3">
                    {results.twitter_thread?.map((tweet, idx) => (
                      <div key={idx} className="p-4 bg-[#F9F5EF] rounded border border-[#E4D9C4]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-[#D8B46B]">Tweet {idx + 1}</span>
                          <span className="text-xs text-[#2B2725]/60">{tweet.length}/280</span>
                        </div>
                        <p className="whitespace-pre-wrap">{tweet}</p>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => navigator.clipboard.writeText(results.twitter_thread.join('\n\n'))}
                    variant="outline"
                  >
                    Copy All Tweets
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="instagram">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Instagram Caption</Label>
                    <span className="text-xs text-[#2B2725]/60">{results.instagram?.length} chars</span>
                  </div>
                  <div className="p-4 bg-[#F9F5EF] rounded border border-[#E4D9C4] whitespace-pre-wrap">
                    {results.instagram}
                  </div>
                  <Button
                    onClick={() => navigator.clipboard.writeText(results.instagram)}
                    variant="outline"
                  >
                    Copy
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="email">
                <div className="space-y-3">
                  <Label>Email Newsletter Segment</Label>
                  <div className="p-4 bg-[#F9F5EF] rounded border border-[#E4D9C4] whitespace-pre-wrap">
                    {results.email}
                  </div>
                  <Button
                    onClick={() => navigator.clipboard.writeText(results.email)}
                    variant="outline"
                  >
                    Copy
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="youtube">
                <div className="space-y-3">
                  <Label>YouTube Description</Label>
                  <div className="p-4 bg-[#F9F5EF] rounded border border-[#E4D9C4] whitespace-pre-wrap">
                    {results.youtube}
                  </div>
                  <Button
                    onClick={() => navigator.clipboard.writeText(results.youtube)}
                    variant="outline"
                  >
                    Copy
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="pinterest">
                <div className="space-y-3">
                  <Label>Pinterest Pin Description</Label>
                  <div className="p-4 bg-[#F9F5EF] rounded border border-[#E4D9C4] whitespace-pre-wrap">
                    {results.pinterest}
                  </div>
                  <Button
                    onClick={() => navigator.clipboard.writeText(results.pinterest)}
                    variant="outline"
                  >
                    Copy
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="tiktok">
                <div className="space-y-3">
                  <Label>TikTok/Reel Script (60 seconds)</Label>
                  <div className="p-4 bg-[#F9F5EF] rounded border border-[#E4D9C4] whitespace-pre-wrap">
                    {results.tiktok_script}
                  </div>
                  <Button
                    onClick={() => navigator.clipboard.writeText(results.tiktok_script)}
                    variant="outline"
                  >
                    Copy
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}