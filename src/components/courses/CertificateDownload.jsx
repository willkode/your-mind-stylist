import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Award, Download, Share2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function CertificateDownload({ courseId, courseName, completionDate }) {
  const [generating, setGenerating] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState(null);
  const [certificateId, setCertificateId] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateCourseCertificate', {
        course_id: courseId
      });

      if (response.data.success) {
        setCertificateUrl(response.data.download_url);
        setCertificateId(response.data.certificate_id);
        
        // Celebrate!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Failed to generate certificate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (certificateUrl) {
      window.open(certificateUrl, '_blank');
    }
  };

  const handleShare = () => {
    if (navigator.share && certificateId) {
      navigator.share({
        title: `Certificate of Completion - ${courseName}`,
        text: `I've completed ${courseName}! Certificate ID: ${certificateId}`,
        url: window.location.href
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-[#D8B46B]/20 to-[#A6B7A3]/20 p-8 rounded-lg text-center"
    >
      <div className="flex justify-center mb-4">
        <Award size={64} className="text-[#D8B46B]" />
      </div>
      
      <h2 className="font-serif text-3xl text-[#1E3A32] mb-3">
        Congratulations!
      </h2>
      
      <p className="text-[#2B2725]/80 mb-2">
        You've completed <strong>{courseName}</strong>
      </p>
      
      {completionDate && (
        <p className="text-sm text-[#2B2725]/60 mb-6">
          Completed on {new Date(completionDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      )}

      {!certificateUrl ? (
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
        >
          {generating ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Generating Certificate...
            </>
          ) : (
            <>
              <Award size={16} className="mr-2" />
              Generate Certificate
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[#A6B7A3] font-medium">
            ✓ Certificate Generated
          </p>
          {certificateId && (
            <p className="text-xs text-[#2B2725]/60 mb-3">
              Certificate ID: {certificateId}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleDownload}
              className="bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              <Download size={16} className="mr-2" />
              Download
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
            >
              <Share2 size={16} className="mr-2" />
              Share
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}