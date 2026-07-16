import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ProgramCard({ program }) {
  const {
    icon: Icon,
    title,
    description,
    progress,
    status,
    primaryAction,
    secondaryAction,
    route,
    color = "#1E3A32"
  } = program;

  const getStatusVariant = (status) => {
    switch (status) {
      case "Owned":
      case "Completed":
        return "default";
      case "In Progress":
        return "secondary";
      case "Subscription Active":
        return "default";
      case "Subscription Ended":
        return "destructive";
      case "Not Enrolled":
        return "outline";
      case "New":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <div className="bg-white p-6 border-l-4 hover:shadow-md transition-shadow" style={{ borderColor: color }}>
      <div className="flex items-start gap-4">
        {Icon && <Icon size={32} style={{ color }} className="flex-shrink-0" />}
        
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg text-[#1E3A32] mb-2">{title}</h3>
          
          {description && (
            <p className="text-[#2B2725]/70 text-sm leading-relaxed mb-3">{description}</p>
          )}

          {status && (
            <Badge variant={getStatusVariant(status)} className="mb-3">
              {status}
            </Badge>
          )}

          {progress !== undefined && progress !== null && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#2B2725]/60">Progress</span>
                <span className="text-xs text-[#2B2725]/60">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-4">
            {primaryAction && (
              route ? (
                <Link to={createPageUrl(route)}>
                  <Button 
                    className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
                  >
                    {primaryAction.label}
                  </Button>
                </Link>
              ) : (
                <Button 
                  onClick={primaryAction.onClick}
                  className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
                >
                  {primaryAction.label}
                </Button>
              )
            )}

            {secondaryAction && (
              <Button 
                variant="outline"
                onClick={secondaryAction.onClick}
                className="border-[#D8B46B] text-[#1E3A32] hover:bg-[#D8B46B]/10"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}