import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { base44 } from "@/api/base44Client";
import InviteEmailPreview from "./InviteEmailPreview";

export default function CreateUserModal({ open, onOpenChange, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", full_name: "" });
  const [showPreview, setShowPreview] = useState(false);

  const handleProceedToPreview = () => {
    if (!formData.email.trim() || !formData.full_name.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setShowPreview(true);
  };

  const handleConfirmSend = async ({ subject, body }) => {
    setLoading(true);
    try {
      await base44.functions.invoke("inviteUserToApp", {
        email: formData.email.toLowerCase(),
        role: "user",
        brandedSubject: subject,
        brandedBody: body,
      });

      // Also create a lead record so we track them
      try {
        const existing = await base44.entities.Lead.filter({ email: formData.email.toLowerCase() });
        if (existing.length === 0) {
          await base44.entities.Lead.create({
            email: formData.email.toLowerCase(),
            full_name: formData.full_name,
            first_name: formData.full_name.split(" ")[0],
            last_name: formData.full_name.split(" ").slice(1).join(" "),
            converted_to_client: true,
            source: "other",
          });
        } else {
          await base44.entities.Lead.update(existing[0].id, { converted_to_client: true });
        }
      } catch (_) { /* non-critical */ }

      toast.success("Invite sent! They'll receive a branded email from Roberta, followed by an account setup email.");
      setFormData({ email: "", full_name: "" });
      setShowPreview(false);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      if (error.response?.data?.userExists) {
        toast.success("This person already has an account.");
        setShowPreview(false);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error("Failed to create user: " + (error.response?.data?.error || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open && !showPreview} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Enter their details, then preview the branded invite email before sending.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                placeholder="Jane Smith"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="jane@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleProceedToPreview}
                disabled={!formData.email.trim() || !formData.full_name.trim()}
                className="bg-[#6E4F7D] hover:bg-[#5A3F69] text-white"
              >
                Preview Email <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <InviteEmailPreview
        open={showPreview}
        onOpenChange={(v) => {
          setShowPreview(v);
          if (!v && !loading) {
            // User cancelled the preview — go back to form
          }
        }}
        recipientName={formData.full_name}
        recipientEmail={formData.email}
        mode="invite"
        onConfirmSend={handleConfirmSend}
      />
    </>
  );
}