import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowRight, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEO from "../components/SEO";
import QuizShareButtons from "../components/quiz/QuizShareButtons";

export default function QuizResults() {
  const { slug } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  const archetypeKey = urlParams.get("archetype");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Fetch quiz
  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ["quiz", slug],
    queryFn: async () => {
      const q = await base44.entities.Quiz.filter({ slug });
      return q[0] || null;
    },
  });

  // Fetch archetype
  const { data: archetype } = useQuery({
    queryKey: ["archetype", quiz?.id, archetypeKey],
    queryFn: async () => {
      if (!quiz?.id) return null;
      const archs = await base44.entities.QuizArchetype.filter({
        quiz_id: quiz.id,
        key: archetypeKey,
      });
      return archs[0] || null;
    },
    enabled: !!quiz?.id,
  });

  // Fetch book product — use cta_product_id first, fall back to related_product_id
  const bookProductId = quiz?.cta_product_id || quiz?.related_product_id;
  const { data: book } = useQuery({
    queryKey: ["book-for-quiz", bookProductId],
    queryFn: async () => {
      if (!bookProductId) return null;
      const prods = await base44.entities.Product.filter({ id: bookProductId });
      return prods[0] || null;
    },
    enabled: !!bookProductId,
  });

  // Default to not showing email gate if disabled
  React.useEffect(() => {
    if (quiz && !quiz.email_gate_enabled) {
      setRevealed(true);
    }
  }, [quiz]);

  if (quizLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!quiz || !archetype) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-2xl text-[#1E3A32]">Result not found</h2>
        </div>
      </div>
    );
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      // Create lead record
      await base44.entities.Lead.create({
        email,
        first_name: name,
        source: "website",
        what_inquired_about: `Dog Archetype Quiz — Result: ${archetype.title}`,
        tags: [`archetype:${archetypeKey}`, "quiz-funnel", `book:${slug}`],
      });
      // Add to MailerLite
      await base44.functions.invoke("mailerLiteAddSubscriber", {
        email,
        name,
        groups: [],
        fields: { dog_archetype: archetypeKey, quiz_source: slug },
      }).catch(() => {});
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      setRevealed(true);
    }
  };

  const handlePurchase = async () => {
    if (!book) return;
    const response = await base44.functions.invoke("createProductCheckout", { product_id: book.id });
    if (response.data?.url) window.location.href = response.data.url;
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF]">
      <SEO title={`Your Dog Archetype Result | Your Mind Stylist`} description={archetype.title} />

      <div className="pt-28 pb-20 px-6">
        <div className="max-w-2xl mx-auto">

          {!revealed ? (
            /* Email gate */
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4">Your Result is Ready</p>
              <h1 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-4">Want your results?</h1>
              <p className="text-[#2B2725]/70 mb-8 leading-relaxed">
                {quiz.results_email_copy || "Enter your email to reveal your personalized insights and receive practical next steps."}
              </p>
              <form onSubmit={handleEmailSubmit} className="bg-white border border-[#E4D9C4] p-8 text-left space-y-4">
                <div>
                  <label className="block text-sm text-[#2B2725]/70 mb-1">First Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your first name"
                    className="border-[#E4D9C4]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#2B2725]/70 mb-1">Email Address *</label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="border-[#E4D9C4]"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#1E3A32] hover:bg-[#2B2725] text-white py-6 text-base"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
                  Show Me My Results
                  <ArrowRight size={16} className="ml-2" />
                </Button>
                <p className="text-center text-xs text-[#2B2725]/40">
                  No spam. Just thoughtful insights, book updates, and practical mindset tools.
                </p>
              </form>
            </motion.div>
          ) : (
            /* Results reveal */
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-center mb-10">
                <div className="text-6xl mb-4">{archetype.emoji}</div>
                <p className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-3">Your Archetype</p>
                <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32] mb-6">{archetype.title}</h1>
                <p className="text-[#2B2725]/80 text-lg leading-relaxed">{archetype.summary}</p>
              </div>

              <div className="space-y-6">
                {/* Strengths */}
                {archetype.strengths && archetype.strengths.length > 0 && (
                  <div className="bg-white border border-[#E4D9C4] p-6">
                    <h3 className="font-serif text-xl text-[#1E3A32] mb-4">Your Strengths</h3>
                    <ul className="space-y-2">
                      {archetype.strengths.map((s, i) => (
                        <li key={i} className="flex items-center gap-3 text-[#2B2725]/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D8B46B] flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Growth edge */}
                {archetype.growth && (
                  <div className="bg-[#F9F5EF] border border-[#E4D9C4] p-6">
                    <h3 className="font-serif text-xl text-[#1E3A32] mb-3">Your Growth Edge</h3>
                    <p className="text-[#2B2725]/80 leading-relaxed">{archetype.growth}</p>
                  </div>
                )}

                {/* Relationships */}
                {archetype.relationships && (
                  <div className="bg-white border border-[#E4D9C4] p-6">
                    <h3 className="font-serif text-xl text-[#1E3A32] mb-3">In Relationships</h3>
                    <p className="text-[#2B2725]/80 leading-relaxed">{archetype.relationships}</p>
                  </div>
                )}

                {/* Stress */}
                {archetype.stress && (
                  <div className="bg-[#F9F5EF] border border-[#E4D9C4] p-6">
                    <h3 className="font-serif text-xl text-[#1E3A32] mb-3">Under Stress</h3>
                    <p className="text-[#2B2725]/80 leading-relaxed">{archetype.stress}</p>
                  </div>
                )}

                {/* Restyle prompt */}
                {archetype.restyle && (
                  <div className="bg-[#1E3A32] p-6 text-center">
                    <p className="text-[#D8B46B] text-xs tracking-[0.2em] uppercase mb-3">Your Restyle Prompt</p>
                    <p className="font-serif text-xl text-white italic">"{archetype.restyle}"</p>
                  </div>
                )}

                {/* Share buttons */}
                {quiz.share_enabled !== false && (
                  <QuizShareButtons archetype={archetype} quiz={quiz} quizSlug={slug} />
                )}

                {/* Book CTA */}
                {book && (
                  <div className="bg-[#D8B46B]/10 border border-[#D8B46B]/30 p-8 text-center">
                    {book.book_cover_image && (
                      <img
                        src={book.book_cover_image}
                        alt={book.name}
                        className="w-32 h-auto mx-auto mb-6 rounded shadow-lg"
                      />
                    )}
                    <h3 className="font-serif text-2xl text-[#1E3A32] mb-3">
                      {quiz.results_intro_text || "Ready to understand your archetype more deeply?"}
                    </h3>
                    <p className="text-[#2B2725]/70 mb-6 max-w-md mx-auto">
                      {book.short_description || "Discover practical tools and deeper insights in the book."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {book.slug && (
                        <Link
                          to={`/books/${book.slug}`}
                          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1E3A32] hover:bg-[#2B2725] text-white text-base transition-colors"
                        >
                          <BookOpen size={18} />
                          {quiz.cta_text || "Learn More About the Book"}
                        </Link>
                      )}
                      <Button
                        onClick={handlePurchase}
                        variant={book.slug ? "outline" : "default"}
                        className={book.slug ? "border-[#1E3A32] text-[#1E3A32] hover:bg-[#1E3A32] hover:text-white px-8 py-4 text-base" : "bg-[#1E3A32] hover:bg-[#2B2725] text-white px-8 py-4 text-base"}
                      >
                        <ShoppingCart size={18} className="mr-2" />
                        Buy Now{book.price ? ` — $${(book.price / 100).toFixed(2)}` : ""}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}