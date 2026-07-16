import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, CreditCard, Calendar, DollarSign, RefreshCw, XCircle, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function ManagerSubscriptions() {
  const [searchEmail, setSearchEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);

  // Cancel subscription state
  const [cancelDialog, setCancelDialog] = useState(null); // { subscription_id, immediately }
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Refund state
  const [refundDialog, setRefundDialog] = useState(null); // { charge_id, amount }
  const [refundAmount, setRefundAmount] = useState("");
  const [refundPartial, setRefundPartial] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await base44.functions.invoke("managerSubscriptionAction", {
        action: "list_subscriptions",
        customer_email: searchEmail.trim(),
      });
      setResult(res.data);
    } catch (err) {
      toast.error("Error looking up customer: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!cancelDialog) return;
    setCancelling(true);
    try {
      const action = cancelDialog.immediately
        ? "cancel_subscription_immediately"
        : "cancel_subscription";
      await base44.functions.invoke("managerSubscriptionAction", {
        action,
        subscription_id: cancelDialog.subscription_id,
        reason: cancelReason,
      });
      toast.success(cancelDialog.immediately
        ? "Subscription cancelled immediately."
        : "Subscription will cancel at end of billing period.");
      setCancelDialog(null);
      setCancelReason("");
      // Refresh
      handleSearch();
    } catch (err) {
      toast.error("Error cancelling: " + err.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleRefund = async () => {
    if (!refundDialog) return;
    setRefunding(true);
    try {
      const amountCents = refundPartial && refundAmount
        ? Math.round(parseFloat(refundAmount) * 100)
        : undefined;
      await base44.functions.invoke("managerSubscriptionAction", {
        action: "issue_refund",
        charge_id: refundDialog.charge_id,
        amount: amountCents,
      });
      toast.success(amountCents
        ? `Partial refund of $${refundAmount} issued.`
        : "Full refund issued.");
      setRefundDialog(null);
      setRefundAmount("");
      setRefundPartial(false);
      handleSearch();
    } catch (err) {
      toast.error("Error issuing refund: " + err.message);
    } finally {
      setRefunding(false);
    }
  };

  const formatDate = (ts) => ts ? new Date(ts * 1000).toLocaleDateString() : "—";
  const formatAmount = (cents, currency = "usd") =>
    `$${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Subscriptions & Refunds</h1>
          <p className="text-[#2B2725]/70 mb-8">Look up a client by email to manage their subscriptions and issue refunds.</p>

          {/* Search */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Input
                  placeholder="Client email address..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearch}
                  disabled={loading || !searchEmail.trim()}
                  className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  <span className="ml-2">Look Up</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {searched && !loading && result && (
            <div className="space-y-6">

              {/* Subscriptions */}
              <div>
                <h2 className="font-serif text-2xl text-[#1E3A32] mb-4 flex items-center gap-2">
                  <RefreshCw size={20} /> Subscriptions
                </h2>
                {result.subscriptions?.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-[#2B2725]/60">No active subscriptions found.</CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {result.subscriptions?.map((sub) => (
                      <Card key={sub.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-medium text-[#1E3A32]">
                                  {typeof sub.product_name === "string" ? sub.product_name : "Subscription"}
                                </span>
                                <Badge className={
                                  sub.status === "active" ? "bg-green-100 text-green-800" :
                                  sub.status === "canceled" ? "bg-gray-100 text-gray-600" :
                                  sub.status === "past_due" ? "bg-red-100 text-red-800" :
                                  "bg-yellow-100 text-yellow-800"
                                }>
                                  {sub.status}
                                </Badge>
                                {sub.cancel_at_period_end && (
                                  <Badge className="bg-orange-100 text-orange-800">Cancels at period end</Badge>
                                )}
                              </div>
                              <div className="text-sm text-[#2B2725]/70 space-y-1">
                                {sub.amount && (
                                  <div className="flex items-center gap-2">
                                    <DollarSign size={14} />
                                    {formatAmount(sub.amount)} / {sub.interval}
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Calendar size={14} />
                                  Current period ends: {formatDate(sub.current_period_end)}
                                </div>
                                <div className="text-xs text-[#2B2725]/40">ID: {sub.id}</div>
                              </div>
                            </div>
                            {sub.status === "active" && !sub.cancel_at_period_end && (
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                  onClick={() => setCancelDialog({ subscription_id: sub.id, immediately: false })}
                                >
                                  <XCircle size={14} className="mr-1" />
                                  Cancel at Period End
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-300 text-red-700 hover:bg-red-50"
                                  onClick={() => setCancelDialog({ subscription_id: sub.id, immediately: true })}
                                >
                                  <XCircle size={14} className="mr-1" />
                                  Cancel Immediately
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Charges / Payments */}
              <div>
                <h2 className="font-serif text-2xl text-[#1E3A32] mb-4 flex items-center gap-2">
                  <CreditCard size={20} /> Payment History & Refunds
                </h2>
                {result.charges?.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-[#2B2725]/60">No payment history found.</CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {result.charges?.map((charge) => (
                      <Card key={charge.id}>
                        <CardContent className="pt-4 pb-4">
                          <div className="flex justify-between items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="font-medium text-[#1E3A32] text-sm">
                                  {charge.description || "Payment"}
                                </span>
                                {charge.refunded && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">Fully Refunded</Badge>
                                )}
                                {charge.amount_refunded > 0 && !charge.refunded && (
                                  <Badge className="bg-purple-100 text-purple-800 text-xs">
                                    Partially Refunded ({formatAmount(charge.amount_refunded, charge.currency)})
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-[#2B2725]/70">
                                {formatAmount(charge.amount, charge.currency)} · {new Date(charge.created * 1000).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-[#2B2725]/40 mt-0.5">ID: {charge.id}</div>
                            </div>
                            {!charge.refunded && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                onClick={() => {
                                  setRefundDialog({ charge_id: charge.id, amount: charge.amount, currency: charge.currency });
                                  setRefundPartial(false);
                                  setRefundAmount("");
                                }}
                              >
                                <RotateCcw size={14} className="mr-1" />
                                Issue Refund
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {searched && !loading && !result && (
            <Card>
              <CardContent className="pt-6 flex items-center gap-3 text-[#2B2725]/60">
                <AlertCircle size={18} />
                No Stripe customer found for that email.
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={!!cancelDialog} onOpenChange={(open) => !open && setCancelDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {cancelDialog?.immediately ? "Cancel Subscription Immediately" : "Cancel at End of Billing Period"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {cancelDialog?.immediately
                ? "The subscription will be cancelled immediately. The client loses access right now. This cannot be undone."
                : "The subscription will not renew. The client keeps access until the end of their current billing period."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <Label>Reason (optional, internal note)</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Client requested cancellation via email"
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep Active</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className={cancelDialog?.immediately ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"}
            >
              {cancelling ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              {cancelDialog?.immediately ? "Cancel Now" : "Cancel at Period End"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund Dialog */}
      <Dialog open={!!refundDialog} onOpenChange={(open) => !open && setRefundDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-[#2B2725]/70">
              Original charge: <strong>{refundDialog ? formatAmount(refundDialog.amount, refundDialog.currency) : ""}</strong>
            </p>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="partial"
                checked={refundPartial}
                onChange={(e) => setRefundPartial(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="partial">Partial refund</Label>
            </div>
            {refundPartial && (
              <div>
                <Label>Refund amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={refundDialog ? (refundDialog.amount / 100).toFixed(2) : ""}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="e.g. 25.00"
                  className="mt-1"
                />
              </div>
            )}
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800 flex gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              Stripe processes refunds to the original payment method within 5–10 business days. This action cannot be undone.
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRefundDialog(null)}>Cancel</Button>
              <Button
                onClick={handleRefund}
                disabled={refunding || (refundPartial && !refundAmount)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {refunding ? <Loader2 size={14} className="animate-spin mr-1" /> : <RotateCcw size={14} className="mr-1" />}
                {refundPartial && refundAmount ? `Refund $${refundAmount}` : "Issue Full Refund"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}