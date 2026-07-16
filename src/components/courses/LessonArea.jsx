import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, StickyNote, Download, FileText, Lock, Circle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import VideoPlayer from "./VideoPlayer";
import CourseAudioPlayer from "./CourseAudioPlayer";
import LessonNotes from "./LessonNotes";

export default function LessonArea({ 
  lesson, 
  isCompleted, 
  onMarkComplete, 
  onAddNote, 
  onProgressUpdate, 
  lastPosition,
  isLocked = false,
  prerequisiteLessons = [],
  lessonNotes = []
}) {
  const [attachedResources, setAttachedResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Fetch attached resources
  useEffect(() => {
    const fetchResources = async () => {
      if (!lesson?.attached_resource_ids || lesson.attached_resource_ids.length === 0) return;
      
      setLoadingResources(true);
      try {
        const resources = await Promise.all(
          lesson.attached_resource_ids.map(id => base44.entities.Resource.get(id))
        );
        setAttachedResources(resources.filter(r => r));
      } catch (error) {
        console.error("Error fetching resources:", error);
      } finally {
        setLoadingResources(false);
      }
    };
    fetchResources();
  }, [lesson?.attached_resource_ids]);
  const getTypeLabel = (type) => {
    const labels = {
      video: "Video Lesson",
      audio: "Audio Lesson",
      text: "Reading",
      hybrid: "Video + Reading",
    };
    return labels[type] || "Lesson";
  };

  return (
    <div className="flex-1 bg-[#F9F5EF]">
      <div className="max-w-4xl mx-auto p-6 lg:p-12">
        {/* Locked State */}
        {isLocked && (
          <div className="bg-white p-8 rounded-lg text-center mb-8 border-2 border-[#E4D9C4]">
            <Lock size={48} className="mx-auto text-[#D8B46B] mb-4" />
            <h2 className="font-serif text-2xl text-[#1E3A32] mb-3">This Lesson is Locked</h2>
            <p className="text-[#2B2725]/70 mb-4">
              Complete the following lessons to unlock this content:
            </p>
            <div className="space-y-2 max-w-md mx-auto">
              {prerequisiteLessons.map((prereq, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-[#F9F5EF] rounded text-left">
                  <Circle size={16} className="text-[#2B2725]/40 flex-shrink-0" />
                  <span className="text-sm text-[#2B2725]/80">{prereq.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lesson Header */}
        {!isLocked && (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-[#D8B46B]/20 text-[#1E3A32]">
                  {getTypeLabel(lesson.type)}
                </Badge>
                {lesson.estimated_time && (
                  <Badge variant="outline" className="text-[#2B2725]/60">
                    <FileText size={12} className="mr-1" />
                    {lesson.estimated_time} min
                  </Badge>
                )}
              </div>
              <h1 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-4">
                {lesson.title}
              </h1>
            </div>

        {/* Video Player */}
        {(lesson.type === "video" || lesson.type === "hybrid") && (lesson.embed_url || lesson.media_url) && (() => {
          // Determine if media_url is actually an embeddable link (YouTube/Vimeo)
          const isEmbeddable = (url) => url && (
            url.includes('youtube.com') || url.includes('youtu.be') ||
            url.includes('vimeo.com') || url.includes('player.vimeo.com')
          );
          const embedUrl = lesson.embed_url || (isEmbeddable(lesson.media_url) ? lesson.media_url : null);
          const src = !embedUrl ? lesson.media_url : null;
          return (
            <div className="mb-8 bg-black rounded-lg overflow-hidden">
              <VideoPlayer
                src={src}
                embedUrl={embedUrl}
                onProgressUpdate={onProgressUpdate}
                lastPosition={lastPosition}
              />
            </div>
          );
        })()}

        {/* Audio Player */}
        {lesson.type === "audio" && lesson.media_url && (
          <div className="mb-8">
            <CourseAudioPlayer
              src={lesson.media_url}
              onProgressUpdate={onProgressUpdate}
              lastPosition={lastPosition}
            />
          </div>
        )}

        {/* Text Content */}
        {lesson.content && (
          <div
            className="prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        )}

        {/* Key Takeaways */}
        {lesson.key_takeaways && lesson.key_takeaways.length > 0 && (
          <div className="bg-white p-6 rounded-lg mb-8">
            <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">Key Takeaways</h2>
            <ul className="space-y-2">
              {lesson.key_takeaways.map((takeaway, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-[#D8B46B] mt-1">•</span>
                  <span className="text-[#2B2725]/80">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

            {/* Lesson Notes */}
            <LessonNotes notes={lessonNotes} onAddNote={onAddNote} />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={onAddNote}
                variant="outline"
                className="flex-1 border-[#D8B46B] hover:bg-[#D8B46B]/10"
              >
                <StickyNote size={16} className="mr-2" />
                {lessonNotes.length > 0 ? "Add Another Note" : "Add Note"}
              </Button>
              <Button
                onClick={onMarkComplete}
                disabled={isCompleted}
                className="flex-1 bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
              >
                <CheckCircle size={16} className="mr-2" />
                {isCompleted ? "Completed" : "Mark as Complete"}
              </Button>
            </div>

            {/* Transcription */}
            {lesson.transcription_url && (
              <div className="mt-8 bg-white p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-xl text-[#1E3A32]">Transcript Available</h2>
                  <a
                    href={lesson.transcription_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[#1E3A32] hover:text-[#D8B46B] transition-colors"
                  >
                    <Download size={16} />
                    Download
                  </a>
                </div>
                <p className="text-sm text-[#2B2725]/70">
                  Download the full transcript for accessibility or reference
                </p>
              </div>
            )}

        {/* Attached Resources */}
        {attachedResources.length > 0 && (
          <div className="bg-white p-6 rounded-lg mb-8">
            <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">Resources</h2>
            {loadingResources ? (
              <p className="text-[#2B2725]/60">Loading resources...</p>
            ) : (
              <div className="space-y-3">
                {attachedResources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-[#F9F5EF] hover:bg-[#E4D9C4] transition-colors rounded"
                  >
                    <FileText size={16} className="text-[#D8B46B] flex-shrink-0" />
                    <span className="text-[#2B2725] flex-1">{resource.title}</span>
                    <span className="text-[#D8B46B]">↓</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lesson Comments/Q&A - Disabled */}
            {/* <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-12"
            >
              <LessonComments lessonId={lesson.id} courseId={lesson.course_id} />
            </motion.div> */}
          </>
        )}
      </div>
    </div>
  );
}