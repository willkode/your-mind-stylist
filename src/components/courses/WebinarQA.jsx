import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, ThumbsUp, User } from "lucide-react";
import { motion } from "framer-motion";

export default function WebinarQA({ webinarId, user }) {
  const queryClient = useQueryClient();
  const [newQuestion, setNewQuestion] = useState("");

  // Fetch questions (using Message entity with source_type="webinar")
  const { data: questions = [] } = useQuery({
    queryKey: ["webinar-qa", webinarId],
    queryFn: async () => {
      const messages = await base44.entities.Message.filter(
        { source_id: webinarId, source_type: "webinar" },
        "-created_date"
      );
      return messages;
    },
    enabled: !!webinarId,
  });

  // Post question
  const postQuestionMutation = useMutation({
    mutationFn: (questionText) =>
      base44.entities.Message.create({
        user_id: user.id,
        source_type: "webinar",
        source_id: webinarId,
        message: questionText,
        status: "pending",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webinar-qa"] });
      setNewQuestion("");
    },
  });

  // Like question
  const likeMutation = useMutation({
    mutationFn: async (messageId) => {
      const message = questions.find((q) => q.id === messageId);
      const currentLikes = message.likes || 0;
      await base44.entities.Message.update(messageId, { likes: currentLikes + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webinar-qa"] });
    },
  });

  const handleSubmitQuestion = () => {
    if (newQuestion.trim()) {
      postQuestionMutation.mutate(newQuestion);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg">
      <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Questions & Discussion</h2>

      {/* Post Question */}
      <div className="mb-8 p-6 bg-[#F9F5EF] rounded-lg">
        <h3 className="font-medium text-[#1E3A32] mb-3">Ask a Question</h3>
        <Textarea
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Share your thoughts or ask a question about this webinar..."
          className="mb-3"
        />
        <Button
          onClick={handleSubmitQuestion}
          disabled={!newQuestion.trim() || postQuestionMutation.isPending}
          className="bg-[#6E4F7D] hover:bg-[#1E3A32] text-white"
        >
          <MessageCircle size={16} className="mr-2" />
          {postQuestionMutation.isPending ? "Posting..." : "Post Question"}
        </Button>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-[#2B2725]/70">
            <MessageCircle size={40} className="mx-auto mb-3 text-[#2B2725]/40" />
            <p>No questions yet. Be the first to ask!</p>
          </div>
        ) : (
          questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border-b border-[#E4D9C4] pb-6 last:border-0"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#6E4F7D]/20 flex items-center justify-center flex-shrink-0">
                  <User size={20} className="text-[#6E4F7D]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-[#1E3A32]">
                      {question.user_name || "Anonymous"}
                    </span>
                    <span className="text-xs text-[#2B2725]/50">
                      {new Date(question.created_date).toLocaleDateString()}
                    </span>
                    {question.status === "answered" && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                        Answered
                      </span>
                    )}
                  </div>
                  <p className="text-[#2B2725]/80 mb-3">{question.message}</p>

                  {question.response && (
                    <div className="mt-3 p-4 bg-[#F9F5EF] rounded border-l-4 border-[#6E4F7D]">
                      <p className="text-sm font-medium text-[#1E3A32] mb-1">Response:</p>
                      <p className="text-sm text-[#2B2725]/80">{question.response}</p>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => likeMutation.mutate(question.id)}
                    className="mt-2"
                  >
                    <ThumbsUp size={14} className="mr-2" />
                    {question.likes || 0} helpful
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}