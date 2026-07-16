import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Clock, Award, RotateCcw } from "lucide-react";

export default function QuizPlayer({ quizId, onComplete }) {
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [instantFeedback, setInstantFeedback] = useState(null);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    if (quiz?.time_limit && !submitted && startTime) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = (quiz.time_limit * 60) - elapsed;
        
        if (remaining <= 0) {
          handleSubmit();
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz, submitted, startTime]);

  // Per-question timer
  useEffect(() => {
    const currentQ = questions[currentQuestionIndex];
    if (currentQ?.time_limit_seconds && !submitted && questionStartTime) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - questionStartTime) / 1000);
        const remaining = currentQ.time_limit_seconds - elapsed;
        
        if (remaining <= 0) {
          // Auto-advance to next question
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          } else {
            handleSubmit();
          }
        } else {
          setQuestionTimeRemaining(remaining);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentQuestionIndex, questions, submitted, questionStartTime]);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const quizData = await base44.entities.Quiz.filter({ id: quizId });
      if (quizData && quizData.length > 0) {
        const loadedQuiz = quizData[0];
        setQuiz(loadedQuiz);
        
        let questionData = [];
        
        // Check if using question pools
        if (loadedQuiz.use_question_pools) {
          const pools = await base44.entities.QuizQuestionPool.filter({ 
            quiz_id: quizId, 
            active: true 
          });
          
          for (const pool of pools) {
            // Shuffle and select pool_size questions from each pool
            const shuffled = [...pool.question_ids].sort(() => Math.random() - 0.5);
            const selectedIds = shuffled.slice(0, pool.pool_size);
            
            // Fetch selected questions
            for (const qId of selectedIds) {
              const q = await base44.entities.QuizQuestion.filter({ id: qId });
              if (q && q.length > 0) {
                questionData.push(q[0]);
              }
            }
          }
        } else {
          // Regular question loading
          questionData = await base44.entities.QuizQuestion.filter({ quiz_id: quizId });
          questionData = questionData.sort((a, b) => a.order - b.order);
          
          if (loadedQuiz.randomize_questions) {
            questionData = questionData.sort(() => Math.random() - 0.5);
          }
        }
        
        setQuestions(questionData);
        setStartTime(Date.now());
        setQuestionStartTime(Date.now());
        
        if (loadedQuiz.time_limit) {
          setTimeRemaining(loadedQuiz.time_limit * 60);
        }

        // Set per-question timer if available
        if (questionData[0]?.time_limit_seconds) {
          setQuestionTimeRemaining(questionData[0].time_limit_seconds);
        }
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (questionId, optionIndex, isMultiple = false) => {
    if (submitted || (instantFeedback && instantFeedback.questionId === questionId)) return;

    const newAnswers = { ...answers };
    if (isMultiple) {
      const current = newAnswers[questionId] || [];
      if (current.includes(optionIndex)) {
        newAnswers[questionId] = current.filter(i => i !== optionIndex);
      } else {
        newAnswers[questionId] = [...current, optionIndex];
      }
    } else {
      newAnswers[questionId] = [optionIndex];
    }
    setAnswers(newAnswers);

    // Instant feedback mode
    if (quiz.instant_feedback && !isMultiple) {
      const question = questions.find(q => q.id === questionId);
      const correctIndices = question.options
        .map((opt, idx) => opt.is_correct ? idx : -1)
        .filter(idx => idx !== -1);
      
      const isCorrect = newAnswers[questionId].every(idx => correctIndices.includes(idx)) &&
                        newAnswers[questionId].length === correctIndices.length;

      setInstantFeedback({
        questionId,
        isCorrect,
        explanation: question.explanation
      });

      // Update question analytics
      try {
        await base44.entities.QuizQuestion.update(questionId, {
          times_answered: (question.times_answered || 0) + 1,
          times_correct: (question.times_correct || 0) + (isCorrect ? 1 : 0)
        });
      } catch (error) {
        console.error('Failed to update question stats:', error);
      }

      // Auto-advance after 2 seconds
      if (!isMultiple) {
        setTimeout(() => {
          setInstantFeedback(null);
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          }
        }, 2000);
      }
    }
  };

  const handleSubmit = async () => {
    const endTime = Date.now();
    const timeTaken = Math.floor((endTime - startTime) / 1000);

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers = [];

    questions.forEach(question => {
      totalPoints += question.points || 1;
      const userAnswer = answers[question.id] || [];
      const correctIndices = question.options
        .map((opt, idx) => opt.is_correct ? idx : -1)
        .filter(idx => idx !== -1);

      const isCorrect = 
        userAnswer.length === correctIndices.length &&
        userAnswer.every(idx => correctIndices.includes(idx));

      const pointsEarned = isCorrect ? (question.points || 1) : 0;
      earnedPoints += pointsEarned;

      gradedAnswers.push({
        question_id: question.id,
        selected_options: userAnswer,
        is_correct: isCorrect,
        points_earned: pointsEarned
      });
    });

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= (quiz.passing_score || 70);

    // Save attempt
    try {
      const user = await base44.auth.me();
      const previousAttempts = await base44.entities.UserQuizAttempt.filter({
        user_id: user.id,
        quiz_id: quizId
      });

      await base44.entities.UserQuizAttempt.create({
        user_id: user.id,
        quiz_id: quizId,
        attempt_number: previousAttempts.length + 1,
        answers: gradedAnswers,
        score,
        passed,
        time_taken: timeTaken,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString()
      });

      setResults({ score, passed, gradedAnswers });
      setSubmitted(true);

      if (onComplete) {
        onComplete({ score, passed });
      }
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setResults(null);
    setCurrentQuestionIndex(0);
    setInstantFeedback(null);
    loadQuiz();
  };

  const handleQuestionChange = (newIndex) => {
    setCurrentQuestionIndex(newIndex);
    setQuestionStartTime(Date.now());
    setInstantFeedback(null);
    
    const nextQuestion = questions[newIndex];
    if (nextQuestion?.time_limit_seconds) {
      setQuestionTimeRemaining(nextQuestion.time_limit_seconds);
    } else {
      setQuestionTimeRemaining(null);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A32]"></div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="text-center p-12">
        <p className="text-[#2B2725]/70">No quiz questions available.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (submitted && results) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {results.passed ? (
                <Award size={64} className="text-[#D8B46B]" />
              ) : (
                <RotateCcw size={64} className="text-[#6E4F7D]" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {results.passed ? 'Congratulations!' : 'Keep Trying!'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className="text-5xl font-bold text-[#1E3A32] mb-2">{results.score}%</p>
              <p className="text-[#2B2725]/70">
                {results.passed ? 'You passed!' : `Passing score: ${quiz.passing_score}%`}
              </p>
            </div>

            {quiz.show_correct_answers && (
              <div className="space-y-4 mb-6">
                <h3 className="font-medium text-[#1E3A32]">Review Answers:</h3>
                {questions.map((question, idx) => {
                  const answer = results.gradedAnswers.find(a => a.question_id === question.id);
                  return (
                    <div key={question.id} className="border-l-4 pl-4" style={{
                      borderColor: answer?.is_correct ? '#A6B7A3' : '#E57373'
                    }}>
                      <p className="font-medium text-sm mb-2">
                        {idx + 1}. {question.question_text}
                      </p>
                      {question.explanation && (
                        <p className="text-sm text-[#2B2725]/70 italic">
                          {question.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={handleRetry} variant="outline">
                <RotateCcw size={16} className="mr-2" />
                Retry Quiz
              </Button>
              {results.passed && (
                <Button onClick={() => onComplete && onComplete(results)} className="bg-[#1E3A32]">
                  Continue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Quiz Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-serif text-[#1E3A32]">{quiz.title}</h2>
          <div className="flex items-center gap-4">
            {questionTimeRemaining !== null && (
              <div className="flex items-center gap-2 text-[#2B2725]/70">
                <Clock size={16} />
                <span className={questionTimeRemaining < 10 ? 'text-red-600 font-bold' : 'text-[#D8B46B]'}>
                  {questionTimeRemaining}s
                </span>
              </div>
            )}
            {timeRemaining !== null && (
              <div className="flex items-center gap-2 text-[#2B2725]/70">
                <Clock size={20} />
                <span className={timeRemaining < 60 ? 'text-red-600 font-bold' : ''}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
        </div>
        {quiz.description && (
          <p className="text-[#2B2725]/70">{quiz.description}</p>
        )}
        <Progress value={progress} className="mt-4" />
        <p className="text-sm text-[#2B2725]/60 mt-2">
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{currentQuestion.question_text}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = (answers[currentQuestion.id] || []).includes(idx);
                  const isMultiple = currentQuestion.question_type === 'multiple_select';

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(currentQuestion.id, idx, isMultiple)}
                      className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                        isSelected
                          ? 'border-[#D8B46B] bg-[#D8B46B]/10'
                          : 'border-[#E4D9C4] hover:border-[#A6B7A3]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded ${isMultiple ? '' : 'rounded-full'} border-2 flex items-center justify-center ${
                          isSelected ? 'bg-[#D8B46B] border-[#D8B46B]' : 'border-[#2B2725]/30'
                        }`}>
                          {isSelected && (
                            <CheckCircle size={16} className="text-white" />
                          )}
                        </div>
                        <span className="flex-1">{option.text}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {currentQuestion.question_type === 'multiple_select' && (
                <p className="text-sm text-[#2B2725]/60 mt-4 italic">
                  Select all that apply
                </p>
              )}

              {/* Instant Feedback */}
              {instantFeedback && instantFeedback.questionId === currentQuestion.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 p-4 rounded-lg ${
                    instantFeedback.isCorrect 
                      ? 'bg-green-50 border-2 border-green-200' 
                      : 'bg-red-50 border-2 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {instantFeedback.isCorrect ? (
                      <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle size={24} className="text-red-600 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`font-medium ${
                        instantFeedback.isCorrect ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {instantFeedback.isCorrect ? 'Correct!' : 'Incorrect'}
                      </p>
                      {instantFeedback.explanation && (
                        <p className="text-sm text-[#2B2725]/80 mt-1">
                          {instantFeedback.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              onClick={() => handleQuestionChange(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0 || (instantFeedback && quiz.instant_feedback)}
            >
              Previous
            </Button>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                className="bg-[#1E3A32] hover:bg-[#2B2725]"
                disabled={Object.keys(answers).length < questions.length}
              >
                Submit Quiz
              </Button>
            ) : (
              <Button
                onClick={() => handleQuestionChange(currentQuestionIndex + 1)}
                className="bg-[#1E3A32] hover:bg-[#2B2725]"
                disabled={instantFeedback && quiz.instant_feedback}
              >
                Next
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}