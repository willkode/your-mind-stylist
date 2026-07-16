import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, MoreVertical, Edit, Copy, Archive, Trash2, Eye, BarChart3, Monitor, Merge, GripVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import CourseAnalytics from "@/components/courses/CourseAnalytics";
import CourseMerger from "@/components/courses/CourseMerger";
import { createPageUrl } from "../utils";
import { useNavigate } from "react-router-dom";

export default function CourseManager() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showMerger, setShowMerger] = useState(false);
  const [orderedCourses, setOrderedCourses] = useState([]);

  // Fetch all courses sorted by display_order
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("display_order"),
  });

  // Keep local ordered list in sync
  useEffect(() => {
    if (courses.length > 0) {
      setOrderedCourses(courses);
    }
  }, [courses]);

  // Update display order mutation
  const reorderMutation = useMutation({
    mutationFn: async (reorderedList) => {
      await Promise.all(
        reorderedList.map((course, index) =>
          base44.entities.Course.update(course.id, { display_order: index + 1 })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(orderedCourses);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setOrderedCourses(items);
    reorderMutation.mutate(items);
  };

  // Fetch course progress data for analytics
  const { data: allProgress = [] } = useQuery({
    queryKey: ["courseProgress"],
    queryFn: () => base44.entities.UserCourseProgress.list(),
  });

  // Delete course
  const deleteMutation = useMutation({
    mutationFn: async (courseId) => {
      // Delete associated modules and lessons first
      const modules = await base44.entities.Module.filter({ course_id: courseId });
      for (const module of modules) {
        const lessons = await base44.entities.Lesson.filter({ module_id: module.id });
        for (const lesson of lessons) {
          await base44.entities.Lesson.delete(lesson.id);
        }
        await base44.entities.Module.delete(module.id);
      }
      await base44.entities.Course.delete(courseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  // Duplicate course
  const duplicateMutation = useMutation({
    mutationFn: async (courseId) => {
      const course = courses.find(c => c.id === courseId);
      const newCourse = await base44.entities.Course.create({
        ...course,
        title: `${course.title} (Copy)`,
        slug: `${course.slug}-copy-${Date.now()}`,
        status: "draft",
      });

      // Duplicate modules and lessons
      const modules = await base44.entities.Module.filter({ course_id: courseId }, "order");
      for (const module of modules) {
        const newModule = await base44.entities.Module.create({
          course_id: newCourse.id,
          title: module.title,
          description: module.description,
          order: module.order,
        });

        const lessons = await base44.entities.Lesson.filter({ module_id: module.id }, "order");
        for (const lesson of lessons) {
          await base44.entities.Lesson.create({
            module_id: newModule.id,
            title: lesson.title,
            type: lesson.type,
            content: lesson.content,
            media_url: lesson.media_url,
            embed_url: lesson.embed_url,
            duration: lesson.duration,
            key_takeaways: lesson.key_takeaways,
            resources: lesson.resources,
            order: lesson.order,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  // Archive course
  const archiveMutation = useMutation({
    mutationFn: (courseId) => base44.entities.Course.update(courseId, { status: "archived" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  const handleDelete = (courseId) => {
    if (confirm("Delete this course and all its content? This cannot be undone.")) {
      deleteMutation.mutate(courseId);
    }
  };

  // Filter courses (from ordered list to preserve drag-and-drop order)
  const filteredCourses = orderedCourses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || course.status === statusFilter;
    const matchesType = typeFilter === "all" || course.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });
  
  // Only allow drag when no filters are active
  const isDragEnabled = searchQuery === "" && statusFilter === "all" && typeFilter === "all";

  // Calculate analytics
  const getCourseStats = (courseId) => {
    const courseProgress = allProgress.filter(p => p.course_id === courseId);
    const enrolled = courseProgress.length;
    const completed = courseProgress.filter(p => p.status === "completed").length;
    const inProgress = courseProgress.filter(p => p.status === "in_progress").length;
    return { enrolled, completed, inProgress };
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-800" },
      published: { label: "Published", className: "bg-green-100 text-green-800" },
      archived: { label: "Archived", className: "bg-orange-100 text-orange-800" },
    };
    return config[status] || config.draft;
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Course Manager</h1>
              <p className="text-[#2B2725]/70">Create and manage your courses</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowMerger(true)}
                variant="outline"
                className="border-[#D8B46B] text-[#1E3A32]"
              >
                <Merge size={16} className="mr-2" />
                Merge Courses
              </Button>
              <Button
                onClick={() => window.location.href = createPageUrl("CourseBuilder")}
                className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
              >
                <Plus size={16} className="mr-2" />
                Create Course
              </Button>
            </div>
          </div>

          {/* Quick Guide */}
          <div className="bg-[#D8B46B]/10 border-l-4 border-[#D8B46B] p-4 rounded-r">
            <h3 className="font-medium text-[#1E3A32] mb-2">💡 How to Display Courses on Programs Page</h3>
            <ol className="text-sm text-[#2B2725]/80 space-y-1 list-decimal list-inside">
              <li><strong>Publish your courses</strong> - Set status to "Published" (they'll appear in Library for enrolled students)</li>
              <li><strong>Create Products in Manager Products</strong> - For each course, create a Product and link it using the "Related Course" field</li>
              <li><strong>Set Product category</strong> - Choose "foundation", "mid_level", or "high_touch" to control where it displays</li>
              <li><strong>Optional: Create a bundle</strong> - Use "Merge Courses" to combine multiple courses, then create one Product linking to the merged course</li>
            </ol>
            <p className="text-xs text-[#2B2725]/60 mt-2">
              Courses will display like Books and Webinars - as individual cards in their category section.
            </p>
          </div>
        </div>

        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <Search size={16} />
              Courses
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 size={16} />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            {/* Stats Overview */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg border border-[#E4D9C4]">
                <p className="text-sm text-[#2B2725]/70 mb-1">Total Courses</p>
                <p className="text-3xl font-serif text-[#1E3A32]">{courses.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-[#E4D9C4]">
                <p className="text-sm text-[#2B2725]/70 mb-1">Published</p>
                <p className="text-3xl font-serif text-[#1E3A32]">{courses.filter(c => c.status === "published").length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-[#E4D9C4]">
                <p className="text-sm text-[#2B2725]/70 mb-1">Drafts</p>
                <p className="text-3xl font-serif text-[#1E3A32]">{courses.filter(c => c.status === "draft").length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-[#E4D9C4]">
                <p className="text-sm text-[#2B2725]/70 mb-1">Total Enrollments</p>
                <p className="text-3xl font-serif text-[#1E3A32]">{allProgress.length}</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg border border-[#E4D9C4] mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" size={18} />
                  <Input placeholder="Search courses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Toolkit Module">Toolkit Module</SelectItem>
                    <SelectItem value="Webinar">Webinar</SelectItem>
                    <SelectItem value="Audio-Based Program">Audio-Based Program</SelectItem>
                    <SelectItem value="Training Program">Training Program</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Course List */}
            {isLoading ? (
              <div className="text-center py-12 text-[#2B2725]/70">Loading courses...</div>
            ) : filteredCourses.length === 0 ? (
              <div className="bg-white p-12 rounded-lg border border-[#E4D9C4] text-center">
                <p className="text-[#2B2725]/70 mb-4">No courses found</p>
                <Button onClick={() => window.location.href = createPageUrl("CourseBuilder")} variant="outline">
                  <Plus size={16} className="mr-2" />Create Your First Course
                </Button>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="courses" isDropDisabled={!isDragEnabled}>
                  {(provided) => (
                    <div className="space-y-4" {...provided.droppableProps} ref={provided.innerRef}>
                      {!isDragEnabled && (
                        <p className="text-xs text-[#2B2725]/50 text-center py-1">Clear filters to enable drag-and-drop reordering</p>
                      )}
                      {filteredCourses.map((course, index) => {
                        const stats = getCourseStats(course.id);
                        const statusBadge = getStatusBadge(course.status);
                        return (
                          <Draggable key={course.id} draggableId={course.id} index={index} isDragDisabled={!isDragEnabled}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                className={`bg-white border border-[#E4D9C4] rounded-lg p-6 transition-shadow ${dragSnapshot.isDragging ? 'shadow-xl ring-2 ring-[#D8B46B]' : 'hover:shadow-md'}`}
                              >
                                <div className="flex gap-4">
                                  {isDragEnabled && (
                                    <div {...dragProvided.dragHandleProps} className="flex items-center text-[#2B2725]/30 hover:text-[#D8B46B] cursor-grab active:cursor-grabbing flex-shrink-0 mt-1">
                                      <GripVertical size={20} />
                                    </div>
                                  )}
                                  {course.thumbnail && (
                                    <img src={course.thumbnail} alt={course.title} className="w-48 h-32 object-cover rounded-lg flex-shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <h3 className="font-serif text-2xl text-[#1E3A32] mb-2">{course.title}</h3>
                                        <div className="flex gap-2 flex-wrap">
                                          <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                                          <Badge variant="outline">{course.type}</Badge>
                                          {course.difficulty && <Badge variant="outline">{course.difficulty}</Badge>}
                                          {course.visibility === "clients_only" && (
                                            <Badge className="bg-purple-100 text-purple-800">Clients Only</Badge>
                                          )}
                                        </div>
                                      </div>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm"><MoreVertical size={16} /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => navigate(createPageUrl(`CoursePreview?id=${course.id}`))}>
                                            <Monitor size={14} className="mr-2" />Preview
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => navigate(createPageUrl(`CourseBuilder?id=${course.id}`))}>
                                            <Edit size={14} className="mr-2" />Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => navigate(createPageUrl(`CoursePage?slug=${course.slug}`))}>
                                            <Eye size={14} className="mr-2" />View as Student
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => duplicateMutation.mutate(course.id)}>
                                            <Copy size={14} className="mr-2" />Duplicate
                                          </DropdownMenuItem>
                                          {course.status !== "archived" && (
                                            <DropdownMenuItem onClick={() => archiveMutation.mutate(course.id)}>
                                              <Archive size={14} className="mr-2" />Archive
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem onClick={() => handleDelete(course.id)} className="text-red-600">
                                            <Trash2 size={14} className="mr-2" />Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                    {course.short_description && (
                                      <p className="text-[#2B2725]/70 mb-4 line-clamp-2">{course.short_description}</p>
                                    )}
                                    <div className="flex gap-6 text-sm">
                                      <div><span className="text-[#2B2725]/60">Enrolled: </span><span className="font-medium text-[#1E3A32]">{stats.enrolled}</span></div>
                                      <div><span className="text-[#2B2725]/60">In Progress: </span><span className="font-medium text-[#1E3A32]">{stats.inProgress}</span></div>
                                      <div><span className="text-[#2B2725]/60">Completed: </span><span className="font-medium text-[#1E3A32]">{stats.completed}</span></div>
                                      {course.duration && (
                                        <div><span className="text-[#2B2725]/60">Duration: </span><span className="font-medium text-[#1E3A32]">{course.duration}</span></div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <CourseAnalytics courses={courses} />
          </TabsContent>
        </Tabs>

        {/* Course Merger Dialog */}
        <CourseMerger open={showMerger} onClose={() => setShowMerger(false)} />
      </div>
    </div>
  );
}