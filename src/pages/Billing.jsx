import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ExternalLink, Download, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Billing() {
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user?.stripe_customer_id) {
      fetchSubscriptions();
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    try {
      const response = await base44.functions.invoke("getSubscriptionDetails", {});
      if (response.data.subscriptions) {
        setSubscriptions(response.data.subscriptions);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const response = await base44.functions.invoke("createCustomerPortalSession", {});
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Error opening portal:", error);
      alert("Failed to open billing portal");
    } finally {
      setLoadingPortal(false);
    }
  };

  const formatPrice = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-[#A6B7A3]';
      case 'canceled': return 'text-red-600';
      case 'past_due': return 'text-orange-600';
      default: return 'text-[#2B2725]/70';
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-3">Billing & Subscriptions</h1>
          <p className="text-[#2B2725]/70 mb-8">
            Manage your subscriptions, payment methods, and billing history
          </p>

          {/* Active Subscriptions */}
          {subscriptions.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-[#A6B7A3]" />
                  Active Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-4 bg-[#F9F5EF] rounded-lg">
                    <div>
                      <p className="font-medium text-[#1E3A32]">{sub.product_name}</p>
                      <p className="text-sm text-[#2B2725]/70">
                        {formatPrice(sub.price, sub.currency)}/{sub.interval}
                      </p>
                      <p className={`text-sm font-medium ${getStatusColor(sub.status)}`}>
                        Status: {sub.status}
                      </p>
                      {sub.current_period_end && (
                        <p className="text-xs text-[#2B2725]/60 mt-1">
                          {sub.cancel_at_period_end ? 'Cancels' : 'Renews'} on{' '}
                          {new Date(sub.current_period_end * 1000).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Stripe Customer Portal */}
          {user?.stripe_customer_id ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard size={20} />
                  Manage Your Billing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#2B2725]/70 mb-4">
                  Access your Stripe Customer Portal to manage subscriptions, update payment methods, 
                  view invoices, and download receipts.
                </p>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-[#A6B7A3] mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-[#1E3A32]">Payment Methods</p>
                      <p className="text-xs text-[#2B2725]/60">Update cards and billing info</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-[#A6B7A3] mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-[#1E3A32]">Invoices & Receipts</p>
                      <p className="text-xs text-[#2B2725]/60">View and download history</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-[#A6B7A3] mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-[#1E3A32]">Subscription Control</p>
                      <p className="text-xs text-[#2B2725]/60">Pause or cancel anytime</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-[#A6B7A3] mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-[#1E3A32]">Billing History</p>
                      <p className="text-xs text-[#2B2725]/60">Complete payment records</p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleManageSubscription}
                  disabled={loadingPortal}
                  className="bg-[#1E3A32] hover:bg-[#2B2725] w-full md:w-auto"
                >
                  {loadingPortal ? (
                    "Opening Portal..."
                  ) : (
                    <>
                      <CreditCard size={16} className="mr-2" />
                      Open Billing Portal
                      <ExternalLink size={14} className="ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle size={48} className="mx-auto text-[#D8B46B] mb-4" />
                <h3 className="font-medium text-[#1E3A32] mb-2">No Active Subscriptions</h3>
                <p className="text-[#2B2725]/70 mb-6">
                  You don't have any active subscriptions yet. Browse our programs to get started.
                </p>
                <Button
                  onClick={() => window.location.href = "/app/Programs"}
                  className="bg-[#1E3A32] hover:bg-[#2B2725]"
                >
                  View Programs
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#2B2725]/70 mb-4">
                If you have questions about billing or need assistance, our support team is here to help.
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.href = "/app/Contact"}
              >
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}