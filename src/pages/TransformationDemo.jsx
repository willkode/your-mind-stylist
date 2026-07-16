import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, Play, X, ChevronRight, ArrowRight, Info
} from "lucide-react";
import SEO from "../components/SEO";
import InsightsPanel from "../components/transformation/InsightsPanel";
import JourneyMap from "../components/transformation/JourneyMap";
import { format } from "date-fns";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to the Transformation Story Demo',
    content: 'This is a 90-day journey showing how users track their personal growth through reflections, milestones, and emotional snapshots.',
    position: 'center'
  },
  {
    id: 'insights',
    title: 'AI-Powered Insights',
    content: 'The system analyzes patterns and provides personalized growth insights, celebrating wins and suggesting next steps.',
    target: '#insights-section'
  },
  {
    id: 'current-state',
    title: 'Current Emotional State',
    content: 'Users track their emotional well-being across multiple dimensions - calm, grounded, and openness.',
    target: '#current-state'
  },
  {
    id: 'trends',
    title: 'Emotional Trends Over Time',
    content: 'Visual tracking shows improvement over weeks and months, helping users see their progress.',
    target: '#trends-section'
  },
  {
    id: 'milestones',
    title: 'Milestone Celebrations',
    content: 'Achievements are automatically detected and celebrated - from consistency streaks to breakthrough moments.',
    target: '#milestones-section'
  },
  {
    id: 'journey',
    title: 'Interactive Journey Map',
    content: 'Every reflection, lesson, and milestone is captured in a beautiful timeline that tells the user\'s transformation story.',
    target: '#journey-section'
  },
  {
    id: 'complete',
    title: 'Building Better Humans',
    content: 'This system helps people develop self-awareness, emotional intelligence, and lasting change - the foundation for a better world.',
    position: 'center'
  }
];

export default function TransformationDemo() {
  const [tourActive, setTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [demoEmail] = useState('demo@yourmindstylist.com');

  // Fetch demo data (filtering by demo user)
  const { data: reflections = [] } = useQuery({
    queryKey: ["demo-reflections"],
    queryFn: async () => {
      const all = await base44.entities.LearningReflection.list("-created_date");
      return all.filter(r => r.created_by === demoEmail);
    }
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ["demo-milestones"],
    queryFn: async () => {
      const all = await base44.entities.Milestone.list("-unlocked_date");
      return all.filter(m => m.created_by === demoEmail);
    }
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ["demo-snapshots"],
    queryFn: async () => {
      const all = await base44.entities.TransformationSnapshot.list("-created_date");
      return all.filter(s => s.created_by === demoEmail);
    }
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["demo-checkins"],
    queryFn: async () => {
      const all = await base44.entities.DailyStyleCheck.list("-created_date", 100);
      return all.filter(c => c.created_by === demoEmail);
    }
  });

  // Mock insights for demo
  const demoInsights = [
    {
      id: 'demo-1',
      insight_type: 'celebration',
      insight_category: 'emotional',
      insight_text: 'Your calm scores have increased by 120% over the past 90 days. This is remarkable growth.',
      insight_detail: 'Starting from 35, you\'re now consistently averaging 78 on the calm scale. The work you\'re doing is clearly paying off.',
      priority: 'high',
      viewed: false
    },
    {
      id: 'demo-2',
      insight_type: 'pattern',
      insight_category: 'breakthrough',
      insight_text: 'You tend to have breakthrough moments after private sessions with Roberta.',
      insight_detail: 'Consider booking another session when you feel stuck - the 1:1 work seems to unlock deeper insights for you.',
      priority: 'medium',
      viewed: false
    },
    {
      id: 'demo-3',
      insight_type: 'recommendation',
      insight_category: 'consistency',
      insight_text: 'Your daily check-in streak is powerful. Keep this momentum going.',
      insight_detail: 'Consistency compounds. The fact that you\'re showing up every day is building real transformation.',
      priority: 'medium',
      viewed: false
    }
  ];

  const emotionalTrends = checkIns
    .slice(0, 30)
    .reverse()
    .map(c => ({
      date: format(new Date(c.created_date), 'MMM d'),
      calm: c.state_value
    }));

  const latestSnapshot = snapshots[0];
  const radarData = latestSnapshot ? [
    { dimension: 'Calm', value: latestSnapshot.calm_score },
    { dimension: 'Grounded', value: latestSnapshot.grounded_score },
    { dimension: 'Open', value: latestSnapshot.open_score },
    { dimension: 'Energy', value: latestSnapshot.energy_level * 10 }
  ] : [];

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

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      const step = TOUR_STEPS[currentStep + 1];
      if (step.target) {
        document.querySelector(step.target)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTourActive(false);
      setCurrentStep(0);
    }
  };

  const currentTourStep = TOUR_STEPS[currentStep];

  return (
    <>
      <SEO
        title="Transformation Story Demo - Your Mind Stylist"
        description="See how users track their personal growth journey with AI-powered insights, milestone celebrations, and visual progress tracking."
      />
      <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Demo Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D8B46B]/20 rounded-full mb-4">
              <Sparkles size={16} className="text-[#D8B46B]" />
              <span className="text-[#D8B46B] text-sm font-medium tracking-wide uppercase">
                Demo Experience
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32] mb-4">
              90-Day Transformation Journey
            </h1>
            <p className="text-[#2B2725]/70 text-lg max-w-2xl mx-auto mb-6">
              Watch how personal growth unfolds through reflections, milestones, and emotional tracking.
            </p>
            <Button
              onClick={() => setTourActive(true)}
              className="bg-[#1E3A32] hover:bg-[#2B2725] text-white px-8"
              size="lg"
            >
              <Play size={20} className="mr-2" />
              Start Guided Tour
            </Button>
          </motion.div>

          {/* Content */}
          <div id="insights-section" className="mb-12">
            <h2 className="font-serif text-3xl text-[#1E3A32] mb-6">AI-Powered Growth Insights</h2>
            <InsightsPanel insights={demoInsights} />
          </div>

          {latestSnapshot && (
            <div id="current-state" className="bg-white rounded-xl p-8 shadow-md mb-12">
              <h2 className="font-serif text-3xl text-[#1E3A32] mb-6">Current Emotional State</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E4D9C4" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: '#2B2725', fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#2B2725', fontSize: 10 }} />
                  <Radar name="Current State" dataKey="value" stroke="#1E3A32" fill="#D8B46B" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {emotionalTrends.length > 0 && (
            <div id="trends-section" className="bg-white rounded-xl p-8 shadow-md mb-12">
              <h2 className="font-serif text-3xl text-[#1E3A32] mb-6">Emotional Trends (30 Days)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={emotionalTrends}>
                  <defs>
                    <linearGradient id="calmGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D8B46B" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#D8B46B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4D9C4" />
                  <XAxis dataKey="date" tick={{ fill: '#2B2725', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#2B2725', fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="calm" stroke="#D8B46B" fillOpacity={1} fill="url(#calmGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div id="milestones-section" className="bg-white rounded-xl p-8 shadow-md mb-12">
            <h2 className="font-serif text-3xl text-[#1E3A32] mb-6">Milestones Achieved</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="bg-[#F9F5EF] p-4 rounded-lg border-l-4 border-[#D8B46B]">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{milestone.icon}</div>
                    <div>
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
              ))}
            </div>
          </div>

          <div id="journey-section" className="bg-white rounded-xl p-8 shadow-md">
            <h2 className="font-serif text-3xl text-[#1E3A32] mb-6">Complete Journey Map</h2>
            <JourneyMap events={timelineEvents} />
          </div>
        </div>
      </div>

      {/* Guided Tour */}
      <AnimatePresence>
        {tourActive && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[100]"
              onClick={() => setTourActive(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`fixed z-[101] bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full ${
                currentTourStep.position === 'center' 
                  ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                  : 'top-8 left-1/2 -translate-x-1/2'
              }`}
            >
              <button
                onClick={() => setTourActive(false)}
                className="absolute top-4 right-4 text-[#2B2725]/60 hover:text-[#2B2725]"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#D8B46B] text-white flex items-center justify-center font-bold">
                  {currentStep + 1}
                </div>
                <p className="text-sm text-[#2B2725]/60">
                  Step {currentStep + 1} of {TOUR_STEPS.length}
                </p>
              </div>

              <h3 className="font-serif text-2xl text-[#1E3A32] mb-4">
                {currentTourStep.title}
              </h3>
              <p className="text-[#2B2725]/80 leading-relaxed mb-6">
                {currentTourStep.content}
              </p>

              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  onClick={() => setTourActive(false)}
                  className="text-[#2B2725]/60"
                >
                  Skip Tour
                </Button>
                <Button
                  onClick={nextStep}
                  className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next'}
                  <ChevronRight size={18} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}