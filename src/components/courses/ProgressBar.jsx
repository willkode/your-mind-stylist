import React from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ProgressBar({ userProgress, totalLessons, completedLessons, onContinue }) {
  const percentage = userProgress?.completion_percentage || 0;
  const status = userProgress?.status || "not_started";

  const getButtonConfig = () => {
    if (status === "not_started") {
      return { label: "Start Program", icon: Play };
    }
    if (status === "completed") {
      return { label: "Revisit from the Beginning", icon: RotateCcw };
    }
    return { label: "Continue", icon: ArrowRight };
  };

  const { label, icon: Icon } = getButtonConfig();

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-[#E4D9C4] shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div className="flex-1 w-full md:w-auto">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-sm text-[#2B2725]/70">
                {completedLessons} of {totalLessons} lessons completed
              </span>
              <span className="text-sm font-medium text-[#1E3A32]">
                {Math.round(percentage)}%
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
          <Button
            onClick={onContinue}
            className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF] w-full md:w-auto"
          >
            <Icon size={16} className="mr-2" />
            {label}
          </Button>
        </div>
      </div>
    </div>
  );
}