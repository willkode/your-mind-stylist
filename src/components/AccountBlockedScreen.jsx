import React from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Mail } from "lucide-react";

const STATUS_CONTENT = {
  inactive: {
    heading: "Your account is currently paused",
    message: "Your account has been temporarily deactivated. If you believe this is a mistake, please contact us and we'll be happy to help.",
  },
  archived: {
    heading: "Your account has been archived",
    message: "Your account has been archived by your administrator. If you'd like to reactivate it, please reach out to us.",
  },
  deleted: {
    heading: "This account is no longer active",
    message: "This account has been closed. If you have questions, please contact us.",
  },
};

export default function AccountBlockedScreen({ status, user, onLogout }) {
  const content = STATUS_CONTENT[status] || STATUS_CONTENT.inactive;

  return (
    <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a98b3e154ab3b36c88ebb/7d5c32b99_Mind-stylist-dark-icon2x.png"
          alt="Your Mind Stylist"
          className="w-16 h-16 mx-auto mb-8 object-contain"
        />

        {/* Status message */}
        <h1 className="font-serif text-2xl text-[#1E3A32] mb-4">
          {content.heading}
        </h1>
        <p className="text-[#2B2725]/70 text-sm leading-relaxed mb-8">
          {content.message}
        </p>

        {/* Contact */}
        <a
          href="mailto:roberta@robertafernandez.com"
          className="inline-flex items-center gap-2 text-sm text-[#6E4F7D] hover:text-[#5A3F69] transition-colors mb-8"
        >
          <Mail size={16} />
          roberta@robertafernandez.com
        </a>

        {/* Logout */}
        <div>
          <Button
            onClick={onLogout}
            className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF] px-8 py-3"
          >
            <LogOut size={16} className="mr-2" />
            Log Out
          </Button>
        </div>

        {/* Subtle user identifier */}
        {user?.email && (
          <p className="mt-8 text-xs text-[#2B2725]/30">
            Signed in as {user.email}
          </p>
        )}
      </div>
    </div>
  );
}