import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookCover3D from "../components/books/BookCover3D";
import SEO from "../components/SEO";
import BookPurchaseOptions from "../components/books/BookPurchaseOptions";

const formatPrice = (price) => `$${(price / 100).toFixed(2)}`;

export default function BookLanding() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: book, isLoading } = useQuery({
    queryKey: ["book-landing", slug],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ slug, product_subtype: "book" });
      return products[0] || null;
    },
    enabled: !!slug,
  });

  // Fetch associated quiz
  const { data: quiz } = useQuery({
    queryKey: ["book-quiz", book?.id],
    queryFn: async () => {
      const quizzes = await base44.entities.Quiz.filter({ status: "published" });
      return quizzes.find(q => 
        q.related_product_id === book.key || 
        q.related_product_id === book.id || 
        q.related_product_id === book.slug ||
        q.cta_product_id === book.key ||
        q.cta_product_id === book.id ||
        q.cta_product_id === book.slug
      ) || null;
    },
    enabled: !!book,
  });

  // Check if book has purchase options configured
  const hasPurchaseOptions = book?.purchase_options && book.purchase_options.length > 0;

  const handleDefaultPurchase = async () => {
    if (!book) return;
    const response = await base44.functions.invoke("createProductCheckout", { product_id: book.id });
    if (response.data?.url) window.location.href = response.data.url;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D8B46B]" size={40} />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">Book not found</h2>
          <Link to="/Books"><Button variant="outline">Back to Books</Button></Link>
        </div>
      </div>
    );
  }

  const coverImage = book.book_cover_image || book.thumbnail;
  const quizSlug = quiz?.slug || slug;

  return (
    <div className="min-h-screen bg-[#F9F5EF]">
      <SEO
        title={`${book.name} | Your Mind Stylist`}
        description={book.short_description || `${book.name} by Roberta Fernandez — available at Your Mind Stylist.`}
        ogImage={coverImage}
        canonical={`/books/${slug}`}
      />

      {/* Back Navigation */}
      <div className="pt-24 pb-2 px-6 md:px-12 lg:px-20 xl:px-28">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/Books');
            }
          }}
          className="inline-flex items-center gap-2 text-sm text-[#2B2725]/60 hover:text-[#1E3A32] transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Section 1 — Hero */}
      <section className="pb-12 bg-[#F9F5EF]">
        <div className="w-full px-6 md:px-12 lg:px-20 xl:px-28">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="flex-shrink-0"
            >
              {coverImage ? (
                <BookCover3D imageUrl={coverImage} title={book.name} size="xl" />
              ) : (
                <div className="w-[240px] h-[320px] bg-[#E4D9C4] rounded flex items-center justify-center text-[#2B2725]/40 text-sm">
                  No cover image
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex-1 min-w-0"
            >
              {book.tagline && (
                <p className="text-[#D8B46B] text-xs tracking-[0.2em] uppercase mb-2 font-medium">
                  {book.tagline}
                </p>
              )}
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-3 leading-tight">
                {book.name}
              </h1>
              {book.short_description && (
                <p className="text-[#1E3A32]/70 text-base lg:text-lg leading-relaxed mb-4 font-serif italic">
                  {book.short_description}
                </p>
              )}

              <div className="mb-6">
                <Link to={`/quiz/${quizSlug}`}>
                  <Button variant="outline" className="border-[#D8B46B] text-[#1E3A32] hover:bg-[#D8B46B]/10 px-6 py-4 text-sm">
                    Take the Quiz
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </div>

              {hasPurchaseOptions ? (
                <BookPurchaseOptions product={book} />
              ) : (
                <Button
                  onClick={handleDefaultPurchase}
                  className="bg-[#1E3A32] hover:bg-[#2B2725] text-white px-8 py-5 text-base"
                >
                  <ShoppingCart size={18} className="mr-2" />
                  Buy the Book{book.price ? ` — ${formatPrice(book.price)}` : ""}
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 2 — About & Walk Away With */}
      {book.long_description && (
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-6">
            <div
              className="prose prose-lg max-w-none text-[#2B2725]/80 leading-relaxed [&_h2]:font-serif [&_h2]:text-[#1E3A32] [&_h2]:text-3xl [&_h2]:mt-12 [&_h2]:mb-6 [&_blockquote]:border-l-4 [&_blockquote]:border-[#D8B46B] [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-[#1E3A32] [&_li]:mb-2"
              dangerouslySetInnerHTML={{ __html: book.long_description }}
            />
          </div>
        </section>
      )}

      {/* Walk Away With — features */}
      {book.features && book.features.length > 0 && (
        <section className="py-20 bg-[#F9F5EF]">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="font-serif text-3xl text-[#1E3A32] mb-4 text-center">What You'll Walk Away With</h2>
            <p className="text-center text-[#2B2725]/60 mb-12 italic">This isn't a book you power through. It's a book you sit with.</p>
            <div className="grid md:grid-cols-2 gap-6">
              {book.features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white border border-[#E4D9C4] p-6"
                >
                  <p className="text-[#2B2725]/80 leading-relaxed">{f}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}


      <section className="py-20 bg-[#1E3A32]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4">Self-Discovery</p>
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-6">
              Which Archetype Leads Your Life?
            </h2>
            <p className="text-white/70 text-lg mb-10 leading-relaxed">
              In less than 3 minutes, discover the pattern you return to most — and how it shapes your relationships, work style, emotional habits, and growth.
            </p>
            <Link to={`/quiz/${quizSlug}`}>
              <Button className="bg-[#D8B46B] hover:bg-[#C5A35B] text-[#1E3A32] px-10 py-6 text-base font-semibold">
                Start the Quiz
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Section 4 — Reviews */}
      {book.book_reviews && book.book_reviews.length > 0 && (
        <section className="py-20 px-6 bg-[#F9F5EF]">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-serif text-3xl text-[#1E3A32] mb-12 text-center">What Readers Are Saying</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {book.book_reviews.map((review, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-6 border border-[#E4D9C4]"
                >
                  <p className="text-[#2B2725]/80 italic leading-relaxed text-sm mb-4">"{review.quote}"</p>
                  <p className="font-medium text-[#1E3A32] text-sm">{review.reviewer}</p>
                  {review.reviewer_title && (
                    <p className="text-[#2B2725]/50 text-xs mt-0.5">{review.reviewer_title}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 5 — Final CTA */}
      <section className="py-20 bg-[#D8B46B]/10 border-t border-[#D8B46B]/20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl text-[#1E3A32] mb-4">
            Read the book. Discover your archetype. Restyle your mindset.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
           {hasPurchaseOptions ? (
             <BookPurchaseOptions product={book} />
           ) : (
             <Button
               onClick={handleDefaultPurchase}
               className="bg-[#1E3A32] hover:bg-[#2B2725] text-white px-10 py-6 text-base"
             >
               <ShoppingCart size={18} className="mr-2" />
               Buy the Book{book.price ? ` — ${formatPrice(book.price)}` : ""}
             </Button>
           )}
            <Link to={`/quiz/${quizSlug}`}>
              <Button variant="outline" className="border-[#1E3A32] text-[#1E3A32] px-10 py-6 text-base w-full">
                Take the Quiz
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}