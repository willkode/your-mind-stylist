import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Download, CheckCircle, ArrowRight, Loader2, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Lead Magnet CTA block — renders at end of blog posts, homepage, programs, or product pages.
 *
 * placement: "blog" | "homepage" | "programs" | "products"
 * inline:    if true, shows an email capture form directly instead of linking to landing page
 * productContext: { id, name } — optional product for source tracking (products placement)
 */
export default function LeadMagnetCTA({ placement = "blog", inline = false, productContext }) {
  const filterKey = {
    blog: "show_on_blog",
    homepage: "show_on_homepage",
    programs: "show_on_programs",
    products: "show_on_products",
  }[placement] || "show_on_blog";

  const { data: items = [] } = useQuery({
    queryKey: ["leadMagnetCTA", placement],
    queryFn: () => base44.entities.LeadMagnet.filter({ [filterKey]: true, active: true }),
  });

  const item = items[0];
  if (!item) return null;

  // Inline mode: show the form directly
  if (inline) {
    return <InlineLeadMagnetForm item={item} placement={placement} productContext={productContext} />;
  }

  // Default: link to landing page
  return (
    <div className="my-10 bg-[#1E3A32] p-8 md:p-10">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        {item.thumbnail && (
          <img src={item.thumbnail} alt={item.title} className="w-24 h-24 object-cover flex-shrink-0" />
        )}
        <div className="flex-1 text-center md:text-left">
          <p className="text-[#D8B46B] text-xs tracking-[0.2em] uppercase mb-2">Free Download</p>
          <h3 className="font-serif text-2xl text-[#F9F5EF] mb-2">{item.title}</h3>
          {item.description && (
            <p className="text-[#F9F5EF]/70 text-sm mb-4">{item.description}</p>
          )}
          {item.benefits?.slice(0, 2).map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-[#F9F5EF]/80 text-sm mb-1 justify-center md:justify-start">
              <CheckCircle size={14} className="text-[#D8B46B]" />
              {b}
            </div>
          ))}
        </div>
        <Link
          to={createPageUrl(`LeadMagnetPage?slug=${item.slug}`)}
          className="flex-shrink-0 inline-flex items-center gap-2 bg-[#D8B46B] text-[#1E3A32] px-6 py-3 text-sm font-medium tracking-wide hover:bg-[#C9A55A] transition-colors"
        >
          <Download size={16} />
          {item.cta_text || "Get It Free"}
        </Link>
      </div>
    </div>
  );
}

/**
 * Inline form sub-component — handles email capture directly,
 * then calls processLeadMagnetDownload to deliver the file.
 */
function InlineLeadMagnetForm({ item, placement, productContext }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !name) return;
    setLoading(true);
    setError("");

    try {
      // Use processLeadMagnetDownload to preserve full pipeline:
      // download tracking, MailerLite sync, confirmation email, lead creation
      const sourceValue = productContext
        ? `${placement}_${productContext.id}`
        : placement;

      const res = await base44.functions.invoke("processLeadMagnetDownload", {
        lead_magnet_id: item.id,
        user_email: email.trim(),
        user_name: name.trim(),
        source: sourceValue,
      });
      setFileUrl(res.data.file_url);
      setSuccess(true);
    } catch (err) {
      console.error("Inline lead magnet error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="my-10 bg-[#1E3A32] p-8 md:p-10">
        <div className="text-center">
          <div className="w-14 h-14 bg-[#D8B46B]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-[#D8B46B]" />
          </div>
          <h3 className="font-serif text-2xl text-[#F9F5EF] mb-2">You're all set!</h3>
          <p className="text-[#F9F5EF]/70 text-sm mb-6">
            A copy has been sent to <strong className="text-[#F9F5EF]">{email}</strong>.
          </p>
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-[#D8B46B] text-[#1E3A32] px-6 py-3 text-sm font-medium tracking-wide hover:bg-[#C9A55A] transition-colors"
          >
            <Download size={16} />
            Download {item.title}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="my-10 bg-[#1E3A32] p-8 md:p-10">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        {/* Left: Info */}
        <div className="text-center md:text-left">
          {item.thumbnail && (
            <img src={item.thumbnail} alt={item.title} className="w-20 h-20 object-cover mb-4 mx-auto md:mx-0" />
          )}
          <p className="text-[#D8B46B] text-xs tracking-[0.2em] uppercase mb-2">Free Download</p>
          <h3 className="font-serif text-2xl text-[#F9F5EF] mb-2">{item.title}</h3>
          {item.description && (
            <p className="text-[#F9F5EF]/70 text-sm mb-3">{item.description}</p>
          )}
          {item.benefits?.slice(0, 3).map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-[#F9F5EF]/80 text-sm mb-1 justify-center md:justify-start">
              <CheckCircle size={14} className="text-[#D8B46B] flex-shrink-0" />
              {b}
            </div>
          ))}
        </div>

        {/* Right: Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D8B46B] hover:bg-[#C9A55A] text-[#1E3A32] py-5"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {item.cta_text || "Get Your Free Download"} <ArrowRight size={16} />
                </span>
              )}
            </Button>
          </form>
          <div className="flex items-center gap-1.5 mt-3 text-[#F9F5EF]/40">
            <Shield size={10} />
            <span className="text-[10px]">
              We respect your privacy. Unsubscribe anytime. See our{" "}
              <Link to={createPageUrl("LegalPage?slug=privacy-policy")} className="underline hover:opacity-80">
                Privacy Policy
              </Link>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}