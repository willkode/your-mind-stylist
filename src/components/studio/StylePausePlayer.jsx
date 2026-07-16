import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, RotateCcw, Check, Volume2 } from "lucide-react";
import StylePauseReflection from "./StylePauseReflection";

export default function StylePausePlayer({ pause, onClose, sourceContext, linkedCheckinId }) {
  const queryClient = useQueryClient();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showReflection, setShowReflection] = useState(false);
  const [completionId, setCompletionId] = useState(null);
  const audioRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const hasAudio = Boolean(pause.audio_url);

  // Create completion record on mount
  useEffect(() => {
    const createCompletion = async () => {
      const completion = await base44.entities.StylePauseCompletion.create({
        pause_id: pause.id,
        pause_title: pause.title,
        started_at: new Date().toISOString(),
        source_context: sourceContext,
        linked_checkin_id: linkedCheckinId
      });
      setCompletionId(completion.id);
    };
    createCompletion();
  }, []);

  // Auto-play audio if available
  useEffect(() => {
    if (hasAudio && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [hasAudio]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
    setCurrentTime(0);
    startTimeRef.current = Date.now();
  };

  const handleFinish = async () => {
    const durationListened = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    if (completionId) {
      await base44.entities.StylePauseCompletion.update(completionId, {
        completed_at: new Date().toISOString(),
        completion_status: "completed",
        duration_listened: durationListened
      });
    }
    
    setShowReflection(true);
  };

  const handleExit = async () => {
    const durationListened = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    if (completionId) {
      await base44.entities.StylePauseCompletion.update(completionId, {
        completed_at: new Date().toISOString(),
        completion_status: "exited",
        duration_listened: durationListened
      });
    }
    
    onClose();
  };

  const handleReflectionComplete = async (response) => {
    if (completionId && response) {
      await base44.entities.StylePauseCompletion.update(completionId, {
        reflection_response: response
      });
    }
    queryClient.invalidateQueries({ queryKey: ["style-pause-completions"] });
    onClose();
  };

  const categoryColors = {
    reset: "bg-blue-100 text-blue-800",
    restyle: "bg-purple-100 text-purple-800",
    interrupt: "bg-amber-100 text-amber-800",
    anchor: "bg-green-100 text-green-800"
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showReflection) {
    return <StylePauseReflection onComplete={handleReflectionComplete} />;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        onClick={handleExit}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-[#E4D9C4] p-6 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge className={categoryColors[pause.category]}>
                  {pause.category}
                </Badge>
                <span className="text-sm text-[#2B2725]/60">
                  {Math.floor(pause.duration_seconds / 60)} min
                </span>
              </div>
              <h2 className="font-serif text-2xl text-[#1E3A32]">{pause.title}</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={handleExit}>
              <X size={20} />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-sm text-[#2B2725]/60 mb-6 italic">
              You can stop anytime. Even one breath counts.
            </p>

            {/* Audio Player */}
            {hasAudio ? (
              <div className="space-y-6">
                <div className="bg-[#F9F5EF] rounded-lg p-8 flex items-center justify-center">
                  <Volume2 size={48} className="text-[#D8B46B]" />
                </div>

                <audio
                  ref={audioRef}
                  src={pause.audio_url}
                  onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                  onEnded={handleFinish}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                {/* Progress Bar */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max={pause.duration_seconds}
                    value={currentTime}
                    onChange={(e) => {
                      const newTime = parseFloat(e.target.value);
                      setCurrentTime(newTime);
                      if (audioRef.current) {
                        audioRef.current.currentTime = newTime;
                      }
                    }}
                    className="w-full h-2 bg-[#E4D9C4] rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #D8B46B ${(currentTime / pause.duration_seconds) * 100}%, #E4D9C4 ${(currentTime / pause.duration_seconds) * 100}%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-[#2B2725]/60">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(pause.duration_seconds)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRestart}
                    className="rounded-full w-12 h-12"
                  >
                    <RotateCcw size={20} />
                  </Button>
                  
                  <Button
                    size="icon"
                    onClick={handlePlayPause}
                    className="rounded-full w-16 h-16 bg-[#D8B46B] hover:bg-[#C9A55A]"
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleFinish}
                    className="rounded-full w-12 h-12"
                  >
                    <Check size={20} />
                  </Button>
                </div>
              </div>
            ) : (
              /* Text Mode */
              <div className="space-y-6">
                <div className="prose prose-lg max-w-none">
                  <div className="text-[#2B2725] leading-relaxed whitespace-pre-wrap">
                    {pause.script_text}
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-[#E4D9C4]">
                  <Button variant="outline" onClick={handleRestart} className="flex-1">
                    <RotateCcw size={16} className="mr-2" />
                    Read Again
                  </Button>
                  <Button onClick={handleFinish} className="flex-1 bg-[#1E3A32] hover:bg-[#2B2725]">
                    <Check size={16} className="mr-2" />
                    Finish Pause
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}