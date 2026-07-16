import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Headphones, Play, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function formatDuration(seconds) {
  if (!seconds) return "";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export default function AudiobookLibrarySection({ userId, expanded, onToggle }) {
  // Fetch all published audiobooks
  const { data: audiobooks = [], isLoading } = useQuery({
    queryKey: ["publishedAudiobooks"],
    queryFn: () => base44.entities.Audiobook.filter({ status: "published" }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user's audiobook progress
  const { data: progressList = [] } = useQuery({
    queryKey: ["audiobookProgressAll", userId],
    queryFn: () => base44.entities.UserAudiobookProgress.filter({ user_id: userId }),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  // Check audiobook access via comprehensive backend function (batch)
  const { data: accessMap = {}, isLoading: loadingAccess } = useQuery({
    queryKey: ["audiobookAccess", userId, audiobooks.map(a => a.id).join(",")],
    queryFn: async () => {
      const ids = audiobooks.map(a => a.id);
      const result = await base44.functions.invoke("checkAudiobookAccess", {
        audiobook_ids: ids,
      });
      return result.data?.access || {};
    },
    enabled: audiobooks.length > 0 && !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Filter to only audiobooks the user has access to
  const accessibleAudiobooks = audiobooks.filter(ab => accessMap[ab.id]);

  if (isLoading || loadingAccess) return null;
  if (accessibleAudiobooks.length === 0) return null;

  return (
    <div className="mb-8">
      <button onClick={onToggle} className="w-full flex items-center justify-between mb-4 group">
        <div className="flex items-center gap-2">
          <Headphones size={20} className="text-[#6E4F7D]" />
          <h2 className="font-serif text-xl text-[#1E3A32]">Audiobooks</h2>
          <Badge className="bg-[#6E4F7D]/10 text-[#6E4F7D] text-xs ml-2">
            {accessibleAudiobooks.length}
          </Badge>
        </div>
        {expanded ? <ChevronUp className="text-[#D8B46B]" /> : <ChevronDown className="text-[#D8B46B]" />}
      </button>

      {expanded && (
        <>
          <p className="text-sm text-[#2B2725]/60 mb-4">
            Listen here directly, or download the audio file to listen on your preferred device.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accessibleAudiobooks.map((ab) => {
              const progress = progressList.find(p => p.audiobook_id === ab.id);
              const pct = progress && ab.total_duration_seconds
                ? Math.min(100, Math.round((progress.current_position_seconds / ab.total_duration_seconds) * 100))
                : 0;
              const isCompleted = progress?.completed;

              return (
                <Card key={ab.id} className="p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4 mb-3">
                    {ab.cover_image ? (
                      <img src={ab.cover_image} alt="" className="w-16 h-16 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded bg-[#6E4F7D]/10 flex items-center justify-center flex-shrink-0">
                        <Headphones size={24} className="text-[#6E4F7D]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-lg text-[#1E3A32] leading-tight mb-1">{ab.title}</h3>
                      {ab.author && <p className="text-xs text-[#2B2725]/50">by {ab.author}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {ab.total_duration_seconds && (
                          <span className="text-xs text-[#2B2725]/40">{formatDuration(ab.total_duration_seconds)}</span>
                        )}
                        {ab.chapters?.length > 0 && (
                          <span className="text-xs text-[#2B2725]/40">• {ab.chapters.length} chapters</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  {pct > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-[#2B2725]/60 mb-1">
                        <span>{isCompleted ? "Completed" : "Progress"}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: isCompleted ? "#A6B7A3" : "#6E4F7D" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link to={`/audiobook/${ab.slug}`} className="flex-1">
                      <Button className="w-full text-sm gap-2" style={{ backgroundColor: "#6E4F7D" }}>
                        <Play size={14} />
                        {pct > 0 && !isCompleted ? "Continue" : isCompleted ? "Listen Again" : "Listen"}
                      </Button>
                    </Link>
                    {(ab.download_url || ab.audio_url) && (
                      <a
                        href={ab.download_url || ab.audio_url}
                        download
                        className="flex-shrink-0"
                      >
                        <Button variant="outline" size="icon" className="border-[#E4D9C4] text-[#2B2725]/60 hover:text-[#1E3A32]">
                          <Download size={16} />
                        </Button>
                      </a>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}