import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle } from "lucide-react";

export default function GuestAuthorInvite() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: "",
    message: "",
  });
  const [sent, setSent] = useState(false);

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      const token = Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const user = await base44.auth.me();
      
      await base44.entities.GuestAuthorInvite.create({
        email: data.email,
        invited_by: user.email,
        invite_token: token,
        expires_at: expiresAt.toISOString(),
        message: data.message,
        status: "pending",
      });

      // TODO: Send email with invitation link
      // await base44.integrations.Core.SendEmail({
      //   to: data.email,
      //   subject: "You're invited to write for The Mind Styling Journal",
      //   body: `...invitation link with token...`
      // });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guestInvites"] });
      setSent(true);
      setTimeout(() => {
        setFormData({ email: "", message: "" });
        setSent(false);
      }, 3000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    inviteMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Invite Guest Author</h1>
          <p className="text-[#2B2725]/70">Invite someone to contribute to The Mind Styling Journal</p>
        </div>

        <div className="bg-white p-8">
          {sent ? (
            <div className="text-center py-12">
              <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
              <p className="text-[#1E3A32] text-lg">Invitation sent successfully!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Guest Author Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="author@example.com"
                  required
                />
              </div>

              <div>
                <Label>Personal Message (optional)</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Add a personal note to your invitation..."
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full bg-[#1E3A32]" disabled={inviteMutation.isLoading}>
                <Send size={16} className="mr-2" />
                Send Invitation
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}