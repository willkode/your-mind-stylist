import React, { useState, useEffect } from "react";
import { checkCredits } from "@/components/utils/trackUsage";
import { CREDIT_WEIGHTS } from "@/components/utils/creditConfig";
import { AlertTriangle, Zap, TrendingUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

/**
 * Drop this component above any AI feature button.
 * It checks credits and either renders children (allowed) or shows a block banner.
 *
 * Usage:
 *   <CreditGateBanner feature="blog_content_generator">
 *     <Button onClick={generateContent}>Generate</Button>
 *   </CreditGateBanner>
 */
export default function CreditGateBanner({ feature, children }) {
  const [creditStatus, setCreditStatus] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    checkCredits(feature).then((status) => {
      if (!cancelled) {
        setCreditStatus(status);
        setChecked(true);
      }
    });
    return () => { cancelled = true; };
  }, [feature]);

  // Still loading or check failed — show children (fail-open)
  if (!checked || !creditStatus) return children;

  // Allowed — render children normally
  if (creditStatus.allowed) {
    const isLow = creditStatus.remaining < (creditStatus.monthly_limit || 250) * 0.15;
    return (
      <div>
        {isLow && creditStatus.tier !== "admin" && (
          <div className="flex items-center gap-2 text-amber-600 text-xs mb-2 bg-amber-50 px-3 py-1.5 rounded">
            <AlertTriangle size={12} />
            <span>{creditStatus.remaining} credits left this month</span>
            <Link to="/ManagerCreditUpgrade" className="text-[#6E4F7D] underline ml-1">
              Buy Top-Up
            </Link>
          </div>
        )}
        {children}
      </div>
    );
  }

  // No subscription — show subscribe banner
  if (creditStatus.requires_subscription) {
    return (
      <div className="bg-[#6E4F7D]/5 border border-[#6E4F7D]/20 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-[#6E4F7D] mb-2">
          <ShieldCheck size={18} />
          <span className="font-medium">AI Subscription Required</span>
        </div>
        <p className="text-sm text-[#2B2725]/70 mb-3">
          Subscribe to the Standard plan to unlock all AI-powered tools.
        </p>
        <Link to="/ManagerCreditUpgrade">
          <Button size="sm" className="bg-[#6E4F7D] hover:bg-[#5d4269] text-white gap-1">
            <ShieldCheck size={14} />
            Subscribe — $79/mo
          </Button>
        </Link>
      </div>
    );
  }

  // Blocked — credits depleted
  const cost = CREDIT_WEIGHTS[feature] || 1;
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
      <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
        <Zap size={18} />
        <span className="font-medium">AI Credits Depleted</span>
      </div>
      <p className="text-sm text-[#2B2725]/70 mb-3">
        This feature costs {cost} credit{cost > 1 ? "s" : ""}, but you have {creditStatus.remaining} remaining.
        Buy a top-up pack to keep creating.
      </p>
      <Link to="/ManagerCreditUpgrade">
        <Button size="sm" className="bg-[#6E4F7D] hover:bg-[#5d4269] text-white gap-1">
          <TrendingUp size={14} />
          Buy Top-Up — $25
        </Button>
      </Link>
    </div>
  );
}