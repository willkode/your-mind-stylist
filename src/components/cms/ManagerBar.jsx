import React, { useState } from "react";
import { useEditMode } from "./EditModeProvider";
import { Eye, Edit3, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function ManagerBar() {
  const { isEditMode, setIsEditMode, isManager } = useEditMode();
  const [hasUnsaved, setHasUnsaved] = useState(false);

  if (!isManager) return null;

  // Show minimal button when in View Mode
  if (!isEditMode) {
    return (
      <div className="fixed bottom-24 right-6 lg:bottom-6 lg:right-24 z-[60]">
        <Button
          size="sm"
          onClick={() => setIsEditMode(true)}
          className="bg-[#D8B46B] text-[#1E3A32] hover:bg-[#1E3A32] hover:text-white shadow-lg"
        >
          <Edit3 size={16} className="mr-2" />
          Edit Page
        </Button>
      </div>
    );
  }

  // Show full banner when in Manager Mode
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-[60] bg-[#1E3A32] text-white shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-medium text-sm">Manager Mode</span>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#D8B46B] animate-pulse" />
              <span className="text-sm text-white/90">You're Editing This Page</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasUnsaved && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                <Save size={16} className="mr-2" />
                Save All
              </Button>
            )}
            
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsEditMode(false)}
            >
              <X size={16} className="mr-2" />
              Exit Edit Mode
            </Button>
          </div>
        </div>

        <div className="bg-[#D8B46B]/20 px-6 py-2 border-t border-white/10">
          <p className="text-xs text-white/80">
            Click any highlighted area to edit its text.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}