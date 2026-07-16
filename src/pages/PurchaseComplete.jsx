import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../components/shop/CartContext";

export default function PurchaseComplete() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center"
      >
        <div className="w-20 h-20 rounded-full bg-[#D8B46B]/20 flex items-center justify-center mx-auto mb-8">
          <ShoppingBag size={32} className="text-[#D8B46B]" />
        </div>

        <h1 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-6">
          Purchase Complete
        </h1>

        <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-6 max-w-xl mx-auto">
          Your access is ready.
        </p>

        <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
          Thank you for your purchase.
          <br />
          Your new program or session is now available in your dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            to="/app/library"
            className="px-8 py-4 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-all"
          >
            Open Your Library
          </Link>
          <Link
            to={createPageUrl("Dashboard")}
            className="px-8 py-4 border border-[#D8B46B] text-[#1E3A32] text-sm tracking-wide hover:bg-[#D8B46B]/10 transition-all"
          >
            Visit Your Dashboard
          </Link>
        </div>

        <p className="text-[#2B2725]/70 text-sm mb-12">
          If you have any issues accessing your content, contact us anytime.
        </p>

        <div className="border-t border-[#E4D9C4] pt-8">
          <p className="font-serif text-xl text-[#2B2725]/70 italic">
            "What you invest in your mind, you carry everywhere."
          </p>
        </div>
      </motion.div>
    </div>
  );
}