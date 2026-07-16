import React, { useState } from "react";
import { createPageUrl } from "../../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Loader2 } from "lucide-react";

export default function MasterclassSignupForm({ source = "landing_page", onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    biggest_challenge: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if user is already signed up
      const existingSignups = await base44.entities.MasterclassSignup.filter({
        email: formData.email
      });

      if (existingSignups.length > 0) {
        // Already signed up - redirect to masterclass
        if (onSuccess) {
          onSuccess(existingSignups[0]);
        } else {
          window.location.href = createPageUrl('FreeMasterclass');
        }
        return;
      }

      // Send confirmation email (also creates the signup record server-side)
      await base44.functions.invoke('sendMasterclassConfirmation', {
        email: formData.email,
        full_name: formData.full_name
      });

      // Also store the extra form fields locally
      try {
        const created = await base44.entities.MasterclassSignup.filter({ email: formData.email });
        if (created.length > 0) {
          await base44.entities.MasterclassSignup.update(created[0].id, {
            biggest_challenge: formData.biggest_challenge,
            role: formData.role,
          });
        }
      } catch (_) {}

      // Success - redirect or callback
      if (onSuccess) {
        onSuccess({ email: formData.email });
      } else {
        window.location.href = createPageUrl('FreeMasterclass');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="full_name" className="text-[#2B2725] mb-2 block">
          Full Name *
        </Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          placeholder="Your full name"
          required
          className="border-[#E4D9C4] focus:border-[#D8B46B]"
        />
      </div>

      <div>
        <Label htmlFor="email" className="text-[#2B2725] mb-2 block">
          Email *
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="your@email.com"
          required
          className="border-[#E4D9C4] focus:border-[#D8B46B]"
        />
      </div>

      <div>
        <Label htmlFor="role" className="text-[#2B2725] mb-2 block">
          I am a... *
        </Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value })}
          required
        >
          <SelectTrigger className="border-[#E4D9C4] focus:border-[#D8B46B]">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Leader / Executive">Leader / Executive</SelectItem>
            <SelectItem value="Entrepreneur / Business Owner">Entrepreneur / Business Owner</SelectItem>
            <SelectItem value="Professional / Individual Contributor">Professional / Individual Contributor</SelectItem>
            <SelectItem value="Coach / Consultant">Coach / Consultant</SelectItem>
            <SelectItem value="Student / Aspiring Professional">Student / Aspiring Professional</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="biggest_challenge" className="text-[#2B2725] mb-2 block">
          What's your biggest challenge right now? *
        </Label>
        <Textarea
          id="biggest_challenge"
          value={formData.biggest_challenge}
          onChange={(e) => setFormData({ ...formData, biggest_challenge: e.target.value })}
          placeholder="e.g., 'I struggle with feeling like I don't belong...' or 'I constantly doubt my decisions...'"
          rows={3}
          required
          className="border-[#E4D9C4] focus:border-[#D8B46B]"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1E3A32] hover:bg-[#2B2725] text-white py-6 text-base"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="mr-2 animate-spin" />
            Getting your access...
          </>
        ) : (
          <>
            Get Instant Access
            <ArrowRight size={18} className="ml-2" />
          </>
        )}
      </Button>

      <p className="text-xs text-[#2B2725]/60 text-center">
        By signing up, you'll get immediate access to the masterclass and occasional emails from Roberta about Mind Styling. Unsubscribe anytime.
      </p>
    </form>
  );
}