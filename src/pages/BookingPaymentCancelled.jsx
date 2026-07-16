import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft, Calendar, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "../components/SEO";

export default function BookingPaymentCancelled() {
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get("session_id"));
  }, []);

  return (
    <>
      <SEO 
        title="Booking Cancelled - Your Mind Stylist"
        description="Your booking was cancelled. You can try again whenever you're ready."
      />
      
      <div className="min-h-screen bg-[#F9F5EF] py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow-xl p-8 md:p-12 text-center"
          >
            {/* Cancel Icon */}
            <div className="w-20 h-20 rounded-full bg-[#E4D9C4] flex items-center justify-center mx-auto mb-6">
              <XCircle size={40} className="text-[#2B2725]/60" />
            </div>

            {/* Heading */}
            <h1 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-4">
              Booking Cancelled
            </h1>
            
            <p className="text-lg text-[#2B2725]/70 mb-6">
              You cancelled the checkout process. No payment was made.
            </p>

            <p className="text-[#2B2725]/60 mb-8">
              Your selected time slot was temporarily held but has now been released. 
              You can start a new booking whenever you're ready.
            </p>

            {/* What happens next */}
            <div className="bg-[#F9F5EF] p-6 mb-8 text-left">
              <h2 className="font-medium text-[#1E3A32] mb-3">What happens next?</h2>
              <ul className="space-y-2 text-sm text-[#2B2725]/70">
                <li>• No charges were made to your account</li>
                <li>• Your selected time slot is now available for others</li>
                <li>• You can book a different time whenever you're ready</li>
                <li>• Your account information has not changed</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => window.location.href = createPageUrl('Bookings')}
                className="flex-1 bg-[#1E3A32] hover:bg-[#2B4A40] text-white"
                size="lg"
              >
                <Calendar size={18} className="mr-2" />
                Browse Available Times
              </Button>
              <Button
                onClick={() => window.location.href = createPageUrl('Contact')}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <Mail size={18} className="mr-2" />
                Have Questions?
              </Button>
            </div>

            {/* Back to home */}
            <Link
              to={createPageUrl('Home')}
              className="inline-flex items-center gap-2 text-[#2B2725]/70 hover:text-[#1E3A32] mt-8 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </Link>

            {/* Session ID for reference */}
            {sessionId && (
              <div className="mt-8 pt-6 border-t border-[#E4D9C4]">
                <p className="text-xs text-[#2B2725]/40">
                  Session ID: {sessionId}
                </p>
              </div>
            )}
          </motion.div>

          {/* Reassurance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-center"
          >
            <div className="bg-white p-6 shadow-md">
              <p className="text-[#1E3A32] font-medium mb-2">
                Not sure which session is right for you?
              </p>
              <p className="text-sm text-[#2B2725]/70 mb-4">
                Book a free consultation to discuss your goals and find the perfect fit.
              </p>
              <Link
                to={createPageUrl('Contact')}
                className="text-[#D8B46B] hover:text-[#C9A55B] font-medium transition-colors"
              >
                Schedule a Free Consultation →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}