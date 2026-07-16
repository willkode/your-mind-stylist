import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  TrendingUp, Users, Award, Heart, BookOpen, Calendar,
  BarChart, Target, Sparkles, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "../components/SEO";
import {
  BarChart as RechartsBar, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const COLORS = ['#D8B46B', '#1E3A32', '#A6B7A3', '#6E4F7D', '#2B4A40'];

export default function ManagerTransformationAnalytics() {
  const [timeframe, setTimeframe] = useState('30d'); // 30d, 90d, all

  const { data: allReflections = [] } = useQuery({
    queryKey: ["all-reflections"],
    queryFn: () => base44.entities.LearningReflection.list("-created_date")
  });

  const { data: allMilestones = [] } = useQuery({
    queryKey: ["all-milestones"],
    queryFn: () => base44.entities.Milestone.list("-unlocked_date")
  });

  const { data: allSnapshots = [] } = useQuery({
    queryKey: ["all-snapshots"],
    queryFn: () => base44.entities.TransformationSnapshot.list("-created_date")
  });

  const { data: allInsights = [] } = useQuery({
    queryKey: ["all-insights"],
    queryFn: () => base44.entities.GrowthInsight.list("-created_date")
  });

  const { data: users = [] } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => base44.entities.User.list()
  });

  const { data: allCourses = [] } = useQuery({
    queryKey: ["all-courses"],
    queryFn: () => base44.entities.Course.list()
  });

  const { data: allLessons = [] } = useQuery({
    queryKey: ["all-lessons"],
    queryFn: () => base44.entities.Lesson.list()
  });

  const { data: userProgress = [] } = useQuery({
    queryKey: ["all-course-progress"],
    queryFn: () => base44.entities.UserCourseProgress.list()
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["all-bookings"],
    queryFn: () => base44.entities.Booking.list()
  });

  // Calculate aggregate stats
  const activeUsers = users.filter(u => u.role !== 'manager').length;
  const usersWithReflections = new Set(allReflections.map(r => r.created_by)).size;
  const avgReflectionsPerUser = activeUsers > 0 ? (allReflections.length / activeUsers).toFixed(1) : 0;
  const breakthroughRate = allReflections.length > 0 
    ? ((allReflections.filter(r => r.breakthrough_tagged).length / allReflections.length) * 100).toFixed(1)
    : 0;

  // Milestone distribution
  const milestoneDistribution = allMilestones.reduce((acc, m) => {
    acc[m.milestone_type] = (acc[m.milestone_type] || 0) + 1;
    return acc;
  }, {});

  const milestoneChartData = Object.entries(milestoneDistribution).map(([type, count]) => ({
    name: type.replace(/_/g, ' '),
    value: count
  }));

  // Reflection types distribution
  const reflectionTypes = allReflections.reduce((acc, r) => {
    acc[r.reflection_type] = (acc[r.reflection_type] || 0) + 1;
    return acc;
  }, {});

  const reflectionChartData = Object.entries(reflectionTypes).map(([type, count]) => ({
    type: type.replace(/_/g, ' '),
    count
  }));

  // Monthly growth trends (last 6 months)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return date.toISOString().substring(0, 7);
  });

  const monthlyData = last6Months.map(month => {
    const reflections = allReflections.filter(r => r.created_date.startsWith(month));
    const milestones = allMilestones.filter(m => m.unlocked_date.startsWith(month));
    const snapshots = allSnapshots.filter(s => s.created_date.startsWith(month));
    
    return {
      month: new Date(month).toLocaleDateString('en-US', { month: 'short' }),
      reflections: reflections.length,
      milestones: milestones.length,
      snapshots: snapshots.length
    };
  });

  // Average emotional scores from snapshots
  const avgEmotionalScores = {
    calm: allSnapshots.reduce((sum, s) => sum + (s.calm_score || 0), 0) / allSnapshots.length || 0,
    grounded: allSnapshots.reduce((sum, s) => sum + (s.grounded_score || 0), 0) / allSnapshots.length || 0,
    open: allSnapshots.reduce((sum, s) => sum + (s.open_score || 0), 0) / allSnapshots.length || 0,
    energy: allSnapshots.reduce((sum, s) => sum + (s.energy_level || 0), 0) / allSnapshots.length || 0
  };

  // Top insights categories
  const insightCategories = allInsights.reduce((acc, i) => {
    acc[i.insight_category] = (acc[i.insight_category] || 0) + 1;
    return acc;
  }, {});

  const insightCategoryData = Object.entries(insightCategories).map(([category, count]) => ({
    category,
    count
  }));

  // Helpful insights rate
  const ratedInsights = allInsights.filter(i => i.helpful !== null && i.helpful !== undefined);
  const helpfulRate = ratedInsights.length > 0
    ? ((ratedInsights.filter(i => i.helpful).length / ratedInsights.length) * 100).toFixed(1)
    : 0;

  // PROGRAM EFFECTIVENESS ANALYTICS

  // Course effectiveness - which courses drive most reflections/breakthroughs
  const courseEffectiveness = allCourses.map(course => {
    const courseReflections = allReflections.filter(r => 
      r.reflection_type === 'lesson' && 
      allLessons.some(lesson => lesson.module_id?.startsWith(course.id) && r.related_id === lesson.id)
    );
    const breakthroughs = courseReflections.filter(r => r.breakthrough_tagged);
    const enrollments = userProgress.filter(p => p.course_id === course.id);
    const completions = enrollments.filter(p => p.status === 'completed');
    
    return {
      title: course.title,
      reflections: courseReflections.length,
      breakthroughs: breakthroughs.length,
      enrollments: enrollments.length,
      completions: completions.length,
      completionRate: enrollments.length > 0 ? ((completions.length / enrollments.length) * 100).toFixed(0) : 0,
      breakthroughRate: courseReflections.length > 0 ? ((breakthroughs.length / courseReflections.length) * 100).toFixed(0) : 0,
      avgReflectionsPerStudent: enrollments.length > 0 ? (courseReflections.length / enrollments.length).toFixed(1) : 0
    };
  }).filter(c => c.enrollments > 0).sort((a, b) => b.reflections - a.reflections);

  // Session type effectiveness - consultations vs courses vs pauses
  const sessionTypeData = [
    {
      type: 'Private Sessions',
      reflections: allReflections.filter(r => r.reflection_type === 'consultation').length,
      breakthroughs: allReflections.filter(r => r.reflection_type === 'consultation' && r.breakthrough_tagged).length,
      totalSessions: bookings.filter(b => b.booking_status === 'completed').length
    },
    {
      type: 'Course Lessons',
      reflections: allReflections.filter(r => r.reflection_type === 'lesson').length,
      breakthroughs: allReflections.filter(r => r.reflection_type === 'lesson' && r.breakthrough_tagged).length,
      totalSessions: allReflections.filter(r => r.reflection_type === 'lesson').length
    },
    {
      type: 'Style Pauses',
      reflections: allReflections.filter(r => r.reflection_type === 'style_pause').length,
      breakthroughs: allReflections.filter(r => r.reflection_type === 'style_pause' && r.breakthrough_tagged).length,
      totalSessions: allReflections.filter(r => r.reflection_type === 'style_pause').length
    }
  ].map(s => ({
    ...s,
    breakthroughRate: s.reflections > 0 ? ((s.breakthroughs / s.reflections) * 100).toFixed(0) : 0
  }));

  // Most impactful content (top 10 lessons by breakthroughs)
  const lessonImpact = {};
  allReflections.forEach(r => {
    if (r.reflection_type === 'lesson' && r.related_title) {
      if (!lessonImpact[r.related_title]) {
        lessonImpact[r.related_title] = {
          title: r.related_title,
          reflections: 0,
          breakthroughs: 0,
          avgMoodShift: []
        };
      }
      lessonImpact[r.related_title].reflections++;
      if (r.breakthrough_tagged) lessonImpact[r.related_title].breakthroughs++;
      
      // Calculate mood shift if both moods exist
      const moodValues = {
        'joyful': 9, 'grateful': 9, 'energized': 8, 'content': 7, 'calm': 6,
        'neutral': 5, 'tired': 4, 'anxious': 3, 'frustrated': 2, 'sad': 1
      };
      if (r.mood_before && r.mood_after) {
        const shift = (moodValues[r.mood_after] || 5) - (moodValues[r.mood_before] || 5);
        lessonImpact[r.related_title].avgMoodShift.push(shift);
      }
    }
  });

  const topLessons = Object.values(lessonImpact)
    .map(l => ({
      ...l,
      avgMoodShift: l.avgMoodShift.length > 0 
        ? (l.avgMoodShift.reduce((a, b) => a + b, 0) / l.avgMoodShift.length).toFixed(1)
        : 0
    }))
    .sort((a, b) => b.breakthroughs - a.breakthroughs)
    .slice(0, 10);

  // Transformation trajectory - users who started vs now
  const snapshotsWithBeforeAfter = {};
  allSnapshots.forEach(s => {
    if (!snapshotsWithBeforeAfter[s.created_by]) {
      snapshotsWithBeforeAfter[s.created_by] = [];
    }
    snapshotsWithBeforeAfter[s.created_by].push(s);
  });

  const transformationTrajectories = Object.values(snapshotsWithBeforeAfter)
    .filter(snapshots => snapshots.length >= 2)
    .map(snapshots => {
      const sorted = snapshots.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      
      return {
        calmImprovement: (last.calm_score || 0) - (first.calm_score || 0),
        groundedImprovement: (last.grounded_score || 0) - (first.grounded_score || 0),
        openImprovement: (last.open_score || 0) - (first.open_score || 0),
        energyImprovement: (last.energy_level || 0) - (first.energy_level || 0)
      };
    });

  const avgImprovement = transformationTrajectories.length > 0 ? {
    calm: (transformationTrajectories.reduce((sum, t) => sum + t.calmImprovement, 0) / transformationTrajectories.length).toFixed(1),
    grounded: (transformationTrajectories.reduce((sum, t) => sum + t.groundedImprovement, 0) / transformationTrajectories.length).toFixed(1),
    open: (transformationTrajectories.reduce((sum, t) => sum + t.openImprovement, 0) / transformationTrajectories.length).toFixed(1),
    energy: (transformationTrajectories.reduce((sum, t) => sum + t.energyImprovement, 0) / transformationTrajectories.length).toFixed(1)
  } : { calm: 0, grounded: 0, open: 0, energy: 0 };

  return (
    <>
      <SEO
        title="Transformation Analytics - Manager Dashboard"
        description="View aggregate transformation data and program impact across all users."
      />
      <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">
                  Transformation Analytics
                </h1>
                <p className="text-[#2B2725]/70">
                  See how your programs are creating lasting change
                </p>
              </div>
              <Button
                variant="outline"
                className="border-[#1E3A32] text-[#1E3A32]"
              >
                <Download size={18} className="mr-2" />
                Export Report
              </Button>
            </div>
          </motion.div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {[
              { 
                label: "Active Users", 
                value: activeUsers, 
                icon: Users, 
                color: "#1E3A32",
                subtext: `${usersWithReflections} reflecting`
              },
              { 
                label: "Total Reflections", 
                value: allReflections.length, 
                icon: Heart, 
                color: "#D8B46B",
                subtext: `${avgReflectionsPerUser} avg/user`
              },
              { 
                label: "Milestones Achieved", 
                value: allMilestones.length, 
                icon: Award, 
                color: "#A6B7A3",
                subtext: `${breakthroughRate}% breakthrough rate`
              },
              { 
                label: "Transformation Snapshots", 
                value: allSnapshots.length, 
                icon: Target, 
                color: "#6E4F7D",
                subtext: "Emotional tracking"
              }
            ].map((metric) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-xl shadow-md"
              >
                <metric.icon size={28} style={{ color: metric.color }} className="mb-4" />
                <p className="text-4xl font-bold text-[#1E3A32] mb-2">{metric.value}</p>
                <p className="text-sm text-[#2B2725] mb-1">{metric.label}</p>
                <p className="text-xs text-[#2B2725]/50">{metric.subtext}</p>
              </motion.div>
            ))}
          </div>

          {/* Growth Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-8 shadow-md mb-8"
          >
            <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">
              6-Month Activity Trends
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4D9C4" />
                <XAxis dataKey="month" tick={{ fill: '#2B2725', fontSize: 12 }} />
                <YAxis tick={{ fill: '#2B2725', fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="reflections" stroke="#D8B46B" strokeWidth={2} name="Reflections" />
                <Line type="monotone" dataKey="milestones" stroke="#1E3A32" strokeWidth={2} name="Milestones" />
                <Line type="monotone" dataKey="snapshots" stroke="#A6B7A3" strokeWidth={2} name="Snapshots" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Milestone Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-8 shadow-md"
            >
              <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">
                Milestone Types
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={milestoneChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {milestoneChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Reflection Types */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-8 shadow-md"
            >
              <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">
                Reflection Types
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBar data={reflectionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4D9C4" />
                  <XAxis dataKey="type" tick={{ fill: '#2B2725', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#2B2725', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#D8B46B" />
                </RechartsBar>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Average Emotional Scores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-8 shadow-md mb-8"
          >
            <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">
              Average Emotional Scores (All Users)
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { label: "Calm", value: avgEmotionalScores.calm.toFixed(0), max: 100 },
                { label: "Grounded", value: avgEmotionalScores.grounded.toFixed(0), max: 100 },
                { label: "Open", value: avgEmotionalScores.open.toFixed(0), max: 100 },
                { label: "Energy", value: avgEmotionalScores.energy.toFixed(1), max: 10 }
              ].map((score) => (
                <div key={score.label} className="text-center">
                  <p className="text-4xl font-bold text-[#1E3A32] mb-2">
                    {score.value}
                    <span className="text-lg text-[#2B2725]/50">/{score.max}</span>
                  </p>
                  <p className="text-sm text-[#2B2725]/70">{score.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Program Effectiveness - Which programs drive transformation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#1E3A32] to-[#2B4A40] rounded-xl p-8 shadow-lg mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Sparkles size={28} className="text-[#D8B46B]" />
              <h2 className="font-serif text-3xl text-[#F9F5EF]">
                Program Effectiveness
              </h2>
            </div>
            <p className="text-[#F9F5EF]/80 mb-8">
              Discover which courses and sessions create the deepest transformation
            </p>

            {/* Course Leaderboard */}
            {courseEffectiveness.length > 0 && (
              <div className="mb-8">
                <h3 className="text-[#D8B46B] text-sm tracking-wider uppercase mb-4">
                  Top Performing Courses
                </h3>
                <div className="space-y-3">
                  {courseEffectiveness.slice(0, 5).map((course, idx) => (
                    <div key={course.title} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[#D8B46B] font-bold text-lg">#{idx + 1}</span>
                            <h4 className="text-[#F9F5EF] font-medium">{course.title}</h4>
                          </div>
                          <p className="text-[#F9F5EF]/60 text-sm">
                            {course.enrollments} students • {course.completionRate}% completion rate
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-[#F9F5EF]">{course.reflections}</p>
                          <p className="text-xs text-[#F9F5EF]/60">Reflections</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-[#D8B46B]">{course.breakthroughs}</p>
                          <p className="text-xs text-[#F9F5EF]/60">Breakthroughs</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-[#F9F5EF]">{course.avgReflectionsPerStudent}</p>
                          <p className="text-xs text-[#F9F5EF]/60">Avg/Student</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Session Type Comparison */}
            <div className="grid md:grid-cols-3 gap-4">
              {sessionTypeData.map(type => (
                <div key={type.type} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                  <h4 className="text-[#F9F5EF] font-medium mb-4">{type.type}</h4>
                  <p className="text-3xl font-bold text-[#D8B46B] mb-2">{type.breakthroughRate}%</p>
                  <p className="text-sm text-[#F9F5EF]/70 mb-3">Breakthrough Rate</p>
                  <div className="flex justify-around text-xs">
                    <div>
                      <p className="text-[#F9F5EF] font-bold">{type.reflections}</p>
                      <p className="text-[#F9F5EF]/60">Reflections</p>
                    </div>
                    <div>
                      <p className="text-[#F9F5EF] font-bold">{type.breakthroughs}</p>
                      <p className="text-[#F9F5EF]/60">Breakthroughs</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Average Improvement Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-8 shadow-md mb-8"
          >
            <h2 className="font-serif text-2xl text-[#1E3A32] mb-6 flex items-center gap-2">
              <TrendingUp size={24} className="text-[#D8B46B]" />
              Average User Improvement
            </h2>
            <p className="text-[#2B2725]/70 mb-6">
              Comparing first snapshot to most recent for users with multiple check-ins
            </p>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { label: "Calm Score", value: avgImprovement.calm, color: "#D8B46B" },
                { label: "Grounded Score", value: avgImprovement.grounded, color: "#1E3A32" },
                { label: "Open Score", value: avgImprovement.open, color: "#A6B7A3" },
                { label: "Energy Level", value: avgImprovement.energy, color: "#6E4F7D" }
              ].map(metric => (
                <div key={metric.label} className="text-center p-4 rounded-lg" style={{ backgroundColor: `${metric.color}10` }}>
                  <p className="text-4xl font-bold mb-2" style={{ color: metric.color }}>
                    {metric.value > 0 ? '+' : ''}{metric.value}
                  </p>
                  <p className="text-sm text-[#2B2725]/70">{metric.label}</p>
                  <p className="text-xs text-[#2B2725]/50 mt-1">Avg improvement</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-[#F9F5EF] rounded-lg text-center">
              <p className="text-sm text-[#2B2725]/80">
                📊 Based on {transformationTrajectories.length} users with 2+ snapshots
              </p>
            </div>
          </motion.div>

          {/* Most Impactful Lessons */}
          {topLessons.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-8 shadow-md mb-8"
            >
              <h2 className="font-serif text-2xl text-[#1E3A32] mb-6 flex items-center gap-2">
                <BookOpen size={24} className="text-[#6E4F7D]" />
                Most Impactful Content
              </h2>
              <p className="text-[#2B2725]/70 mb-6">
                Lessons generating the most breakthroughs and emotional shifts
              </p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E4D9C4]">
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#2B2725]/70">Lesson</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-[#2B2725]/70">Reflections</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-[#2B2725]/70">Breakthroughs</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-[#2B2725]/70">Avg Mood Shift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topLessons.map((lesson, idx) => (
                      <tr key={lesson.title} className="border-b border-[#E4D9C4]/50 hover:bg-[#F9F5EF] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[#D8B46B] font-bold">#{idx + 1}</span>
                            <span className="text-sm text-[#1E3A32]">{lesson.title}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4 text-[#2B2725]">{lesson.reflections}</td>
                        <td className="text-center py-3 px-4">
                          <span className="font-bold text-[#D8B46B]">{lesson.breakthroughs}</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`font-medium ${lesson.avgMoodShift > 0 ? 'text-green-600' : 'text-[#2B2725]/60'}`}>
                            {lesson.avgMoodShift > 0 ? '+' : ''}{lesson.avgMoodShift}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* AI Insights Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-8 shadow-md"
          >
            <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">
              AI Insights Performance
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-[#1E3A32] mb-2">{allInsights.length}</p>
                <p className="text-sm text-[#2B2725]/70">Insights Generated</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-[#1E3A32] mb-2">{helpfulRate}%</p>
                <p className="text-sm text-[#2B2725]/70">Marked Helpful</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-[#1E3A32] mb-2">
                  {allInsights.filter(i => i.viewed).length}
                </p>
                <p className="text-sm text-[#2B2725]/70">Viewed</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsBar data={insightCategoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4D9C4" />
                <XAxis dataKey="category" tick={{ fill: '#2B2725', fontSize: 11 }} />
                <YAxis tick={{ fill: '#2B2725', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6E4F7D" />
              </RechartsBar>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </>
  );
}