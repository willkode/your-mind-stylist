import React from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Link as LinkIcon, Headphones } from "lucide-react";

export default function WebinarResources({ lesson }) {
  if (!lesson || !lesson.resources || lesson.resources.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg text-center">
        <FileText size={40} className="mx-auto mb-3 text-[#2B2725]/40" />
        <p className="text-[#2B2725]/70">No resources available for this webinar yet.</p>
      </div>
    );
  }

  const getResourceIcon = (type) => {
    switch (type) {
      case "pdf":
        return FileText;
      case "audio":
        return Headphones;
      case "link":
        return LinkIcon;
      default:
        return Download;
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg">
      <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Webinar Resources</h2>
      <p className="text-[#2B2725]/70 mb-6">
        Download worksheets, slides, and additional materials to deepen your learning.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {lesson.resources.map((resource, index) => {
          const Icon = getResourceIcon(resource.type);
          
          return (
            <div
              key={index}
              className="border border-[#E4D9C4] rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#6E4F7D]/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-[#6E4F7D]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-[#1E3A32] mb-2">{resource.title}</h3>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button variant="outline" size="sm">
                      <Download size={14} className="mr-2" />
                      {resource.type === "link" ? "Open" : "Download"}
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Key Takeaways */}
      {lesson.key_takeaways && lesson.key_takeaways.length > 0 && (
        <div className="mt-8 p-6 bg-[#F9F5EF] rounded-lg">
          <h3 className="font-serif text-xl text-[#1E3A32] mb-4">Key Takeaways</h3>
          <ul className="space-y-2">
            {lesson.key_takeaways.map((takeaway, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-[#6E4F7D] mt-1">✦</span>
                <span className="text-[#2B2725]/80">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}