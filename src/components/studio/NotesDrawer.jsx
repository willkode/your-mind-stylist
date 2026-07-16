import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Tag, Save, CheckCircle, AlertCircle, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function NotesDrawer({ isOpen, onClose, context = {} }) {
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [customTag, setCustomTag] = useState("");
  const [saveStatus, setSaveStatus] = useState(null); // null, 'saving', 'saved', 'error'
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);
  const sourceType = context?.source_type || "freeform";
  const sourceId = context?.source_id || null;
  const sourceTitle = context?.source_title || null;

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setContent(context?.prompt_text || "");
      setTags([]);
      setCustomTag("");
      setSaveStatus(null);
    }
  }, [isOpen, context?.prompt_text]);



  const createNoteMutation = useMutation({
    mutationFn: (data) => base44.entities.Note.create(data),
    onMutate: async (newNote) => {
      setSaveStatus('saving');
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["notes"] });
      
      // Snapshot previous value
      const previousNotes = queryClient.getQueryData(["notes"]);
      
      // Optimistically update
      queryClient.setQueryData(["notes"], (old = []) => [{
        id: 'temp-' + Date.now(),
        ...newNote,
        created_date: new Date().toISOString(),
      }, ...old]);
      
      return { previousNotes };
    },
    onError: (err, newNote, mutationCtx) => {
      setSaveStatus('error');
      // Rollback on error
      queryClient.setQueryData(["notes"], mutationCtx?.previousNotes);
      setTimeout(() => setSaveStatus(null), 2000);
    },
    onSuccess: () => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["lessonNotes"] });
    },
  });

  const handleSave = () => {
    if (!content.trim()) return;

    createNoteMutation.mutate({
      user_id: currentUser?.id || currentUser?.email || 'unknown',
      source_type: sourceType,
      source_id: sourceId,
      source_title: sourceTitle,
      content: content.trim(),
      tags: tags.length > 0 ? tags : undefined,
    });
  };

  const addTag = (tag) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addCustomTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim())) {
      setTags([...tags, customTag.trim()]);
      setCustomTag("");
    }
  };

  const emotionalTags = [
    "calm", "clarity", "resistance", "overwhelm", 
    "confidence", "curiosity", "tension", "momentum"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-[#F9F5EF] shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-serif text-2xl text-[#1E3A32] mb-1">Mind Note</h3>
                  {sourceTitle && (
                    <p className="text-sm text-[#2B2725]/60">{sourceTitle}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#E4D9C4] rounded transition-colors"
                >
                  <X size={20} className="text-[#2B2725]" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What are you noticing? What's present for you right now?"
                  className="min-h-[200px] border-[#D8B46B]/30 focus:border-[#D8B46B] focus:ring-[#D8B46B]"
                />

                {/* Emotional Tags */}
                <div>
                  <p className="text-sm text-[#2B2725]/70 mb-3 flex items-center gap-2">
                    <Tag size={16} />
                    Emotional tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {emotionalTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => tags.includes(tag) ? removeTag(tag) : addTag(tag)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          tags.includes(tag)
                            ? "bg-[#D8B46B] text-[#1E3A32]"
                            : "bg-white text-[#2B2725]/70 hover:bg-[#E4D9C4]"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Tags */}
                <div>
                  <p className="text-sm text-[#2B2725]/70 mb-3">Add your own tag</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addCustomTag()}
                      placeholder="Type and press Enter"
                      className="flex-1 px-3 py-2 border border-[#E4D9C4] rounded focus:outline-none focus:border-[#D8B46B]"
                    />
                    <Button onClick={addCustomTag} variant="outline">
                      Add
                    </Button>
                  </div>
                  {tags.filter(t => !emotionalTags.includes(t)).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {tags.filter(t => !emotionalTags.includes(t)).map(tag => (
                        <span
                          key={tag}
                          onClick={() => removeTag(tag)}
                          className="px-3 py-1 text-sm bg-[#A6B7A3]/20 text-[#1E3A32] rounded-full cursor-pointer hover:bg-[#A6B7A3]/40"
                        >
                          {tag} ×
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save Status Messages */}
                {saveStatus === 'saving' && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded text-blue-700 text-sm">
                    <div className="animate-spin">⟳</div>
                    Saving your note...
                  </div>
                )}
                {saveStatus === 'saved' && (
                  <div className="flex flex-col gap-2 p-3 bg-green-50 rounded text-green-700 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} />
                      Note saved successfully!
                    </div>
                    <button
                      onClick={() => { onClose(); navigate('/StudioNotes'); }}
                      className="flex items-center gap-1.5 text-xs text-[#1E3A32] font-medium underline underline-offset-2 hover:text-[#D8B46B] transition-colors"
                    >
                      <BookOpen size={13} />
                      See your notes
                    </button>
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded text-red-700 text-sm">
                    <AlertCircle size={16} />
                    Failed to save. Please try again.
                  </div>
                )}

                {/* Save Button */}
                <Button
                  onClick={handleSave}
                  disabled={!content.trim() || saveStatus === 'saving'}
                  className="w-full bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
                >
                  <Save size={16} className="mr-2" />
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Note'}
                </Button>

                <p className="text-xs text-[#2B2725]/50 text-center">
                  {saveStatus ? '' : ''}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}