import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email.trim());
      setSent(true);
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
      `}</style>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a98b3e154ab3b36c88ebb/5fbe0fe56_mind-stylist-purple-m2x.png"
                alt="Your Mind Stylist"
                className="w-14 h-14 mx-auto mb-3"
              />
            </Link>
            <p className="text-[10px] tracking-[0.2em] text-[#2B2725]/50 uppercase mb-1">Roberta Fernandez</p>
            <h1 className="font-serif text-3xl text-[#1E3A32] font-bold">
              {sent ? "Check Your Email" : "Reset Password"}
            </h1>
          </div>

          <div className="bg-white rounded-xl border border-[#E4D9C4] shadow-sm p-8 mb-6">
            {sent ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <p className="text-sm text-[#2B2725]/70 leading-relaxed mb-2">
                  We've sent a password reset link to:
                </p>
                <p className="text-sm font-medium text-[#1E3A32] mb-4">{email}</p>
                <p className="text-xs text-[#2B2725]/50 leading-relaxed">
                  Check your inbox (and spam folder) for the reset link. It may take a minute to arrive.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-[#2B2725]/60 mb-6 leading-relaxed">
                  Enter the email address associated with your account and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2B2725]/80 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/30" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        required
                        className="pl-10 h-12 border-[#E4D9C4] focus:border-[#D8B46B] focus:ring-[#D8B46B]/20"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#1E3A32] hover:bg-[#2B4A40] text-[#F9F5EF] text-sm tracking-wide"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : "Send Reset Link"}
                  </Button>
                </form>
              </>
            )}
          </div>

          {/* Back to login */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-[#D8B46B] hover:text-[#C9A557] font-medium transition-colors"
            >
              <ArrowLeft size={14} />
              Back to login
            </Link>
          </div>

          {/* Help */}
          <p className="text-center text-xs text-[#2B2725]/40 mt-6">
            Need help?{" "}
            <Link to="/Contact" className="text-[#D8B46B] hover:text-[#C9A557] transition-colors">
              Contact Roberta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}