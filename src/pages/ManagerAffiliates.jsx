import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, DollarSign, TrendingUp, CheckCircle, XCircle, Search, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function ManagerAffiliates() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [selectedPayoutAffiliate, setSelectedPayoutAffiliate] = useState(null);
  const [minimumThreshold, setMinimumThreshold] = useState(5000);

  // Fetch all affiliates
  const { data: affiliates = [], isLoading } = useQuery({
    queryKey: ["affiliates"],
    queryFn: () => base44.entities.Affiliate.list("-created_date"),
  });

  // Fetch all referrals
  const { data: allReferrals = [] } = useQuery({
    queryKey: ["allReferrals"],
    queryFn: () => base44.entities.AffiliateReferral.list("-created_date", 100),
  });

  // Fetch payouts
  const { data: payouts = [] } = useQuery({
    queryKey: ["payouts"],
    queryFn: () => base44.entities.AffiliatePayout.list("-created_date", 100),
  });

  // Approve affiliate
  const approveMutation = useMutation({
    mutationFn: async (affiliateId) => {
      return base44.asServiceRole.entities.Affiliate.update(affiliateId, {
        status: "active",
        approved_date: new Date().toISOString(),
        approved_by: (await base44.auth.me()).email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliates"] });
      toast.success("Affiliate approved!");
    },
  });

  // Update affiliate
  const updateMutation = useMutation({
    mutationFn: ({ affiliateId, updates }) => {
      return base44.asServiceRole.entities.Affiliate.update(affiliateId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliates"] });
      setEditDialogOpen(false);
      toast.success("Affiliate updated!");
    },
  });

  // Approve commission
  const approveCommissionMutation = useMutation({
    mutationFn: async (referralId) => {
      return base44.asServiceRole.entities.AffiliateReferral.update(referralId, {
        commission_status: "approved",
        commission_approved_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allReferrals"] });
      toast.success("Commission approved!");
    },
  });

  // Process payout
  const processPayoutMutation = useMutation({
    mutationFn: ({ affiliate_id, payout_method }) => 
      base44.functions.invoke('processAffiliatePayout', { affiliate_id, payout_method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["allReferrals"] });
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      toast.success('Payout processed successfully');
      setPayoutDialogOpen(false);
      setSelectedPayoutAffiliate(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Payout failed');
    },
  });

  // Scheduled batch payout
  const scheduledPayoutMutation = useMutation({
    mutationFn: ({ minimum_threshold }) => 
      base44.functions.invoke('processScheduledPayouts', { minimum_threshold }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      const summary = result.data.summary;
      toast.success(`Batch payout complete: ${summary.processed} processed, ${summary.skipped} skipped, ${summary.failed} failed`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Batch payout failed');
    },
  });

  // Filter affiliates
  const filteredAffiliates = affiliates.filter((aff) => {
    const query = searchQuery.toLowerCase();
    return (
      aff.affiliate_code?.toLowerCase().includes(query) ||
      aff.payment_email?.toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const pendingAffiliates = affiliates.filter((a) => a.status === "pending").length;
  const activeAffiliates = affiliates.filter((a) => a.status === "active").length;
  const totalCommissionPending = affiliates.reduce((sum, a) => sum + (a.commission_pending || 0), 0);
  const totalRevenue = affiliates.reduce((sum, a) => sum + (a.total_revenue_generated || 0), 0);

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Affiliate Management</h1>
          <p className="text-[#2B2725]/70">Manage affiliates, commissions, and payouts</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Total Affiliates</p>
                  <p className="text-2xl font-bold text-[#1E3A32]">{affiliates.length}</p>
                </div>
                <Users size={32} className="text-[#D8B46B]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Pending Approval</p>
                  <p className="text-2xl font-bold text-[#1E3A32]">{pendingAffiliates}</p>
                </div>
                <Clock size={32} className="text-[#A6B7A3]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Commission Due</p>
                  <p className="text-2xl font-bold text-[#1E3A32]">
                    ${(totalCommissionPending / 100).toFixed(2)}
                  </p>
                </div>
                <DollarSign size={32} className="text-[#6E4F7D]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Total Revenue</p>
                  <p className="text-2xl font-bold text-[#1E3A32]">
                    ${(totalRevenue / 100).toFixed(2)}
                  </p>
                </div>
                <TrendingUp size={32} className="text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="affiliates" className="space-y-6">
          <TabsList>
            <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Affiliates Tab */}
          <TabsContent value="affiliates">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>All Affiliates ({filteredAffiliates.length})</span>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" size={16} />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-8 text-[#2B2725]/60">Loading...</p>
                ) : filteredAffiliates.length === 0 ? (
                  <p className="text-center py-8 text-[#2B2725]/60">No affiliates found</p>
                ) : (
                  <div className="space-y-3">
                    {filteredAffiliates.map((affiliate) => (
                      <motion.div
                        key={affiliate.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border border-[#E4D9C4] rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-medium text-[#1E3A32]">
                                {affiliate.payment_email || "No email"}
                              </h3>
                              <Badge
                                variant={affiliate.status === "active" ? "default" : "secondary"}
                                className={
                                  affiliate.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : affiliate.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-600"
                                }
                              >
                                {affiliate.status}
                              </Badge>
                            </div>
                            <p className="text-sm font-mono text-[#2B2725]/60">
                              Code: {affiliate.affiliate_code}
                            </p>
                            <p className="text-xs text-[#2B2725]/40 mt-1">
                              {affiliate.commission_rate}% commission • {affiliate.commission_tier} tier
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-[#2B2725]/60">
                              {affiliate.successful_conversions} / {affiliate.total_referrals} conversions
                            </p>
                            <p className="text-lg font-bold text-[#1E3A32]">
                              ${((affiliate.commission_pending || 0) / 100).toFixed(2)} pending
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {affiliate.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate(affiliate.id)}
                              disabled={approveMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle size={14} className="mr-1" />
                              Approve
                            </Button>
                          )}
                          <Dialog
                            open={editDialogOpen && selectedAffiliate?.id === affiliate.id}
                            onOpenChange={(open) => {
                              setEditDialogOpen(open);
                              if (open) setSelectedAffiliate(affiliate);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Affiliate</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Commission Rate (%)</label>
                                  <Input
                                    type="number"
                                    defaultValue={affiliate.commission_rate}
                                    onChange={(e) =>
                                      setSelectedAffiliate({
                                        ...selectedAffiliate,
                                        commission_rate: parseFloat(e.target.value),
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Tier</label>
                                  <Select
                                    defaultValue={affiliate.commission_tier}
                                    onValueChange={(value) =>
                                      setSelectedAffiliate({
                                        ...selectedAffiliate,
                                        commission_tier: value,
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="standard">Standard</SelectItem>
                                      <SelectItem value="silver">Silver</SelectItem>
                                      <SelectItem value="gold">Gold</SelectItem>
                                      <SelectItem value="platinum">Platinum</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Status</label>
                                  <Select
                                    defaultValue={affiliate.status}
                                    onValueChange={(value) =>
                                      setSelectedAffiliate({ ...selectedAffiliate, status: value })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="suspended">Suspended</SelectItem>
                                      <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  onClick={() =>
                                    updateMutation.mutate({
                                      affiliateId: affiliate.id,
                                      updates: {
                                        commission_rate: selectedAffiliate.commission_rate,
                                        commission_tier: selectedAffiliate.commission_tier,
                                        status: selectedAffiliate.status,
                                      },
                                    })
                                  }
                                  className="w-full"
                                >
                                  Save Changes
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {affiliate.commission_pending > 0 && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPayoutAffiliate(affiliate);
                                setPayoutDialogOpen(true);
                              }}
                              disabled={processPayoutMutation.isPending}
                            >
                              Process Payout
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle>Recent Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                {allReferrals.length === 0 ? (
                  <p className="text-center py-8 text-[#2B2725]/60">No referrals yet</p>
                ) : (
                  <div className="space-y-3">
                    {allReferrals.slice(0, 20).map((ref) => (
                      <div
                        key={ref.id}
                        className="flex justify-between items-center p-4 border border-[#E4D9C4] rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-[#1E3A32]">
                            {ref.referred_user_email || "Anonymous"}
                          </p>
                          <p className="text-sm text-[#2B2725]/60">
                            Code: {ref.affiliate_code} • {ref.product_name || "No purchase"}
                          </p>
                          <p className="text-xs text-[#2B2725]/40">
                            {new Date(ref.created_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
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
                          {ref.commission_status === "pending" && ref.status === "converted" && (
                            <Button
                              size="sm"
                              onClick={() => approveCommissionMutation.mutate(ref.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Payout History</span>
                  <Button
                    onClick={() => scheduledPayoutMutation.mutate({ minimum_threshold: minimumThreshold })}
                    disabled={scheduledPayoutMutation.isPending}
                  >
                    {scheduledPayoutMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Run Batch Payout'
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payouts.length === 0 ? (
                  <p className="text-center py-8 text-[#2B2725]/60">No payouts processed yet</p>
                ) : (
                  <div className="space-y-3">
                    {payouts.map((payout) => {
                      const affiliate = affiliates.find(a => a.id === payout.affiliate_id);
                      return (
                        <div key={payout.id} className="p-4 border border-[#E4D9C4] rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-[#1E3A32]">
                                {affiliate?.affiliate_code || 'Unknown'}
                              </p>
                              <p className="text-sm text-[#2B2725]/60">
                                {new Date(payout.created_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-[#1E3A32]">
                                ${(payout.payout_amount / 100).toFixed(2)}
                              </p>
                              <Badge
                                variant={
                                  payout.status === 'completed' ? 'default' :
                                  payout.status === 'processing' ? 'secondary' : 'destructive'
                                }
                              >
                                {payout.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm text-[#2B2725]/70 space-y-1">
                            <p><strong>Method:</strong> {payout.payout_method}</p>
                            <p><strong>Ref:</strong> {payout.payment_reference}</p>
                            {payout.notes && <p className="italic">{payout.notes}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Payout Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Minimum Payout Threshold</Label>
                  <p className="text-sm text-[#2B2725]/60 mb-2">
                    Affiliates must earn at least this amount before payout
                  </p>
                  <div className="flex gap-2 items-center">
                    <span>$</span>
                    <Input
                      type="number"
                      value={minimumThreshold / 100}
                      onChange={(e) => setMinimumThreshold(parseFloat(e.target.value) * 100)}
                      className="w-32"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-2">Payment Methods</h4>
                  <ul className="text-sm text-[#2B2725]/70 space-y-2">
                    <li>✓ Stripe Connect (automated)</li>
                    <li>✓ PayPal (manual)</li>
                    <li>✓ Bank Transfer (manual)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payout Dialog */}
        <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Payout</DialogTitle>
            </DialogHeader>
            {selectedPayoutAffiliate && (
              <div className="space-y-4">
                <div className="bg-[#F9F5EF] p-4 rounded-lg space-y-2">
                  <div>
                    <p className="text-sm text-[#2B2725]/60">Affiliate</p>
                    <p className="font-medium">{selectedPayoutAffiliate.affiliate_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#2B2725]/60">Amount</p>
                    <p className="text-2xl font-bold text-[#1E3A32]">
                      ${((selectedPayoutAffiliate.commission_pending || 0) / 100).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#2B2725]/60">Method</p>
                    <p className="capitalize">{selectedPayoutAffiliate.payment_method || 'Not set'}</p>
                  </div>
                </div>

                <p className="text-sm text-[#2B2725]/70">
                  {selectedPayoutAffiliate.payment_method === 'stripe'
                    ? 'Funds will be transferred via Stripe Connect.'
                    : 'This creates a payout record for manual processing.'}
                </p>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      processPayoutMutation.mutate({
                        affiliate_id: selectedPayoutAffiliate.id,
                        payout_method: selectedPayoutAffiliate.payment_method
                      });
                    }}
                    disabled={processPayoutMutation.isPending}
                  >
                    {processPayoutMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}