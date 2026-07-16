import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Download, Copy, Share2, Check } from "lucide-react";
import html2canvas from "html2canvas";

export default function ShareAchievement({ milestone, onClose }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const element = document.getElementById('achievement-card');
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2
      });
      
      const link = document.createElement('a');
      link.download = `milestone-${milestone.milestone_key}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    }
    setDownloading(false);
  };

  const handleCopyLink = () => {
    const shareText = `🎉 I just achieved "${milestone.milestone_name}" with Your Mind Stylist! Every small step forward is a win. #PersonalGrowth #MindStyling`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#E4D9C4] flex items-center justify-between">
          <h2 className="font-serif text-2xl text-[#1E3A32]">Share Your Achievement</h2>
          <button onClick={onClose} className="text-[#2B2725]/60 hover:text-[#2B2725]">
            <X size={24} />
          </button>
        </div>

        {/* Achievement Card Preview */}
        <div className="p-8">
          <div
            id="achievement-card"
            className="bg-gradient-to-br from-[#1E3A32] via-[#2B4A40] to-[#1E3A32] p-8 rounded-xl text-white relative overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D8B46B] opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#D8B46B] opacity-10 rounded-full -ml-12 -mb-12"></div>

            {/* Content */}
            <div className="relative z-10 text-center">
              <div className="text-6xl mb-6">{milestone.icon}</div>
              <h3 className="font-serif text-3xl mb-3">{milestone.milestone_name}</h3>
              <p className="text-white/80 text-lg mb-6 max-w-md mx-auto">
                {milestone.milestone_description}
              </p>
              {milestone.points_awarded > 0 && (
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#D8B46B]/20 rounded-full">
                  <span className="text-[#D8B46B] text-2xl font-bold">
                    +{milestone.points_awarded}
                  </span>
                  <span className="text-white/80 text-sm">Depth Points</span>
                </div>
              )}
              <div className="mt-8 pt-6 border-t border-white/20">
                <p className="text-white/60 text-sm">
                  Your Mind Stylist • Personal Transformation
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-[#F9F5EF] rounded-b-xl flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 bg-[#1E3A32] hover:bg-[#2B2725]"
          >
            <Download size={18} className="mr-2" />
            {downloading ? "Downloading..." : "Download Image"}
          </Button>
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="flex-1 border-[#1E3A32] text-[#1E3A32]"
          >
            {copied ? (
              <>
                <Check size={18} className="mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={18} className="mr-2" />
                Copy Share Text
              </>
            )}
          </Button>
        </div>

        <div className="px-6 pb-6">
          <p className="text-xs text-[#2B2725]/50 text-center">
            Share your wins with the world or keep them private—the choice is yours.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}