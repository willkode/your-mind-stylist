import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentFailureBanner({ status, onUpdatePayment }) {
  if (!status || status === "active") return null;

  const statusConfig = {
    past_due: {
      icon: AlertCircle,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      title: "Payment Issue",
      message: "Your last payment didn't go through. Please update your payment method to avoid service interruption.",
      buttonText: "Update Payment Method",
      urgent: true
    },
    canceled: {
      icon: AlertCircle,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      title: "Subscription Canceled",
      message: "Your subscription has been canceled due to payment failure. Update your payment method to restore access.",
      buttonText: "Restore Subscription",
      urgent: true
    },
    incomplete: {
      icon: AlertCircle,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      title: "Payment Incomplete",
      message: "Your payment is pending. Please complete the payment process to activate your subscription.",
      buttonText: "Complete Payment",
      urgent: false
    }
  };

  const config = statusConfig[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-l-4 ${config.borderColor} ${config.bgColor} p-6 mb-6`}
    >
      <div className="flex items-start gap-4">
        <Icon className={`w-6 h-6 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h3 className="font-medium text-[#1E3A32] mb-2">{config.title}</h3>
          <p className="text-[#2B2725]/80 mb-4">{config.message}</p>
          <Button
            onClick={onUpdatePayment}
            className={`${
              config.urgent
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-[#1E3A32] hover:bg-[#2B2725]"
            } text-white`}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {config.buttonText}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}