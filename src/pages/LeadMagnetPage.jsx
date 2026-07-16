import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Download, ArrowRight } from "lucide-react";
import SEO from "../components/SEO";

export default function LeadMagnetPage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [error, setError] = useState("");

  const { data: leadMagnets = [], isLoading } = useQuery({
    queryKey: ["leadMagnet", slug],
    queryFn: () => base44.entities.LeadMagnet.filter({ slug, active: true }),
    enabled: !!slug,
  });

  const leadMagnet = leadMagnets[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("processLeadMagnetDownload", {
        lead_magnet_id: leadMagnet.id,
        user_email: email,
        user_name: name,
        source: "landing_page",
      });
      setFileUrl(res.data.file_url);
      setSuccess(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="animate-pulse text-[#1E3A32]">Loading...</div>
      </div>
    );
  }

  if (!leadMagnet) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl text-[#1E3A32] mb-2">Not Found</h1>
          <p className="text-[#2B2725]/60">This resource isn't available.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#1E3A32] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-[#D8B46B]" size={32} />
          </div>
          <h2 className="font-serif text-3xl text-[#1E3A32] mb-3">You're all set!</h2>
          <p className="text-[#2B2725]/70 mb-8 leading-relaxed">
            A copy has been sent to <strong>{email}</strong>. Click below to download now.
          </p>
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-[#1E3A32] text-[#F9F5EF] px-8 py-4 text-sm tracking-wide hover:bg-[#2B2725] transition-colors"
          >
            <Download size={18} />
            Download {leadMagnet.title}
          </a>
          <p className="text-xs text-[#2B2725]/40 mt-6">Check your inbox — we also emailed you the link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF]">
      <SEO
        title={`${leadMagnet.title} — Free Resource | Your Mind Stylist`}
        description={leadMagnet.description || `Download ${leadMagnet.title} — a free resource from Roberta Fernandez, Your Mind Stylist.`}
        ogImage={leadMagnet.thumbnail}
        canonical={`/LeadMagnetPage?slug=${slug}`}
      />
      {/* Hero */}
      <div className="bg-[#1E3A32] pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4">Free Resource</p>
          <h1 className="font-serif text-4xl md:text-5xl text-[#F9F5EF] mb-6 leading-tight">
            {leadMagnet.title}
          </h1>
          {leadMagnet.description && (
            <p className="text-[#F9F5EF]/70 text-lg leading-relaxed max-w-xl mx-auto">
              {leadMagnet.description}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left: Info */}
          <div>
            {leadMagnet.thumbnail && (
              <img
                src={leadMagnet.thumbnail}
                alt={leadMagnet.title}
                className="w-full max-w-xs mb-8 shadow-lg"
              />
            )}
            {leadMagnet.benefits?.length > 0 && (
              <div>
                <h3 className="font-serif text-xl text-[#1E3A32] mb-4">What you'll get:</h3>
                <ul className="space-y-3">
                  {leadMagnet.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle size={18} className="text-[#D8B46B] flex-shrink-0 mt-0.5" />
                      <span className="text-[#2B2725]/80">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right: Form */}
          <div className="bg-white p-8 shadow-sm">
            <h2 className="font-serif text-2xl text-[#1E3A32] mb-2">{leadMagnet.cta_text || "Get Your Free Download"}</h2>
            <p className="text-[#2B2725]/60 text-sm mb-6">Enter your details below and we'll send it straight to your inbox.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2B2725] mb-1">Your Name</label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2B2725] mb-1">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF] py-6 text-base"
              >
                {loading ? "Sending..." : (
                  <span className="flex items-center gap-2">
                    {leadMagnet.cta_text || "Get Your Free Download"} <ArrowRight size={18} />
                  </span>
                )}
              </Button>
              <p className="text-xs text-[#2B2725]/40 text-center">
                No spam. Unsubscribe anytime.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Footer bio */}
      <div className="bg-white py-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a98b3e154ab3b36c88ebb/5fbe0fe56_mind-stylist-purple-m2x.png"
            alt="Roberta"
            className="w-16 h-16 mx-auto mb-4 object-contain"
          />
          <p className="font-serif text-lg text-[#1E3A32] mb-2">Roberta Fernandez</p>
          <p className="text-[#2B2725]/60 text-sm">Your Mind Stylist · Emotional Intelligence · Hypnosis · Mind Styling</p>
        </div>
      </div>
    </div>
  );
}