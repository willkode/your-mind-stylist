import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, TrendingUp, Award, AlertTriangle, Clock, RefreshCcw, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function ManagerCourseAnalytics() {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  // Fetch courses
  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list("-created_date"),
  });

  // Fetch analytics for selected course
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["courseAnalytics", selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return null;
      const analytics = await base44.entities.CourseAnalytics.filter({ course_id: selectedCourseId });
      return analytics[0] || null;
    },
    enabled: !!selectedCourseId,
  });

  // Recalculate analytics
  const recalculateMutation = useMutation({
    mutationFn: (courseId) => base44.functions.invoke("calculateCourseAnalytics", { course_id: courseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courseAnalytics"] });
      toast.success("Analytics updated!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to calculate analytics");
    },
  });

  const handleRecalculate = () => {
    if (selectedCourseId) {
      recalculateMutation.mutate(selectedCourseId);
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const COLORS = {
    primary: "#1E3A32",
    secondary: "#D8B46B",
    success: "#A6B7A3",
    warning: "#E57373",
    info: "#6E4F7D",
  };

  const progressColors = ["#E57373", "#FFB74D", "#FFF176", "#AED581", "#81C784"];

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Course Analytics</h1>
          <p className="text-[#2B2725]/70">Track student progress, quiz performance, and completion rates</p>
        </div>

        {/* Course Selection */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Select value={selectedCourseId || ""} onValueChange={setSelectedCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course to analyze" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedCourseId && (
                <Button
                  onClick={handleRecalculate}
                  disabled={recalculateMutation.isPending}
                  variant="outline"
                >
                  {recalculateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <RefreshCcw size={16} className="mr-2" />
                      Recalculate
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Display */}
        {!selectedCourseId ? (
          <div className="text-center py-20">
            <Users size={64} className="mx-auto text-[#D8B46B]/30 mb-4" />
            <p className="text-[#2B2725]/60 text-lg">Select a course to view analytics</p>
          </div>
        ) : analyticsLoading ? (
          <div className="text-center py-20">
            <Loader2 size={48} className="mx-auto animate-spin text-[#D8B46B]" />
            <p className="text-[#2B2725]/60 mt-4">Loading analytics...</p>
          </div>
        ) : !analyticsData ? (
          <div className="text-center py-20">
            <AlertTriangle size={64} className="mx-auto text-[#D8B46B]/30 mb-4" />
            <p className="text-[#2B2725]/60 text-lg mb-4">No analytics data yet</p>
            <Button onClick={handleRecalculate} disabled={recalculateMutation.isPending}>
              Calculate Analytics
            </Button>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#2B2725]/60">Total Enrolled</p>
                      <p className="text-3xl font-bold text-[#1E3A32]">{analyticsData.total_enrolled}</p>
                    </div>
                    <Users size={32} className="text-[#D8B46B]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#2B2725]/60">Completion Rate</p>
                      <p className="text-3xl font-bold text-[#1E3A32]">
                        {analyticsData.completion_rate.toFixed(1)}%
                      </p>
                    </div>
                    <Award size={32} className="text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#2B2725]/60">Avg Completion Time</p>
                      <p className="text-3xl font-bold text-[#1E3A32]">
                        {analyticsData.avg_completion_days.toFixed(0)}d
                      </p>
                    </div>
                    <Clock size={32} className="text-[#6E4F7D]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#2B2725]/60">In Progress</p>
                      <p className="text-3xl font-bold text-[#1E3A32]">
                        {analyticsData.in_progress_count}
                      </p>
                    </div>
                    <TrendingUp size={32} className="text-[#A6B7A3]" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="modules">Module Performance</TabsTrigger>
                <TabsTrigger value="lessons">Lesson Drop-off</TabsTrigger>
                <TabsTrigger value="quizzes">Quiz Analytics</TabsTrigger>
                <TabsTrigger value="engagement">Engagement</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Progress Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Progress Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={Object.entries(analyticsData.progress_distribution).map(([range, count]) => ({
                              name: range,
                              value: count,
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {Object.entries(analyticsData.progress_distribution).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={progressColors[index % progressColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Daily Engagement (Last 7 Days) */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Engagement (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analyticsData.daily_engagement.slice(-7)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="started" stroke={COLORS.secondary} name="Started" />
                          <Line type="monotone" dataKey="completed" stroke={COLORS.success} name="Completed" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Module Performance Tab */}
              <TabsContent value="modules">
                <Card>
                  <CardHeader>
                    <CardTitle>Module Completion Rates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={analyticsData.module_stats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="module_title" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="started_count" fill={COLORS.info} name="Started" />
                        <Bar dataKey="completed_count" fill={COLORS.success} name="Completed" />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-6 space-y-3">
                      {analyticsData.module_stats.map((module) => (
                        <div key={module.module_id} className="border-l-4 pl-4" style={{ borderColor: COLORS.secondary }}>
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-medium text-[#1E3A32]">{module.module_title}</h4>
                            <span className="text-sm font-medium text-[#D8B46B]">
                              {module.completion_rate.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-sm text-[#2B2725]/60">
                            {module.completed_count} / {module.started_count} completed • {module.total_lessons} lessons
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Lesson Drop-off Tab */}
              <TabsContent value="lessons">
                <Card>
                  <CardHeader>
                    <CardTitle>Lesson Drop-off Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analyticsData.lesson_stats
                        .sort((a, b) => b.drop_off_rate - a.drop_off_rate)
                        .slice(0, 15)
                        .map((lesson) => (
                          <motion.div
                            key={lesson.lesson_id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`border-l-4 pl-4 py-3 ${
                              lesson.drop_off_rate > 50 ? "border-red-500 bg-red-50" : 
                              lesson.drop_off_rate > 30 ? "border-orange-500 bg-orange-50" : 
                              "border-green-500 bg-green-50"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-[#1E3A32]">{lesson.lesson_title}</h4>
                              <div className="text-right">
                                <span className={`text-lg font-bold ${
                                  lesson.drop_off_rate > 50 ? "text-red-600" :
                                  lesson.drop_off_rate > 30 ? "text-orange-600" :
                                  "text-green-600"
                                }`}>
                                  {lesson.drop_off_rate.toFixed(1)}%
                                </span>
                                <p className="text-xs text-[#2B2725]/60">drop-off</p>
                              </div>
                            </div>
                            <div className="flex gap-6 text-sm text-[#2B2725]/70">
                              <span>Started: {lesson.started_count}</span>
                              <span>Completed: {lesson.completed_count}</span>
                              <span>Avg Progress: {lesson.avg_progress.toFixed(0)}%</span>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Quiz Analytics Tab */}
              <TabsContent value="quizzes">
                <div className="space-y-6">
                  {/* Quiz Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quiz Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsData.quiz_stats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="quiz_title" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="avg_score" fill={COLORS.secondary} name="Avg Score (%)" />
                          <Bar dataKey="pass_rate" fill={COLORS.success} name="Pass Rate (%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Difficult Questions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle size={20} className="text-orange-600" />
                        Most Difficult Questions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analyticsData.difficult_questions.length === 0 ? (
                        <p className="text-center py-8 text-[#2B2725]/60">
                          Not enough quiz data yet
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {analyticsData.difficult_questions.map((q, idx) => (
                            <div key={q.question_id} className="border-l-4 border-orange-500 pl-4 py-2">
                              <div className="flex justify-between items-start mb-1">
                                <p className="text-sm font-medium text-[#1E3A32]">
                                  {idx + 1}. {q.question_text}
                                </p>
                                <span className="text-lg font-bold text-orange-600 ml-4">
                                  {q.correct_rate.toFixed(0)}%
                                </span>
                              </div>
                              <div className="flex gap-4 text-xs text-[#2B2725]/60">
                                <span>Quiz: {q.quiz_title}</span>
                                <span>Answered: {q.times_answered}</span>
                                <span>Correct: {q.times_correct}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Engagement Tab */}
              <TabsContent value="engagement">
                <Card>
                  <CardHeader>
                    <CardTitle>30-Day Engagement Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={analyticsData.daily_engagement}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="started" stroke={COLORS.info} name="Started" strokeWidth={2} />
                        <Line type="monotone" dataKey="completed" stroke={COLORS.success} name="Completed" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>

                    <div className="mt-6 grid md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-[#F9F5EF] rounded-lg">
                        <p className="text-2xl font-bold text-[#1E3A32]">
                          {analyticsData.daily_engagement.reduce((sum, day) => sum + day.started, 0)}
                        </p>
                        <p className="text-sm text-[#2B2725]/60">Total Starts (30d)</p>
                      </div>
                      <div className="text-center p-4 bg-[#F9F5EF] rounded-lg">
                        <p className="text-2xl font-bold text-[#1E3A32]">
                          {analyticsData.daily_engagement.reduce((sum, day) => sum + day.completed, 0)}
                        </p>
                        <p className="text-sm text-[#2B2725]/60">Total Completions (30d)</p>
                      </div>
                      <div className="text-center p-4 bg-[#F9F5EF] rounded-lg">
                        <p className="text-2xl font-bold text-[#1E3A32]">
                          {(analyticsData.daily_engagement.reduce((sum, day) => sum + day.started, 0) / 30).toFixed(1)}
                        </p>
                        <p className="text-sm text-[#2B2725]/60">Avg Daily Starts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}