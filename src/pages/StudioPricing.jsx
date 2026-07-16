import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Save, AlertCircle } from "lucide-react";

export default function StudioPricing() {
  const queryClient = useQueryClient();

  // Mock data - in production, store in Settings entity
  const [pricing, setPricing] = useState({
    certificationFullPrice: 1995,
    certificationPaymentPlan: 525,
    certificationPaymentPlanInstallments: 4,
    innerRehearsalMonthly: 29,
    innerRehearsalYearly: 299,
    privateConsultation: 250,
    // Stripe Product IDs (reference only, not editable)
    stripeCertificationPriceId: "price_xxxxx",
    stripeInnerRehearsalMonthlyId: "price_xxxxx",
    stripeInnerRehearsalYearlyId: "price_xxxxx",
    stripePrivateConsultId: "price_xxxxx",
  });

  const handleSave = () => {
    // In production: save to your Settings entity
    console.log("Saving pricing:", pricing);
    alert("Pricing updated! (Note: Stripe prices must be updated separately in Stripe Dashboard)");
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">
              Pricing Manager
            </h1>
            <p className="text-[#2B2725]/70">
              Manage pricing display on your public and portal pages.
            </p>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 mb-8">
            <div className="flex gap-3">
              <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
              <div>
                <p className="text-amber-900 font-medium mb-1">
                  Important: Stripe Integration Required
                </p>
                <p className="text-amber-800 text-sm">
                  These prices are for display only. To process payments, you must create corresponding 
                  products and prices in your Stripe Dashboard and reference the Stripe Price IDs below.
                  Only update Stripe prices directly in Stripe.
                </p>
              </div>
            </div>
          </div>

          {/* Certification */}
          <div className="bg-white p-8 mb-6">
            <h2 className="font-serif text-2xl text-[#1E3A32] mb-6 flex items-center gap-3">
              <DollarSign size={24} className="text-[#D8B46B]" />
              The Mind Styling Certification™
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="certFullPrice" className="text-[#2B2725] mb-2 block">
                  Full Price ($)
                </Label>
                <Input
                  id="certFullPrice"
                  type="number"
                  value={pricing.certificationFullPrice}
                  onChange={(e) => setPricing({ ...pricing, certificationFullPrice: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="certPaymentPlan" className="text-[#2B2725] mb-2 block">
                  Payment Plan (per installment $)
                </Label>
                <Input
                  id="certPaymentPlan"
                  type="number"
                  value={pricing.certificationPaymentPlan}
                  onChange={(e) => setPricing({ ...pricing, certificationPaymentPlan: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-[#2B2725] mb-2 block">
                  Number of Installments
                </Label>
                <Input
                  type="number"
                  value={pricing.certificationPaymentPlanInstallments}
                  onChange={(e) => setPricing({ ...pricing, certificationPaymentPlanInstallments: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-[#2B2725] mb-2 block">
                  Stripe Price ID (Reference Only)
                </Label>
                <Input
                  value={pricing.stripeCertificationPriceId}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Inner Rehearsal */}
          <div className="bg-white p-8 mb-6">
            <h2 className="font-serif text-2xl text-[#1E3A32] mb-6 flex items-center gap-3">
              <DollarSign size={24} className="text-[#D8B46B]" />
              Inner Rehearsal Sessions™
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="innerMonthly" className="text-[#2B2725] mb-2 block">
                  Monthly Subscription ($)
                </Label>
                <Input
                  id="innerMonthly"
                  type="number"
                  value={pricing.innerRehearsalMonthly}
                  onChange={(e) => setPricing({ ...pricing, innerRehearsalMonthly: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="innerYearly" className="text-[#2B2725] mb-2 block">
                  Yearly Subscription ($)
                </Label>
                <Input
                  id="innerYearly"
                  type="number"
                  value={pricing.innerRehearsalYearly}
                  onChange={(e) => setPricing({ ...pricing, innerRehearsalYearly: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-[#2B2725] mb-2 block">
                  Stripe Monthly Price ID
                </Label>
                <Input
                  value={pricing.stripeInnerRehearsalMonthlyId}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label className="text-[#2B2725] mb-2 block">
                  Stripe Yearly Price ID
                </Label>
                <Input
                  value={pricing.stripeInnerRehearsalYearlyId}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Private Sessions */}
          <div className="bg-white p-8 mb-8">
            <h2 className="font-serif text-2xl text-[#1E3A32] mb-6 flex items-center gap-3">
              <DollarSign size={24} className="text-[#D8B46B]" />
              Private Mind Styling
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="privateConsult" className="text-[#2B2725] mb-2 block">
                  Consultation Price ($)
                </Label>
                <Input
                  id="privateConsult"
                  type="number"
                  value={pricing.privateConsultation}
                  onChange={(e) => setPricing({ ...pricing, privateConsultation: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-[#2B2725] mb-2 block">
                  Stripe Price ID
                </Label>
                <Input
                  value={pricing.stripePrivateConsultId}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF] px-8 py-6"
            >
              <Save size={18} className="mr-2" />
              Save Pricing Changes
            </Button>
          </div>

          {/* Stripe Instructions */}
          <div className="mt-8 bg-[#F9F5EF] p-6 border-l-4 border-[#D8B46B]">
            <h3 className="font-medium text-[#1E3A32] mb-3">
              How to Update Stripe Prices:
            </h3>
            <ol className="space-y-2 text-[#2B2725]/80 text-sm">
              <li>1. Log in to your Stripe Dashboard</li>
              <li>2. Navigate to Products → Select your product</li>
              <li>3. Create a new price (Stripe doesn't allow editing existing prices)</li>
              <li>4. Copy the new Price ID (starts with "price_")</li>
              <li>5. Update your checkout code to reference the new Price ID</li>
              <li>6. Test in Stripe Test Mode before going live</li>
            </ol>
          </div>
        </motion.div>
      </div>
    </div>
  );
}