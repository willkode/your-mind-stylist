import React, { useRef } from "react";

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function ProgressBar({ currentTime, duration, onSeek }) {
  const barRef = useRef(null);

  const handleClick = (e) => {
    const rect = barRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    onSeek(pct * duration);
  };

  const handleTouch = (e) => {
    const rect = barRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    onSeek(pct * duration);
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full mb-2">
      {/* Seekable bar */}
      <div
        ref={barRef}
        className="w-full h-3 bg-[#E4D9C4] rounded-full cursor-pointer relative overflow-hidden group"
        onClick={handleClick}
        onTouchMove={handleTouch}
        role="slider"
        aria-label="Audio progress"
        aria-valuenow={Math.floor(currentTime)}
        aria-valuemin={0}
        aria-valuemax={Math.floor(duration)}
      >
        <div
          className="h-full bg-[#D8B46B] transition-[width] duration-200 rounded-full"
          style={{ width: `${pct}%` }}
        />
        {/* Thumb indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#1E3A32] rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>

      {/* Time display */}
      <div className="flex justify-between text-xs text-[#2B2725]/50 mt-1.5">
        <span>{formatTime(currentTime)}</span>
        <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
      </div>
    </div>
  );
}