import React, { useRef, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import PlaybackControls from "./PlaybackControls";
import ProgressBar from "./ProgressBar";
import ChapterList from "./ChapterList";
import DownloadSection from "./DownloadSection";

export default function AudiobookPlayer({ audiobook, userProgress, onProgressSaved }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(userProgress?.current_position_seconds || 0);
  const [duration, setDuration] = useState(audiobook.total_duration_seconds || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState(userProgress?.playback_speed || 1);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(userProgress?.current_chapter_index || 0);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  const lastSaveRef = useRef(0);

  const chapters = audiobook.chapters || [];

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async (data) => {
      if (userProgress?.id) {
        await base44.entities.UserAudiobookProgress.update(userProgress.id, data);
      } else {
        const user = await base44.auth.me();
        await base44.entities.UserAudiobookProgress.create({
          user_id: user.id,
          audiobook_id: audiobook.id,
          ...data,
        });
      }
    },
    onSuccess: () => onProgressSaved?.(),
  });

  // Determine current chapter based on position
  const getCurrentChapter = useCallback((time) => {
    if (!chapters.length) return 0;
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (time >= chapters[i].start_seconds) return i;
    }
    return 0;
  }, [chapters]);

  // Save progress periodically (every 10 seconds of playback)
  const saveProgress = useCallback((time, force = false) => {
    const now = Date.now();
    if (!force && now - lastSaveRef.current < 10000) return;
    lastSaveRef.current = now;

    const chapterIdx = getCurrentChapter(time);
    saveProgressMutation.mutate({
      current_position_seconds: Math.floor(time),
      current_chapter_index: chapterIdx,
      playback_speed: playbackSpeed,
      last_played: new Date().toISOString(),
      completed: duration > 0 && time >= duration - 5,
      completed_date: duration > 0 && time >= duration - 5 ? new Date().toISOString() : undefined,
    });
  }, [playbackSpeed, duration, getCurrentChapter, saveProgressMutation]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      const t = audio.currentTime;
      setCurrentTime(t);
      setCurrentChapterIndex(getCurrentChapter(t));
      saveProgress(t);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      // Resume from saved position
      if (!hasLoadedInitial && userProgress?.current_position_seconds > 0) {
        audio.currentTime = userProgress.current_position_seconds;
        setHasLoadedInitial(true);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      saveProgress(audio.duration, true);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      setIsPlaying(false);
      saveProgress(audio.currentTime, true);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [userProgress, hasLoadedInitial, getCurrentChapter, saveProgress]);

  // Playback speed
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  // Media Session API for lock-screen controls
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: audiobook.title,
      artist: audiobook.narrator || audiobook.author || "Your Mind Stylist",
      album: audiobook.author || "Audiobook",
      artwork: audiobook.cover_image ? [{ src: audiobook.cover_image, sizes: "512x512", type: "image/png" }] : [],
    });

    navigator.mediaSession.setActionHandler("play", () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler("seekbackward", () => skip(-15));
    navigator.mediaSession.setActionHandler("seekforward", () => skip(30));
    navigator.mediaSession.setActionHandler("previoustrack", () => jumpToChapter(Math.max(0, currentChapterIndex - 1)));
    navigator.mediaSession.setActionHandler("nexttrack", () => jumpToChapter(Math.min(chapters.length - 1, currentChapterIndex + 1)));

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("seekbackward", null);
      navigator.mediaSession.setActionHandler("seekforward", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
    };
  }, [audiobook, currentChapterIndex, chapters.length]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const skip = (seconds) => {
    const audio = audioRef.current;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + seconds));
  };

  const handleSeek = (time) => {
    const audio = audioRef.current;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const jumpToChapter = (index) => {
    if (!chapters[index]) return;
    const audio = audioRef.current;
    audio.currentTime = chapters[index].start_seconds;
    setCurrentTime(chapters[index].start_seconds);
    setCurrentChapterIndex(index);
    if (!isPlaying) audio.play();
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audiobook.audio_url} preload="metadata" crossOrigin="anonymous" />

      {/* Cover & Info */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {audiobook.cover_image && (
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <img
              src={audiobook.cover_image}
              alt={audiobook.title}
              className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}
        <div className="flex-1 text-center md:text-left">
          <h1 className="font-serif text-2xl md:text-3xl text-[#1E3A32] mb-2">{audiobook.title}</h1>
          {audiobook.author && (
            <p className="text-[#2B2725]/60 text-sm mb-1">by {audiobook.author}</p>
          )}
          {audiobook.narrator && (
            <p className="text-[#2B2725]/50 text-xs mb-3">Narrated by {audiobook.narrator}</p>
          )}
          {userProgress?.current_position_seconds > 0 && !userProgress?.completed && (
            <p className="text-xs text-[#D8B46B] font-medium">
              ▶ Resuming where you left off
            </p>
          )}
          {userProgress?.completed && (
            <p className="text-xs text-[#A6B7A3] font-medium">✓ Completed</p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
      />

      {/* Controls */}
      <div className="mb-8 mt-4">
        <PlaybackControls
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onSkip={skip}
          playbackSpeed={playbackSpeed}
          onSpeedChange={handleSpeedChange}
        />
      </div>

      {/* Chapters */}
      {chapters.length > 0 && (
        <div className="mb-6">
          <ChapterList
            chapters={chapters}
            currentChapterIndex={currentChapterIndex}
            currentPositionSeconds={currentTime}
            onChapterSelect={jumpToChapter}
          />
        </div>
      )}

      {/* Download */}
      <DownloadSection audiobook={audiobook} />
    </div>
  );
}