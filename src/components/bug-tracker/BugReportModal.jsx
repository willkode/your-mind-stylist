import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload, CheckCircle, Loader2, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import html2canvas from "html2canvas";

export default function BugReportModal({ onClose }) {
  const [description, setDescription] = useState("");
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [screenshotCaptured, setScreenshotCaptured] = useState(false);
  const [autoScreenshot, setAutoScreenshot] = useState(null);

  useEffect(() => {
    // Capture screenshot automatically when modal opens
    const captureScreenshot = async () => {
      try {
        // Hide the modal temporarily
        const modal = document.getElementById("bug-report-modal");
        if (modal) modal.style.display = "none";

        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(document.body, {
          allowTaint: true,
          useCORS: true,
          logging: false
        });

        // Show modal again
        if (modal) modal.style.display = "block";

        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], "screenshot.png", { type: "image/png" });
            setAutoScreenshot(file);
            setScreenshotCaptured(true);
          }
        });
      } catch (error) {
        console.error("Screenshot capture failed:", error);
        toast.error("Screenshot capture failed, but you can continue");
      }
    };

    captureScreenshot();
  }, []);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setAdditionalFiles(prev => [...prev, ...files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast.error("Please describe the bug");
      return;
    }

    setSubmitting(true);

    try {
      const user = await base44.auth.me();
      
      // Upload auto-captured screenshot
      let screenshotUrl = null;
      if (autoScreenshot) {
        const { data: uploadData } = await base44.integrations.Core.UploadFile({
          file: autoScreenshot
        });
        screenshotUrl = uploadData.file_url;
      }

      // Upload additional files
      const additionalUrls = [];
      for (const file of additionalFiles) {
        const { data: uploadData } = await base44.integrations.Core.UploadFile({
          file: file
        });
        additionalUrls.push(uploadData.file_url);
      }

      // Get browser info
      const browserInfo = `${navigator.userAgent} | Screen: ${window.screen.width}x${window.screen.height} | Viewport: ${window.innerWidth}x${window.innerHeight}`;

      // Submit bug report with AI analysis
      await base44.functions.invoke('submitBugReport', {
        description,
        reporter_email: user.email,
        reporter_name: user.full_name,
        page_url: window.location.href,
        screenshot_url: screenshotUrl,
        additional_screenshots: additionalUrls,
        browser_info: browserInfo
      });

      toast.success("Bug report submitted! We'll look into it.");
      onClose();
    } catch (error) {
      console.error("Failed to submit bug report:", error);
      toast.error("Failed to submit bug report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        id="bug-report-modal"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-[#E4D9C4]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D8B46B]/20 flex items-center justify-center">
                <Camera size={20} className="text-[#D8B46B]" />
              </div>
              <h2 className="font-serif text-2xl text-[#1E3A32]">Report a Bug</h2>
            </div>
            <button
              onClick={onClose}
              className="text-[#2B2725]/60 hover:text-[#2B2725] transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {screenshotCaptured && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">Screenshot captured and attached automatically!</p>
            <button
              onClick={() => setScreenshotCaptured(false)}
              className="ml-auto text-green-600 hover:text-green-700"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#1E3A32] mb-2">
              Describe the bug *
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What went wrong? What were you trying to do? What did you expect to happen?"
              rows={6}
              className="w-full resize-none"
              required
            />
            <p className="text-xs text-[#2B2725]/60 mt-2">
              Be as detailed as possible. Our AI will help structure your report.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E3A32] mb-2">
              Additional Screenshots or Screen Recording (Optional)
            </label>
            <div className="border-2 border-dashed border-[#E4D9C4] rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload size={32} className="text-[#D8B46B]" />
                <span className="text-sm text-[#2B2725]/70">
                  Upload More Files
                </span>
              </label>
              {additionalFiles.length > 0 && (
                <div className="mt-4 text-left">
                  <p className="text-sm font-medium text-[#1E3A32] mb-2">
                    {additionalFiles.length} file(s) selected:
                  </p>
                  <ul className="text-xs text-[#2B2725]/70 space-y-1">
                    {additionalFiles.map((file, idx) => (
                      <li key={idx}>• {file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#D8B46B] hover:bg-[#C9A55A] text-white"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Bug Report"
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}