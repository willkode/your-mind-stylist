import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, RefreshCw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "../components/SEO";

export default function BookingPaymentFailed() {
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get("session_id"));
  }, []);

  return (
    <>
      <SEO 
        title="Payment Failed - Your Mind Stylist"
        description="Your payment could not be processed. Please try again or contact us for assistance."
      />
      
      <div className="min-h-screen bg-[#F9F5EF] py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow-xl p-8 md:p-12 text-center"
          >
            {/* Error Icon */}
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} className="text-red-600" />
            </div>

            {/* Heading */}
            <h1 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-4">
              Payment Failed
            </h1>
            
            <p className="text-lg text-[#2B2725]/70 mb-8">
              We couldn't process your payment. Your booking was not completed.
            </p>

            {/* Common Reasons */}
            <div className="bg-[#FFF9F0] border-l-4 border-yellow-500 p-6 mb-8 text-left">
              <h2 className="font-medium text-[#1E3A32] mb-3">Common reasons for payment failure:</h2>
              <ul className="space-y-2 text-sm text-[#2B2725]/70">
                <li>• Insufficient funds in your account</li>
                <li>• Incorrect card details or expired card</li>
                <li>• Your bank declined the transaction</li>
                <li>• Network timeout or connection issue</li>
              </ul>
            </div>

            {/* What to do */}
            <div className="bg-[#F9F5EF] p-6 mb-8 text-left">
              <h2 className="font-medium text-[#1E3A32] mb-3">What you can do:</h2>
              <ul className="space-y-2 text-sm text-[#2B2725]/70">
                <li>• Check your payment method and try again</li>
                <li>• Try a different card or payment method</li>
                <li>• Contact your bank to authorize the payment</li>
                <li>• Reach out to us if the issue persists</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => window.location.href = createPageUrl('Bookings')}
                className="flex-1 bg-[#1E3A32] hover:bg-[#2B4A40] text-white"
                size="lg"
              >
                <RefreshCw size={18} className="mr-2" />
                Try Booking Again
              </Button>
              <Button
                onClick={() => window.location.href = createPageUrl('Contact')}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <Mail size={18} className="mr-2" />
                Contact Support
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

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-center"
          >
            <p className="text-[#2B2725]/70 mb-4">
              Need help? We're here for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:hello@yourmindstylist.com"
                className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors"
              >
                hello@yourmindstylist.com
              </a>
              <span className="hidden sm:inline text-[#2B2725]/30">•</span>
              <Link
                to={createPageUrl('Contact')}
                className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors"
              >
                Contact Form
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}