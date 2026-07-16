import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard, Mail } from "lucide-react";

export default function PaymentFailureModal({ isOpen, onClose, status, onUpdatePayment, onContactSupport }) {
  const statusMessages = {
    past_due: {
      title: "Payment Failed",
      message: "We couldn't process your last payment. This might happen if your card expired, was declined, or if there were insufficient funds.",
      actions: [
        "Update your payment method to continue your subscription",
        "If updated, your subscription will automatically resume",
        "You'll retain access while we retry the payment"
      ]
    },
    canceled: {
      title: "Subscription Canceled",
      message: "Your subscription was canceled after multiple failed payment attempts. You currently don't have access to paid content.",
      actions: [
        "Update your payment method to restore your subscription",
        "You'll regain immediate access after payment",
        "All your previous progress and content remain saved"
      ]
    },
    incomplete: {
      title: "Payment Pending",
      message: "Your payment is still being processed. This can happen with certain payment methods that require additional verification.",
      actions: [
        "Check your email for any required actions",
        "Payment usually completes within 24 hours",
        "Contact support if you need immediate assistance"
      ]
    }
  };

  const config = statusMessages[status] || statusMessages.past_due;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <DialogTitle className="text-xl">{config.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-[#2B2725]/80 leading-relaxed">{config.message}</p>

          <div className="bg-[#F9F5EF] p-4 rounded">
            <h4 className="font-medium text-[#1E3A32] mb-3 text-sm">What happens next:</h4>
            <ul className="space-y-2">
              {config.actions.map((action, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-[#2B2725]/70">
                  <span className="text-[#D8B46B] mt-0.5">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={onUpdatePayment}
              className="w-full bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Update Payment Method
            </Button>
            <Button
              onClick={onContactSupport}
              variant="outline"
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>

          <p className="text-xs text-[#2B2725]/60 text-center">
            Questions? We're here to help. Reply to any of our emails or use the contact button above.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}