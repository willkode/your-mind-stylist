import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

export default function EditUserDialog({ open, onOpenChange, user }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        address_line1: user.address_line1 || "",
        address_line2: user.address_line2 || "",
        city: user.city || "",
        state: user.state || "",
        zip: user.zip || "",
        country: user.country || "",
        manager_notes: user.manager_notes || "",
      });
    }
  }, [user?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("updateUserProfile", {
        userId: user.id,
        updates: form,
      });
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["person-user", user.email?.toLowerCase()] });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save: " + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-[#1E3A32]">Edit User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input
                value={form.first_name || ""}
                onChange={(e) => set("first_name", e.target.value)}
                placeholder="First name"
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                value={form.last_name || ""}
                onChange={(e) => set("last_name", e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-gray-50" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone || ""}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="Phone number"
              />
            </div>
          </div>

          {/* Address */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Street Address</Label>
              <Input
                value={form.address_line1 || ""}
                onChange={(e) => set("address_line1", e.target.value)}
                placeholder="123 Main St"
              />
            </div>
            <div>
              <Label>Apt / Suite</Label>
              <Input
                value={form.address_line2 || ""}
                onChange={(e) => set("address_line2", e.target.value)}
                placeholder="Apt 4B"
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={form.city || ""}
                onChange={(e) => set("city", e.target.value)}
                placeholder="City"
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={form.state || ""}
                onChange={(e) => set("state", e.target.value)}
                placeholder="State"
              />
            </div>
            <div>
              <Label>ZIP</Label>
              <Input
                value={form.zip || ""}
                onChange={(e) => set("zip", e.target.value)}
                placeholder="ZIP code"
              />
            </div>
            <div>
              <Label>Country</Label>
              <Input
                value={form.country || ""}
                onChange={(e) => set("country", e.target.value)}
                placeholder="Country"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Manager Notes</Label>
            <Textarea
              value={form.manager_notes || ""}
              onChange={(e) => set("manager_notes", e.target.value)}
              placeholder="Internal notes about this client..."
              className="min-h-[100px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}