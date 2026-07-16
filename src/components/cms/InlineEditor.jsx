import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { X, Save, Upload, Clock, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useEditMode } from "./EditModeProvider";

export default function InlineEditor({
  contentKey,
  blockTitle,
  page,
  initialContent,
  contentType,
  maxLength,
  block,
  onClose,
}) {
  const queryClient = useQueryClient();
  const { user } = useEditMode();
  const [content, setContent] = useState(initialContent);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch revision history
  const { data: revisions = [] } = useQuery({
    queryKey: ["cms-revisions", contentKey],
    queryFn: () => base44.entities.CmsRevision.filter({ content_key: contentKey }, "-created_date"),
    enabled: showHistory,
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (block) {
        await base44.entities.CmsContent.update(block.id, {
          draft_content: content,
          is_draft: true,
        });
      } else {
        await base44.entities.CmsContent.create({
          key: contentKey,
          page: page || "unknown",
          block_title: blockTitle,
          content: content,
          content_type: contentType,
          max_length: maxLength,
          is_draft: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-content"] });
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (block) {
        // Create revision
        await base44.entities.CmsRevision.create({
          content_key: contentKey,
          content: block.content,
          edited_by: user.email,
          action: "updated",
        });

        // Update content
        await base44.entities.CmsContent.update(block.id, {
          content: content,
          is_draft: false,
          draft_content: null,
        });
      } else {
        // Create new block
        await base44.entities.CmsContent.create({
          key: contentKey,
          page: page || "unknown",
          block_title: blockTitle,
          content: content,
          content_type: contentType,
          max_length: maxLength,
          is_draft: false,
        });

        // Create initial revision
        await base44.entities.CmsRevision.create({
          content_key: contentKey,
          content: content,
          edited_by: user.email,
          action: "created",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-content"] });
      onClose();
    },
  });

  // Restore revision
  const restoreMutation = useMutation({
    mutationFn: async (revisionContent) => {
      await base44.entities.CmsRevision.create({
        content_key: contentKey,
        content: block.content,
        edited_by: user.email,
        action: "updated",
      });

      await base44.entities.CmsContent.update(block.id, {
        content: revisionContent,
        is_draft: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-content", "cms-revisions"] });
      onClose();
    },
  });

  const charCount = content?.length || 0;
  const isOverLimit = maxLength && charCount > maxLength;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif text-[#1E3A32]">Editing: {blockTitle}</h2>
            <p className="text-sm text-gray-500 mt-1">Changes appear when you publish.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {contentType === "short_text" ? (
            <div>
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="text-lg text-[#1E3A32]"
                placeholder="Type your text here..."
              />
              {maxLength && (
                <p className={`text-sm mt-2 ${isOverLimit ? "text-red-600" : "text-gray-500"}`}>
                  {charCount}/{maxLength} characters
                </p>
              )}
            </div>
          ) : (
            <div>
              <style>{`
                .ql-editor {
                  color: #1E3A32 !important;
                  min-height: 200px;
                }
                .ql-editor p, .ql-editor span, .ql-editor div {
                  color: #1E3A32 !important;
                }
              `}</style>
              <ReactQuill
                value={content}
                onChange={setContent}
                theme="snow"
                modules={{
                  toolbar: [
                    ["bold", "italic", "underline"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link"],
                    ["clean"],
                  ],
                }}
              />
              {maxLength && (
                <p className={`text-sm mt-2 ${isOverLimit ? "text-red-600" : "text-gray-500"}`}>
                  {charCount}/{maxLength} characters
                </p>
              )}
            </div>
          )}

          {/* History */}
          {block && (
            <div className="mt-6 border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-[#1E3A32]">Version History</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <Clock size={16} className="mr-2" />
                  {showHistory ? "Hide" : "Show"} ({revisions.length})
                </Button>
              </div>

              {showHistory && (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {revisions.length === 0 ? (
                    <div className="text-center py-6">
                      <Clock size={32} className="mx-auto text-[#D8B46B] mb-2" />
                      <p className="text-sm text-gray-500">No previous versions yet.</p>
                    </div>
                  ) : (
                    revisions.map((revision, idx) => (
                      <div
                        key={revision.id}
                        className="border-l-4 border-[#D8B46B] bg-[#F9F5EF] rounded p-3"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span
                              className={`inline-block px-2 py-0.5 text-xs rounded mb-1 ${
                                revision.action === "created"
                                  ? "bg-green-100 text-green-800"
                                  : revision.action === "restored"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {revision.action}
                            </span>
                            <p className="text-xs text-gray-600">
                              {new Date(revision.created_date).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">by {revision.edited_by}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (
                                confirm(
                                  "Restore this version? Current content will be saved in history."
                                )
                              ) {
                                restoreMutation.mutate(revision.content);
                              }
                            }}
                            disabled={restoreMutation.isPending}
                            className="text-[#1E3A32] hover:text-[#D8B46B]"
                          >
                            <RotateCcw size={14} className="mr-1" />
                            Restore
                          </Button>
                        </div>
                        <div className="mt-2 p-2 bg-white rounded text-sm text-gray-700 line-clamp-2">
                          {revision.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => saveDraftMutation.mutate()}
              disabled={saveDraftMutation.isPending || isOverLimit}
            >
              <Save size={16} className="mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending || isOverLimit}
              className="bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              <Upload size={16} className="mr-2" />
              Publish Changes
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}