import React from "react";
import { Button } from "@/components/ui/button";
import { X, BookOpen, Headphones, Video, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function CourseTemplates({ onSelectTemplate, onClose }) {
  const templates = [
    {
      id: "emotional-toolkit",
      icon: BookOpen,
      title: "Emotional Intelligence Toolkit",
      description: "3-module course with video lessons and practical exercises",
      type: "Toolkit Module",
      difficulty: "Intermediate",
      modules: 3,
      lessons: 12,
      color: "#6E4F7D"
    },
    {
      id: "audio-journey",
      icon: Headphones,
      title: "Guided Audio Journey",
      description: "5-module audio-based program with reflection exercises",
      type: "Audio-Based Program",
      difficulty: "Intro",
      modules: 5,
      lessons: 15,
      color: "#D8B46B"
    },
    {
      id: "leadership-training",
      icon: Users,
      title: "Leadership Training Series",
      description: "Comprehensive 6-module training with assessments",
      type: "Training Program",
      difficulty: "Deep Work",
      modules: 6,
      lessons: 20,
      color: "#A6B7A3"
    },
    {
      id: "masterclass-webinar",
      icon: Video,
      title: "90-Minute Masterclass",
      description: "Single webinar format with Q&A and resources",
      type: "Webinar",
      difficulty: "Intro",
      modules: 1,
      lessons: 4,
      color: "#1E3A32"
    }
  ];

  const generateTemplateStructure = (template) => {
    const structures = {
      "emotional-toolkit": {
        title: "Emotional Intelligence Toolkit",
        subtitle: "Master Your Emotions, Transform Your Life",
        short_description: "Learn practical tools to understand, regulate, and leverage your emotions for personal and professional growth.",
        type: "Toolkit Module",
        difficulty: "Intermediate",
        duration: "3 hours",
        learning_outcomes: [
          "Identify and understand your emotional patterns",
          "Develop emotional regulation strategies",
          "Build emotional resilience in challenging situations",
          "Improve communication through emotional awareness"
        ],
        modules: [
          {
            id: `temp-${Date.now()}-mod-1`,
            title: "Understanding Your Emotional Landscape",
            description: "Explore the foundations of emotional intelligence and self-awareness",
            order: 1,
            lessons: [
              { id: `temp-${Date.now()}-lesson-1`, title: "Introduction to Emotional Intelligence", type: "video", order: 1 },
              { id: `temp-${Date.now()}-lesson-2`, title: "Mapping Your Emotional Triggers", type: "text", order: 2 },
              { id: `temp-${Date.now()}-lesson-3`, title: "The Mind-Body Connection", type: "hybrid", order: 3 },
              { id: `temp-${Date.now()}-lesson-4`, title: "Practice: Daily Emotional Check-in", type: "text", order: 4 }
            ]
          },
          {
            id: `temp-${Date.now()}-mod-2`,
            title: "Emotional Regulation Techniques",
            description: "Practical tools to manage and navigate difficult emotions",
            order: 2,
            lessons: [
              { id: `temp-${Date.now()}-lesson-5`, title: "The Regulation Toolkit", type: "video", order: 1 },
              { id: `temp-${Date.now()}-lesson-6`, title: "Breathing & Grounding Exercises", type: "audio", order: 2 },
              { id: `temp-${Date.now()}-lesson-7`, title: "Cognitive Reframing", type: "hybrid", order: 3 },
              { id: `temp-${Date.now()}-lesson-8`, title: "Practice: Stress Response Protocol", type: "text", order: 4 }
            ]
          },
          {
            id: `temp-${Date.now()}-mod-3`,
            title: "Applying Emotional Intelligence",
            description: "Integrate emotional intelligence into daily life and relationships",
            order: 3,
            lessons: [
              { id: `temp-${Date.now()}-lesson-9`, title: "EI in Communication", type: "video", order: 1 },
              { id: `temp-${Date.now()}-lesson-10`, title: "Building Emotional Resilience", type: "hybrid", order: 2 },
              { id: `temp-${Date.now()}-lesson-11`, title: "Empathy & Perspective-Taking", type: "text", order: 3 },
              { id: `temp-${Date.now()}-lesson-12`, title: "Creating Your EI Practice Plan", type: "text", order: 4 }
            ]
          }
        ]
      },
      "audio-journey": {
        title: "Inner Transformation Journey",
        subtitle: "A Guided Audio Experience for Deep Personal Change",
        short_description: "A 5-week audio-based program combining guided visualizations, reflective exercises, and transformative practices.",
        type: "Audio-Based Program",
        difficulty: "Intro",
        duration: "5 weeks",
        learning_outcomes: [
          "Develop a daily mindfulness practice",
          "Release limiting beliefs and patterns",
          "Connect with your authentic self",
          "Create a vision for your transformed life"
        ],
        modules: [
          { id: `temp-${Date.now()}-mod-1`, title: "Week 1: Awareness", description: "Building foundational self-awareness", order: 1, lessons: Array(3).fill(null).map((_, i) => ({ id: `temp-${Date.now()}-l1-${i}`, title: `Session ${i+1}`, type: "audio", order: i+1 })) },
          { id: `temp-${Date.now()}-mod-2`, title: "Week 2: Release", description: "Letting go of what no longer serves", order: 2, lessons: Array(3).fill(null).map((_, i) => ({ id: `temp-${Date.now()}-l2-${i}`, title: `Session ${i+1}`, type: "audio", order: i+1 })) },
          { id: `temp-${Date.now()}-mod-3`, title: "Week 3: Reconnection", description: "Connecting with your true self", order: 3, lessons: Array(3).fill(null).map((_, i) => ({ id: `temp-${Date.now()}-l3-${i}`, title: `Session ${i+1}`, type: "audio", order: i+1 })) },
          { id: `temp-${Date.now()}-mod-4`, title: "Week 4: Vision", description: "Creating your future self", order: 4, lessons: Array(3).fill(null).map((_, i) => ({ id: `temp-${Date.now()}-l4-${i}`, title: `Session ${i+1}`, type: "audio", order: i+1 })) },
          { id: `temp-${Date.now()}-mod-5`, title: "Week 5: Integration", description: "Living your transformation", order: 5, lessons: Array(3).fill(null).map((_, i) => ({ id: `temp-${Date.now()}-l5-${i}`, title: `Session ${i+1}`, type: "audio", order: i+1 })) }
        ]
      },
      "leadership-training": {
        title: "Transformational Leadership Training",
        subtitle: "Lead with Emotional Intelligence and Authentic Presence",
        short_description: "Comprehensive training for leaders ready to elevate their impact through emotional intelligence and authentic leadership.",
        type: "Training Program",
        difficulty: "Deep Work",
        duration: "6 weeks",
        learning_outcomes: [
          "Lead with emotional intelligence and presence",
          "Navigate difficult conversations with confidence",
          "Build high-trust, high-performance teams",
          "Develop your unique leadership style",
          "Create sustainable organizational change"
        ],
        modules: [
          { id: `temp-${Date.now()}-mod-1`, title: "Foundations of EI Leadership", description: "Self-awareness and emotional regulation for leaders", order: 1, lessons: Array(4).fill(null).map((_, i) => ({ id: `temp-${Date.now()}-l1-${i}`, title: `Lesson ${i+1}`, type: i % 2 === 0 ? "video" : "hybrid", order: i+1 })) },
          { id: `temp-${Date.now()}-mod-2`, title: "Communication & Influence", description: "Master the art of leadership communication", order: 2, lessons: Array(3).fill(null).map((_, i) => ({ id: `temp-${Date.now()}-l2-${i}`, title: `Lesson ${i+1}`, type: "hybrid", order: i+1 })) },
          { id: `temp-${Date.now()}-mod-3`, title: "Team Dynamics", description: "Building psychologically safe teams", order: 3, lessons: Array(3).fill(null).map((_, i) => ({ id: `temp-${Date.now()}-l3-${i}`, title: `Lesson ${i+1}`, type: "video", order: i+1 })) },
          { id: `temp-${Date.now()}-mod-4`, title: "Difficult Conversations", description: "Navigate conflict with skill and grace", order: 4, lessons: Array(4).fill(null).map((_, i) => ({ id: `temp-${Date.now()}-l4-${i}`, title: `Lesson ${i+1}`, type: "hybrid", order: i+1 })) },
          { id: `temp-${Date.now()}-mod-5`, title: "Change Management", description: "Lead transformation effectively", order: 5, lessons: Array(3).fill(null).map((_, i) => ({ id: `temp-${Date.now()}-l5-${i}`, title: `Lesson ${i+1}`, type: "video", order: i+1 })) },
          { id: `temp-${Date.now()}-mod-6`, title: "Your Leadership Legacy", description: "Sustaining impact and growth", order: 6, lessons: Array(3).fill(null).map((_, i) => ({ id: `temp-${Date.now()}-l6-${i}`, title: `Lesson ${i+1}`, type: "text", order: i+1 })) }
        ]
      },
      "masterclass-webinar": {
        title: "90-Minute Transformational Masterclass",
        subtitle: "A Focused, High-Impact Learning Experience",
        short_description: "An intensive 90-minute masterclass designed for rapid insight and immediate application.",
        type: "Webinar",
        difficulty: "Intro",
        duration: "90 minutes",
        learning_outcomes: [
          "Gain immediate, actionable insights",
          "Understand the core principles",
          "Leave with a clear action plan"
        ],
        modules: [
          {
            id: `temp-${Date.now()}-mod-1`,
            title: "Masterclass Content",
            description: "90-minute transformational session",
            order: 1,
            lessons: [
              { id: `temp-${Date.now()}-lesson-1`, title: "Introduction & Framework", type: "video", order: 1 },
              { id: `temp-${Date.now()}-lesson-2`, title: "Core Teaching", type: "video", order: 2 },
              { id: `temp-${Date.now()}-lesson-3`, title: "Q&A Session", type: "video", order: 3 },
              { id: `temp-${Date.now()}-lesson-4`, title: "Action Plan & Resources", type: "text", order: 4 }
            ]
          }
        ]
      }
    };

    return structures[template.id];
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg max-w-5xl w-full p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-serif text-2xl text-[#1E3A32] mb-1">Course Templates</h2>
              <p className="text-sm text-[#2B2725]/60">Start with a pre-built structure</p>
            </div>
            <button onClick={onClose} className="text-[#2B2725]/40 hover:text-[#2B2725]">
              <X size={24} />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {templates.map((template, idx) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="border-2 border-[#E4D9C4] rounded-lg p-6 hover:border-[#D8B46B] hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => {
                  const structure = generateTemplateStructure(template);
                  onSelectTemplate(structure);
                  onClose();
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${template.color}20` }}
                >
                  <template.icon size={24} style={{ color: template.color }} />
                </div>
                <h3 className="font-serif text-xl text-[#1E3A32] mb-2">{template.title}</h3>
                <p className="text-sm text-[#2B2725]/70 mb-4">{template.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-[#F9F5EF] text-[#2B2725]/70 rounded">
                    {template.modules} modules
                  </span>
                  <span className="px-2 py-1 bg-[#F9F5EF] text-[#2B2725]/70 rounded">
                    {template.lessons} lessons
                  </span>
                  <span className="px-2 py-1 bg-[#F9F5EF] text-[#2B2725]/70 rounded capitalize">
                    {template.difficulty}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}