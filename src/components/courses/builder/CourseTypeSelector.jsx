import React from "react";
import { motion } from "framer-motion";
import { Video, Headphones, BookOpen, GraduationCap, Sparkles } from "lucide-react";

export default function CourseTypeSelector({ selectedType, onSelect }) {
  const courseTypes = [
    {
      value: "Toolkit Module",
      icon: BookOpen,
      title: "Toolkit Module",
      description: "Short, focused lessons on specific skills or concepts",
      color: "bg-blue-50 border-blue-200 hover:border-blue-400",
      iconColor: "text-blue-600",
    },
    {
      value: "Webinar",
      icon: Video,
      title: "Webinar",
      description: "Live or recorded sessions with Q&A and discussion",
      color: "bg-purple-50 border-purple-200 hover:border-purple-400",
      iconColor: "text-purple-600",
    },
    {
      value: "Audio-Based Program",
      icon: Headphones,
      title: "Audio-Based Program",
      description: "Guided audio experiences and sessions",
      color: "bg-green-50 border-green-200 hover:border-green-400",
      iconColor: "text-green-600",
    },
    {
      value: "Training Program",
      icon: GraduationCap,
      title: "Training Program",
      description: "Comprehensive multi-module certification or training",
      color: "bg-amber-50 border-amber-200 hover:border-amber-400",
      iconColor: "text-amber-600",
    },
    {
      value: "Other",
      icon: Sparkles,
      title: "Other",
      description: "Custom course type",
      color: "bg-gray-50 border-gray-200 hover:border-gray-400",
      iconColor: "text-gray-600",
    },
  ];

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="font-serif text-3xl text-[#1E3A32] mb-3">
          What type of course are you creating?
        </h2>
        <p className="text-[#2B2725]/70">
          Choose the format that best fits your content
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {courseTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.value;
          
          return (
            <motion.button
              key={type.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(type.value)}
              className={`p-6 border-2 rounded-lg text-left transition-all ${type.color} ${
                isSelected ? "ring-2 ring-[#D8B46B] shadow-lg" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg bg-white ${type.iconColor}`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-xl text-[#1E3A32] mb-2">
                    {type.title}
                  </h3>
                  <p className="text-sm text-[#2B2725]/70">
                    {type.description}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}