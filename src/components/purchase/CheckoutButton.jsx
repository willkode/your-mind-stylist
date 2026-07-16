import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function CheckoutButton({ 
  productId, 
  children, 
  className = "",
  variant = "default",
  size = "default"
}) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Get affiliate code from localStorage if exists
      const affiliateCode = localStorage.getItem('affiliate_code');
      const timestamp = localStorage.getItem('affiliate_code_timestamp');
      
      // Check if affiliate code is still valid (within 30 days)
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const isValid = timestamp && (Date.now() - parseInt(timestamp)) < thirtyDaysMs;

      const payload = {
        product_id: productId,
        success_url: window.location.origin + '/PurchaseSuccess',
        cancel_url: window.location.origin + '/PurchaseCenter'
      };

      if (isValid && affiliateCode) {
        payload.affiliate_code = affiliateCode;
      }

      const { data } = await base44.functions.invoke('createProductCheckout', payload);

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.error || 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleCheckout} 
      disabled={loading}
      className={className}
      variant={variant}
      size={size}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  );
}