import React, { useState } from "react";
import { ShoppingCart, X, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "./CartContext";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion, AnimatePresence } from "framer-motion";

export default function CartIcon({ hasDarkHero = false }) {
  const { items, removeItem, total } = useCart();
  const [open, setOpen] = useState(false);

  const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-lg transition-colors ${
          hasDarkHero
            ? "text-white hover:bg-white/10"
            : "text-[#1E3A32] hover:bg-[#1E3A32]/5"
        }`}
        aria-label="Shopping cart"
      >
        <ShoppingCart size={22} />
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#D8B46B] text-[#1E3A32] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {items.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-3 w-80 bg-white shadow-2xl border border-[#E4D9C4] z-50 rounded-sm"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4D9C4]">
                <span className="font-serif text-[#1E3A32] text-lg">
                  Your Cart {items.length > 0 && `(${items.length})`}
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="text-[#2B2725]/40 hover:text-[#1E3A32]"
                >
                  <X size={18} />
                </button>
              </div>

              {items.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <ShoppingCart size={32} className="text-[#D8B46B] mx-auto mb-3 opacity-40" />
                  <p className="text-[#2B2725]/60 text-sm">Your cart is empty</p>
                  <Link
                    to={createPageUrl("Shop")}
                    onClick={() => setOpen(false)}
                    className="mt-4 inline-block text-sm text-[#D8B46B] hover:underline"
                  >
                    Browse products →
                  </Link>
                </div>
              ) : (
                <>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E4D9C4]">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1E3A32] truncate">{item.name}</p>
                          <p className="text-xs text-[#2B2725]/60 mt-0.5">
                            {item.price ? formatPrice(item.price) : "Free"}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[#2B2725]/30 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="px-5 py-4 border-t border-[#E4D9C4]">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-[#2B2725]/70">Subtotal</span>
                      <span className="font-serif text-[#1E3A32] text-lg font-medium">
                        {formatPrice(total)}
                      </span>
                    </div>
                    <Link
                      to={createPageUrl("Cart")}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-colors"
                    >
                      Proceed to Checkout
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}