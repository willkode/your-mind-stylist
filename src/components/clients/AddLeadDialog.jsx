import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const SOURCE_OPTIONS = [
  { value: "networking", label: "Networking" },
  { value: "internet", label: "Internet" },
  { value: "referral", label: "Referral" },
  { value: "client", label: "Client" },
  { value: "colleague", label: "Colleague" },
  { value: "vendor", label: "Vendor" },
  { value: "website", label: "Website" },
  { value: "masterclass", label: "Masterclass" },
  { value: "social_media", label: "Social Media" },
  { value: "paid_ad", label: "Paid Ad" },
  { value: "organic_search", label: "Organic Search" },
  { value: "email_campaign", label: "Email Campaign" },
  { value: "event", label: "Event" },
  { value: "booking_system", label: "Booking System" },
  { value: "product_purchase", label: "Product Purchase" },
  { value: "free_masterclass", label: "Free Masterclass" },
  { value: "other", label: "Other" },
];

const STAGE_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "booked", label: "Booked" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export default function AddLeadDialog({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    source: "",
    stage: "new",
    what_inquired_about: "",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead added successfully!");
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        source: "",
        stage: "new",
        what_inquired_about: "",
        notes: "",
      });
      onOpenChange(false);
    },
  });

  const handleSubmit = () => {
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    const payload = { ...formData };
    if (formData.first_name && formData.last_name) {
      payload.full_name = `${formData.first_name} ${formData.last_name}`;
    }
    createMutation.mutate(payload);
  };

  const update = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-[#1E3A32]">Add New Lead</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input
                placeholder="Jane"
                value={formData.first_name}
                onChange={(e) => update("first_name", e.target.value)}
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                placeholder="Doe"
                value={formData.last_name}
                onChange={(e) => update("last_name", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              placeholder="jane@example.com"
              value={formData.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          <div>
            <Label>Phone</Label>
            <Input
              type="tel"
              placeholder="612-555-0123"
              value={formData.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Source</Label>
              <Select value={formData.source} onValueChange={(v) => update("source", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source..." />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stage</Label>
              <Select value={formData.stage} onValueChange={(v) => update("stage", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>What They Inquired About</Label>
            <Input
              placeholder="e.g., LENS™ course, private sessions..."
              value={formData.what_inquired_about}
              onChange={(e) => update("what_inquired_about", e.target.value)}
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              placeholder="Any additional notes..."
              value={formData.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E4D9C4]">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" /> Saving...
                </>
              ) : (
                "Add Lead"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}