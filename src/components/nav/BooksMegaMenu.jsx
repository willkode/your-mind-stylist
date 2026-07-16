import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

export default function BooksMegaMenu({ isOpen, hasDarkHero }) {
  const [hoveredBook, setHoveredBook] = useState(null);
  const { data: books = [] } = useQuery({
    queryKey: ["nav-books"],
    queryFn: async () => {
      const all = await base44.entities.Product.filter({ status: "published", product_subtype: "book" });
      // Collect all product IDs referenced as purchase option variants
      const variantIds = new Set();
      all.forEach(book => {
        (book.purchase_options || []).forEach(opt => {
          if (opt.product_id) {
            // product_id can be a string or array of strings
            const ids = Array.isArray(opt.product_id) ? opt.product_id : [opt.product_id];
            ids.forEach(id => variantIds.add(id));
          }
          if (opt.bundle_product_id) variantIds.add(opt.bundle_product_id);
        });
      });
      return all
        .filter(b => b.ui_group !== "hidden" && !variantIds.has(b.id))
        .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Cap books at 9 for the mega menu, distribute across 3 columns
  const MAX_BOOKS = 9;
  const visibleBooks = books.slice(0, MAX_BOOKS);
  const hasMoreBooks = books.length > MAX_BOOKS;

  const col1 = visibleBooks.filter((_, i) => i % 3 === 0);
  const col2 = visibleBooks.filter((_, i) => i % 3 === 1);
  const col3 = visibleBooks.filter((_, i) => i % 3 === 2);

  const displayBook = hoveredBook || books[0];
  const displayCover = displayBook?.book_cover_image || displayBook?.thumbnail;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute top-full left-0 right-0 bg-white shadow-2xl border-t border-b border-[#E4D9C4] z-50"
        >
          <div className="max-w-7xl mx-auto px-8 py-8">
            {books.length === 0 ? (
              <p className="text-[#2B2725]/60 text-sm">No books available yet.</p>
            ) : (
              <div className="grid grid-cols-4 gap-8">
                {/* Columns 1-3: Book titles */}
                {[col1, col2, col3].map((col, colIdx) => (
                  <div key={colIdx} className="space-y-3">
                    {colIdx === 0 && (
                      <h3 className="text-[#D8B46B] text-xs tracking-[0.2em] uppercase mb-4">Our Books</h3>
                    )}
                    {colIdx !== 0 && <div className="h-[20px]" />}
                    {col.map((book) => {
                       const slugPath = book.slug ? `/books/${book.slug}` : `/Books`;
                      return (
                        <Link
                          key={book.id}
                          to={slugPath}
                          onMouseEnter={() => setHoveredBook(book)}
                          onMouseLeave={() => setHoveredBook(null)}
                          className="block group py-1"
                        >
                          <p className="text-[#1E3A32] font-medium text-sm group-hover:text-[#D8B46B] transition-colors leading-snug">
                            {book.name}
                          </p>
                          {book.tagline && (
                            <p className="text-[#2B2725]/50 text-xs mt-0.5">{book.tagline}</p>
                          )}
                        </Link>
                      );
                    })}
                    {colIdx === 0 && hasMoreBooks && (
                      <Link
                        to="/Books"
                        className="block text-xs text-[#D8B46B] hover:text-[#1E3A32] transition-colors mt-3 font-medium"
                      >
                        See All Books →
                      </Link>
                    )}
                  </div>
                ))}

                {/* Column 4: Cover preview */}
                <div className="flex flex-col items-center justify-center gap-4">
                  <AnimatePresence mode="wait">
                    {displayBook && (
                      <motion.div
                        key={displayBook.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center gap-3"
                      >
                        {displayCover ? (
                          <div className="w-[100px] h-[140px] shadow-xl overflow-hidden rounded-sm">
                            <img
                              src={displayCover}
                              alt={displayBook.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-[100px] h-[140px] bg-[#E4D9C4] rounded-sm flex items-center justify-center">
                            <span className="text-xs text-[#2B2725]/40">No cover</span>
                          </div>
                        )}
                        <p className="text-[#1E3A32] text-xs font-medium text-center max-w-[120px] leading-snug">
                          {displayBook.name}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Link
                    to="/Books"
                    className="text-xs text-[#D8B46B] hover:text-[#1E3A32] transition-colors border-b border-[#D8B46B] pb-0.5 whitespace-nowrap mt-2"
                  >
                    View All Books →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}