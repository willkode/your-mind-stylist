import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => {
      if (authed) {
        navigate("/ClientPortal", { replace: true });
      }
      setCheckingAuth(false);
    }).catch(() => setCheckingAuth(false));
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email.trim(), password);
      navigate("/ClientPortal", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Login failed";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("credentials")) {
        setError("Invalid email or password. Please try again.");
      } else if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("no user")) {
        setError("No account found with that email. If you were invited, click 'Create My Account' below.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    base44.auth.loginWithProvider("google", "/ClientPortal");
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E4D9C4] border-t-[#1E3A32] rounded-full animate-spin" />
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
            <h1 className="font-serif text-3xl text-[#1E3A32] font-bold">Your Mind Stylist</h1>
          </div>

          {/* Returning Users — Login */}
          <div className="bg-white rounded-xl border border-[#E4D9C4] shadow-sm p-8 mb-6">
            <h2 className="font-serif text-xl text-[#1E3A32] mb-1">Welcome Back</h2>
            <p className="text-sm text-[#2B2725]/60 mb-6">Sign in to your account</p>

            <form onSubmit={handleLogin} className="space-y-4">
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

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-[#2B2725]/80">Password</label>
                  <Link to="/forgot-password" className="text-xs text-[#D8B46B] hover:text-[#C9A557] transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/30" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
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
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Log In"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E4D9C4]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-[#2B2725]/40">or</span>
              </div>
            </div>

            {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full h-12 border-[#E4D9C4] text-[#2B2725]/70 hover:bg-[#F9F5EF] text-sm"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>
          </div>

          {/* First-Time Invited Customers */}
          <div className="bg-[#1E3A32] rounded-xl p-8 text-center">
            <h3 className="font-serif text-lg text-[#F9F5EF] mb-2">First Time Here?</h3>
            <p className="text-sm text-[#F9F5EF]/70 mb-5 leading-relaxed">
              If Roberta invited you or you received a Your Mind Stylist email, create your password to get started.
            </p>
            <Link to="/register">
              <Button className="w-full h-12 bg-[#D8B46B] hover:bg-[#C9A557] text-[#1E3A32] text-sm font-medium tracking-wide">
                Create My Account
              </Button>
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