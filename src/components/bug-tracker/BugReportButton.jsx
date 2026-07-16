import React, { useState } from "react";
import { Bug } from "lucide-react";
import BugReportModal from "./BugReportModal";
import { motion, AnimatePresence } from "framer-motion";

export default function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="hidden lg:flex fixed right-6 bottom-6 z-[8888] w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#D8B46B] hover:bg-[#C9A55A] text-white shadow-lg items-center justify-center transition-colors"
        title="Report a Bug"
      >
        <Bug size={20} className="w-5 h-5 lg:w-6 lg:h-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && <BugReportModal onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
    </>
  );
}