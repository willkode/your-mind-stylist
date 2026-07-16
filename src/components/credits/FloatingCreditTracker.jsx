import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Zap, X, TrendingUp, ChevronUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Floating credit tracker — visible only to managers.
 * Shows a small pill in the bottom-left that expands on click.
 */
export default function FloatingCreditTracker({ userEmail, userRole }) {
  const [expanded, setExpanded] = useState(false);

  // Only show for managers
  const isManager = userRole === "manager" || userRole === "admin";
  
  const { data: allowances = [] } = useQuery({
    queryKey: ["creditAllowance", userEmail],
    queryFn: () => base44.entities.CreditAllowance.filter({ user_email: userEmail }),
    enabled: !!userEmail && isManager,
    refetchInterval: 30000, // refresh every 30s
  });

  if (!isManager || !userEmail) return null;

  const allowance = allowances[0];
  const isSubscribed = allowance?.stripe_subscription_id && allowance?.tier === "standard";

  // Don't show for admin (bypass) or if no allowance at all
  if (userRole === "admin") return null;

  const remaining = allowance?.credits_remaining ?? 0;
  const limit = allowance?.monthly_limit || 250;
  const used = allowance?.credits_used ?? 0;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isDepleted = remaining <= 0;
  const isLow = remaining < limit * 0.15;

  const pillColor = !isSubscribed
    ? "bg-[#6E4F7D]"
    : isDepleted
    ? "bg-red-500"
    : isLow
    ? "bg-amber-500"
    : "bg-[#1E3A32]";

  return (
    <>
      {/* Collapsed pill */}
      <AnimatePresence>
        {!expanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setExpanded(true)}
            className={`fixed bottom-6 left-6 z-50 ${pillColor} text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-shadow`}
          >
            <Zap size={16} />
            {isSubscribed ? (
              <span className="text-sm font-medium">{remaining} credits</span>
            ) : (
              <span className="text-sm font-medium">AI Credits</span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-50 w-80 bg-white rounded-xl shadow-2xl border border-[#E4D9C4] overflow-hidden"
          >
            {/* Header */}
            <div className={`${pillColor} text-white px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Zap size={16} />
                <span className="font-medium text-sm">AI Credits</span>
              </div>
              <button onClick={() => setExpanded(false)} className="hover:opacity-70">
                <X size={16} />
              </button>
            </div>

            <div className="p-4">
              {/* Not subscribed */}
              {!isSubscribed && (
                <div className="text-center py-2">
                  <p className="text-sm text-[#2B2725]/70 mb-3">
                    Subscribe to unlock all AI-powered tools.
                  </p>
                  <Button size="sm" className="bg-[#6E4F7D] hover:bg-[#5d4269] text-white gap-1 w-full" asChild>
                    <Link to="/ManagerCreditUpgrade" onClick={() => setExpanded(false)}>
                      <ShieldCheck size={14} />
                      Subscribe — $79/mo
                    </Link>
                  </Button>
                </div>
              )}

              {/* Subscribed */}
              {isSubscribed && (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className={`text-3xl font-bold ${isDepleted ? "text-red-500" : "text-[#1E3A32]"}`}>
                      {remaining}
                    </span>
                    <span className="text-xs text-[#2B2725]/50">/ {limit} remaining</span>
                  </div>

                  <Progress value={pct} className="h-2 mb-3" />

                  {isDepleted && (
                    <p className="text-xs text-red-500 mb-3">Credits depleted — AI tools are paused.</p>
                  )}
                  {isLow && !isDepleted && (
                    <p className="text-xs text-amber-600 mb-3">Running low — {remaining} credits left.</p>
                  )}

                  <div className="flex gap-2">
                    {(isLow || isDepleted) && (
                      <Button size="sm" className="bg-[#6E4F7D] hover:bg-[#5d4269] text-white gap-1 w-full text-xs flex-1" asChild>
                        <Link to="/ManagerCreditUpgrade" onClick={() => setExpanded(false)}>
                          <TrendingUp size={12} />
                          Buy Top-Up
                        </Link>
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className={`text-xs w-full ${isLow || isDepleted ? "" : "flex-1"}`} asChild>
                      <Link to="/ManagerCreditUpgrade" onClick={() => setExpanded(false)}>
                        Manage Credits
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}