import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

export default function CourseAudioPlayer({ src, onProgressUpdate, lastPosition = 0 }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set initial position
    if (lastPosition > 0) {
      audio.currentTime = lastPosition;
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Save progress every 5 seconds
    const interval = setInterval(() => {
      if (!audio.paused) {
        onProgressUpdate?.(audio.currentTime);
      }
    }, 5000);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      clearInterval(interval);
    };
  }, [lastPosition, onProgressUpdate]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skip = (seconds) => {
    const audio = audioRef.current;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audio.currentTime = percentage * audio.duration;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Progress Bar */}
      <div 
        className="w-full h-2 bg-[#E4D9C4] rounded-full mb-4 cursor-pointer relative overflow-hidden"
        onClick={handleSeek}
      >
        <div 
          className="h-full bg-[#D8B46B] transition-all"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </div>

      {/* Time Display */}
      <div className="flex justify-between text-sm text-[#2B2725]/60 mb-6">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => skip(-15)}
          className="text-[#2B2725]/60 hover:text-[#1E3A32] transition-colors"
        >
          <SkipBack size={24} />
        </button>

        <button
          onClick={togglePlayPause}
          className="w-16 h-16 rounded-full bg-[#1E3A32] text-white flex items-center justify-center hover:bg-[#2B2725] transition-colors"
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
        </button>

        <button
          onClick={() => skip(15)}
          className="text-[#2B2725]/60 hover:text-[#1E3A32] transition-colors"
        >
          <SkipForward size={24} />
        </button>
      </div>
    </div>
  );
}