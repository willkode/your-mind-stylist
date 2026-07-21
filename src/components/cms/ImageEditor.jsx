import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { useEditMode } from "./EditModeProvider";

export default function ImageEditor({
  contentKey,
  blockTitle,
  page,
  initialContent,
  block,
  onClose,
}) {
  const queryClient = useQueryClient();
  const { user } = useEditMode();
  const [imageUrl, setImageUrl] = useState(initialContent);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } finally {
      setIsUploading(false);
    }
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (block) {
        await base44.entities.CmsRevision.create({
          content_key: contentKey,
          content: block.content,
          edited_by: user.email,
          action: "updated",
        });
        await base44.entities.CmsContent.update(block.id, {
          content: imageUrl,
          is_draft: false,
          draft_content: null,
        });
      } else {
        await base44.entities.CmsContent.create({
          key: contentKey,
          page: page || "unknown",
          block_title: blockTitle,
          content: imageUrl,
          content_type: "image",
        });
        await base44.entities.CmsRevision.create({
          content_key: contentKey,
          content: imageUrl,
          edited_by: user.email,
          action: "created",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-content-all"] });
      onClose();
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-serif text-[#1E3A32]">Editing: {blockTitle}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <div className="p-6">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full rounded-lg mb-4 max-h-64 object-contain bg-gray-50" />
          ) : (
            <div className="w-full h-40 rounded-lg mb-4 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
              No image selected
            </div>
          )}
          <label className="block">
            <span className="sr-only">Choose image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[#1E3A32] file:text-white hover:file:bg-[#2B2725]"
            />
          </label>
          {isUploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending || isUploading || !imageUrl}
            className="bg-[#1E3A32] hover:bg-[#2B2725]"
          >
            <Upload size={16} className="mr-2" />
            Publish Changes
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}