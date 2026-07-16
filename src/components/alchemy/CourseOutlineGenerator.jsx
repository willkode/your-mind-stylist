import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { trackUsage } from "@/components/utils/trackUsage";
import CreditGateBanner from "@/components/credits/CreditGateBanner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function CourseOutlineGenerator() {
  const [courseTopic, setCourseTopic] = useState("");
  const [sourceContent, setSourceContent] = useState("");
  const [numModules, setNumModules] = useState("5");
  const [loading, setLoading] = useState(false);
  const [outline, setOutline] = useState(null);

  const handleGenerate = async () => {
    if (!courseTopic.trim()) {
      alert("Please enter a course topic");
      return;
    }

    setLoading(true);
    try {
      let prompt = `Create a comprehensive course outline for: "${courseTopic}"

Requirements:
- ${numModules} modules
- Each module should have 3-5 lessons
- Clear learning progression from beginner to advanced
- Actionable, transformational content
- Aligned with emotional intelligence and personal development principles`;

      if (sourceContent.trim()) {
        prompt += `\n\nBase the course structure on this source content:\n${sourceContent}`;
      }

      prompt += `\n\nFor each module, provide:
- Module title and overview
- Learning objectives
- Lesson titles and brief descriptions
- Key takeaways

Return as JSON with structure: {modules: [{title, overview, objectives, lessons: [{title, description}], takeaways}]}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            course_title: { type: "string" },
            course_description: { type: "string" },
            modules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  overview: { type: "string" },
                  objectives: { type: "array", items: { type: "string" } },
                  lessons: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" }
                      }
                    }
                  },
                  takeaways: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setOutline(response);
      trackUsage({ feature: "course_outline_generator", integration_type: "InvokeLLM", details: `${numModules} modules: ${courseTopic.substring(0, 60)}` });
    } catch (error) {
      alert("Failed to generate outline: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 shadow-md">
      <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Course Outline Generator</h2>
      
      <div className="space-y-6">
        <div>
          <Label>Course Topic</Label>
          <Input
            value={courseTopic}
            onChange={(e) => setCourseTopic(e.target.value)}
            placeholder="e.g., Mastering Emotional Intelligence for Leaders"
            className="mt-2"
          />
        </div>

        <div>
          <Label>Source Content (Optional)</Label>
          <Textarea
            value={sourceContent}
            onChange={(e) => setSourceContent(e.target.value)}
            placeholder="Paste existing content, transcripts, or notes to base the course on..."
            rows={6}
            className="mt-2"
          />
        </div>

        <div>
          <Label>Number of Modules</Label>
          <Input
            type="number"
            value={numModules}
            onChange={(e) => setNumModules(e.target.value)}
            min="3"
            max="12"
            className="mt-2"
          />
        </div>

        <CreditGateBanner feature="course_outline_generator">
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? "Generating Outline..." : "Generate Course Outline"}
          </Button>
        </CreditGateBanner>

        {outline && (
          <div className="space-y-6 mt-8">
            <Card className="p-6 bg-[#1E3A32] text-[#F9F5EF]">
              <h3 className="font-serif text-2xl mb-2">{outline.course_title}</h3>
              <p className="text-[#F9F5EF]/80">{outline.course_description}</p>
            </Card>

            {outline.modules?.map((module, idx) => (
              <Card key={idx} className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-serif text-xl text-[#1E3A32] mb-2">
                      Module {idx + 1}: {module.title}
                    </h4>
                    <p className="text-[#2B2725]/70">{module.overview}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-[#1E3A32]">Learning Objectives</Label>
                    <ul className="list-disc list-inside space-y-1 mt-2 text-sm text-[#2B2725]/70">
                      {module.objectives?.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-[#1E3A32]">Lessons</Label>
                    <div className="space-y-2 mt-2">
                      {module.lessons?.map((lesson, i) => (
                        <div key={i} className="bg-[#F9F5EF] p-3 rounded">
                          <p className="font-medium text-[#1E3A32] text-sm">{lesson.title}</p>
                          <p className="text-xs text-[#2B2725]/70 mt-1">{lesson.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-[#1E3A32]">Key Takeaways</Label>
                    <ul className="list-disc list-inside space-y-1 mt-2 text-sm text-[#2B2725]/70">
                      {module.takeaways?.map((takeaway, i) => (
                        <li key={i}>{takeaway}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigator.clipboard.writeText(JSON.stringify(outline, null, 2))}
            >
              Copy Full Outline as JSON
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}