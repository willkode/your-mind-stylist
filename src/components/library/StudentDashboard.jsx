import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion } from "framer-motion";
import { BookOpen, Clock, Award, TrendingUp, CheckCircle, PlayCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function StudentDashboard({ 
  courses, 
  userProgress, 
  userLessonProgress, 
  allLessons,
  modules,
  upcomingBookings = []
}) {
  // Calculate overall stats
  const totalCourses = userProgress.length;
  const completedCourses = userProgress.filter(p => p.status === "completed").length;
  const inProgressCourses = userProgress.filter(p => p.status === "in_progress").length;
  
  const totalLessons = allLessons.length;
  const completedLessons = userLessonProgress.filter(p => p.completed).length;
  const totalWatchTime = Math.round(userLessonProgress.reduce((sum, p) => sum + (p.watch_time || 0), 0) / 60); // in minutes

  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Get active courses
  const activeCourses = userProgress
    .filter(p => p.status === "in_progress")
    .map(p => {
      const course = courses.find(c => c.id === p.course_id);
      return { ...course, progress: p };
    })
    .filter(c => c.id); // Filter out null courses

  // Get recently completed
  const recentlyCompleted = userProgress
    .filter(p => p.status === "completed")
    .sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date))
    .slice(0, 3)
    .map(p => courses.find(c => c.id === p.course_id))
    .filter(c => c);

  const getCourseModule = (courseId, lessonId) => {
    const lesson = allLessons.find(l => l.id === lessonId);
    if (!lesson) return null;
    return modules.find(m => m.id === lesson.module_id);
  };

  const getCourseStats = (courseId) => {
    const courseLessons = allLessons.filter(l => {
      const module = modules.find(m => m.id === l.module_id);
      return module?.course_id === courseId;
    });
    const completed = courseLessons.filter(l => 
      userLessonProgress.some(p => p.lesson_id === l.id && p.completed)
    ).length;
    return {
      total: courseLessons.length,
      completed
    };
  };

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm"
        >
          <BookOpen className="w-8 h-8 text-[#6E4F7D] mb-3" />
          <div className="text-3xl font-serif text-[#1E3A32] mb-1">{totalCourses}</div>
          <div className="text-sm text-[#2B2725]/70">Enrolled Courses</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-sm"
        >
          <TrendingUp className="w-8 h-8 text-[#D8B46B] mb-3" />
          <div className="text-3xl font-serif text-[#1E3A32] mb-1">{overallProgress}%</div>
          <div className="text-sm text-[#2B2725]/70">Overall Progress</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-sm"
        >
          <Clock className="w-8 h-8 text-[#A6B7A3] mb-3" />
          <div className="text-3xl font-serif text-[#1E3A32] mb-1">{totalWatchTime}</div>
          <div className="text-sm text-[#2B2725]/70">Minutes Learned</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-sm"
        >
          <Award className="w-8 h-8 text-[#1E3A32] mb-3" />
          <div className="text-3xl font-serif text-[#1E3A32] mb-1">{completedCourses}</div>
          <div className="text-sm text-[#2B2725]/70">Completed</div>
        </motion.div>
      </div>

      {/* Upcoming Sessions */}
      {upcomingBookings.length > 0 && (
        <div className="bg-gradient-to-r from-[#1E3A32] to-[#2B4A40] p-6 rounded-lg text-white">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-[#D8B46B]" />
            <h2 className="font-serif text-2xl">Upcoming Sessions</h2>
          </div>
          <div className="space-y-3">
            {upcomingBookings.slice(0, 2).map((booking) => (
              <div key={booking.id} className="bg-white/10 backdrop-blur-sm p-4 rounded">
                <p className="font-medium mb-1">{booking.service_type}</p>
                <p className="text-sm text-white/80">
                  {new Date(booking.scheduled_date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continue Learning */}
      {activeCourses.length > 0 && (
        <div>
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">Continue Learning</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {activeCourses.map((course) => {
              const stats = getCourseStats(course.id);
              const lastLesson = allLessons.find(l => l.id === course.progress.last_accessed_lesson_id);
              const module = lastLesson ? getCourseModule(course.id, lastLesson.id) : null;
              
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {course.thumbnail && (
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="font-serif text-xl text-[#1E3A32] mb-2">{course.title}</h3>
                    <p className="text-sm text-[#2B2725]/70 mb-4">
                      {lastLesson && module && `${module.title}: ${lastLesson.title}`}
                    </p>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-[#2B2725]/70 mb-2">
                        <span>{stats.completed} of {stats.total} lessons</span>
                        <span>{Math.round(course.progress.completion_percentage)}%</span>
                      </div>
                      <Progress value={course.progress.completion_percentage} className="h-2" />
                    </div>

                    <Link to={createPageUrl(`CoursePage?slug=${course.slug}`)}>
                      <Button className="w-full bg-[#1E3A32] hover:bg-[#2B2725]">
                        <PlayCircle size={16} className="mr-2" />
                        Continue
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recently Completed */}
      {recentlyCompleted.length > 0 && (
        <div>
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">Recently Completed</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {recentlyCompleted.map((course) => (
              <div key={course.id} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={20} className="text-[#A6B7A3]" />
                  <span className="text-sm text-[#A6B7A3] font-medium">Completed</span>
                </div>
                <h3 className="font-medium text-[#1E3A32] mb-2">{course.title}</h3>
                <Link to={createPageUrl(`CoursePage?slug=${course.slug}`)}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Review Course
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Courses */}
      <div>
        <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">All Your Courses</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userProgress.map((progress) => {
            const course = courses.find(c => c.id === progress.course_id);
            if (!course) return null;
            
            const stats = getCourseStats(course.id);
            
            return (
              <div key={course.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {course.thumbnail && (
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-medium text-[#1E3A32] mb-2">{course.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-[#2B2725]/60 mb-3">
                    <span>{course.type}</span>
                    {course.duration && (
                      <>
                        <span>•</span>
                        <span>{course.duration}</span>
                      </>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-[#2B2725]/70 mb-1">
                      <span>{stats.completed}/{stats.total} lessons</span>
                      <span>{Math.round(progress.completion_percentage)}%</span>
                    </div>
                    <Progress value={progress.completion_percentage} className="h-1.5" />
                  </div>

                  <Link to={createPageUrl(`CoursePage?slug=${course.slug}`)}>
                    <Button 
                      size="sm" 
                      className="w-full bg-[#1E3A32] hover:bg-[#2B2725]"
                    >
                      {progress.status === "not_started" ? "Start" : progress.status === "completed" ? "Review" : "Continue"}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}