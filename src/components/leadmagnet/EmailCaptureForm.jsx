import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Loader2, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * Reusable email capture form component.
 * 
 * Props:
 * - source: string — Lead source value (e.g. "programs_page", "product_interest")
 * - title: string — Form heading
 * - subtitle: string — Form description
 * - buttonText: string — Submit button label
 * - thankYouTitle: string — Success heading
 * - thankYouMessage: string — Success body
 * - interestedProducts: string[] — Product IDs for lead tracking
 * - onSuccess: (data) => void — Callback after successful submission
 * - compact: boolean — Smaller form variant
 * - variant: "light" | "dark" — Color scheme
 * - className: string — Additional wrapper classes
 */
export default function EmailCaptureForm({
  source = "website",
  title = "Stay in the Loop",
  subtitle = "Get insights on emotional intelligence, mind styling, and personal growth.",
  buttonText = "Subscribe",
  thankYouTitle = "You're all set!",
  thankYouMessage = "Thank you for your interest. We'll be in touch.",
  interestedProducts,
  onSuccess,
  compact = false,
  variant = "light",
  className = "",
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const isDark = variant === "dark";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !name) return;
    setLoading(true);
    setError("");

    try {
      await base44.functions.invoke("createOrUpdateLead", {
        email: email.trim(),
        full_name: name.trim(),
        source,
        email_consent: true,
        consent_given_at: new Date().toISOString(),
        interested_products: interestedProducts || [],
        skip_sequence_enrollment: true,
      });
      setSuccess(true);
      onSuccess?.({ email, name });
    } catch (err) {
      console.error("Email capture error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`text-center py-6 ${className}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? "bg-[#D8B46B]/20" : "bg-[#1E3A32]/10"}`}>
          <CheckCircle size={24} className={isDark ? "text-[#D8B46B]" : "text-[#1E3A32]"} />
        </div>
        <h3 className={`font-serif text-xl mb-2 ${isDark ? "text-[#F9F5EF]" : "text-[#1E3A32]"}`}>
          {thankYouTitle}
        </h3>
        <p className={`text-sm ${isDark ? "text-[#F9F5EF]/70" : "text-[#2B2725]/60"}`}>
          {thankYouMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {!compact && (
        <div className="mb-4">
          <h3 className={`font-serif ${compact ? "text-lg" : "text-xl"} mb-1 ${isDark ? "text-[#F9F5EF]" : "text-[#1E3A32]"}`}>
            {title}
          </h3>
          <p className={`text-sm ${isDark ? "text-[#F9F5EF]/70" : "text-[#2B2725]/60"}`}>
            {subtitle}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={compact ? "flex flex-col sm:flex-row gap-2" : "space-y-3"}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          className={`${isDark ? "bg-white/10 border-white/20 text-white placeholder:text-white/50" : "bg-white border-[#E4D9C4]"} ${compact ? "flex-1" : ""}`}
        />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className={`${isDark ? "bg-white/10 border-white/20 text-white placeholder:text-white/50" : "bg-white border-[#E4D9C4]"} ${compact ? "flex-1" : ""}`}
        />
        <Button
          type="submit"
          disabled={loading}
          className={`${isDark ? "bg-[#D8B46B] hover:bg-[#C9A55A] text-[#1E3A32]" : "bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"} ${compact ? "flex-shrink-0" : "w-full py-5"}`}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <span className="flex items-center gap-2">
              {buttonText} <ArrowRight size={16} />
            </span>
          )}
        </Button>
      </form>

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      <div className={`flex items-center gap-1.5 mt-3 ${isDark ? "text-[#F9F5EF]/40" : "text-[#2B2725]/40"}`}>
        <Shield size={10} />
        <span className="text-[10px]">
          We respect your privacy. Unsubscribe anytime. See our{" "}
          <Link to={createPageUrl("LegalPage?slug=privacy-policy")} className="underline hover:opacity-80">
            Privacy Policy
          </Link>.
        </span>
      </div>
    </div>
  );
}