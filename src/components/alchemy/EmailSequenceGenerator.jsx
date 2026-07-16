import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { trackUsage } from "@/components/utils/trackUsage";
import CreditGateBanner from "@/components/credits/CreditGateBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EmailSequenceGenerator() {
  const [offer, setOffer] = useState("");
  const [sequenceType, setSequenceType] = useState("launch");
  const [numEmails, setNumEmails] = useState("5");
  const [loading, setLoading] = useState(false);
  const [sequence, setSequence] = useState([]);

  const handleGenerate = async () => {
    if (!offer.trim()) {
      alert("Please describe your offer");
      return;
    }

    setLoading(true);
    try {
      const sequenceDescriptions = {
        launch: "a product launch sequence building anticipation and value",
        nurture: "a nurture sequence building trust and relationship",
        sales: "a sales sequence focused on conversion and overcoming objections",
        onboarding: "an onboarding sequence welcoming and guiding new clients",
        webinar: "a webinar invitation and follow-up sequence"
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create ${sequenceDescriptions[sequenceType]} with ${numEmails} emails for this offer:

${offer}

For each email, provide:
1. Email number and purpose
2. Subject line (compelling and on-brand)
3. Full email body (warm, professional, engaging)
4. Key CTA

Style: Warm, authentic, professional. Aligned with emotional intelligence and personal transformation. Write as Roberta Fernandez, Your Mind Stylist.

Return as JSON array with objects containing: email_number, subject, body, cta`,
        response_json_schema: {
          type: "object",
          properties: {
            emails: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  email_number: { type: "number" },
                  subject: { type: "string" },
                  body: { type: "string" },
                  cta: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSequence(response.emails || []);
      trackUsage({ feature: "email_sequence_generator", integration_type: "InvokeLLM", details: `${sequenceType}: ${numEmails} emails` });
    } catch (error) {
      alert("Failed to generate sequence: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 shadow-md">
      <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Email Sequence Generator</h2>
      
      <div className="space-y-6">
        <div>
          <Label>Your Offer/Product</Label>
          <Textarea
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder="Describe what you're promoting: program details, benefits, pricing, who it's for..."
            rows={4}
            className="mt-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Sequence Type</Label>
            <Select value={sequenceType} onValueChange={setSequenceType}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="launch">Product Launch</SelectItem>
                <SelectItem value="nurture">Nurture/Relationship</SelectItem>
                <SelectItem value="sales">Sales/Conversion</SelectItem>
                <SelectItem value="onboarding">Client Onboarding</SelectItem>
                <SelectItem value="webinar">Webinar Funnel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Number of Emails</Label>
            <Input
              type="number"
              value={numEmails}
              onChange={(e) => setNumEmails(e.target.value)}
              min="3"
              max="10"
              className="mt-2"
            />
          </div>
        </div>

        <CreditGateBanner feature="email_sequence_generator">
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? "Generating Sequence..." : "Generate Email Sequence"}
          </Button>
        </CreditGateBanner>

        {sequence.length > 0 && (
          <div className="mt-8">
            <h3 className="font-medium text-[#1E3A32] mb-4">Your Email Sequence</h3>
            <Tabs defaultValue="0" className="w-full">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${sequence.length}, 1fr)` }}>
                {sequence.map((_, idx) => (
                  <TabsTrigger key={idx} value={idx.toString()}>
                    Email {idx + 1}
                  </TabsTrigger>
                ))}
              </TabsList>

              {sequence.map((email, idx) => (
                <TabsContent key={idx} value={idx.toString()}>
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs text-[#2B2725]/60">Subject Line</Label>
                        <p className="font-medium text-[#1E3A32] mt-1">{email.subject}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-[#2B2725]/60">Email Body</Label>
                        <div className="bg-[#F9F5EF] p-4 rounded mt-1 whitespace-pre-wrap">
                          {email.body}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-[#2B2725]/60">Call-to-Action</Label>
                        <p className="text-[#1E3A32] mt-1">{email.cta}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}\n\nCTA: ${email.cta}`)}
                      >
                        Copy This Email
                      </Button>
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