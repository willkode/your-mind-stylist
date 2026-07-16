import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Merge, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";

export default function CourseMerger({ open, onClose }) {
  const queryClient = useQueryClient();
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseSlug, setNewCourseSlug] = useState("");

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("-created_date"),
  });

  const [mergeProgress, setMergeProgress] = useState("");

  const mergeMutation = useMutation({
    mutationFn: async ({ courseIds, newName, newSlug }) => {
      const firstCourse = courses.find(c => c.id === courseIds[0]);

      setMergeProgress("Creating merged course...");
      const newCourse = await base44.entities.Course.create({
        title: newName,
        slug: newSlug,
        subtitle: firstCourse?.subtitle || "",
        type: firstCourse?.type || "Other",
        difficulty: firstCourse?.difficulty || null,
        status: "draft",
        visibility: firstCourse?.visibility || "clients_only",
        short_description: `Merged course containing: ${courseIds.length} programs`,
        long_description: firstCourse?.long_description || "",
      });

      let moduleOrder = 1;
      for (const courseId of courseIds) {
        const courseName = courses.find(c => c.id === courseId)?.title || courseId;
        setMergeProgress(`Copying modules from "${courseName}"...`);

        const modules = await base44.entities.Module.filter({ course_id: courseId });
        // Sort by order client-side
        modules.sort((a, b) => (a.order || 0) - (b.order || 0));

        for (const module of modules) {
          const newModule = await base44.entities.Module.create({
            course_id: newCourse.id,
            title: module.title,
            description: module.description || "",
            order: moduleOrder++,
            required: module.required !== false,
            prerequisites: [],
            estimated_time: module.estimated_time || null,
          });

          const lessons = await base44.entities.Lesson.filter({ module_id: module.id });
          lessons.sort((a, b) => (a.order || 0) - (b.order || 0));

          for (const lesson of lessons) {
            await base44.entities.Lesson.create({
              module_id: newModule.id,
              title: lesson.title,
              type: lesson.type,
              content: lesson.content || null,
              media_url: lesson.media_url || null,
              embed_url: lesson.embed_url || null,
              transcription_url: lesson.transcription_url || null,
              duration: lesson.duration || null,
              key_takeaways: lesson.key_takeaways || [],
              resources: lesson.resources || [],
              attached_resource_ids: lesson.attached_resource_ids || [],
              order: lesson.order,
              required: lesson.required !== false,
              prerequisites: [],
              estimated_time: lesson.estimated_time || null,
            });
          }
        }
      }

      setMergeProgress("");
      return newCourse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Courses merged successfully!");
      onClose();
      setSelectedCourseIds([]);
      setNewCourseName("");
      setNewCourseSlug("");
    },
    onError: (error) => {
      toast.error(`Failed to merge courses: ${error.message}`);
    },
  });

  const toggleCourseSelection = (courseId) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleMerge = () => {
    if (selectedCourseIds.length < 2) {
      toast.error("Please select at least 2 courses to merge");
      return;
    }
    if (!newCourseName || !newCourseSlug) {
      toast.error("Please provide a name and slug for the merged course");
      return;
    }

    mergeMutation.mutate({
      courseIds: selectedCourseIds,
      newName: newCourseName,
      newSlug: newCourseSlug,
    });
  };

  const selectedCourses = courses.filter(c => selectedCourseIds.includes(c.id));
  const totalModules = selectedCourses.reduce((sum, course) => {
    // This is an estimate - would need to fetch actual modules
    return sum + 1; // Placeholder
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl text-[#1E3A32] flex items-center gap-3">
            <Merge size={28} />
            Merge Courses
          </DialogTitle>
          <p className="text-sm text-[#2B2725]/60">
            Combine multiple courses into one unified program
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
              <div className="text-sm text-[#2B2725]/80">
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>This creates a NEW course with all modules from selected courses</li>
                  <li>Original courses remain unchanged</li>
                  <li>Modules are combined in the order of selected courses</li>
                  <li>The new course will be saved as a draft for review</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Select Courses */}
          <div>
            <Label className="mb-3 block">Select Courses to Merge (minimum 2)</Label>
            <p className="text-xs text-[#2B2725]/60 mb-3">Click courses in the order you want to merge them. Selected courses will appear in numbered order below.</p>
            <div className="border border-[#E4D9C4] rounded-lg max-h-[300px] overflow-y-auto">
              {courses.filter(c => c.status !== "archived").map((course, index) => (
                <div
                  key={course.id}
                  className={`flex items-start gap-4 p-4 border-b border-[#E4D9C4] last:border-0 transition-all cursor-pointer ${
                    selectedCourseIds.includes(course.id)
                      ? "bg-[#D8B46B]/10 border-b border-[#D8B46B]/30"
                      : "hover:bg-[#F9F5EF]"
                  }`}
                  onClick={() => toggleCourseSelection(course.id)}
                >
                  <Checkbox
                    checked={selectedCourseIds.includes(course.id)}
                    onCheckedChange={(checked) => toggleCourseSelection(course.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-[#1E3A32]">{course.title}</h4>
                      {selectedCourseIds.includes(course.id) && (
                        <span className="text-xs px-2 py-1 bg-[#D8B46B] text-white rounded">
                          #{selectedCourseIds.indexOf(course.id) + 1}
                        </span>
                      )}
                    </div>
                    {course.subtitle && (
                      <p className="text-sm text-[#2B2725]/60 mt-1">{course.subtitle}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-[#F9F5EF] text-[#2B2725]/70 rounded">
                        {course.type}
                      </span>
                      <span className="text-xs px-2 py-1 bg-[#F9F5EF] text-[#2B2725]/70 rounded">
                        {course.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Course Details */}
          {selectedCourseIds.length >= 2 && (
            <div className="space-y-4 p-6 bg-[#F9F5EF] rounded-lg">
              <h4 className="font-medium text-[#1E3A32] flex items-center gap-2">
                <ArrowRight size={18} className="text-[#D8B46B]" />
                New Merged Course Details
              </h4>
              
              <div>
                <Label>New Course Name *</Label>
                <Input
                  value={newCourseName}
                  onChange={(e) => {
                    setNewCourseName(e.target.value);
                    if (!newCourseSlug) {
                      setNewCourseSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="The Complete Mind Styling Program"
                />
              </div>

              <div>
                <Label>URL Slug *</Label>
                <Input
                  value={newCourseSlug}
                  onChange={(e) => setNewCourseSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="complete-mind-styling-program"
                />
              </div>

              <div className="pt-4 border-t border-[#E4D9C4]">
                <p className="text-sm text-[#2B2725]/70 mb-2">
                  <strong>Will merge:</strong> {selectedCourseIds.length} courses in selected order
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedCourses.map((course, idx) => (
                    <div key={course.id} className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg text-sm">
                      <span className="text-[#D8B46B] font-medium">#{idx + 1}</span>
                      <span className="text-[#1E3A32]">{course.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={mergeMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleMerge}
              disabled={selectedCourseIds.length < 2 || !newCourseName || !newCourseSlug || mergeMutation.isPending}
              className="bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              <Merge size={18} className="mr-2" />
              {mergeMutation.isPending ? (mergeProgress || "Merging...") : "Merge Courses"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}