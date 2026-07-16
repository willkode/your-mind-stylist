import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { PLAN_CONFIG, CREDIT_WEIGHTS, EXAMPLE_MONTH } from "@/components/utils/creditConfig";
import { Check, Zap, ArrowLeft, Loader2, Plus, FileText, Search, Image, Repeat, Sparkles, ShieldCheck, AlertTriangle, Mail, GraduationCap, Video, Magnet, Eye, Info } from "lucide-react";
import { CREDIT_WEIGHTS as CW_RAW, FEATURE_LABELS as FL_RAW } from "@/components/utils/creditConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const ICON_MAP = { FileText, Search, Image, Repeat, Sparkles, Mail, GraduationCap, Video, Magnet };
const MANAGER_EMAIL = "roberta@robertafernandez.com";

export default function ManagerCreditUpgrade() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const isAdmin = user?.role === "admin";
  // Admin sees Roberta's data; managers see their own
  const queryEmail = isAdmin ? MANAGER_EMAIL : user?.email;

  // Show success toast from redirect
  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "subscription") toast.success("Subscription activated! Your 250 credits are ready.");
    if (success === "topup") toast.success("Top-up complete! 50 credits added to your balance.");
  }, [searchParams]);

  const { data: allowances = [], refetch } = useQuery({
    queryKey: ["creditAllowance", queryEmail],
    queryFn: () => base44.entities.CreditAllowance.filter({ user_email: queryEmail }),
    enabled: !!queryEmail,
    refetchInterval: searchParams.get("success") ? 2000 : false, // poll briefly after purchase
  });

  const allowance = allowances[0];
  const isSubscribed = allowance?.stripe_subscription_id && allowance?.tier === "standard";

  const handleAction = async (action) => {
    setLoading(action);
    try {
      const response = await base44.functions.invoke("createCreditTopup", { action });
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        toast.error("Unable to create checkout. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const plan = PLAN_CONFIG.standard;
  const used = allowance?.credits_used || 0;
  const limit = allowance?.monthly_limit || 250;
  const remaining = allowance?.credits_remaining || 0;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const periodEnd = allowance?.period_end ? new Date(allowance.period_end) : null;
  const daysLeft = periodEnd ? Math.max(0, Math.ceil((periodEnd - new Date()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/ManagerDashboard"
          className="inline-flex items-center gap-2 text-sm text-[#2B2725]/60 hover:text-[#1E3A32] mb-6"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl text-[#1E3A32] mb-2">AI Credits</h1>
          <p className="text-[#2B2725]/60 max-w-lg mx-auto">
            AI credits power your entire creative toolkit — blog writing, the Alchemy Suite, course builders, lead magnets, email sequences, video scripts, and business insights.
          </p>
          {isAdmin && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <Eye size={14} />
              Admin View — showing Roberta's credit account (read-only)
            </div>
          )}
        </div>

        {/* ── Current Balance (if subscribed) ─────────────────────── */}
        {isSubscribed && (
          <Card className="mb-8 border-[#D8B46B]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap size={20} className="text-[#D8B46B]" />
                  <span className="font-serif text-xl text-[#1E3A32]">Your Balance</span>
                </div>
                <Badge className="bg-[#1E3A32] text-white">Standard Plan</Badge>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className={`text-4xl font-bold ${remaining <= 0 ? "text-red-500" : "text-[#1E3A32]"}`}>
                  {remaining.toLocaleString()}
                </span>
                <span className="text-[#2B2725]/50">credits remaining</span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <Progress value={pct} className="h-2.5 flex-1" />
                <span className="text-sm text-[#2B2725]/60 whitespace-nowrap">{used} / {limit} used</span>
              </div>

              <div className="flex items-center justify-between text-sm text-[#2B2725]/50">
                {daysLeft !== null && <span>Resets in {daysLeft} day{daysLeft !== 1 ? "s" : ""}</span>}
                {remaining <= 0 && (
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertTriangle size={14} /> Credits depleted
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Subscription Card ───────────────────────────────────── */}
        {!isSubscribed && (
          <Card className="mb-8 border-[#6E4F7D] border-2 shadow-lg overflow-hidden">
            <div className="bg-[#6E4F7D] text-white text-center py-2 text-sm font-medium tracking-wide">
              AI Content Suite
            </div>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={22} className="text-[#6E4F7D]" />
                <CardTitle className="text-xl text-[#1E3A32]">{plan.name}</CardTitle>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#1E3A32]">{plan.price_display}</span>
              </div>
              <p className="text-sm text-[#2B2725]/60 mt-1">{plan.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#2B2725]">
                    <Check size={16} className="text-[#A6B7A3] mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {!isAdmin && (
                <Button
                  className="w-full bg-[#6E4F7D] hover:bg-[#5d4269] text-white text-base py-3"
                  onClick={() => handleAction("subscribe")}
                  disabled={loading === "subscribe"}
                >
                  {loading === "subscribe" ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Subscribe Now"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Top-Up Card ─────────────────────────────────────────── */}
        {isSubscribed && (
          <Card className="mb-8 border-[#E4D9C4]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-[#1E3A32]">Need More Credits?</CardTitle>
                  <p className="text-sm text-[#2B2725]/60 mt-1">
                    Buy a top-up pack — 50 credits added instantly to your balance.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-[#1E3A32]">$25</span>
                  <p className="text-xs text-[#2B2725]/50">one-time</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!isAdmin && (
                <Button
                  variant="outline"
                  className="w-full border-[#6E4F7D] text-[#6E4F7D] hover:bg-[#6E4F7D]/5 gap-2"
                  onClick={() => handleAction("topup")}
                  disabled={loading === "topup"}
                >
                  {loading === "topup" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Plus size={16} />
                      Buy 50 Credits — $25
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Reset / Rollover Notice ────────────────────────────── */}
        <div className="flex items-start gap-3 bg-[#F9F5EF] border border-[#E4D9C4] rounded-lg p-4 mb-8">
          <Info size={18} className="text-[#D8B46B] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-[#2B2725]/80">
            Credits reset to {plan.monthly_limit} at the start of each billing cycle. Unused credits do not roll over.
          </p>
        </div>

        {/* ── Credit Costs by Feature ─────────────────────────────── */}
        <Card className="mb-8 border-[#E4D9C4]">
          <CardHeader>
            <CardTitle className="text-lg text-[#1E3A32]">Credit Costs by Feature</CardTitle>
            <p className="text-sm text-[#2B2725]/60">
              Each AI-powered feature uses a set number of credits per use.
            </p>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-[#E4D9C4]/60">
              {Object.entries(CW_RAW)
                .filter(([key]) => key !== "other")
                .sort((a, b) => b[1] - a[1] || (FL_RAW[a[0]] || a[0]).localeCompare(FL_RAW[b[0]] || b[0]))
                .map(([key, cost]) => (
                  <div key={key} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-[#1E3A32]">{FL_RAW[key] || key}</span>
                    <span className="text-sm font-semibold text-[#1E3A32]">{cost} credit{cost !== 1 ? "s" : ""}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Example Month ─────────────────────────────────────── */}
        <Card className="border-[#E4D9C4]">
          <CardHeader>
            <CardTitle className="text-lg text-[#1E3A32]">Example Month</CardTitle>
            <p className="text-sm text-[#2B2725]/60">
              Here's what a productive month looks like with 250 credits — and you'd still have room to spare.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {EXAMPLE_MONTH.map((row) => {
                const Icon = ICON_MAP[row.icon] || Sparkles;
                const subtotal = row.qty * row.cost_each;
                return (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-[#E4D9C4]/60 last:border-0">
                    <div className="flex items-center gap-3">
                      <Icon size={18} className="text-[#6E4F7D] flex-shrink-0" />
                      <div>
                        <span className="text-sm text-[#1E3A32] font-medium">{row.qty} {row.label}</span>
                        <span className="text-xs text-[#2B2725]/40 ml-2">({row.cost_each} cr each)</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-[#1E3A32]">{subtotal} cr</span>
                  </div>
                );
              })}
              {/* Total row */}
              {(() => {
                const total = EXAMPLE_MONTH.reduce((s, r) => s + r.qty * r.cost_each, 0);
                const spare = 250 - total;
                return (
                  <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-[#D8B46B]">
                    <span className="text-sm font-bold text-[#1E3A32]">Monthly total</span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-[#1E3A32]">{total}</span>
                      <span className="text-sm text-[#2B2725]/50"> / 250 credits</span>
                      <p className="text-xs text-[#A6B7A3] font-medium">{spare} credits to spare</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}