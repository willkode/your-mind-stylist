import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Calendar, MessageCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

export default function PrivateSessionsPurchase() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("3");
  const [notes, setNotes] = useState("");

  const packages = [
    { sessions: 3, price: 1500, pricePerSession: 500 },
    { sessions: 6, price: 2700, pricePerSession: 450 },
    { sessions: 12, price: 4800, pricePerSession: 400 }
  ];

  const handleBookConsultation = () => {
    navigate(createPageUrl("Contact") + "?interest=private-sessions");
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const pkg = packages.find(p => p.sessions.toString() === selectedPackage);
      const response = await base44.functions.invoke('createBookingCheckout', {
        service_type: 'private_sessions',
        session_count: pkg.sessions,
        amount: pkg.price * 100, // Convert to cents
        notes
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  const benefits = [
    "Personalized 1:1 attention focused on your specific patterns",
    "Deep exploration of emotional patterns and identity-level shifts",
    "Custom strategies tailored to your life and goals",
    "Ongoing support between sessions via email",
    "Flexible scheduling that works with your life"
  ];

  return (
    <div className="min-h-screen bg-[#F9F5EF] pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
              Private Mind Styling
            </span>
            <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32] mb-6">
              Work Directly with Roberta
            </h1>
            <p className="text-[#2B2725]/70 text-lg max-w-2xl mx-auto leading-relaxed">
              Private Mind Styling is for those ready for personalized, deep-dive work on shifting 
              long-held patterns and designing new ways of being.
            </p>
          </div>

          {/* What You Get */}
          <div className="bg-white p-8 mb-8">
            <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">What's Included</h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle size={20} className="text-[#D8B46B] flex-shrink-0 mt-1" />
                  <span className="text-[#2B2725]/80">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-[#1E3A32] p-8 mb-8">
            <h2 className="font-serif text-2xl text-[#F9F5EF] mb-6">How It Works</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#D8B46B]/20 flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} className="text-[#D8B46B]" />
                </div>
                <div>
                  <h3 className="text-[#F9F5EF] font-medium mb-2">Step 1: Complimentary Consultation</h3>
                  <p className="text-[#F9F5EF]/70 text-sm">
                    We'll have a 30-minute conversation to explore what you're working on and see if 
                    private work is the right fit.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#D8B46B]/20 flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={20} className="text-[#D8B46B]" />
                </div>
                <div>
                  <h3 className="text-[#F9F5EF] font-medium mb-2">Step 2: Custom Proposal</h3>
                  <p className="text-[#F9F5EF]/70 text-sm">
                    Based on our conversation, Roberta will create a custom proposal with pricing, 
                    session structure, and timeline that fits your needs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#D8B46B]/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={20} className="text-[#D8B46B]" />
                </div>
                <div>
                  <h3 className="text-[#F9F5EF] font-medium mb-2">Step 3: Begin Your Work</h3>
                  <p className="text-[#F9F5EF]/70 text-sm">
                    Once you're ready to move forward, we'll schedule your first session and begin 
                    the transformational work.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Options */}
          <div className="bg-white p-8 mb-8">
            <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Choose Your Package</h2>
            <p className="text-[#2B2725]/70 text-sm mb-6 flex items-center gap-2">
              <CheckCircle size={16} className="text-[#A6B7A3]" />
              Payment required • Secure checkout via Stripe
            </p>
            <RadioGroup value={selectedPackage} onValueChange={setSelectedPackage}>
              <div className="space-y-4">
                {packages.map((pkg) => (
                  <div key={pkg.sessions} className="flex items-center space-x-3 border border-[#E4D9C4] p-4 rounded hover:border-[#D8B46B] transition-colors">
                    <RadioGroupItem value={pkg.sessions.toString()} id={`pkg-${pkg.sessions}`} />
                    <Label htmlFor={`pkg-${pkg.sessions}`} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-[#1E3A32]">{pkg.sessions} Sessions</p>
                          <p className="text-sm text-[#2B2725]/60">${pkg.pricePerSession} per session</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-serif text-[#1E3A32]">${pkg.price.toLocaleString()}</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <div className="mt-6">
              <Label htmlFor="notes" className="text-[#2B2725] mb-2 block">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share any specific goals, challenges, or scheduling preferences..."
                className="border-[#E4D9C4] focus:border-[#D8B46B] min-h-[100px]"
              />
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-6">
            <div className="text-center">
              <Button
                onClick={handlePurchase}
                disabled={loading}
                className="bg-[#1E3A32] hover:bg-[#2B2725] px-8 py-6 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Secure Checkout
                    <ArrowRight size={18} className="ml-2" />
                  </>
                )}
              </Button>
              <p className="text-[#2B2725]/60 text-sm mt-4 flex items-center justify-center gap-2">
                🔒 Secure payment powered by Stripe • You'll receive confirmation immediately
              </p>
            </div>

            <div className="text-center border-t border-[#E4D9C4] pt-6">
              <p className="text-[#2B2725]/70 text-sm mb-4">
                Not ready to commit? Start with a complimentary consultation
              </p>
              <Button
                onClick={handleBookConsultation}
                variant="outline"
                className="border-[#1E3A32] text-[#1E3A32]"
              >
                Schedule Free Consultation
                <Calendar size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}