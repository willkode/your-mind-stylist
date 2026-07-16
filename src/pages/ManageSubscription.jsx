import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, CreditCard, Calendar, DollarSign, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function ManageSubscription() {
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (user?.stripe_customer_id) {
        try {
          const response = await base44.functions.invoke('getActiveSubscriptions', {});
          if (response.data.subscriptions) {
            setSubscriptions(response.data.subscriptions);
          }
        } catch (error) {
          console.error('Error fetching subscriptions:', error);
        }
      }
    };
    
    if (user) {
      fetchSubscriptions();
    }
  }, [user]);

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const response = await base44.functions.invoke("createCustomerPortalSession", {});
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert('Unable to open billing portal. Please try again.');
    } finally {
      setLoadingPortal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#1E3A32]" size={32} />
      </div>
    );
  }

  if (!user?.stripe_customer_id) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>No Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#2B2725]/70 mb-6">
                You don't have any active subscriptions yet.
              </p>
              <Link to={createPageUrl("Programs")}>
                <Button className="bg-[#1E3A32] hover:bg-[#2B2725]">
                  Browse Programs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-8">
            Manage Your Subscriptions
          </h1>

          {/* Active Subscriptions */}
          {subscriptions.length > 0 && (
            <div className="mb-8 space-y-4">
              <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">Active Subscriptions</h2>
              {subscriptions.map((sub) => (
                <Card key={sub.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-[#1E3A32] mb-2">
                          {sub.product_name || 'Subscription'}
                        </h3>
                        <div className="space-y-1 text-sm text-[#2B2725]/70">
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} />
                            <span>${(sub.amount / 100).toFixed(2)} / {sub.interval}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>
                              Next billing: {new Date(sub.current_period_end * 1000).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              sub.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : sub.status === 'past_due'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {sub.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Stripe Customer Portal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard size={20} />
                Billing Portal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-[#2B2725]/70">
                  Manage your subscriptions, update payment methods, view invoices, and more through the Stripe billing portal.
                </p>
                
                <div className="bg-[#E4D9C4]/30 border border-[#D8B46B]/30 p-4 rounded-lg">
                  <h3 className="font-medium text-[#1E3A32] mb-2">What you can do:</h3>
                  <ul className="space-y-1 text-sm text-[#2B2725]/70">
                    <li>• Update payment method</li>
                    <li>• View and download invoices</li>
                    <li>• Update billing information</li>
                    <li>• Cancel or pause subscriptions</li>
                    <li>• View payment history</li>
                  </ul>
                </div>

                <Button
                  onClick={handleManageSubscription}
                  disabled={loadingPortal}
                  className="bg-[#1E3A32] hover:bg-[#2B2725] w-full sm:w-auto"
                >
                  {loadingPortal ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Opening Portal...
                    </>
                  ) : (
                    <>
                      <ExternalLink size={16} className="mr-2" />
                      Open Billing Portal
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle size={20} />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#2B2725]/70 mb-4">
                If you have questions about your subscription or billing, please contact support.
              </p>
              <Link to={createPageUrl("Contact")}>
                <Button variant="outline">Contact Support</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}