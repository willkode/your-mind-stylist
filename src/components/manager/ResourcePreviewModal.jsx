import React from "react";
import { Button } from "@/components/ui/button";
import { X, Download, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function ResourcePreviewModal({ resource, onClose }) {
  const renderPreview = () => {
    if (resource.resource_type === "worksheet" || resource.file_url?.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
      return (
        <img
          src={resource.file_url}
          alt={resource.title}
          className="max-w-full max-h-[600px] mx-auto"
        />
      );
    }

    if (resource.resource_type === "pdf") {
      return (
        <iframe
          src={resource.file_url}
          className="w-full h-[600px] border-0"
          title={resource.title}
        />
      );
    }

    if (resource.resource_type === "video") {
      return (
        <video
          controls
          className="max-w-full max-h-[600px] mx-auto"
          src={resource.file_url}
        >
          Your browser does not support video playback.
        </video>
      );
    }

    if (resource.resource_type === "audio") {
      return (
        <div className="p-12 text-center">
          <audio controls className="w-full max-w-md mx-auto" src={resource.file_url}>
            Your browser does not support audio playback.
          </audio>
        </div>
      );
    }

    return (
      <div className="p-12 text-center">
        <p className="text-[#2B2725]/70 mb-4">
          Preview not available for this file type
        </p>
        <Button asChild>
          <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={16} className="mr-2" />
            Open in New Tab
          </a>
        </Button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-6 flex items-start justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg max-w-5xl w-full my-8"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <h2 className="font-serif text-2xl text-[#1E3A32] mb-1">
                {resource.title}
              </h2>
              {resource.description && (
                <p className="text-sm text-[#2B2725]/70">{resource.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={resource.file_url} download>
                  <Download size={16} className="mr-2" />
                  Download
                </a>
              </Button>
              <button
                onClick={onClose}
                className="text-[#2B2725]/40 hover:text-[#2B2725] p-2"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Preview Area */}
          <div className="p-6 bg-[#F9F5EF] min-h-[400px] flex items-center justify-center">
            {renderPreview()}
          </div>
        </motion.div>
      </div>
    </div>
  );
}