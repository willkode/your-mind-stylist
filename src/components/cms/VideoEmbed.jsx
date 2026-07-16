import React, { useState } from "react";
import { useCmsText } from "./useCmsText";
import { useEditMode } from "./EditModeProvider";
import { Pencil } from "lucide-react";
import InlineEditor from "./InlineEditor";

export default function VideoEmbed({ contentKey, fallback, page, blockTitle }) {
  const { content, block } = useCmsText(contentKey, fallback);
  const { isEditMode, isManager } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  
  const getVideoEmbedUrl = (url) => {
    // If input contains an iframe tag, extract the src attribute
    const iframeSrc = url.match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1];
    if (iframeSrc) {
      // If src is already a player embed URL, use it directly
      if (iframeSrc.includes('player.vimeo.com') || iframeSrc.includes('youtube.com/embed')) {
        return iframeSrc.replace(/&amp;/g, '&');
      }
      // Otherwise, process the extracted src as a normal URL
      return getVideoEmbedUrl(iframeSrc.replace(/&amp;/g, '&'));
    }

    // YouTube
    const ytId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
    if (ytId) return `https://www.youtube.com/embed/${ytId}`;
    
    // If it's already a player embed URL, return as is
    if (url.includes('player.vimeo.com/video/') || url.includes('youtube.com/embed')) {
      return url;
    }

    // Vimeo - handle full URLs and privacy hashes
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)(?:\/([a-f0-9]+))?/);
    if (vimeoMatch) {
      const videoId = vimeoMatch[1];
      const pathHash = vimeoMatch[2];
      const queryHash = url.match(/[?&]h=([a-f0-9]+)/)?.[1];
      const hash = pathHash || queryHash;
      const base = `https://player.vimeo.com/video/${videoId}`;
      const params = hash
        ? `?h=${hash}&badge=0&autopause=0&player_id=0&app_id=58479`
        : `?badge=0&autopause=0&player_id=0&app_id=58479`;
      return base + params;
    }
    
    return null;
  };

  // Strip HTML tags in case CMS wraps the URL in <p> or <a> tags
  const rawContent = content ? content.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").trim() : "";
  const embedUrl = getVideoEmbedUrl(rawContent);

  if (!embedUrl) {
    if (isManager && isEditMode) {
      return (
        <>
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-[#D8B46B]/10 transition-colors group relative"
            onClick={() => setIsEditing(true)}
          >
            <div className="text-center">
              <Pencil size={32} className="text-[#D8B46B] mb-2 mx-auto" />
              <p className="text-[#F9F5EF] text-sm">Click to add video URL</p>
              <p className="text-[#F9F5EF]/60 text-xs mt-1">Paste Vimeo or YouTube URL</p>
            </div>
          </div>
          {isEditing && (
            <InlineEditor
              contentKey={contentKey}
              blockTitle={blockTitle}
              page={page}
              initialContent={content}
              contentType="short_text"
              block={block}
              onClose={() => setIsEditing(false)}
            />
          )}
        </>
      );
    }
    return <div className="text-center text-[#2B2725]/60">Invalid video URL</div>;
  }

  return (
    <>
      <div className={`relative w-full h-full ${isManager && isEditMode ? 'group cursor-pointer' : ''}`}>
        <iframe
          width="100%"
          height="100%"
          src={embedUrl}
          title="Video"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="w-full h-full"
        />
        {isManager && isEditMode && (
          <div 
            className="absolute inset-0 z-10 flex items-start justify-end p-4 cursor-pointer hover:bg-black/10 transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <div className="bg-[#D8B46B] text-white px-3 py-2 text-xs flex items-center gap-2 rounded shadow-lg">
              <Pencil size={14} />
              <span>Edit Video</span>
            </div>
          </div>
        )}
      </div>
      {isEditing && (
        <InlineEditor
          contentKey={contentKey}
          blockTitle={blockTitle}
          page={page}
          initialContent={content}
          contentType="short_text"
          block={block}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
}