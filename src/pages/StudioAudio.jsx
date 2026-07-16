import React, { useState } from "react";
import { motion } from "framer-motion";
import { Play, Heart, Filter, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AudioPlayer from "@/components/studio/AudioPlayer";

export default function StudioAudio() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['audioSessions'],
    queryFn: async () => {
      return await base44.entities.AudioSession.filter({ status: 'published' });
    },
  });

  const { data: userSessions = [] } = useQuery({
    queryKey: ['userAudioSessions'],
    queryFn: async () => {
      return await base44.entities.UserAudioSession.list();
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async ({ sessionId, favorite }) => {
      const existing = userSessions.find(us => us.audio_session_id === sessionId);
      if (existing) {
        await base44.entities.UserAudioSession.update(existing.id, { favorite });
      } else {
        await base44.entities.UserAudioSession.create({
          audio_session_id: sessionId,
          favorite,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAudioSessions'] });
    },
  });

  const categories = [
    "Calm & Nervous System Resets",
    "Confidence & Identity",
    "Clarity & Decisions",
    "Emotional Release",
    "Performance Prep",
    "Rest & Recovery",
  ];

  const filteredSessions = sessions.filter(session => {
    const matchesCategory = selectedCategory === "all" || session.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getUserSession = (sessionId) => {
    return userSessions.find(us => us.audio_session_id === sessionId);
  };

  if (isLoading) {
    return (
      <div className="bg-[#F9F5EF] min-h-screen pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-[#2B2725]/60">Loading Pocket Mindset...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9F5EF] min-h-screen pt-32 pb-24">
      {selectedSession && (
        <AudioPlayer
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          userSession={getUserSession(selectedSession.id)}
        />
      )}

      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-2 block">
              Mind Styling Studio
            </span>
            <h1 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-4">
              Pocket Mindset™ Library
            </h1>
            <p className="text-[#2B2725]/70 text-lg mb-4">
              Quick, powerful sessions to reset your mind and shift your state
            </p>

          </div>

          {/* Search & Filters */}
          <div className="space-y-4 mb-8">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" />
              <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-[#E4D9C4] focus:border-[#D8B46B]"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Filter size={16} className="text-[#2B2725]/60" />
                <span className="text-xs text-[#2B2725]/60 tracking-wide uppercase">Category</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("all")}
                  className={selectedCategory === "all" ? "bg-[#1E3A32]" : ""}
                >
                  All
                </Button>
                {categories.map(category => (
                  <Button
                    key={category}
                    size="sm"
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    className={selectedCategory === category ? "bg-[#A6B7A3] text-white" : ""}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Sessions Grid */}
          {filteredSessions.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#2B2725]/60">No sessions found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSessions.map((session) => {
                const userSession = getUserSession(session.id);
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 relative group cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedSession(session)}
                  >
                    {/* Cover Image */}
                    {session.cover_image && (
                      <div 
                        className="w-full h-40 bg-cover bg-center mb-4 rounded"
                        style={{ backgroundImage: `url(${session.cover_image})` }}
                      />
                    )}

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        favoriteMutation.mutate({
                          sessionId: session.id,
                          favorite: !userSession?.favorite,
                        });
                      }}
                      className="absolute top-4 right-4"
                    >
                      <Heart
                        size={20}
                        className={userSession?.favorite ? "fill-[#D8B46B] text-[#D8B46B]" : "text-[#2B2725]/40"}
                      />
                    </button>

                    {/* Title & Category */}
                    <Badge className="mb-3 bg-[#A6B7A3] text-white">{session.category}</Badge>
                    <h3 className="font-serif text-xl text-[#1E3A32] mb-2">{session.title}</h3>

                    {/* Duration */}
                    {session.duration && (
                      <p className="text-sm text-[#2B2725]/60 mb-3">{session.duration} min</p>
                    )}

                    {/* Description */}
                    <div 
                      className="text-sm text-[#2B2725]/70 mb-4 line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: session.description || '' }}
                    />

                    {/* Play Button */}
                    <button
                      className="w-full py-3 bg-[#1E3A32] text-[#F9F5EF] flex items-center justify-center gap-2 hover:bg-[#2B2725] transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSession(session);
                      }}
                    >
                      <Play size={16} />
                      {userSession?.completed ? "Listen Again" : "Play"}
                    </button>

                    {/* Progress Indicator */}
                    {userSession && userSession.progress > 0 && !userSession.completed && (
                      <div className="mt-2">
                        <div className="w-full h-1 bg-[#E4D9C4] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#D8B46B]"
                            style={{ width: `${userSession.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}