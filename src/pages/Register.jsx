import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Eye, EyeOff, Loader2, Mail, Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => {
      if (authed) {
        navigate("/ClientPortal", { replace: true });
      }
      setCheckingAuth(false);
    }).catch(() => setCheckingAuth(false));
  }, [navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await base44.auth.register({ email: email.trim(), password });
      // Platform sends a 6-digit OTP code to the user's email
      setNeedsVerification(true);
      setError("");
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Registration failed";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exists")) {
        setError("An account with this email already exists. Try logging in instead.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.verifyOtp({ email: email.trim(), otpCode: otpCode.trim() });
      await base44.auth.loginViaEmailPassword(email.trim(), password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/ClientPortal", { replace: true });
      }, 3000);
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Verification failed";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("expired")) {
        setError("That code is invalid or has expired. Please try again or request a new code.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    setResendSuccess(false);
    setError("");
    try {
      await base44.auth.resendOtp(email.trim());
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      setError("Could not resend the code. Please wait a moment and try again.");
    } finally {
      setResending(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E4D9C4] border-t-[#1E3A32] rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-xl border border-[#E4D9C4] shadow-sm p-10">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="font-serif text-2xl text-[#1E3A32] mb-3">Welcome!</h2>
            <p className="text-sm text-[#2B2725]/70 leading-relaxed mb-4">
              Your account has been created successfully. Your dashboard is being prepared.
            </p>
            <p className="text-xs text-[#2B2725]/50 leading-relaxed">
              If your program doesn't appear immediately, refresh in a few minutes — everything will be set up automatically.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#D8B46B]">
              <Loader2 size={14} className="animate-spin" />
              Taking you to your dashboard...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex flex-col">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        `}</style>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Link to="/" className="inline-block">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a98b3e154ab3b36c88ebb/5fbe0fe56_mind-stylist-purple-m2x.png"
                  alt="Your Mind Stylist"
                  className="w-14 h-14 mx-auto mb-3"
                />
              </Link>
              <p className="text-[10px] tracking-[0.2em] text-[#2B2725]/50 uppercase mb-1">Roberta Fernandez</p>
              <h1 className="font-serif text-3xl text-[#1E3A32] font-bold">Check Your Email</h1>
            </div>

            <div className="bg-white rounded-xl border border-[#E4D9C4] shadow-sm p-8 mb-6">
              <div className="bg-[#F9F5EF] border border-[#E4D9C4] rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Mail size={20} className="text-[#D8B46B] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-[#2B2725]/80 leading-relaxed">
                      We sent a <span className="font-medium text-[#1E3A32]">6-digit verification code</span> to:
                    </p>
                    <p className="text-sm font-medium text-[#1E3A32] mt-1">{email}</p>
                    <p className="text-xs text-[#2B2725]/50 mt-2 leading-relaxed">
                      Check your inbox and spam/junk folder. It may take a minute to arrive.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2B2725]/80 mb-1.5">Verification Code</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    required
                    maxLength={6}
                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono border-[#E4D9C4] focus:border-[#D8B46B] focus:ring-[#D8B46B]/20"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}

                {resendSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    A new code has been sent to your email.
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="w-full h-12 bg-[#1E3A32] hover:bg-[#2B4A40] text-[#F9F5EF] text-sm tracking-wide"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "Verify & Continue"}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-[#E4D9C4] text-center">
                <p className="text-sm text-[#2B2725]/60 mb-2">Didn't receive the code?</p>
                <button
                  onClick={handleResendCode}
                  disabled={resending}
                  className="text-sm text-[#D8B46B] hover:text-[#C9A557] font-medium transition-colors disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend Code"}
                </button>
              </div>
            </div>

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
            <h1 className="font-serif text-3xl text-[#1E3A32] font-bold">Create Your Account</h1>
          </div>

          <div className="bg-white rounded-xl border border-[#E4D9C4] shadow-sm p-8 mb-6">
            {/* Guidance for invited users */}
            <div className="bg-[#F9F5EF] border border-[#E4D9C4] rounded-lg p-4 mb-6">
              <p className="text-sm text-[#2B2725]/70 leading-relaxed">
                Use the <span className="font-medium text-[#1E3A32]">same email address</span> where you received Roberta's invitation. After you create your password, your dashboard will be set up automatically.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2B2725]/80 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/30" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="The email where you received your invitation"
                    required
                    className="pl-10 h-12 border-[#E4D9C4] focus:border-[#D8B46B] focus:ring-[#D8B46B]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2B2725]/80 mb-1.5">Create Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/30" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    className="pl-10 pr-10 h-12 border-[#E4D9C4] focus:border-[#D8B46B] focus:ring-[#D8B46B]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2B2725]/30 hover:text-[#2B2725]/60"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2B2725]/80 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/30" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
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
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Create My Account"}
              </Button>
            </form>
          </div>

          {/* Already have account */}
          <div className="text-center">
            <p className="text-sm text-[#2B2725]/60">
              Already have an account?{" "}
              <Link to="/login" className="text-[#D8B46B] hover:text-[#C9A557] font-medium transition-colors">
                Log in
              </Link>
            </p>
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