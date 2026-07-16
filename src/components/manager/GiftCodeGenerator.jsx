import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function GiftCodeGenerator({ productId, productType, onCodeGenerated }) {
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isSingleUse, setIsSingleUse] = useState(true);
  const [maxUses, setMaxUses] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = async () => {
    if (!productId || !productType) {
      alert("Product information is missing");
      return;
    }

    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('generateGiftCode', {
        product_id: productId,
        product_type: productType,
        recipient_name: recipientName || null,
        recipient_email: recipientEmail || null,
        notes: notes || null,
        is_single_use: isSingleUse,
        max_uses: !isSingleUse ? maxUses : null
      });

      setGeneratedCode(response.data.code);
      if (onCodeGenerated) {
        onCodeGenerated(response.data.code);
      }
      
      // Reset form
      setRecipientName("");
      setRecipientEmail("");
      setNotes("");
      setIsSingleUse(true);
      setMaxUses(1);
    } catch (error) {
      alert('Failed to generate code: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (generatedCode) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 border border-green-200 rounded-lg p-6"
      >
        <div className="text-center">
          <h3 className="font-serif text-xl text-green-900 mb-4">Gift Code Generated! 🎉</h3>
          <div className="bg-white p-4 border-2 border-green-300 rounded mb-4">
            <p className="text-xs text-green-700 mb-2">GIFT CODE</p>
            <p className="font-mono text-2xl font-bold text-green-900">{generatedCode}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="border-green-300 text-green-900 hover:bg-green-100"
            >
              {copied ? (
                <>
                  <Check size={16} className="mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} className="mr-2" />
                  Copy Code
                </>
              )}
            </Button>
            <Button
              onClick={() => setGeneratedCode(null)}
              className="bg-green-600 hover:bg-green-700"
            >
              Generate Another
            </Button>
          </div>
          {recipientName && (
            <p className="text-sm text-green-800 mt-4">
              Code for: <span className="font-medium">{recipientName}</span>
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-serif text-lg text-[#1E3A32] mb-6">Create Gift Code</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="recipientName">Recipient Name (Optional)</Label>
          <Input
            id="recipientName"
            placeholder="e.g., Sarah Johnson"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="recipientEmail">Recipient Email (Optional)</Label>
          <Input
            id="recipientEmail"
            type="email"
            placeholder="sarah@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="e.g., Birthday gift, Free trial, Referral bonus"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="singleUse"
              checked={isSingleUse}
              onChange={(e) => setIsSingleUse(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="singleUse" className="cursor-pointer mb-0">
              Single-Use Code
            </Label>
          </div>
          {!isSingleUse && (
            <div>
              <Label htmlFor="maxUses">Maximum Uses</Label>
              <Input
                id="maxUses"
                type="number"
                min="2"
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
              />
            </div>
          )}
        </div>

        <Button
          onClick={handleGenerateCode}
          disabled={isLoading}
          className="w-full bg-[#1E3A32] hover:bg-[#2B4A40]"
        >
          {isLoading ? "Generating..." : "Generate Gift Code"}
        </Button>
      </div>
    </Card>
  );
}