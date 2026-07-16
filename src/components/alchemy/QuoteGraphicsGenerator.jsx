import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function QuoteGraphicsGenerator() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [images, setImages] = useState({});

  const handleExtractQuotes = async () => {
    if (!content.trim()) {
      alert("Please enter your content");
      return;
    }

    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract 5-8 of the most powerful, shareable quotes from this content. Each quote should be:
- Impactful and standalone
- 15-25 words maximum
- Inspirational or thought-provoking
- Social media friendly

Content:
${content}

Return as a JSON array of quote strings.`,
        response_json_schema: {
          type: "object",
          properties: {
            quotes: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setQuotes(response.quotes || []);
    } catch (error) {
      alert("Failed to extract quotes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateQuoteImage = async (quote, index) => {
    try {
      const response = await base44.integrations.Core.GenerateImage({
        prompt: `Create an elegant quote graphic with the text: "${quote}"

Design specifications:
- Professional, sophisticated aesthetic
- Forest green, soft gold, and cream color palette
- Elegant serif typography for the quote
- Minimalist, clean design
- Attribution: "Roberta Fernandez, Your Mind Stylist" in small text
- Suitable for Instagram square format`
      });

      setImages({ ...images, [index]: response.url });
    } catch (error) {
      alert("Failed to generate image: " + error.message);
    }
  };

  return (
    <div className="bg-white p-6 shadow-md">
      <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Quote Graphics Generator</h2>
      
      <div className="space-y-6">
        <div>
          <Label>Your Content (Blog post, article, or speech)</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your content here to extract shareable quotes..."
            rows={8}
            className="mt-2"
          />
        </div>

        <Button onClick={handleExtractQuotes} disabled={loading} className="w-full">
          {loading ? "Extracting Quotes..." : "Extract Shareable Quotes"}
        </Button>

        {quotes.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium text-[#1E3A32]">Extracted Quotes</h3>
            {quotes.map((quote, index) => (
              <Card key={index} className="p-4">
                <p className="text-[#2B2725] italic mb-3">"{quote}"</p>
                {images[index] ? (
                  <div className="space-y-2">
                    <img src={images[index]} alt={`Quote ${index + 1}`} className="w-full rounded shadow-md" />
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(images[index], '_blank')}
                    >
                      Download Image
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => generateQuoteImage(quote, index)}
                  >
                    Generate Quote Graphic
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}