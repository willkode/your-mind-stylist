import React from "react";
import { motion } from "framer-motion";
import { X, Lock, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "../../utils";

export default function LockedResourceModal({ resource, products, onClose }) {
  const requiredProducts = products.filter(p => 
    resource.product_ids?.includes(p.stripe_product_id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white max-w-lg w-full shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#2B2725]/60 hover:text-[#1E3A32]"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          <div className="w-16 h-16 bg-[#D8B46B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-[#D8B46B]" />
          </div>

          <h2 className="font-serif text-2xl text-[#1E3A32] text-center mb-4">
            Premium Resource
          </h2>

          <p className="text-[#2B2725]/70 text-center mb-6">
            <strong>{resource.title}</strong> requires a purchase to access.
          </p>

          {requiredProducts.length > 0 ? (
            <>
              <p className="text-sm text-[#2B2725]/60 text-center mb-4">
                This resource is included with:
              </p>
              <div className="space-y-3 mb-6">
                {requiredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="border border-[#E4D9C4] p-4 rounded-lg"
                  >
                    <h3 className="font-medium text-[#1E3A32] mb-1">
                      {product.name}
                    </h3>
                    {product.tagline && (
                      <p className="text-sm text-[#2B2725]/70">
                        {product.tagline}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Maybe Later
                </Button>
                <Button
                  onClick={() => window.location.href = createPageUrl("Programs")}
                  className="flex-1 bg-[#1E3A32]"
                >
                  <ShoppingCart size={16} className="mr-2" />
                  View Programs
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-[#2B2725]/70 text-center mb-6">
                Contact us for access to this resource.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => window.location.href = createPageUrl("Contact")}
                  className="flex-1 bg-[#1E3A32]"
                >
                  Contact Us
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}