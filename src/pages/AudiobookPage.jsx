import React from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lock } from "lucide-react";
import { motion } from "framer-motion";
import AudiobookPlayer from "@/components/audiobook/AudiobookPlayer";
import { Button } from "@/components/ui/button";

export default function AudiobookPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();

  // Fetch audiobook by slug
  const { data: audiobooks = [], isLoading: loadingBook } = useQuery({
    queryKey: ["audiobook", slug],
    queryFn: () => base44.entities.Audiobook.filter({ slug, status: "published" }),
  });

  const audiobook = audiobooks[0];

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // Check audiobook access via comprehensive backend function
  const { data: accessResult, isLoading: loadingOwnership } = useQuery({
    queryKey: ["audiobookAccess", audiobook?.id, user?.id],
    queryFn: async () => {
      const result = await base44.functions.invoke("checkAudiobookAccess", {
        audiobook_id: audiobook.id,
      });
      return result.data;
    },
    enabled: !!audiobook && !!user,
  });

  // Get user's progress
  const { data: progressList = [] } = useQuery({
    queryKey: ["audiobookProgress", audiobook?.id, user?.id],
    queryFn: () =>
      base44.entities.UserAudiobookProgress.filter({
        audiobook_id: audiobook.id,
        user_id: user.id,
      }),
    enabled: !!audiobook && !!user,
  });

  const userProgress = progressList[0] || null;

  const handleProgressSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["audiobookProgress"] });
  };

  // Loading
  if (loadingBook || loadingOwnership) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center pt-32">
        <div className="animate-pulse text-[#2B2725]/60">Loading audiobook...</div>
      </div>
    );
  }

  // Not found
  if (!audiobook) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex flex-col items-center justify-center pt-32 px-6">
        <h1 className="font-serif text-2xl text-[#1E3A32] mb-4">Audiobook Not Found</h1>
        <p className="text-[#2B2725]/60 mb-6">This audiobook may have been removed or the link is incorrect.</p>
        <Link to="/" className="text-[#D8B46B] hover:text-[#C9A55C] text-sm">
          ← Back to Home
        </Link>
      </div>
    );
  }

  // Access check via unified backend function
  const hasAccess = accessResult?.access?.[audiobook?.id];
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <Lock size={48} className="mx-auto text-[#E4D9C4] mb-6" />
          <h1 className="font-serif text-3xl text-[#1E3A32] mb-4">{audiobook.title}</h1>
          <p className="text-[#2B2725]/60 mb-8">
            This audiobook is included with your purchase. Please ensure you're logged in with the account that made the purchase.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
              className="bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              Log In
            </Button>
            <Link to="/Programs">
              <Button variant="outline" className="border-[#D8B46B] text-[#1E3A32]">
                View Programs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] pt-32 pb-24 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back link */}
        <div className="max-w-3xl mx-auto mb-8">
          <Link
            to="/Library"
            className="inline-flex items-center gap-2 text-sm text-[#2B2725]/50 hover:text-[#1E3A32] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Library
          </Link>
        </div>

        {/* Instructions */}
        <div className="max-w-3xl mx-auto mb-6 bg-white border border-[#E4D9C4] rounded-lg p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#6E4F7D]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6E4F7D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <div>
              <p className="text-sm text-[#1E3A32] font-medium mb-1">How to listen</p>
              <p className="text-sm text-[#2B2725]/70">
                Listen here directly using the player below, or scroll down to download the audio file to listen on your preferred device.
              </p>
            </div>
          </div>
        </div>

        {/* Player */}
        <AudiobookPlayer
          audiobook={audiobook}
          userProgress={userProgress}
          onProgressSaved={handleProgressSaved}
        />
      </motion.div>
    </div>
  );
}