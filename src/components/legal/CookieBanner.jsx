import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import CookiePreferences from "./CookiePreferences";

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("cookieConsent", JSON.stringify({
      essential: true,
      analytics: true,
      marketing: true,
      accepted: true,
    }));
    setShowBanner(false);
  };

  const handleRejectNonEssential = () => {
    localStorage.setItem("cookieConsent", JSON.stringify({
      essential: true,
      analytics: false,
      marketing: false,
      accepted: true,
    }));
    setShowBanner(false);
  };

  const handleManagePreferences = () => {
    setShowPreferences(true);
  };

  const handleSavePreferences = (preferences) => {
    localStorage.setItem("cookieConsent", JSON.stringify({
      ...preferences,
      accepted: true,
    }));
    setShowBanner(false);
    setShowPreferences(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-[#D8B46B] shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex items-start gap-4 flex-1">
              <Cookie size={32} className="text-[#D8B46B] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-serif text-xl text-[#1E3A32] mb-2">We Use Cookies</h3>
                <p className="text-[#2B2725]/80 text-sm leading-relaxed">
                  We use cookies to improve your experience, personalize content, and analyze our
                  traffic. You may accept all, reject non-essential cookies, or manage preferences.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <Button
                onClick={handleAcceptAll}
                className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
              >
                Accept All
              </Button>
              <Button
                onClick={handleRejectNonEssential}
                variant="outline"
                className="border-[#1E3A32] text-[#1E3A32]"
              >
                Reject Non-Essential
              </Button>
              <Button
                onClick={handleManagePreferences}
                variant="ghost"
                className="text-[#1E3A32]"
              >
                Manage Preferences
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showPreferences && (
        <CookiePreferences
          onClose={() => setShowPreferences(false)}
          onSave={handleSavePreferences}
        />
      )}
    </>
  );
}