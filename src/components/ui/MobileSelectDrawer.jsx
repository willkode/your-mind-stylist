import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MobileSelectDrawer({ 
  isOpen, 
  onClose, 
  options = [], 
  value, 
  onSelect, 
  title = "Select an option",
  placeholder = "Choose..."
}) {
  const handleSelect = (optionValue) => {
    onSelect(optionValue);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-50 lg:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto lg:hidden"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="font-medium text-[#1E3A32]">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-[#2B2725]" />
              </button>
            </div>

            <div className="p-4">
              {options.map((option) => {
                const isSelected = value === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center justify-between p-4 mb-2 rounded-lg transition-colors ${
                      isSelected
                        ? "bg-[#D8B46B]/20 border border-[#D8B46B]"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <span className={`text-left ${isSelected ? "font-medium text-[#1E3A32]" : "text-[#2B2725]"}`}>
                      {option.label}
                    </span>
                    {isSelected && <Check size={18} className="text-[#D8B46B]" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}