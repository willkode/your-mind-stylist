import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Sparkles, Calendar, TrendingUp, Heart, BookOpen, 
  Award, Target, Zap, Camera, ChevronDown, ChevronUp, Lightbulb, Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "../components/SEO";
import InsightsPanel from "../components/transformation/InsightsPanel";
import JourneyMap from "../components/transformation/JourneyMap";
import { format } from "date-fns";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

const MOOD_EMOJIS = {
  joyful: "😊", content: "😌", calm: "😇", neutral: "😐",
  anxious: "😰", sad: "😢", frustrated: "😤", energized: "⚡",
  tired: "😴", grateful: "🙏"
};

const MILESTONE_ICONS = {
  consistency: Calendar,
  emotional_shift: Heart,
  learning: BookOpen,
  engagement: Target,
  breakthrough: Sparkles,
  custom: Award
};

export default function TransformationStory() {
  const [user, setUser] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState("all"); // all, 30d, 90d, year
  const [expandedSections, setExpandedSections] = useState({
    journey: true,
    timeline: false,
    trends: true,
    milestones: true,
    snapshots: false
  });

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: reflections = [] } = useQuery({
    queryKey: ["reflections", user?.id],
    queryFn: () => base44.entities.LearningReflection.list("-created_date"),
    enabled: !!user
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ["milestones", user?.id],
    queryFn: () => base44.entities.Milestone.list("-unlocked_date"),
    enabled: !!user
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ["snapshots", user?.id],
    queryFn: () => base44.entities.TransformationSnapshot.list("-created_date"),
    enabled: !!user
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["check-ins", user?.id],
    queryFn: () => base44.entities.DailyStyleCheck.list("-created_date", 100),
    enabled: !!user
  });

  const { data: insights = [], refetch: refetchInsights } = useQuery({
    queryKey: ["insights", user?.id],
    queryFn: () => base44.entities.GrowthInsight.filter({}, "-created_date"),
    enabled: !!user
  });

  const handleGenerateInsights = async () => {
    await base44.functions.invoke('generateGrowthInsights', {});
    refetchInsights();
  };

  // Calculate emotional trends from check-ins
  const emotionalTrends = checkIns
    .filter(c => c.state_key === 'calm_activated')
    .slice(0, 30)
    .reverse()
    .map(c => ({
      date: format(new Date(c.created_date), 'MMM d'),
      calm: c.state_value,
      energy: checkIns.find(ci => 
        ci.created_date === c.created_date && ci.state_key === 'energy_level'
      )?.state_value || 50
    }));

  // Latest snapshot radar data
  const latestSnapshot = snapshots[0];
  const radarData = latestSnapshot ? [
    { dimension: 'Calm', value: latestSnapshot.calm_score },
    { dimension: 'Grounded', value: latestSnapshot.grounded_score },
    { dimension: 'Open', value: latestSnapshot.open_score },
    { dimension: 'Energy', value: latestSnapshot.energy_level * 10 }
  ] : [];

  // Build unified timeline
  const timelineEvents = [
    ...reflections.map(r => ({
      type: r.breakthrough_tagged ? 'breakthrough' : 'reflection',
      date: r.created_date,
      title: r.related_title || 'Personal Reflection',
      preview: r.what_shifted,
      tags: r.tags,
      data: r
    })),
    ...milestones.map(m => ({
      type: 'milestone',
      date: m.unlocked_date,
      title: m.milestone_name,
      preview: m.milestone_description,
      data: m
    })),
    ...snapshots.map(s => ({
      type: 'snapshot',
      date: s.created_date,
      title: `${s.snapshot_type.replace(/_/g, ' ')} - ${s.related_title || ''}`,
      preview: s.notes || s.intentions,
      data: s
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!user) {
    return <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A32]"></div>
    </div>;
  }

  return (
    <>
      <SEO
        title="Your Transformation Story - Your Mind Stylist"
        description="Track your emotional growth, milestones, and personal transformation journey."
      />
      <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D8B46B]/20 rounded-full mb-4">
              <Sparkles size={16} className="text-[#D8B46B]" />
              <span className="text-[#D8B46B] text-sm font-medium tracking-wide uppercase">
                Your Journey
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32] mb-4">
              Your Transformation Story
            </h1>
            <p className="text-[#2B2725]/70 text-lg max-w-2xl mx-auto">
              Every check-in, every lesson, every breakthrough—this is your evolution.
            </p>
          </motion.div>

          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Lightbulb size={28} className="text-[#D8B46B]" />
                <h2 className="font-serif text-3xl text-[#1E3A32]">
                  Your Insights
                </h2>
              </div>
              <Button
                onClick={handleGenerateInsights}
                variant="outline"
                className="border-[#D8B46B] text-[#D8B46B] hover:bg-[#D8B46B] hover:text-[#1E3A32]"
              >
                <Sparkles size={16} className="mr-2" />
                Generate New Insights
              </Button>
            </div>
            <InsightsPanel insights={insights} onRefresh={handleGenerateInsights} />
          </motion.div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            {[
              { label: "Reflections", count: reflections.length, icon: Heart, color: "#D8B46B" },
              { label: "Milestones", count: milestones.length, icon: Award, color: "#1E3A32" },
              { label: "Snapshots", count: snapshots.length, icon: Camera, color: "#A6B7A3" },
              { label: "Check-ins", count: checkIns.length, icon: Calendar, color: "#6E4F7D" }
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-lg shadow-sm"
              >
                <stat.icon size={24} style={{ color: stat.color }} className="mb-3" />
                <p className="text-3xl font-bold text-[#1E3A32] mb-1">{stat.count}</p>
                <p className="text-sm text-[#2B2725]/60">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Current State Radar */}
          {latestSnapshot && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-8 shadow-md mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl text-[#1E3A32] mb-2">
                    Current State
                  </h2>
                  <p className="text-sm text-[#2B2725]/60">
                    Latest snapshot from {format(new Date(latestSnapshot.created_date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-4xl">{MOOD_EMOJIS[latestSnapshot.overall_mood]}</div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E4D9C4" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: '#2B2725', fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#2B2725', fontSize: 10 }} />
                  <Radar name="Current State" dataKey="value" stroke="#1E3A32" fill="#D8B46B" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Emotional Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-md mb-8 overflow-hidden"
          >
            <button
              onClick={() => toggleSection('trends')}
              className="w-full p-6 flex items-center justify-between hover:bg-[#F9F5EF] transition-colors"
            >
              <div className="flex items-center gap-3">
                <TrendingUp size={24} className="text-[#D8B46B]" />
                <h2 className="font-serif text-2xl text-[#1E3A32]">Emotional Trends</h2>
              </div>
              {expandedSections.trends ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.trends && emotionalTrends.length > 0 && (
              <div className="p-6 pt-0">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={emotionalTrends}>
                    <defs>
                      <linearGradient id="calmGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D8B46B" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#D8B46B" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A6B7A3" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#A6B7A3" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4D9C4" />
                    <XAxis dataKey="date" tick={{ fill: '#2B2725', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#2B2725', fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="calm" stroke="#D8B46B" fillOpacity={1} fill="url(#calmGradient)" />
                    <Area type="monotone" dataKey="energy" stroke="#A6B7A3" fillOpacity={1} fill="url(#energyGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>

          {/* Milestones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-md mb-8 overflow-hidden"
          >
            <button
              onClick={() => toggleSection('milestones')}
              className="w-full p-6 flex items-center justify-between hover:bg-[#F9F5EF] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Award size={24} className="text-[#D8B46B]" />
                <h2 className="font-serif text-2xl text-[#1E3A32]">Milestones Achieved</h2>
              </div>
              {expandedSections.milestones ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.milestones && (
              <div className="p-6 pt-0 grid md:grid-cols-2 gap-4">
                {milestones.map((milestone) => {
                  const IconComponent = MILESTONE_ICONS[milestone.milestone_type] || Award;
                  return (
                    <div key={milestone.id} className="bg-[#F9F5EF] p-4 rounded-lg">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-[#D8B46B]/20 flex items-center justify-center flex-shrink-0">
                          <IconComponent size={20} className="text-[#D8B46B]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-serif text-lg text-[#1E3A32] mb-1">
                            {milestone.milestone_name}
                          </h3>
                          <p className="text-sm text-[#2B2725]/70 mb-2">
                            {milestone.milestone_description}
                          </p>
                          <p className="text-xs text-[#2B2725]/50">
                            {format(new Date(milestone.unlocked_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {milestones.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-[#2B2725]/60">
                    Keep going—your first milestone is just around the corner.
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Journey Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-md overflow-hidden mb-8"
          >
            <button
              onClick={() => toggleSection('journey')}
              className="w-full p-6 flex items-center justify-between hover:bg-[#F9F5EF] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Map size={24} className="text-[#D8B46B]" />
                <h2 className="font-serif text-2xl text-[#1E3A32]">Your Journey</h2>
              </div>
              {expandedSections.journey ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.journey && (
              <div className="p-6 pt-0">
                {timelineEvents.length > 0 ? (
                  <JourneyMap events={timelineEvents} />
                ) : (
                  <div className="text-center py-12 text-[#2B2725]/60">
                    Your journey map will appear here as you create reflections, reach milestones, and track your progress.
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}