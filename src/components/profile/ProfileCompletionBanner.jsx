import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, X } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfileCompletionBanner({ user }) {
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");

  // Don't show if profile is already complete or user is admin/manager
  const hasName = (user?.first_name && user?.last_name) || user?.profile_complete;
  if (hasName || dismissed) return null;
  if (user?.role === "admin" || user?.custom_role === "manager") return null;

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter both first and last name");
      return;
    }
    setSaving(true);
    try {
      await base44.auth.updateMe({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        profile_complete: true,
      });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Profile updated!");
      setDismissed(true);
    } catch (error) {
      toast.error("Failed to save — please try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800 text-sm">Please complete your profile</p>
            <p className="text-xs text-amber-700/70 mt-0.5">
              Add your name so Roberta can personalise your experience.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!expanded && (
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7"
              onClick={() => setExpanded(true)}
            >
              Add Name
            </Button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-400 hover:text-amber-600"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[140px]">
            <Label className="text-xs text-amber-800">First Name *</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              className="h-8 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <Label className="text-xs text-amber-800">Last Name *</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Smith"
              className="h-8 text-sm"
            />
          </div>
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white h-8"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}