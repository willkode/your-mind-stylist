import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function VideoEmbedPreview({ embedUrl, onClose }) {
  const isValidEmbed = embedUrl && (embedUrl.includes("youtube.com") || embedUrl.includes("vimeo.com"));

  return (
    <Dialog open={!!embedUrl} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Video Preview</DialogTitle>
        </DialogHeader>
        {isValidEmbed ? (
          <div className="w-full bg-black rounded-lg overflow-hidden aspect-video">
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Invalid embed URL</p>
              <p className="text-sm text-yellow-700 mt-1">
                Use YouTube embed URLs (youtube.com/embed/...) or Vimeo embed URLs (player.vimeo.com/video/...)
              </p>
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}