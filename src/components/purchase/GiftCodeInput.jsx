import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Check, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function GiftCodeInput({ productId, onCodeApplied }) {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCode, setAppliedCode] = useState(null);
  const [error, setError] = useState(null);

  const handleApplyCode = async () => {
    if (!code.trim()) {
      setError("Please enter a gift code");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await base44.functions.invoke("validateGiftCode", {
        code: code.toUpperCase(),
        product_id: productId,
      });

      if (response.data?.valid) {
        setAppliedCode(code.toUpperCase());
        toast.success("Gift code applied!");
        if (onCodeApplied) {
          onCodeApplied(code.toUpperCase());
        }
      } else {
        setError(response.data?.error || "Invalid gift code");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to validate gift code");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCode = () => {
    setAppliedCode(null);
    setCode("");
    setError(null);
    if (onCodeApplied) {
      onCodeApplied(null);
    }
  };

  if (appliedCode) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check size={20} className="text-green-600" />
            <div>
              <p className="font-medium text-green-900">Gift code applied</p>
              <p className="text-sm text-green-700">{appliedCode}</p>
            </div>
          </div>
          <Button
            onClick={handleRemoveCode}
            variant="outline"
            size="sm"
            className="border-green-300 text-green-700 hover:bg-green-100"
          >
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Gift size={16} />
        Have a Gift Code?
      </Label>
      <div className="flex gap-2">
        <Input
          placeholder="Enter gift code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          onKeyPress={(e) => e.key === "Enter" && handleApplyCode()}
          className={error ? "border-red-300" : ""}
        />
        <Button
          onClick={handleApplyCode}
          disabled={isValidating || !code.trim()}
          variant="outline"
          className="whitespace-nowrap"
        >
          {isValidating ? "Validating..." : "Apply"}
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  );
}