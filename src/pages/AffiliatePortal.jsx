import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, DollarSign, Link as LinkIcon, Users, TrendingUp, Check } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function AffiliatePortal() {
  const queryClient = useQueryClient();
  const [copiedLink, setCopiedLink] = useState(false);
  const [showApplication, setShowApplication] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // Fetch affiliate account
  const { data: affiliate, isLoading: affiliateLoading } = useQuery({
    queryKey: ["affiliate", user?.id],
    queryFn: async () => {
      const affiliates = await base44.entities.Affiliate.filter({ user_id: user.id });
      return affiliates[0] || null;
    },
    enabled: !!user?.id,
  });

  // Fetch referrals
  const { data: referrals = [] } = useQuery({
    queryKey: ["affiliateReferrals", affiliate?.id],
    queryFn: () => base44.entities.AffiliateReferral.filter({ affiliate_id: affiliate.id }),
    enabled: !!affiliate?.id,
  });

  // Apply for affiliate
  const applyMutation = useMutation({
    mutationFn: () => base44.functions.invoke("createAffiliate", { custom_message: customMessage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate"] });
      setShowApplication(false);
      toast.success("Application submitted! We'll review it soon.");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to submit application");
    },
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(affiliate.referral_link);
    setCopiedLink(true);
    toast.success("Link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (affiliateLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <p className="text-[#2B2725]/60">Loading...</p>
      </div>
    );
  }

  // No affiliate account - show application
  if (!affiliate) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-4">Become an Affiliate</h1>
            <p className="text-[#2B2725]/70 text-lg">
              Share Your Mind Stylist with your audience and earn 20% commission on every sale.
            </p>
          </motion.div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Why Join Our Affiliate Program?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <DollarSign size={32} className="text-[#D8B46B] mx-auto mb-3" />
                  <h3 className="font-medium text-[#1E3A32] mb-2">20% Commission</h3>
                  <p className="text-sm text-[#2B2725]/60">
                    Earn generous commissions on all products and services
                  </p>
                </div>
                <div className="text-center">
                  <TrendingUp size={32} className="text-[#A6B7A3] mx-auto mb-3" />
                  <h3 className="font-medium text-[#1E3A32] mb-2">High-Value Products</h3>
                  <p className="text-sm text-[#2B2725]/60">
                    From $9 to $7,995 - earn up to $1,599 per sale
                  </p>
                </div>
                <div className="text-center">
                  <Users size={32} className="text-[#6E4F7D] mx-auto mb-3" />
                  <h3 className="font-medium text-[#1E3A32] mb-2">Lifetime Tracking</h3>
                  <p className="text-sm text-[#2B2725]/60">
                    Get credit for all future purchases from your referrals
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Apply to Join</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2B2725] mb-2">
                    Tell us about yourself and your audience
                  </label>
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Where will you share your affiliate link? (blog, social media, email list, etc.)"
                    className="min-h-[120px]"
                  />
                </div>
                <Button
                  onClick={() => applyMutation.mutate()}
                  disabled={applyMutation.isPending}
                  className="w-full bg-[#1E3A32] hover:bg-[#2B2725]"
                >
                  {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Pending approval
  if (affiliate.status === "pending") {
    return (
      <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-[#D8B46B]/20 p-8 rounded-lg mb-8">
              <h1 className="font-serif text-3xl text-[#1E3A32] mb-4">Application Pending</h1>
              <p className="text-[#2B2725]/70">
                Your affiliate application is under review. We'll notify you once it's approved!
              </p>
            </div>
            <p className="text-sm text-[#2B2725]/60">
              Affiliate Code: <span className="font-mono font-bold">{affiliate.affiliate_code}</span>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Active affiliate dashboard
  const pendingCommission = (affiliate.commission_pending / 100).toFixed(2);
  const totalEarned = (affiliate.total_commission_earned / 100).toFixed(2);
  const totalPaid = (affiliate.commission_paid / 100).toFixed(2);
  const conversionRate =
    affiliate.total_referrals > 0
      ? ((affiliate.successful_conversions / affiliate.total_referrals) * 100).toFixed(1)
      : 0;

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Affiliate Dashboard</h1>
          <p className="text-[#2B2725]/70">Track your referrals and earnings</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users size={24} className="text-[#D8B46B] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#1E3A32]">{affiliate.total_referrals}</p>
                <p className="text-sm text-[#2B2725]/60">Total Referrals</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp size={24} className="text-[#A6B7A3] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#1E3A32]">{affiliate.successful_conversions}</p>
                <p className="text-sm text-[#2B2725]/60">Conversions ({conversionRate}%)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign size={24} className="text-[#6E4F7D] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#1E3A32]">${pendingCommission}</p>
                <p className="text-sm text-[#2B2725]/60">Pending</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Check size={24} className="text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#1E3A32]">${totalPaid}</p>
                <p className="text-sm text-[#2B2725]/60">Paid Out</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Affiliate Link */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon size={20} />
              Your Affiliate Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input value={affiliate.referral_link} readOnly className="font-mono" />
              <Button onClick={handleCopyLink} variant="outline">
                {copiedLink ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
            <p className="text-sm text-[#2B2725]/60 mt-3">
              Share this link with your audience. You'll earn{" "}
              <span className="font-bold">{affiliate.commission_rate}%</span> commission on all sales.
            </p>
          </CardContent>
        </Card>

        {/* Recent Referrals */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <p className="text-center py-8 text-[#2B2725]/60">
                No referrals yet. Start sharing your link!
              </p>
            ) : (
              <div className="space-y-3">
                {referrals.slice(0, 10).map((ref) => (
                  <div
                    key={ref.id}
                    className="flex justify-between items-center p-4 border border-[#E4D9C4] rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-[#1E3A32]">
                        {ref.referred_user_email || "Anonymous"}
                      </p>
                      <p className="text-sm text-[#2B2725]/60">
                        {ref.product_name || "No purchase yet"}
                      </p>
                      <p className="text-xs text-[#2B2725]/40">
                        {new Date(ref.created_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={ref.status === "converted" ? "default" : "secondary"}
                        className={
                          ref.status === "converted"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }
                      >
                        {ref.status}
                      </Badge>
                      {ref.commission_amount > 0 && (
                        <p className="text-sm font-medium text-[#1E3A32] mt-1">
                          ${(ref.commission_amount / 100).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}