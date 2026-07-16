import React from "react";
import { Play, Pause, SkipBack, SkipForward, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

export default function PlaybackControls({
  isPlaying,
  onTogglePlay,
  onSkip,
  playbackSpeed,
  onSpeedChange,
}) {
  return (
    <div className="flex items-center justify-center gap-4 md:gap-6">
      {/* Skip Back */}
      <button
        onClick={() => onSkip(-15)}
        className="text-[#2B2725]/60 hover:text-[#1E3A32] transition-colors relative"
        aria-label="Skip back 15 seconds"
      >
        <SkipBack size={24} />
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-[#2B2725]/40">15s</span>
      </button>

      {/* Play/Pause */}
      <button
        onClick={onTogglePlay}
        className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#1E3A32] text-white flex items-center justify-center hover:bg-[#2B2725] transition-colors shadow-lg"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
      </button>

      {/* Skip Forward */}
      <button
        onClick={() => onSkip(30)}
        className="text-[#2B2725]/60 hover:text-[#1E3A32] transition-colors relative"
        aria-label="Skip forward 30 seconds"
      >
        <SkipForward size={24} />
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-[#2B2725]/40">30s</span>
      </button>

      {/* Speed Control */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="ml-2 border-[#E4D9C4] text-[#2B2725]/70 text-xs font-medium min-w-[52px]"
          >
            {playbackSpeed}x
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {SPEED_OPTIONS.map((speed) => (
            <DropdownMenuItem
              key={speed}
              onClick={() => onSpeedChange(speed)}
              className={speed === playbackSpeed ? "bg-[#1E3A32]/10 font-medium" : ""}
            >
              {speed}x {speed === 1 ? "(Normal)" : speed < 1 ? "(Slower)" : ""}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}