import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

export default function CookiePreferences({ onClose, onSave }) {
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false,
  });

  const handleSave = () => {
    onSave(preferences);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6">
      <div className="bg-white max-w-2xl w-full rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#E4D9C4] p-6 flex justify-between items-center">
          <h2 className="font-serif text-2xl text-[#1E3A32]">Cookie Preferences</h2>
          <button onClick={onClose} className="text-[#2B2725]/60 hover:text-[#1E3A32]">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-[#2B2725]/80 leading-relaxed">
            Manage your cookie preferences. Essential cookies are required for the site to function
            and cannot be disabled.
          </p>

          {/* Essential Cookies */}
          <div className="bg-[#F9F5EF] p-6 rounded">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <Label className="text-lg font-medium text-[#1E3A32] mb-2 block">
                  Essential Cookies
                </Label>
                <p className="text-sm text-[#2B2725]/70 leading-relaxed">
                  Required for authentication, security, and core functionality. These cannot be
                  disabled.
                </p>
              </div>
              <Switch checked={true} disabled className="ml-4" />
            </div>
          </div>

          {/* Analytics Cookies */}
          <div className="bg-[#F9F5EF] p-6 rounded">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <Label className="text-lg font-medium text-[#1E3A32] mb-2 block">
                  Analytics Cookies
                </Label>
                <p className="text-sm text-[#2B2725]/70 leading-relaxed">
                  Help us understand how visitors use our site so we can improve the experience.
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, analytics: checked })
                }
                className="ml-4"
              />
            </div>
          </div>

          {/* Marketing Cookies */}
          <div className="bg-[#F9F5EF] p-6 rounded">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <Label className="text-lg font-medium text-[#1E3A32] mb-2 block">
                  Marketing Cookies
                </Label>
                <p className="text-sm text-[#2B2725]/70 leading-relaxed">
                  Used to deliver personalized content and measure campaign effectiveness.
                </p>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, marketing: checked })
                }
                className="ml-4"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#E4D9C4] p-6 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]">
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}