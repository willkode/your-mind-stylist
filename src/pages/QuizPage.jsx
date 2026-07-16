import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "../components/SEO";

export default function QuizPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);

  // Fetch quiz
  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ["quiz", slug],
    queryFn: async () => {
      const q = await base44.entities.Quiz.filter({ slug });
      return q[0] || null;
    },
  });

  // Fetch questions
  const { data: questions = [] } = useQuery({
    queryKey: ["quiz-questions", quiz?.id],
    queryFn: async () => {
      if (!quiz?.id) return [];
      const qs = await base44.entities.QuizQuestion.filter({ quiz_id: quiz.id }, 'order');
      return qs;
    },
    enabled: !!quiz?.id,
  });

  if (quizLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">Quiz not found</h2>
          <a href="/Books" className="text-[#D8B46B] underline">Back to Books</a>
        </div>
      </div>
    );
  }

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQ];

  const handleAnswer = (archetype) => {
    setSelected(archetype);
  };

  const handleNext = () => {
    if (!selected) return;
    const newAnswers = { ...answers, [currentQ]: selected };
    setAnswers(newAnswers);
    setSelected(null);
    if (currentQ + 1 >= totalQuestions) {
      // Calculate result
      const counts = {};
      Object.values(newAnswers).forEach((a) => { counts[a] = (counts[a] || 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      navigate(`/quiz/${slug}/results?archetype=${top}`);
    } else {
      setCurrentQ(currentQ + 1);
    }
  };

  const handleBack = () => {
    if (currentQ === 0) { setStarted(false); return; }
    setCurrentQ(currentQ - 1);
    setSelected(answers[currentQ - 1] || null);
    const newAnswers = { ...answers };
    delete newAnswers[currentQ];
    setAnswers(newAnswers);
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF]">
      <SEO title={`${quiz.title} | Your Mind Stylist`} description={quiz.subtitle} />

      <div className="pt-28 pb-20 px-6">
        <div className="max-w-2xl mx-auto">

          {!started ? (
            /* Intro Screen */
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4">Self-Discovery</p>
              <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32] mb-6 leading-tight">
                {quiz.title}
              </h1>
              <p className="text-[#2B2725]/60 text-sm mb-6">{quiz.subtitle}</p>
              <div className="bg-white border border-[#E4D9C4] p-8 mb-8 text-left">
                <p className="text-[#2B2725]/80 leading-relaxed mb-4">{quiz.intro}</p>
                <p className="text-[#2B2725]/60 text-sm italic">There are no wrong answers. Choose the one that feels most naturally true most of the time.</p>
              </div>
              <Button
                onClick={() => setStarted(true)}
                className="bg-[#1E3A32] hover:bg-[#2B2725] text-white px-10 py-6 text-base"
              >
                Begin Quiz
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </motion.div>
          ) : (
            /* Question Screen */
            <div>
              {/* Progress bar */}
              <div className="mb-8">
                <div className="flex justify-between text-xs text-[#2B2725]/50 mb-2">
                  <span>Question {currentQ + 1} of {totalQuestions}</span>
                  <span>{Math.round(((currentQ + 1) / totalQuestions) * 100)}% complete</span>
                </div>
                <div className="h-1.5 bg-[#E4D9C4] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#D8B46B] rounded-full transition-all duration-500"
                    style={{ width: `${((currentQ + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQ}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="font-serif text-2xl md:text-3xl text-[#1E3A32] mb-8 leading-snug">
                    {currentQuestion?.question_text}
                  </h2>

                  <div className="space-y-3 mb-10">
                    {currentQuestion?.options?.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(option.archetype || option.text)}
                        className={`w-full text-left px-6 py-4 border transition-all duration-200 ${
                          selected === (option.archetype || option.text)
                            ? "border-[#1E3A32] bg-[#1E3A32] text-white"
                            : "border-[#E4D9C4] bg-white text-[#2B2725] hover:border-[#D8B46B] hover:bg-[#D8B46B]/5"
                        }`}
                      >
                        {option.text}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={handleBack} className="text-[#2B2725]/60">
                  <ArrowLeft size={16} className="mr-1" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!selected}
                  className="bg-[#1E3A32] hover:bg-[#2B2725] text-white px-8"
                >
                  {currentQ + 1 >= totalQuestions ? "See My Results" : "Next"}
                  <ArrowRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}