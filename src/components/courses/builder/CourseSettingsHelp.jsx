import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Info } from "lucide-react";

export default function CourseSettingsHelp() {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HelpCircle size={20} className="text-blue-600" />
          Field Explanations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <h4 className="font-medium text-[#1E3A32] mb-1">Course Type</h4>
          <p className="text-[#2B2725]/70">
            <strong>Toolkit Module:</strong> Short, focused lessons on specific topics<br />
            <strong>Training Program:</strong> Professional development courses (e.g., Hypnosis Training)<br />
            <strong>Webinar:</strong> Single session or recorded presentation<br />
            <strong>Audio-Based Program:</strong> Audio-only content (like meditation or inner rehearsal)
          </p>
        </div>

        <div>
          <h4 className="font-medium text-[#1E3A32] mb-1">Difficulty</h4>
          <p className="text-[#2B2725]/70">
            <strong>Intro:</strong> Beginner-friendly content<br />
            <strong>Intermediate:</strong> Requires some prior knowledge<br />
            <strong>Deep Work:</strong> Advanced, intensive study
          </p>
        </div>

        <div>
          <h4 className="font-medium text-[#1E3A32] mb-1">Visibility</h4>
          <p className="text-[#2B2725]/70">
            <strong>Public:</strong> Anyone can see and purchase this course<br />
            <strong>Clients Only:</strong> Only authenticated, paying clients can access
          </p>
        </div>

        <div>
          <h4 className="font-medium text-[#1E3A32] mb-1">Where Content Appears</h4>
          <p className="text-[#2B2725]/70">
            <strong>Short Description:</strong> Shows on course cards in the Library<br />
            <strong>Long Description:</strong> Displays on the full course detail page<br />
            <strong>Learning Outcomes:</strong> Shown as bullet points on the course page<br />
            <strong>Module Descriptions:</strong> Appear in the curriculum outline<br />
            <strong>Lesson Content:</strong> The main content when viewing each lesson
          </p>
        </div>

        <div className="bg-white p-3 rounded border border-blue-300">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-[#1E3A32] mb-1">Tip: Resources</p>
              <p className="text-[#2B2725]/70">
                To add downloadable resources (PDFs, worksheets, etc.) to lessons, go to <strong>Manager Dashboard → Resource Editor</strong> to upload files first, then attach them to lessons using the lesson editor.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}