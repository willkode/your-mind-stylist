import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, ThumbsUp, Pin, CheckCircle, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function LessonComments({ lessonId, courseId }) {
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [isQuestion, setIsQuestion] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["lessonComments", lessonId],
    queryFn: () => base44.entities.LessonComment.filter({ lesson_id: lessonId }),
  });

  const postCommentMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.LessonComment.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessonComments", lessonId] });
      setCommentText("");
      setIsQuestion(false);
      setReplyingTo(null);
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      const comment = comments.find(c => c.id === commentId);
      const hasLiked = comment.liked_by?.includes(user.email);
      
      await base44.entities.LessonComment.update(commentId, {
        likes: hasLiked ? comment.likes - 1 : comment.likes + 1,
        liked_by: hasLiked 
          ? comment.liked_by.filter(email => email !== user.email)
          : [...(comment.liked_by || []), user.email]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessonComments", lessonId] });
    },
  });

  const markAnsweredMutation = useMutation({
    mutationFn: async (commentId) => {
      await base44.entities.LessonComment.update(commentId, {
        is_answered: true,
        answered_by: user.email,
        answered_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessonComments", lessonId] });
    },
  });

  const handlePostComment = () => {
    if (!commentText.trim()) return;

    postCommentMutation.mutate({
      lesson_id: lessonId,
      course_id: courseId,
      user_email: user.email,
      user_name: user.full_name,
      comment_text: commentText,
      is_question: isQuestion,
      parent_comment_id: replyingTo?.id || null,
    });
  };

  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  const getReplies = (commentId) => comments.filter(c => c.parent_comment_id === commentId);

  const CommentCard = ({ comment, isReply = false }) => {
    const hasLiked = comment.liked_by?.includes(user?.email);
    const replies = getReplies(comment.id);

    return (
      <div className={`${isReply ? 'ml-8 mt-3' : 'mb-4'}`}>
        <div className="bg-white p-4 rounded-lg border border-[#E4D9C4]">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#1E3A32]">{comment.user_name}</span>
              {comment.is_question && (
                <Badge variant="outline" className="text-xs">
                  <MessageCircle size={12} className="mr-1" />
                  Question
                </Badge>
              )}
              {comment.is_answered && (
                <Badge className="bg-green-100 text-green-800 text-xs">
                  <CheckCircle size={12} className="mr-1" />
                  Answered
                </Badge>
              )}
              {comment.pinned && (
                <Badge className="bg-[#D8B46B]/20 text-[#1E3A32] text-xs">
                  <Pin size={12} className="mr-1" />
                  Pinned
                </Badge>
              )}
            </div>
            <span className="text-xs text-[#2B2725]/60">
              {format(new Date(comment.created_date), "MMM d, yyyy")}
            </span>
          </div>

          <p className="text-[#2B2725] mb-3 leading-relaxed">{comment.comment_text}</p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => likeCommentMutation.mutate(comment.id)}
              className={`flex items-center gap-1 text-sm transition-colors ${
                hasLiked ? "text-[#D8B46B]" : "text-[#2B2725]/60 hover:text-[#D8B46B]"
              }`}
            >
              <ThumbsUp size={14} fill={hasLiked ? "currentColor" : "none"} />
              {comment.likes || 0}
            </button>

            <button
              onClick={() => setReplyingTo(comment)}
              className="text-sm text-[#2B2725]/60 hover:text-[#1E3A32]"
            >
              Reply
            </button>

            {user?.role === 'manager' && comment.is_question && !comment.is_answered && (
              <button
                onClick={() => markAnsweredMutation.mutate(comment.id)}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Mark as Answered
              </button>
            )}
          </div>
        </div>

        {replies.length > 0 && (
          <div className="mt-3">
            {replies.map(reply => (
              <CommentCard key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className="text-[#2B2725]/60">Loading comments...</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="font-serif text-xl text-[#1E3A32] flex items-center gap-2">
        <MessageCircle size={20} />
        Discussion ({comments.length})
      </h3>

      {/* Post Comment */}
      <div className="bg-[#F9F5EF] p-4 rounded-lg">
        {replyingTo && (
          <div className="mb-3 p-2 bg-white rounded border border-[#D8B46B]/30 text-sm">
            Replying to <span className="font-medium">{replyingTo.user_name}</span>
            <button
              onClick={() => setReplyingTo(null)}
              className="ml-2 text-[#2B2725]/60 hover:text-[#2B2725]"
            >
              Cancel
            </button>
          </div>
        )}

        <Textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={replyingTo ? "Write your reply..." : "Share your thoughts or ask a question..."}
          rows={3}
          className="mb-3"
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-[#2B2725]/70">
            <input
              type="checkbox"
              checked={isQuestion}
              onChange={(e) => setIsQuestion(e.target.checked)}
              className="rounded"
            />
            Mark as question
          </label>

          <Button
            onClick={handlePostComment}
            disabled={!commentText.trim() || postCommentMutation.isLoading}
            className="bg-[#1E3A32]"
          >
            <Send size={16} className="mr-2" />
            Post {replyingTo ? "Reply" : "Comment"}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div>
        {topLevelComments.length === 0 ? (
          <p className="text-center text-[#2B2725]/60 py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          topLevelComments.map(comment => (
            <CommentCard key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}