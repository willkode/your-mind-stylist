import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { useCmsText } from "@/components/cms/useCmsText";
import { useEditMode } from "@/components/cms/EditModeProvider";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Loader2 } from "lucide-react";

const AUDIO_KEY = "dashboard.announcements.audio";

export default function AnnouncementAudio() {
  const { content: audioUrl, block } = useCmsText(AUDIO_KEY, "");
  const { isEditMode, isManager } = useEditMode();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const saveUrl = async (url) => {
    if (block) {
      await base44.entities.CmsContent.update(block.id, { content: url });
    } else {
      await base44.entities.CmsContent.create({
        key: AUDIO_KEY,
        page: "Dashboard",
        block_title: "Dashboard Announcement Audio",
        content: url,
        content_type: "short_text",
      });
    }
    queryClient.invalidateQueries({ queryKey: ["cms-content"] });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await saveUrl(file_url);
    setUploading(false);
    e.target.value = "";
  };

  const canEdit = isManager && isEditMode;
  if (!audioUrl && !canEdit) return null;

  return (
    <div className="mt-4">
      {audioUrl && (
        <audio controls src={audioUrl} className="w-full">
          Your browser does not support audio playback.
        </audio>
      )}
      {canEdit && (
        <div className="flex items-center gap-2 mt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Upload size={14} className="mr-2" />}
            {audioUrl ? "Replace Audio" : "Add Audio Recording"}
          </Button>
          {audioUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => saveUrl("")}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 size={14} className="mr-2" />
              Remove
            </Button>
          )}
        </div>
      )}
    </div>
  );
}