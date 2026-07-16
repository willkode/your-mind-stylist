import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, TrendingUp, Clock, Award, BarChart3, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function CourseAnalytics({ courses }) {
  const { data: allProgress = [] } = useQuery({
    queryKey: ["allCourseProgress"],
    queryFn: () => base44.entities.UserCourseProgress.list(),
  });

  const { data: allLessonProgress = [] } = useQuery({
    queryKey: ["allLessonProgress"],
    queryFn: () => base44.entities.UserLessonProgress.list(),
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["allModules"],
    queryFn: () => base44.entities.Module.list(),
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["allLessons"],
    queryFn: () => base44.entities.Lesson.list(),
  });

  // Overall stats
  const totalEnrollments = allProgress.length;
  const completedEnrollments = allProgress.filter(p => p.status === "completed").length;
  const inProgressEnrollments = allProgress.filter(p => p.status === "in_progress").length;
  const completionRate = totalEnrollments > 0 ? ((completedEnrollments / totalEnrollments) * 100).toFixed(1) : 0;

  const totalWatchTime = Math.round(allLessonProgress.reduce((sum, p) => sum + (p.watch_time || 0), 0) / 3600); // in hours

  // Course-specific analytics
  const getCourseAnalytics = (courseId) => {
    const courseProgress = allProgress.filter(p => p.course_id === courseId);
    const enrolled = courseProgress.length;
    const completed = courseProgress.filter(p => p.status === "completed").length;
    const inProgress = courseProgress.filter(p => p.status === "in_progress").length;
    const avgCompletion = enrolled > 0 
      ? courseProgress.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / enrolled 
      : 0;

    const courseLessons = lessons.filter(l => {
      const module = modules.find(m => m.id === l.module_id);
      return module?.course_id === courseId;
    });

    const lessonCompletions = courseLessons.reduce((sum, lesson) => {
      return sum + allLessonProgress.filter(p => p.lesson_id === lesson.id && p.completed).length;
    }, 0);

    return {
      enrolled,
      completed,
      inProgress,
      avgCompletion: Math.round(avgCompletion),
      engagementRate: courseLessons.length > 0 ? Math.round((lessonCompletions / (courseLessons.length * enrolled)) * 100) : 0
    };
  };

  // Top performing courses
  const coursesWithStats = courses.map(course => ({
    ...course,
    analytics: getCourseAnalytics(course.id)
  })).sort((a, b) => b.analytics.enrolled - a.analytics.enrolled);

  return (
    <div className="space-y-8">
      {/* Overall Metrics */}
      <div>
        <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Overall Performance</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <Users className="w-8 h-8 text-[#6E4F7D] mb-3" />
            <div className="text-3xl font-serif text-[#1E3A32] mb-1">{totalEnrollments}</div>
            <div className="text-sm text-[#2B2725]/70">Total Enrollments</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <TrendingUp className="w-8 h-8 text-[#2D8CFF] mb-3" />
            <div className="text-3xl font-serif text-[#1E3A32] mb-1">{inProgressEnrollments}</div>
            <div className="text-sm text-[#2B2725]/70">In Progress</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <CheckCircle className="w-8 h-8 text-[#A6B7A3] mb-3" />
            <div className="text-3xl font-serif text-[#1E3A32] mb-1">{completedEnrollments}</div>
            <div className="text-sm text-[#2B2725]/70">Completed</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <Award className="w-8 h-8 text-[#D8B46B] mb-3" />
            <div className="text-3xl font-serif text-[#1E3A32] mb-1">{completionRate}%</div>
            <div className="text-sm text-[#2B2725]/70">Completion Rate</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <Clock className="w-8 h-8 text-[#1E3A32] mb-3" />
            <div className="text-3xl font-serif text-[#1E3A32] mb-1">{totalWatchTime}h</div>
            <div className="text-sm text-[#2B2725]/70">Watch Time</div>
          </motion.div>
        </div>
      </div>

      {/* Course Performance Table */}
      <div>
        <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Course Performance</h2>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F9F5EF] border-b border-[#E4D9C4]">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-[#1E3A32]">Course</th>
                  <th className="text-center p-4 text-sm font-medium text-[#1E3A32]">Enrolled</th>
                  <th className="text-center p-4 text-sm font-medium text-[#1E3A32]">In Progress</th>
                  <th className="text-center p-4 text-sm font-medium text-[#1E3A32]">Completed</th>
                  <th className="text-center p-4 text-sm font-medium text-[#1E3A32]">Avg. Progress</th>
                  <th className="text-center p-4 text-sm font-medium text-[#1E3A32]">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {coursesWithStats.map((course) => (
                  <tr key={course.id} className="border-b border-[#E4D9C4] hover:bg-[#F9F5EF] transition-colors">
                    <td className="p-4">
                      <Link 
                        to={createPageUrl(`CourseBuilder?id=${course.id}`)}
                        className="hover:text-[#D8B46B] transition-colors"
                      >
                        <div className="font-medium text-[#1E3A32]">{course.title}</div>
                        <div className="text-xs text-[#2B2725]/60">{course.type}</div>
                      </Link>
                    </td>
                    <td className="p-4 text-center">
                      <div className="text-xl font-serif text-[#1E3A32]">{course.analytics.enrolled}</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="text-[#2B2725]/70">{course.analytics.inProgress}</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="text-[#A6B7A3] font-medium">{course.analytics.completed}</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={course.analytics.avgCompletion} className="w-20 h-2" />
                        <span className="text-sm text-[#2B2725]/70 tabular-nums">{course.analytics.avgCompletion}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        course.analytics.engagementRate >= 70 
                          ? "bg-green-100 text-green-800"
                          : course.analytics.engagementRate >= 40
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {course.analytics.engagementRate}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}