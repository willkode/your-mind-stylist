import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { createPageUrl } from "../utils";

// Legacy purchase page — the checkout here was never wired to Stripe.
// The Pocket Mindset™ product now has a live product page with real
// pricing and working checkout, so this URL redirects there.
export default function PocketVisualizationPurchase() {
  useEffect(() => {
    window.location.replace(createPageUrl("ProductPage") + "?key=pocket-visualization");
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#1E3A32] animate-spin" />
    </div>
  );
}