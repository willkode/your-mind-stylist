import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle, CreditCard, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function CertPurchase() {
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("full");
  const [loading, setLoading] = useState(true);
  const [purchaseStatus, setPurchaseStatus] = useState(null); // null, 'purchased', 'active_plan', 'failed_payment'

  useEffect(() => {
    const init = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // TODO: Check if user has already purchased or has active payment plan
      // For now, mock the check
      setPurchaseStatus(null);
      
      setLoading(false);
    };
    init();
  }, []);

  const paymentPlans = [
    {
      id: "full",
      label: "Full Pay",
      price: "$1,995",
      perPayment: null,
      total: "$1,995",
      savings: "Best Value - Save $196",
      description: "Pay once, lifetime access",
      recommended: true
    },
    {
      id: "3month",
      label: "3-Month Plan",
      price: "$697",
      perPayment: "/month",
      total: "$2,091 total",
      savings: null,
      description: "3 monthly payments of $697",
      recommended: false
    },
    {
      id: "6month",
      label: "6-Month Plan",
      price: "$365",
      perPayment: "/month",
      total: "$2,190 total",
      savings: null,
      description: "6 monthly payments of $365",
      recommended: false
    }
  ];

  const certificationFeatures = [
    "Complete 3-phase program: Edit, Tailor, Design",
    "30+ video lessons with lifetime access",
    "Inner pattern assessments & diagnostics",
    "Emotional intelligence frameworks",
    "Future-self rehearsal techniques",
    "Downloadable workbooks & integration tools",
    "All future updates & content additions",
    "Official Mind Styling Certification"
  ];

  const handleCheckout = async () => {
    setLoading(true);
    // TODO: Integrate with Stripe Checkout
    console.log("Proceeding to checkout with plan:", selectedPlan);
    
    // Placeholder for Stripe integration
    alert("Stripe checkout integration coming next!");
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1E3A32] animate-spin" />
      </div>
    );
  }

  // Already purchased - full access
  if (purchaseStatus === 'purchased') {
    return (
      <div className="min-h-screen bg-[#F9F5EF] py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-12"
          >
            <div className="w-16 h-16 bg-[#A6B7A3]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={32} className="text-[#A6B7A3]" />
            </div>
            <h1 className="font-serif text-3xl text-[#1E3A32] mb-4">
              You're Already Enrolled
            </h1>
            <p className="text-[#2B2725]/80 mb-8">
              You have full access to The Mind Styling Certification™. Continue your journey.
            </p>
            <Link to={createPageUrl("Library")}>
              <Button className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]">
                Go to My Library
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Active payment plan
  if (purchaseStatus === 'active_plan') {
    return (
      <div className="min-h-screen bg-[#F9F5EF] py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-12"
          >
            <h1 className="font-serif text-3xl text-[#1E3A32] mb-4">
              Your Payment Plan is Active
            </h1>
            <p className="text-[#2B2725]/80 mb-6">
              You're currently enrolled in a payment plan. You have full access to the certification content.
            </p>
            <div className="bg-[#F9F5EF] p-6 mb-8">
              <h3 className="font-medium text-[#1E3A32] mb-2">Payment Plan Details</h3>
              <p className="text-[#2B2725]/70 text-sm mb-1">Next payment: $697 on Jan 15, 2025</p>
              <p className="text-[#2B2725]/70 text-sm">Remaining payments: 2 of 3</p>
            </div>
            <div className="flex gap-4">
              <Link to={createPageUrl("Library")} className="flex-1">
                <Button className="w-full bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]">
                  Go to My Library
                </Button>
              </Link>
              <Button variant="outline" className="flex-1">
                <CreditCard size={16} className="mr-2" />
                Manage Billing
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Failed payment
  if (purchaseStatus === 'failed_payment') {
    return (
      <div className="min-h-screen bg-[#F9F5EF] py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-12"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h1 className="font-serif text-3xl text-[#1E3A32] mb-4 text-center">
              Payment Issue
            </h1>
            <p className="text-[#2B2725]/80 mb-6 text-center">
              Your recent payment couldn't be processed. Please update your payment method to continue your access.
            </p>
            <div className="bg-red-50 border border-red-200 p-6 mb-8">
              <p className="text-red-800 text-sm mb-2">
                <strong>Action Required:</strong> Your payment plan payment failed on Dec 1, 2024.
              </p>
              <p className="text-red-700 text-sm">
                Update your payment method within 7 days to avoid losing access to your certification content.
              </p>
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
              <CreditCard size={16} className="mr-2" />
              Update Payment Method
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Default: Purchase flow
  return (
    <div className="min-h-screen bg-[#F9F5EF] py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32] mb-4">
              Enroll in The Mind Styling Certification™
            </h1>
            <p className="text-[#2B2725]/80 text-lg">
              Choose your payment plan and start your transformation today.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Payment Plans */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">Select Payment Plan</h2>
              
              {paymentPlans.map((plan) => (
                <motion.div
                  key={plan.id}
                  whileHover={{ scale: 1.02 }}
                  className={`bg-white p-6 cursor-pointer transition-all ${
                    selectedPlan === plan.id 
                      ? 'border-2 border-[#1E3A32] shadow-lg' 
                      : 'border-2 border-transparent hover:border-[#E4D9C4]'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPlan === plan.id 
                            ? 'border-[#1E3A32] bg-[#1E3A32]' 
                            : 'border-[#E4D9C4]'
                        }`}>
                          {selectedPlan === plan.id && (
                            <Check size={14} className="text-white" />
                          )}
                        </div>
                        <h3 className="font-medium text-lg text-[#1E3A32]">{plan.label}</h3>
                        {plan.recommended && (
                          <span className="bg-[#D8B46B] text-[#1E3A32] text-xs px-3 py-1 uppercase tracking-wide">
                            Best Value
                          </span>
                        )}
                      </div>
                      <p className="text-[#2B2725]/70 text-sm mb-3 ml-8">{plan.description}</p>
                      <div className="ml-8">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-serif text-3xl text-[#1E3A32]">{plan.price}</span>
                          {plan.perPayment && (
                            <span className="text-[#2B2725]/60">{plan.perPayment}</span>
                          )}
                        </div>
                        <p className="text-[#2B2725]/60 text-sm">{plan.total}</p>
                        {plan.savings && (
                          <p className="text-[#D8B46B] text-sm mt-2">{plan.savings}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              <Button 
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF] py-6 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} className="mr-2" />
                    Proceed to Checkout
                  </>
                )}
              </Button>

              <p className="text-center text-[#2B2725]/60 text-sm">
                Secure checkout powered by Stripe. 14-day money-back guarantee.
              </p>
            </div>

            {/* Right: What's Included */}
            <div className="bg-white p-8">
              <h3 className="font-serif text-xl text-[#1E3A32] mb-6">What's Included</h3>
              <div className="space-y-4">
                {certificationFeatures.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check size={18} className="text-[#D8B46B] mt-0.5 flex-shrink-0" />
                    <span className="text-[#2B2725]/80 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-[#E4D9C4]">
                <p className="text-[#2B2725]/70 text-xs mb-4">
                  Questions about the program?
                </p>
                <Link 
                  to={createPageUrl("Contact")}
                  className="text-[#1E3A32] text-sm hover:text-[#D8B46B] transition-colors"
                >
                  Contact us →
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}