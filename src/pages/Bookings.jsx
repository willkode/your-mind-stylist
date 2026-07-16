import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "../components/SEO";
import { useBookingUrl } from "../components/cms/useBookingUrl";

export default function Bookings() {
  const bookingUrl = useBookingUrl();

  useEffect(() => {
    // Auto-redirect after a brief delay so users see the transition message
    const timer = setTimeout(() => {
      window.open(bookingUrl, '_blank');
    }, 3000);
    return () => clearTimeout(timer);
  }, [bookingUrl]);

  return (
    <>
      <SEO 
        title="Book Your Session - Your Mind Stylist"
        description="Schedule your personalized session with Roberta Fernandez."
      />
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center pt-32 pb-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="bg-white p-12 shadow-lg">
            <div className="w-16 h-16 rounded-full bg-[#D8B46B]/10 flex items-center justify-center mx-auto mb-6">
              <Calendar size={32} className="text-[#D8B46B]" />
            </div>

            <h1 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-4">
              Book Your Session
            </h1>

            <p className="text-[#2B2725]/70 text-lg leading-relaxed mb-8">
              Scheduling is now handled through our booking partner. 
              You'll be redirected automatically, or click the button below.
            </p>

            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-[#1E3A32] hover:bg-[#2B4A40] text-[#F9F5EF] px-8 py-6 text-lg">
                Schedule with Roberta
                <ExternalLink size={18} className="ml-2" />
              </Button>
            </a>

            <p className="text-[#2B2725]/50 text-sm mt-6">
              Redirecting to booking in a few seconds...
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}