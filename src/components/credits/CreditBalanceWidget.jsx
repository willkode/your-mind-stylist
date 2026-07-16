import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { PLAN_CONFIG, CREDIT_WEIGHTS } from "@/components/utils/creditConfig";
import { Zap, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

export default function CreditBalanceWidget({ userEmail }) {
  const { data: allowances = [], isLoading } = useQuery({
    queryKey: ["creditAllowance", userEmail],
    queryFn: () => base44.entities.CreditAllowance.filter({ user_email: userEmail }),
    enabled: !!userEmail,
  });

  if (isLoading) {
    return (
      <div className="bg-white p-6 animate-pulse mb-6">
        <div className="h-4 bg-[#E4D9C4] rounded w-1/3 mb-4" />
        <div className="h-8 bg-[#E4D9C4] rounded w-1/2" />
      </div>
    );
  }

  const allowance = allowances[0];

  // No allowance or no subscription → show subscribe CTA
  if (!allowance || !allowance.stripe_subscription_id || allowance.tier === "starter") {
    return (
      <div className="bg-white p-6 border-l-4 border-[#6E4F7D] mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={18} className="text-[#6E4F7D]" />
          <h3 className="font-serif text-lg text-[#1E3A32]">AI Tools</h3>
        </div>
        <p className="text-sm text-[#2B2725]/70 mb-3">
          Subscribe to unlock AI-powered blog writing, image generation, SEO tools, and more.
        </p>
        <Link to="/ManagerCreditUpgrade">
          <Button size="sm" className="bg-[#6E4F7D] hover:bg-[#5d4269] text-white gap-1">
            <ShieldCheck size={14} />
            View Plan — {PLAN_CONFIG.standard.price_display}
          </Button>
        </Link>
      </div>
    );
  }

  // Active subscription
  const used = allowance.credits_used || 0;
  const limit = allowance.monthly_limit || 250;
  const remaining = allowance.credits_remaining || 0;
  const pct = Math.min(100, Math.round((used / limit) * 100));

  const isLow = remaining < limit * 0.15;
  const isDepleted = remaining <= 0;

  const periodEnd = allowance.period_end ? new Date(allowance.period_end) : null;
  const daysLeft = periodEnd ? Math.max(0, Math.ceil((periodEnd - new Date()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <div className={`bg-white p-6 border-l-4 mb-6 ${isDepleted ? "border-red-400" : isLow ? "border-amber-400" : "border-[#D8B46B]"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap size={18} className={isDepleted ? "text-red-500" : "text-[#D8B46B]"} />
          <h3 className="font-serif text-lg text-[#1E3A32]">AI Credits</h3>
        </div>
        <span className="text-xs px-2 py-1 bg-[#F9F5EF] text-[#6E4F7D] font-medium rounded">
          Standard
        </span>
      </div>

      {/* Balance */}
      <div className="mb-3">
        <div className="flex items-baseline gap-1 mb-1">
          <span className={`text-3xl font-bold ${isDepleted ? "text-red-500" : "text-[#1E3A32]"}`}>
            {remaining.toLocaleString()}
          </span>
          <span className="text-sm text-[#2B2725]/50">/ {limit.toLocaleString()} remaining</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      {/* Status messages */}
      {isDepleted && (
        <div className="flex items-center gap-2 text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">
          <AlertTriangle size={14} />
          <span>Credits depleted — buy a top-up to continue using AI features.</span>
        </div>
      )}
      {isLow && !isDepleted && (
        <div className="flex items-center gap-2 text-amber-600 text-sm mb-3 bg-amber-50 p-2 rounded">
          <AlertTriangle size={14} />
          <span>Running low — {remaining} credits left this month.</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[#E4D9C4]">
        <div className="text-xs text-[#2B2725]/50">
          {daysLeft !== null && <span>Resets in {daysLeft} day{daysLeft !== 1 ? "s" : ""}</span>}
        </div>
        {(isLow || isDepleted) && (
          <Link to="/ManagerCreditUpgrade">
            <Button size="sm" className="bg-[#6E4F7D] hover:bg-[#5d4269] text-white text-xs gap-1">
              <TrendingUp size={12} />
              Buy Top-Up — $25
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}