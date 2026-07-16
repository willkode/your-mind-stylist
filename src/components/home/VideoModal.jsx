import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import VideoEmbed from "../cms/VideoEmbed";

export default function VideoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative w-full max-w-5xl aspect-video bg-black"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors z-10"
          >
            <X size={32} />
          </button>

          <div className="w-full h-full">
            <VideoEmbed
              contentKey="home.hero.welcome_video_embed"
              page="Home"
              blockTitle="Hero Video (Paste Vimeo or YouTube URL)"
              fallback="https://vimeo.com/1153707003/70226bd374"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}