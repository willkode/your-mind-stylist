import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Upload, FileText, Link as LinkIcon } from "lucide-react";
import ReactQuill from "react-quill";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function LessonEditor({ lesson, onUpdate, onClose, onMediaUpload, allLessons = [], modules = [] }) {
  const [uploadingTranscription, setUploadingTranscription] = useState(false);
  
  // Fetch available resources
  const { data: availableResources = [] } = useQuery({
    queryKey: ["resources", "published"],
    queryFn: () => base44.entities.Resource.filter({ status: "published" }),
  });
  
  const addKeyTakeaway = () => {
    const takeaways = lesson.key_takeaways || [];
    onUpdate({ ...lesson, key_takeaways: [...takeaways, ""] });
  };

  const updateKeyTakeaway = (index, value) => {
    const takeaways = [...(lesson.key_takeaways || [])];
    takeaways[index] = value;
    onUpdate({ ...lesson, key_takeaways: takeaways });
  };

  const removeKeyTakeaway = (index) => {
    const takeaways = lesson.key_takeaways.filter((_, i) => i !== index);
    onUpdate({ ...lesson, key_takeaways: takeaways });
  };

  const addResource = () => {
    const resources = lesson.resources || [];
    onUpdate({ ...lesson, resources: [...resources, { title: "", type: "pdf", url: "" }] });
  };

  const updateResource = (index, field, value) => {
    const resources = [...(lesson.resources || [])];
    resources[index] = { ...resources[index], [field]: value };
    onUpdate({ ...lesson, resources });
  };

  const removeResource = (index) => {
    const resources = lesson.resources.filter((_, i) => i !== index);
    onUpdate({ ...lesson, resources });
  };

  const handleTranscriptionUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingTranscription(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onUpdate({ ...lesson, transcription_url: file_url });
    } catch (error) {
      alert("Failed to upload transcription");
    } finally {
      setUploadingTranscription(false);
    }
  };

  const togglePrerequisite = (prereqId) => {
    const prerequisites = lesson.prerequisites || [];
    if (prerequisites.includes(prereqId)) {
      onUpdate({ ...lesson, prerequisites: prerequisites.filter(id => id !== prereqId) });
    } else {
      onUpdate({ ...lesson, prerequisites: [...prerequisites, prereqId] });
    }
  };

  const toggleAttachedResource = (resourceId) => {
    const attachedIds = lesson.attached_resource_ids || [];
    if (attachedIds.includes(resourceId)) {
      onUpdate({ ...lesson, attached_resource_ids: attachedIds.filter(id => id !== resourceId) });
    } else {
      onUpdate({ ...lesson, attached_resource_ids: [...attachedIds, resourceId] });
    }
  };

  // Get available prerequisite lessons (lessons before this one)
  const availablePrerequisites = allLessons.filter(l => 
    l.id !== lesson.id && 
    (l.order < lesson.order || l.module_id !== lesson.module_id)
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-6 flex items-start justify-center">
        <div className="bg-white rounded-lg max-w-4xl w-full p-8 my-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-serif text-2xl text-[#1E3A32]">Edit Lesson</h2>
            <button onClick={onClose} className="text-[#2B2725]/40 hover:text-[#2B2725]">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="lesson-title">Lesson Title *</Label>
              <Input
                id="lesson-title"
                value={lesson.title || ""}
                onChange={(e) => onUpdate({ ...lesson, title: e.target.value })}
                placeholder="e.g., Understanding Emotional Triggers"
              />
            </div>

            {/* Type */}
            <div>
              <Label>Lesson Type</Label>
              <Select
                value={lesson.type || "video"}
                onValueChange={(value) => onUpdate({ ...lesson, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="text">Text / Reading</SelectItem>
                  <SelectItem value="hybrid">Video + Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div>
              <Label htmlFor="lesson-duration">Duration</Label>
              <Input
                id="lesson-duration"
                value={lesson.duration || ""}
                onChange={(e) => onUpdate({ ...lesson, duration: e.target.value })}
                placeholder="e.g., 12:35 or 15 minutes"
              />
            </div>

            {/* Media Upload */}
            {(lesson.type === "video" || lesson.type === "audio" || lesson.type === "hybrid") && (
              <div>
                <Label>Media File</Label>
                {lesson.media_url ? (
                  <div className="p-4 bg-[#F9F5EF] rounded flex justify-between items-center">
                    <span className="text-sm text-[#2B2725]">Media uploaded</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdate({ ...lesson, media_url: "" })}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-[#E4D9C4] rounded-lg p-6 text-center">
                    <Upload className="mx-auto text-[#D8B46B] mb-2" size={32} />
                    <input
                      type="file"
                      accept={lesson.type === "audio" ? "audio/*" : "video/*"}
                      onChange={onMediaUpload}
                      className="hidden"
                      id="media-upload"
                    />
                    <label htmlFor="media-upload">
                      <Button type="button" variant="outline" asChild>
                        <span>Upload {lesson.type === "audio" ? "Audio" : "Video"}</span>
                      </Button>
                    </label>
                    <p className="text-xs text-[#2B2725]/60 mt-3">
                      Max size: {lesson.type === "audio" ? "100MB" : "500MB"}. Files will be compressed automatically.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Embed URL (alternative to upload) */}
            {lesson.type === "video" && (
              <div>
                <Label htmlFor="embed-url">Or use Embed URL</Label>
                <Input
                  id="embed-url"
                  value={lesson.embed_url || ""}
                  onChange={(e) => onUpdate({ ...lesson, embed_url: e.target.value })}
                  placeholder="YouTube, Vimeo, etc."
                />
                <p className="text-xs text-[#2B2725]/60 mt-1">
                  Supports YouTube, Vimeo, and other iframe-embeddable videos
                </p>
              </div>
            )}

            {/* Transcription Upload */}
            {(lesson.type === "video" || lesson.type === "audio") && (
              <div>
                <Label>Transcription (Optional)</Label>
                {lesson.transcription_url ? (
                  <div className="p-4 bg-[#F9F5EF] rounded flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-[#D8B46B]" />
                      <span className="text-sm text-[#2B2725]">Transcription uploaded</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdate({ ...lesson, transcription_url: "" })}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-[#E4D9C4] rounded-lg p-4">
                    <input
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={handleTranscriptionUpload}
                      className="hidden"
                      id="transcription-upload"
                    />
                    <label htmlFor="transcription-upload">
                      <Button type="button" variant="outline" size="sm" disabled={uploadingTranscription} asChild>
                        <span>
                          {uploadingTranscription ? "Uploading..." : "Upload Transcription"}
                        </span>
                      </Button>
                    </label>
                    <p className="text-xs text-[#2B2725]/60 mt-2">
                      For accessibility - transcript of {lesson.type} content
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div>
              <Label>Lesson Content</Label>
              <ReactQuill
                value={lesson.content || ""}
                onChange={(value) => onUpdate({ ...lesson, content: value })}
                className="bg-white"
              />
            </div>

            {/* Estimated Time */}
             <div className="grid md:grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="estimated-time">Estimated Time (minutes)</Label>
                 <Input
                   id="estimated-time"
                   type="number"
                   value={lesson.estimated_time || ""}
                   onChange={(e) => onUpdate({ ...lesson, estimated_time: parseInt(e.target.value) || 0 })}
                   placeholder="e.g., 15"
                 />
               </div>
               <div className="space-y-2">
                 <div className="flex items-center gap-2">
                   <Checkbox
                     id="required"
                     checked={lesson.required !== false}
                     onCheckedChange={(checked) => onUpdate({ ...lesson, required: checked })}
                   />
                   <Label htmlFor="required" className="font-normal cursor-pointer">
                     Required lesson
                   </Label>
                 </div>
                 <div className="flex items-center gap-2">
                   <Checkbox
                     id="enable-checkin"
                     checked={lesson.enable_checkin === true}
                     onCheckedChange={(checked) => onUpdate({ ...lesson, enable_checkin: checked })}
                   />
                   <Label htmlFor="enable-checkin" className="font-normal cursor-pointer">
                     Emotional check-in
                   </Label>
                 </div>
               </div>
             </div>

            {/* Key Takeaways */}
            <div>
              <Label>Key Takeaways</Label>
              <div className="space-y-2">
                {(lesson.key_takeaways || []).map((takeaway, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={takeaway}
                      onChange={(e) => updateKeyTakeaway(index, e.target.value)}
                      placeholder={`Takeaway ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeKeyTakeaway(index)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addKeyTakeaway}
                  className="w-full border-dashed"
                >
                  <Plus size={16} className="mr-2" />
                  Add Takeaway
                </Button>
              </div>
            </div>

            {/* Attached Resources from Library */}
            <div>
              <Label>Attach Resources from Library</Label>
              <p className="text-xs text-[#2B2725]/60 mb-3">
                Select published resources to make available with this lesson
              </p>
              {availableResources.length === 0 ? (
                <div className="p-4 bg-[#F9F5EF] rounded text-sm text-[#2B2725]/60">
                  No published resources available. Create resources in the Resource Manager first.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 border border-[#E4D9C4] rounded-lg p-3">
                  {availableResources.map((resource) => (
                    <div key={resource.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`resource-${resource.id}`}
                        checked={(lesson.attached_resource_ids || []).includes(resource.id)}
                        onCheckedChange={() => toggleAttachedResource(resource.id)}
                      />
                      <Label 
                        htmlFor={`resource-${resource.id}`} 
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-[#D8B46B]" />
                          <span>{resource.title}</span>
                          <span className="text-xs text-[#2B2725]/40">({resource.category})</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Inline Resources (Legacy) */}
            <div>
              <Label>Manual Resources (Legacy)</Label>
              <p className="text-xs text-[#2B2725]/60 mb-2">
                Add quick links/resources. Consider using the Resource Library above instead.
              </p>
              <div className="space-y-3">
                {(lesson.resources || []).map((resource, index) => (
                  <div key={index} className="p-3 bg-[#F9F5EF] rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Resource {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeResource(index)}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                    <Input
                      value={resource.title || ""}
                      onChange={(e) => updateResource(index, "title", e.target.value)}
                      placeholder="Resource title"
                      className="text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={resource.type || "pdf"}
                        onValueChange={(value) => updateResource(index, "type", value)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="link">Link</SelectItem>
                          <SelectItem value="audio">Audio</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={resource.url || ""}
                        onChange={(e) => updateResource(index, "url", e.target.value)}
                        placeholder="URL"
                        className="text-sm"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addResource}
                  className="w-full border-dashed"
                >
                  <Plus size={16} className="mr-2" />
                  Add Resource
                </Button>
              </div>
            </div>

            {/* Prerequisites */}
            {availablePrerequisites.length > 0 && (
              <div>
                <Label>Prerequisites (Optional)</Label>
                <p className="text-xs text-[#2B2725]/60 mb-3">
                  Students must complete these lessons before accessing this one
                </p>
                <div className="max-h-40 overflow-y-auto space-y-2 border border-[#E4D9C4] rounded-lg p-3">
                  {availablePrerequisites.map((prereq) => {
                    const prereqModule = modules.find(m => m.id === prereq.module_id);
                    return (
                      <div key={prereq.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`prereq-${prereq.id}`}
                          checked={(lesson.prerequisites || []).includes(prereq.id)}
                          onCheckedChange={() => togglePrerequisite(prereq.id)}
                        />
                        <Label 
                          htmlFor={`prereq-${prereq.id}`} 
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {prereqModule?.title}: {prereq.title}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onClose}
                className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
              >
                Save Lesson
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}