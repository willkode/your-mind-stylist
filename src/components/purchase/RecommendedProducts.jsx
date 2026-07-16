import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function RecommendedProducts() {
  const { data, isLoading } = useQuery({
    queryKey: ["recommendedProducts"],
    queryFn: async () => {
      const response = await base44.functions.invoke("getRecommendedProducts", {});
      return response.data;
    },
  });

  if (isLoading || !data?.recommendations?.length) {
    return null;
  }

  return (
    <div className="mb-16">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles size={24} className="text-[#D8B46B]" />
        <h2 className="font-serif text-3xl text-[#1E3A32]">Suggested For You</h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.recommendations.map((rec, index) => (
          <motion.div
            key={rec.product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-[#D8B46B]/20 touch-manipulation active:scale-98"
          >
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-[#D8B46B]/10 text-[#1E3A32] text-xs tracking-wider uppercase rounded-full mb-3">
                Recommended
              </span>
              <h3 className="font-serif text-xl text-[#1E3A32] mb-2">
                {rec.product.name}
              </h3>
            </div>

            <div className="mb-4">
              <p className="text-[#2B2725]/80 italic mb-3 leading-relaxed">
                "{rec.rationale}"
              </p>
              <p className="text-[#2B2725]/60 text-sm">
                {rec.reason}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E4D9C4]">
              <div>
                {rec.product.price && (
                  <p className="text-lg font-bold text-[#1E3A32]">
                    ${(rec.product.price / 100).toFixed(2)}
                    {rec.product.billing_interval === "monthly" && (
                      <span className="text-sm font-normal text-[#2B2725]/60">/month</span>
                    )}
                  </p>
                )}
              </div>
              <Link 
                to={createPageUrl(`ProductPage?slug=${rec.product.slug}`)}
                onClick={async () => {
                  try {
                    await base44.functions.invoke('trackPurchaseEvent', {
                      event_type: 'product.card_clicked',
                      product_id: rec.product.id,
                      product_key: rec.product.key
                    });
                  } catch (e) {
                    // Non-critical
                  }
                }}
              >
                <Button variant="outline" className="border-[#1E3A32] hover:bg-[#1E3A32] hover:text-white min-h-[48px]">
                  Learn More
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}