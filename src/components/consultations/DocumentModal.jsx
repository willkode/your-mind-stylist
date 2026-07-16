import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { X, Download, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocumentModal({ isOpen, onClose, title, url }) {
  const [iframeError, setIframeError] = useState(false);

  const handleOpen = () => {
    setIframeError(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); setIframeError(false); } }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="bg-white border-b border-[#E4D9C4] p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[#1E3A32] font-serif text-xl">{title}</DialogTitle>
            <div className="flex items-center gap-2">
              {url && (
                <>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-[#D8B46B] text-[#1E3A32] hover:bg-[#D8B46B]/10">
                      <ExternalLink size={14} className="mr-1" />
                      Open in Tab
                    </Button>
                  </a>
                  <a href={url} download>
                    <Button variant="outline" size="sm" className="border-[#D8B46B] text-[#1E3A32] hover:bg-[#D8B46B]/10">
                      <Download size={14} className="mr-1" />
                      Download
                    </Button>
                  </a>
                </>
              )}
              <DialogClose asChild>
                <button className="p-2 hover:bg-[#F9F5EF] rounded transition-colors ml-2">
                  <X size={20} className="text-[#1E3A32]" />
                </button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-[60vh]">
          {!url ? (
            <div className="flex items-center justify-center h-full p-8 text-center">
              <p className="text-[#2B2725]/60">Document URL not configured. Please add the link in the CMS.</p>
            </div>
          ) : iframeError ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
              <AlertCircle className="text-[#D8B46B]" size={40} />
              <p className="text-[#2B2725]">This document can't be previewed here.</p>
              <div className="flex gap-3">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-[#1E3A32] text-[#F9F5EF] hover:bg-[#2B2725]">
                    <ExternalLink size={16} className="mr-2" />
                    Open in New Tab
                  </Button>
                </a>
                <a href={url} download>
                  <Button variant="outline" className="border-[#D8B46B] text-[#1E3A32]">
                    <Download size={16} className="mr-2" />
                    Download
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <iframe
              key={url}
              src={url}
              className="w-full h-full"
              style={{ minHeight: "60vh", border: "none" }}
              title={title}
              onLoad={handleOpen}
              onError={() => setIframeError(true)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}