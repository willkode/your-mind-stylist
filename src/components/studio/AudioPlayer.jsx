import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function AudioPlayer({ session, onClose, userSession }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const queryClient = useQueryClient();

  const trackProgressMutation = useMutation({
    mutationFn: async ({ progress, completed }) => {
      if (userSession) {
        await base44.entities.UserAudioSession.update(userSession.id, {
          progress,
          completed,
          last_played: new Date().toISOString(),
        });
      } else {
        await base44.entities.UserAudioSession.create({
          audio_session_id: session.id,
          progress,
          completed,
          last_played: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAudioSessions'] });
    },
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      const progress = (audio.currentTime / audio.duration) * 100;
      
      // Track progress every 10%
      if (progress % 10 < 1) {
        trackProgressMutation.mutate({
          progress: Math.floor(progress),
          completed: false,
        });
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = async () => {
      setIsPlaying(false);
      trackProgressMutation.mutate({
        progress: 100,
        completed: true,
      });
      
      // Track as momentum event
      await base44.functions.invoke('trackEvent', {
        event_type: 'session_completed',
        points: 1,
        metadata: { session_id: session.id, title: session.title }
      });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [session, userSession]);

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg max-w-2xl w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#2B2725]/40 hover:text-[#2B2725]"
        >
          <X size={24} />
        </button>

        {/* Cover Image */}
        {session.cover_image && (
          <div 
            className="w-full h-64 bg-cover bg-center rounded-lg mb-6"
            style={{ backgroundImage: `url(${session.cover_image})` }}
          />
        )}

        {/* Title & Category */}
        <div className="mb-6">
          <span className="text-xs text-[#A6B7A3] uppercase tracking-wider">{session.category}</span>
          <h2 className="font-serif text-2xl md:text-3xl text-[#1E3A32] mb-2">{session.title}</h2>
          <div 
            className="text-sm text-[#2B2725]/70"
            dangerouslySetInnerHTML={{ __html: session.description || '' }}
          />
        </div>

        {/* Audio Element */}
        <audio ref={audioRef} src={session.audio_url} preload="metadata" />

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
      </motion.div>
    </motion.div>
  );
}