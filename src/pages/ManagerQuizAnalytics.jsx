import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { RefreshCw, TrendingUp, Users, Clock, Award, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ManagerQuizAnalytics() {
  const queryClient = useQueryClient();
  const [selectedQuizId, setSelectedQuizId] = useState(null);

  const { data: quizzes = [], isLoading: loadingQuizzes } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => base44.entities.Quiz.list(),
  });

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ["quizAnalytics", selectedQuizId],
    queryFn: async () => {
      if (!selectedQuizId) return null;
      const data = await base44.entities.QuizAnalytics.filter({ quiz_id: selectedQuizId });
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!selectedQuizId,
  });

  const recalculateMutation = useMutation({
    mutationFn: (quiz_id) => base44.functions.invoke("calculateQuizAnalytics", { quiz_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizAnalytics", selectedQuizId] });
      toast.success("Analytics recalculated");
    },
    onError: (error) => toast.error(error.message || "Failed to recalculate"),
  });

  const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);

  const COLORS = ['#1E3A32', '#D8B46B', '#A6B7A3', '#6E4F7D', '#E4D9C4'];

  const scoreDistributionData = analytics?.score_distribution
    ? Object.entries(analytics.score_distribution).map(([range, count]) => ({
        range,
        count
      }))
    : [];

  if (loadingQuizzes) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Quiz Analytics</h1>
          <p className="text-[#2B2725]/70">
            Track quiz performance and identify areas for improvement
          </p>
        </div>

        {/* Quiz Selector */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select value={selectedQuizId || ""} onValueChange={setSelectedQuizId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Choose a quiz..." />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.map(quiz => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedQuizId && (
                <Button
                  onClick={() => recalculateMutation.mutate(selectedQuizId)}
                  disabled={recalculateMutation.isPending}
                  variant="outline"
                >
                  <RefreshCw size={16} className={`mr-2 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
                  Recalculate
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Display */}
        {selectedQuizId && analytics && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                  <Users className="h-4 w-4 text-[#2B2725]/60" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.total_attempts}</div>
                  <p className="text-xs text-[#2B2725]/60 mt-1">
                    {analytics.unique_users} unique users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                  <Award className="h-4 w-4 text-[#2B2725]/60" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.pass_rate}%</div>
                  <Progress value={analytics.pass_rate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-[#2B2725]/60" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.average_score}%</div>
                  <p className="text-xs text-[#2B2725]/60 mt-1">
                    Passing: {selectedQuiz?.passing_score || 70}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
                  <Clock className="h-4 w-4 text-[#2B2725]/60" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.floor(analytics.average_time_taken / 60)}m {analytics.average_time_taken % 60}s
                  </div>
                  {selectedQuiz?.time_limit && (
                    <p className="text-xs text-[#2B2725]/60 mt-1">
                      Limit: {selectedQuiz.time_limit} min
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>How students are performing</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={scoreDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#D8B46B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Question Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Question Performance</CardTitle>
                <CardDescription>Questions sorted by difficulty (lowest % correct first)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.question_stats
                    ?.sort((a, b) => a.correct_percentage - b.correct_percentage)
                    .map((stat, idx) => (
                      <div key={stat.question_id} className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {idx + 1}. {stat.question_text}
                            </p>
                            <p className="text-xs text-[#2B2725]/60">
                              {stat.total_responses} responses
                            </p>
                          </div>
                          <Badge 
                            variant={stat.correct_percentage < 50 ? "destructive" : "default"}
                            className={stat.correct_percentage >= 80 ? "bg-[#A6B7A3]" : ""}
                          >
                            {stat.correct_percentage}%
                          </Badge>
                        </div>
                        <Progress value={stat.correct_percentage} />
                        {stat.correct_percentage < 50 && (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle size={12} />
                            This question may need review or clarification
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedQuizId && !analytics && !loadingAnalytics && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-[#2B2725]/70 mb-4">No analytics data yet for this quiz.</p>
              <Button onClick={() => recalculateMutation.mutate(selectedQuizId)}>
                <RefreshCw size={16} className="mr-2" />
                Calculate Analytics
              </Button>
            </CardContent>
          </Card>
        )}

        {!selectedQuizId && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-[#2B2725]/70">Select a quiz to view analytics</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}