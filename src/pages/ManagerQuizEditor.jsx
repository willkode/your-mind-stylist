import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, ArrowLeft, Trash2, Eye, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import toast from "react-hot-toast";
import QuizSettingsEditor from "../components/manager/QuizSettingsEditor";
import QuizQuestionsEditor from "../components/manager/QuizQuestionsEditor";
import QuizArchetypesEditor from "../components/manager/QuizArchetypesEditor";

export default function ManagerQuizEditor() {
  const [user, setUser] = useState(null);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [newQuizSlug, setNewQuizSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      const isManager = currentUser.role === 'manager' || currentUser.custom_role === 'manager' || currentUser.role === 'admin';
      if (!isManager) window.location.href = createPageUrl('Dashboard');
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ["manager-quizzes"],
    queryFn: () => base44.entities.Quiz.list("-created_date"),
  });

  const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);

  const handleCreateQuiz = async () => {
    if (!newQuizTitle.trim()) return;
    setCreating(true);
    const slug = newQuizSlug.trim() || newQuizTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const quiz = await base44.entities.Quiz.create({
      title: newQuizTitle,
      slug,
      framework_type: "archetype",
      status: "draft",
      active: false,
      email_gate_enabled: true,
      share_enabled: true,
      lead_magnet_enabled: false,
      intro: "Answer a few quick questions to discover your result.",
    });
    queryClient.invalidateQueries({ queryKey: ["manager-quizzes"] });
    setSelectedQuizId(quiz.id);
    setShowCreateDialog(false);
    setNewQuizTitle("");
    setNewQuizSlug("");
    setCreating(false);
    toast.success("Quiz created!");
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm("Delete this quiz and all its questions and archetypes? This cannot be undone.")) return;
    // Delete questions
    const questions = await base44.entities.QuizQuestion.filter({ quiz_id: quizId });
    for (const q of questions) await base44.entities.QuizQuestion.delete(q.id);
    // Delete archetypes
    const archetypes = await base44.entities.QuizArchetype.filter({ quiz_id: quizId });
    for (const a of archetypes) await base44.entities.QuizArchetype.delete(a.id);
    // Delete quiz
    await base44.entities.Quiz.delete(quizId);
    queryClient.invalidateQueries({ queryKey: ["manager-quizzes"] });
    if (selectedQuizId === quizId) setSelectedQuizId(null);
    toast.success("Quiz deleted");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D8B46B]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to={createPageUrl("ManagerDashboard")} className="text-sm text-[#D8B46B] hover:underline flex items-center gap-1 mb-2">
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            <h1 className="font-serif text-3xl text-[#1E3A32]">Landing Page Quizzes</h1>
            <p className="text-sm text-[#2B2725]/60 mt-1">Marketing & lead generation quizzes (not course assessments)</p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
          >
            <Plus size={16} className="mr-2" /> New Quiz
          </Button>
        </div>

        {/* Quiz List */}
        {!selectedQuizId ? (
          <div className="space-y-3">
            {quizzes.length === 0 ? (
              <div className="bg-white border border-[#E4D9C4] p-12 text-center">
                <p className="text-[#2B2725]/60 mb-4">No landing page quizzes yet.</p>
                <Button onClick={() => setShowCreateDialog(true)} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
                  <Plus size={16} className="mr-2" /> Create Your First Quiz
                </Button>
              </div>
            ) : (
              quizzes.map(quiz => (
                <div key={quiz.id} className="bg-white border border-[#E4D9C4] p-5 flex items-center justify-between hover:shadow-sm transition-shadow">
                  <div className="flex-1 cursor-pointer" onClick={() => setSelectedQuizId(quiz.id)}>
                    <div className="flex items-center gap-3">
                      <h3 className="font-serif text-lg text-[#1E3A32]">{quiz.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${quiz.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {quiz.status}
                      </span>
                    </div>
                    <p className="text-sm text-[#2B2725]/60 mt-1">/quiz/{quiz.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedQuizId(quiz.id)} title="Edit quiz">
                      <Pencil size={16} />
                    </Button>
                    <a href={`/quiz/${quiz.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" title="Preview quiz"><Eye size={16} /></Button>
                    </a>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteQuiz(quiz.id)} className="text-red-500 hover:text-red-700" title="Delete quiz">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Quiz Editor */
          <div>
            <button
              onClick={() => setSelectedQuizId(null)}
              className="text-sm text-[#D8B46B] hover:underline flex items-center gap-1 mb-4"
            >
              <ArrowLeft size={14} /> All Quizzes
            </button>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-serif text-2xl text-[#1E3A32]">{selectedQuiz?.title}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full ${selectedQuiz?.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {selectedQuiz?.status}
              </span>
            </div>

            <Tabs defaultValue="settings">
              <TabsList className="bg-white border border-[#E4D9C4] mb-6">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="questions">Questions</TabsTrigger>
                <TabsTrigger value="archetypes">Result Archetypes</TabsTrigger>
              </TabsList>

              <TabsContent value="settings">
                <QuizSettingsEditor quiz={selectedQuiz} />
              </TabsContent>
              <TabsContent value="questions">
                <QuizQuestionsEditor quizId={selectedQuizId} />
              </TabsContent>
              <TabsContent value="archetypes">
                <QuizArchetypesEditor quizId={selectedQuizId} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-[#1E3A32]">Create Landing Page Quiz</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#2B2725]/70 mb-1 block">Quiz Title</label>
                <Input value={newQuizTitle} onChange={e => setNewQuizTitle(e.target.value)} placeholder="e.g., Which Dog Archetype Are You?" className="border-[#E4D9C4]" />
              </div>
              <div>
                <label className="text-sm text-[#2B2725]/70 mb-1 block">URL Slug</label>
                <Input value={newQuizSlug} onChange={e => setNewQuizSlug(e.target.value)} placeholder="e.g., go-fetch (auto-generated if blank)" className="border-[#E4D9C4]" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateQuiz} disabled={creating || !newQuizTitle.trim()} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
                {creating ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Create Quiz
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}