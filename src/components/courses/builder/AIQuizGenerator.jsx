import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Plus, Trash2, Check, X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function AIQuizGenerator({ lessonTitle, lessonContent, onQuizGenerated }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [generatedQuiz, setGeneratedQuiz] = useState(null);

  const handleGenerate = async () => {
    if (!lessonContent) {
      toast.error("Please add lesson content first");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate ${numQuestions} multiple-choice quiz questions based on the following lesson content. 
Difficulty level: ${difficulty}

Lesson: ${lessonTitle}

Content:
${lessonContent}

Generate questions that test understanding of key concepts. Each question should have 4 answer options with exactly one correct answer.`,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" }
                  },
                  correct_answer_index: { type: "number" },
                  explanation: { type: "string" }
                }
              }
            }
          }
        }
      });

      setGeneratedQuiz(response.questions);
      toast.success("Quiz generated!");
    } catch (error) {
      console.error("Quiz generation error:", error);
      toast.error("Failed to generate quiz");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveQuiz = () => {
    if (generatedQuiz && onQuizGenerated) {
      onQuizGenerated(generatedQuiz);
      toast.success("Quiz saved to lesson");
    }
  };

  const handleEditQuestion = (index, field, value) => {
    const updated = [...generatedQuiz];
    updated[index][field] = value;
    setGeneratedQuiz(updated);
  };

  const handleEditOption = (qIndex, oIndex, value) => {
    const updated = [...generatedQuiz];
    updated[qIndex].options[oIndex] = value;
    setGeneratedQuiz(updated);
  };

  const handleRemoveQuestion = (index) => {
    setGeneratedQuiz(generatedQuiz.filter((_, i) => i !== index));
  };

  const handleAddQuestion = () => {
    setGeneratedQuiz([
      ...generatedQuiz,
      {
        question: "",
        options: ["", "", "", ""],
        correct_answer_index: 0,
        explanation: ""
      }
    ]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles size={20} className="text-[#D8B46B]" />
          AI Quiz Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generatedQuiz ? (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Number of Questions</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Difficulty</Label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E4D9C4] rounded"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Generate Quiz
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <Badge className="bg-green-100 text-green-800">
                {generatedQuiz.length} questions generated
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddQuestion}
                >
                  <Plus size={14} className="mr-1" />
                  Add Question
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveQuiz}
                  className="bg-[#1E3A32] hover:bg-[#2B2725]"
                >
                  <Check size={14} className="mr-1" />
                  Save Quiz
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setGeneratedQuiz(null)}
                >
                  <X size={14} className="mr-1" />
                  Discard
                </Button>
              </div>
            </div>

            <div className="space-y-6 max-h-96 overflow-y-auto">
              {generatedQuiz.map((q, qIndex) => (
                <div key={qIndex} className="p-4 bg-[#F9F5EF] rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-[#2B2725]/60">
                      Question {qIndex + 1}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveQuestion(qIndex)}
                    >
                      <Trash2 size={14} className="text-red-600" />
                    </Button>
                  </div>

                  <Input
                    value={q.question}
                    onChange={(e) => handleEditQuestion(qIndex, "question", e.target.value)}
                    placeholder="Question text"
                    className="mb-3"
                  />

                  <div className="space-y-2 mb-3">
                    {q.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={q.correct_answer_index === oIndex}
                          onChange={() => handleEditQuestion(qIndex, "correct_answer_index", oIndex)}
                          className="text-[#D8B46B]"
                        />
                        <Input
                          value={option}
                          onChange={(e) => handleEditOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                        />
                      </div>
                    ))}
                  </div>

                  <Input
                    value={q.explanation}
                    onChange={(e) => handleEditQuestion(qIndex, "explanation", e.target.value)}
                    placeholder="Explanation (optional)"
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}