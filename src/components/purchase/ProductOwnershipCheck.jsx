import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function ProductOwnershipCheck({ productKey, children }) {
  const { data: ownershipData, isLoading } = useQuery({
    queryKey: ["productOwnership", productKey],
    queryFn: async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) return { owns_product: false };
        const response = await base44.functions.invoke("checkProductOwnership", {
          product_key: productKey,
        });
        return response.data;
      } catch {
        return { owns_product: false };
      }
    },
    enabled: !!productKey,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D8B46B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user already owns this product, show access message
  if (ownershipData?.owns_product) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-[#F9F5EF] pt-32 pb-20"
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="bg-white p-12 rounded-lg shadow-lg">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>

            <h1 className="font-serif text-3xl text-[#1E3A32] mb-4">
              You Already Have Access
            </h1>

            <p className="text-[#2B2725]/70 text-lg mb-8 leading-relaxed">
              Good news — you already have access to{" "}
              <span className="font-medium text-[#1E3A32]">
                {ownershipData.product_name}
              </span>
              . No need to purchase again.
            </p>

            {ownershipData.access_details && (
              <Link to={createPageUrl(ownershipData.access_details.link)}>
                <Button className="bg-[#1E3A32] hover:bg-[#2B2725]">
                  <ArrowRight size={18} className="mr-2" />
                  {ownershipData.access_details.type === "course"
                    ? "Go to Course"
                    : ownershipData.access_details.type === "webinar"
                    ? "Go to Webinar"
                    : ownershipData.access_details.type === "subscription"
                    ? "Access Content"
                    : "View Your Bookings"}
                </Button>
              </Link>
            )}

            <div className="mt-8 pt-8 border-t border-[#E4D9C4]">
              <Link
                to={createPageUrl("PurchaseCenter")}
                className="text-[#D8B46B] hover:text-[#1E3A32] transition-colors"
              >
                Browse Other Programs →
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // If user doesn't own it, render the purchase flow
  return children;
}