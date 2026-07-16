import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import CmsText from "../components/cms/CmsText";

export default function PocketVisualizationPurchase() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInterval, setSelectedInterval] = useState("monthly");
  const [purchaseStatus, setPurchaseStatus] = useState(null);
  const [processingCheckout, setProcessingCheckout] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        // TODO: Check if user already has active subscription
        // const hasSubscription = await checkSubscriptionStatus(currentUser.id);
        // if (hasSubscription) setPurchaseStatus("active");
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const pricingOptions = [
    {
      interval: "monthly",
      price: 7,
      label: "Monthly",
      description: "Billed monthly • Cancel anytime",
      stripe_price_id: "price_monthly_pocket_viz"
    }
  ];

  const features = [
    "Full library of 30+ guided audio sessions",
    "New sessions added monthly",
    "Calm & nervous system regulation tools",
    "Confidence & identity work",
    "Emotional release sessions",
    "Performance prep & future-self rehearsal",
    "Rest & recovery support",
    "Unlimited access to all content"
  ];

  const handleCheckout = async () => {
    setProcessingCheckout(true);
    try {
      // TODO: Implement Stripe subscription checkout
      // const session = await base44.functions.invoke('createSubscriptionCheckout', {
      //   price_id: selectedPlan.stripe_price_id,
      //   success_url: window.location.origin + createPageUrl('PurchaseComplete'),
      //   cancel_url: window.location.origin + createPageUrl('PocketVisualizationPurchase')
      // });
      // window.location.href = session.data.url;
      
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("Checkout with:", selectedPlan.stripe_price_id);
      
    } catch (error) {
      console.error("Checkout error:", error);
      alert("There was an error processing your request. Please try again.");
    } finally {
      setProcessingCheckout(false);
    }
  };

  const selectedPlan = pricingOptions.find(opt => opt.interval === selectedInterval);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1E3A32] animate-spin" />
      </div>
    );
  }

  if (purchaseStatus === "active") {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-10 text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">
            You're Already Subscribed
          </h2>
          <p className="text-[#2B2725]/70 mb-8">
            You have an active Pocket Visualization subscription.
          </p>
          <Link to={createPageUrl("Dashboard")}>
            <Button className="w-full bg-[#1E3A32] hover:bg-[#2B2725]">
              Go to Library
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (purchaseStatus === "past_due") {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-10 text-center"
        >
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">
            Payment Issue
          </h2>
          <p className="text-[#2B2725]/70 mb-8">
            Your last payment didn't go through. Please update your payment method to continue access.
          </p>
          <Button className="w-full bg-[#1E3A32] hover:bg-[#2B2725]">
            Update Payment Method
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
            <CmsText 
              contentKey="pocketpurchase.hero.subtitle"
              page="PocketVisualizationPurchase"
              blockTitle="Hero Subtitle"
              fallback="Subscribe"
              contentType="short_text"
              as="span"
            />
          </span>
          <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32] mb-4">
            <CmsText 
              contentKey="pocketpurchase.hero.title"
              page="PocketVisualizationPurchase"
              blockTitle="Hero Title"
              fallback="The Pocket Visualization Sessions™"
              contentType="short_text"
            />
          </h1>
          <p className="text-[#2B2725] text-xl md:text-2xl font-serif italic mb-6">
            <CmsText 
              contentKey="pocketpurchase.hero.description"
              page="PocketVisualizationPurchase"
              blockTitle="Hero Description"
              fallback="Guided audio sessions to regulate your nervous system, release doubt, and rehearse your future self."
              contentType="rich_text"
            />
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Pricing Selection - Left Side */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8"
            >
              <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">
                <CmsText 
                  contentKey="pocketpurchase.pricing.title"
                  page="PocketVisualizationPurchase"
                  blockTitle="Pricing Title"
                  fallback="Choose Your Plan"
                  contentType="short_text"
                />
              </h2>

              {/* Billing Toggle */}
              <div className="bg-[#F9F5EF] p-6 rounded-lg mb-8">
                <div className="text-center">
                  <p className="font-medium text-[#1E3A32] mb-1">Monthly Subscription</p>
                  <p className="text-4xl font-serif text-[#1E3A32] mb-2">
                    $7
                    <span className="text-base text-[#2B2725]/60">/month</span>
                  </p>
                  <p className="text-sm text-[#2B2725]/70">Billed monthly • Cancel anytime</p>
                </div>
              </div>

              {/* Selected Plan Summary */}
              <div className="bg-[#F9F5EF] p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[#2B2725]">Plan:</span>
                  <span className="font-medium text-[#1E3A32]">{selectedPlan.label}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[#2B2725]">Billing:</span>
                  <span className="font-medium text-[#1E3A32]">
                    ${selectedPlan.price} / {selectedPlan.interval === "monthly" ? "month" : "year"}
                  </span>
                </div>
                <div className="pt-4 border-t border-[#E4D9C4]">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#1E3A32]">First payment:</span>
                    <span className="text-2xl font-serif text-[#1E3A32]">
                      ${selectedPlan.price}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={processingCheckout}
                className="w-full bg-[#1E3A32] hover:bg-[#2B2725] py-6 text-lg"
              >
                {processingCheckout ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Subscribe Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-[#2B2725]/60 mt-4">
                Cancel anytime. No commitments. Secure payment via Stripe.
              </p>
            </motion.div>
          </div>

          {/* What's Included - Right Side */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-8 sticky top-6"
            >
              <h3 className="font-serif text-xl text-[#1E3A32] mb-6">
                <CmsText 
                  contentKey="pocketpurchase.included.title"
                  page="PocketVisualizationPurchase"
                  blockTitle="Included Title"
                  fallback="What's Included"
                  contentType="short_text"
                />
              </h3>
              <CmsText 
                contentKey="pocketpurchase.included.features"
                page="PocketVisualizationPurchase"
                blockTitle="Included Features"
                fallback={`<div class='space-y-4'>${features.map((feature, index) => `<div class='flex items-start gap-3'><svg class='lucide lucide-check-circle' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#A6B7A3' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='flex-shrink: 0; margin-top: 2px;'><path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'/><polyline points='22 4 12 14.01 9 11.01'/></svg><span class='text-[#2B2725]/80 leading-relaxed'>${feature}</span></div>`).join('')}</div>`}
                contentType="rich_text"
              />

              <div className="mt-8 pt-6 border-t border-[#E4D9C4]">
                <p className="text-sm text-[#2B2725]/70 leading-relaxed">
                  <CmsText 
                    contentKey="pocketpurchase.included.note"
                    page="PocketVisualizationPurchase"
                    blockTitle="Included Note"
                    fallback="These aren't meditation tracks — they're mental rehearsal sessions combining visualization, hypnotic language, and emotional intelligence tools to help you reset and realign."
                    contentType="rich_text"
                  />
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 bg-white p-8"
        >
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-8 text-center">
            <CmsText 
              contentKey="pocketpurchase.faq.title"
              page="PocketVisualizationPurchase"
              blockTitle="FAQ Title"
              fallback="Frequently Asked Questions"
              contentType="short_text"
            />
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h3 className="font-medium text-[#1E3A32] mb-2">
                <CmsText 
                  contentKey="pocketpurchase.faq1.question"
                  page="PocketVisualizationPurchase"
                  blockTitle="FAQ 1 Question"
                  fallback="Can I cancel anytime?"
                  contentType="short_text"
                />
              </h3>
              <p className="text-[#2B2725]/70 leading-relaxed">
                <CmsText 
                  contentKey="pocketpurchase.faq1.answer"
                  page="PocketVisualizationPurchase"
                  blockTitle="FAQ 1 Answer"
                  fallback="Yes. You can cancel your subscription at any time from your dashboard. You'll continue to have access until the end of your current billing period."
                  contentType="rich_text"
                />
              </p>
            </div>
            <div>
              <h3 className="font-medium text-[#1E3A32] mb-2">
                <CmsText 
                  contentKey="pocketpurchase.faq2.question"
                  page="PocketVisualizationPurchase"
                  blockTitle="FAQ 2 Question"
                  fallback="How often are new sessions added?"
                  contentType="short_text"
                />
              </h3>
              <p className="text-[#2B2725]/70 leading-relaxed">
                <CmsText 
                  contentKey="pocketpurchase.faq2.answer"
                  page="PocketVisualizationPurchase"
                  blockTitle="FAQ 2 Answer"
                  fallback="New sessions are added monthly based on requests and themes that emerge in the community."
                  contentType="rich_text"
                />
              </p>
            </div>
            <div>
              <h3 className="font-medium text-[#1E3A32] mb-2">
                <CmsText 
                  contentKey="pocketpurchase.faq3.question"
                  page="PocketVisualizationPurchase"
                  blockTitle="FAQ 3 Question"
                  fallback="Can I download the sessions?"
                  contentType="short_text"
                />
              </h3>
              <p className="text-[#2B2725]/70 leading-relaxed">
                <CmsText 
                  contentKey="pocketpurchase.faq3.answer"
                  page="PocketVisualizationPurchase"
                  blockTitle="FAQ 3 Answer"
                  fallback="Sessions are available for streaming through your dashboard. Downloads are not currently available to ensure content quality and access control."
                  contentType="rich_text"
                />
              </p>
            </div>
            <div>
              <h3 className="font-medium text-[#1E3A32] mb-2">
                <CmsText 
                  contentKey="pocketpurchase.faq4.question"
                  page="PocketVisualizationPurchase"
                  blockTitle="FAQ 4 Question"
                  fallback="Is this the same as meditation?"
                  contentType="short_text"
                />
              </h3>
              <p className="text-[#2B2725]/70 leading-relaxed">
                <CmsText 
                  contentKey="pocketpurchase.faq4.answer"
                  page="PocketVisualizationPurchase"
                  blockTitle="FAQ 4 Answer"
                  fallback="No. These are structured mental rehearsal sessions that combine elements of visualization, emotional intelligence, and future-self embodiment. They're active, not passive."
                  contentType="rich_text"
                />
              </p>
            </div>
          </div>
        </motion.div>

        {/* Trust Elements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-center text-sm text-[#2B2725]/60 mb-4">
            Secure payment processing by Stripe • Cancel anytime
          </p>
          <div className="flex justify-center items-center gap-6 text-xs text-[#2B2725]/40">
            <span>🔒 SSL Encrypted</span>
            <span>•</span>
            <span>💳 All major cards accepted</span>
            <span>•</span>
            <span>✓ Trusted by 500+ members</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}