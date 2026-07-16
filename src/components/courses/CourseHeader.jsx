import React from "react";
import { Badge } from "@/components/ui/badge";

export default function CourseHeader({ course, userProgress }) {
  const statusConfig = {
    not_started: { label: "Not Started", color: "bg-gray-100 text-gray-800" },
    in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
    completed: { label: "Completed", color: "bg-green-100 text-green-800" },
  };

  const status = statusConfig[userProgress?.status || "not_started"];

  return (
    <div className="bg-[#1E3A32] text-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <p className="text-[#D8B46B] text-xs tracking-[0.2em] uppercase mb-2">
          Your Mind Stylist Program
        </p>
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-4">
          {course.title}
        </h1>
        {course.subtitle && (
          <p className="text-[#F9F5EF]/80 text-lg md:text-xl mb-6 italic">
            {course.subtitle}
          </p>
        )}
        <div className="flex gap-3 flex-wrap">
          <Badge className={status.color}>{status.label}</Badge>
          {course.difficulty && (
            <Badge variant="outline" className="border-[#F9F5EF]/30 text-[#F9F5EF]">
              {course.difficulty}
            </Badge>
          )}
          {course.duration && (
            <Badge variant="outline" className="border-[#F9F5EF]/30 text-[#F9F5EF]">
              {course.duration}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}