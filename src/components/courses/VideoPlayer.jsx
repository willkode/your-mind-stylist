import React, { useRef, useEffect } from "react";

export default function VideoPlayer({ src, embedUrl, onProgressUpdate, lastPosition = 0 }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set initial position
    if (lastPosition > 0) {
      video.currentTime = lastPosition;
    }

    // Track progress every 5 seconds
    const handleTimeUpdate = () => {
      onProgressUpdate?.(video.currentTime);
    };

    const interval = setInterval(() => {
      if (!video.paused) {
        handleTimeUpdate();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [lastPosition, onProgressUpdate]);

  // Convert various video URLs to embed format
  const getEmbedUrl = (url) => {
    if (!url) return null;

    // Already an embed URL
    if (url.includes('/embed/') || url.includes('player.vimeo.com') || url.includes('youtube.com/embed')) {
      return url;
    }

    // Vimeo: https://vimeo.com/123456789 or /123456789/hash or with ?h=hash
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)(?:\/([a-f0-9]+))?/);
    if (vimeoMatch) {
      const videoId = vimeoMatch[1];
      // Preserve privacy hash from path (/ID/HASH) or query (?h=HASH)
      const pathHash = vimeoMatch[2];
      const queryHash = url.match(/[?&]h=([a-f0-9]+)/)?.[1];
      const hash = pathHash || queryHash;
      return hash
        ? `https://player.vimeo.com/video/${videoId}?h=${hash}`
        : `https://player.vimeo.com/video/${videoId}`;
    }

    // YouTube: https://www.youtube.com/watch?v=ABC123 -> https://www.youtube.com/embed/ABC123
    const youtubeMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // YouTube short: https://youtu.be/ABC123 -> https://www.youtube.com/embed/ABC123
    const youtubeShortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (youtubeShortMatch) {
      return `https://www.youtube.com/embed/${youtubeShortMatch[1]}`;
    }

    // If no match, return original URL
    return url;
  };

  if (embedUrl) {
    const finalEmbedUrl = getEmbedUrl(embedUrl);
    // Add download protection parameters to embed URLs
    let protectedUrl = finalEmbedUrl;
    
    // Vimeo: Add parameters to prevent download
    if (protectedUrl.includes('player.vimeo.com')) {
      const separator = protectedUrl.includes('?') ? '&' : '?';
      protectedUrl += `${separator}download=0&byline=0&portrait=0`;
    }
    
    // YouTube: Add parameters to prevent download (rel=0 to reduce related videos)
    if (protectedUrl.includes('youtube.com/embed')) {
      const separator = protectedUrl.includes('?') ? '&' : '?';
      protectedUrl += `${separator}rel=0&modestbranding=1`;
    }
    
    return (
      <div className="aspect-video">
        <iframe
          src={protectedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ pointerEvents: 'auto' }}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
    );
  }

  if (src) {
    return (
      <video
        ref={videoRef}
        controls
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        className="w-full"
        src={src}
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  return (
    <div className="aspect-video flex items-center justify-center bg-black text-white">
      Video content coming soon
    </div>
  );
}