import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, BookOpen, TrendingUp, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DiaryCalendar from "../components/diary/DiaryCalendar";
import DiaryEntryCard from "../components/diary/DiaryEntryCard";
import DiaryEntryEditor from "../components/diary/DiaryEntryEditor";
import DiaryPrompts from "../components/diary/DiaryPrompts";
import MoodTrends from "../components/diary/MoodTrends";
import SEO from "../components/SEO";

export default function Diary() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [view, setView] = useState("entries"); // entries, calendar, trends

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: allEntries = [] } = useQuery({
    queryKey: ["diaryEntries", user?.id],
    queryFn: () => base44.entities.DiaryEntry.list("-date"),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DiaryEntry.create(data),
    onMutate: async (newEntry) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["diaryEntries"] });
      
      // Snapshot previous value
      const previousEntries = queryClient.getQueryData(["diaryEntries", user?.id]);
      
      // Optimistically update
      queryClient.setQueryData(["diaryEntries", user?.id], (old = []) => [{
        id: 'temp-' + Date.now(),
        ...newEntry,
        created_date: new Date().toISOString(),
      }, ...old]);
      
      return { previousEntries };
    },
    onError: (err, newEntry, context) => {
      // Rollback on error
      queryClient.setQueryData(["diaryEntries", user?.id], context.previousEntries);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diaryEntries"] });
      setIsEditing(false);
      setEditingEntry(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DiaryEntry.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diaryEntries"] });
      setIsEditing(false);
      setEditingEntry(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DiaryEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diaryEntries"] });
    },
  });

  const handleSave = (data) => {
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setIsEditing(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this entry? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleNewEntry = () => {
    setEditingEntry(null);
    setIsEditing(true);
  };

  const handleUsePrompt = (prompt) => {
    setEditingEntry({ prompt_used: prompt });
    setIsEditing(true);
  };

  const todayEntry = allEntries.find(
    (e) => e.date === new Date().toISOString().split("T")[0]
  );

  return (
    <>
      <SEO
        title="My Diary - Your Mind Stylist"
        description="Your private space for reflection, emotional tracking, and personal growth. Journal your thoughts, track your moods, and discover patterns."
      />
      <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <BookOpen size={32} className="text-[#1E3A32]" />
                <h1 className="font-serif text-4xl text-[#1E3A32]">My Diary</h1>
              </div>
              <p className="text-[#2B2725]/70">
                Your private space for reflection and emotional tracking
              </p>
            </div>
            <Button
              onClick={handleNewEntry}
              className="bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              <Plus size={18} className="mr-2" />
              New Entry
            </Button>
          </div>

          {/* View Toggle */}
          <div className="bg-white p-2 mb-6 inline-flex rounded-lg">
            <button
              onClick={() => setView("entries")}
              className={`px-4 py-2 rounded ${
                view === "entries"
                  ? "bg-[#1E3A32] text-[#F9F5EF]"
                  : "text-[#2B2725]/70 hover:text-[#1E3A32]"
              }`}
            >
              <BookOpen size={16} className="inline mr-2" />
              Entries
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`px-4 py-2 rounded ${
                view === "calendar"
                  ? "bg-[#1E3A32] text-[#F9F5EF]"
                  : "text-[#2B2725]/70 hover:text-[#1E3A32]"
              }`}
            >
              <Calendar size={16} className="inline mr-2" />
              Calendar
            </button>
            <button
              onClick={() => setView("trends")}
              className={`px-4 py-2 rounded ${
                view === "trends"
                  ? "bg-[#1E3A32] text-[#F9F5EF]"
                  : "text-[#2B2725]/70 hover:text-[#1E3A32]"
              }`}
            >
              <TrendingUp size={16} className="inline mr-2" />
              Trends
            </button>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {view === "entries" && (
                <>
                  {/* Today's Entry Prompt */}
                  {!todayEntry && !isEditing && (
                    <div className="bg-gradient-to-r from-[#D8B46B]/20 to-[#A6B7A3]/20 p-6 mb-6 rounded-lg border-2 border-[#D8B46B]/30">
                      <h3 className="font-serif text-xl text-[#1E3A32] mb-2">
                        You haven't written today yet
                      </h3>
                      <p className="text-[#2B2725]/70 mb-4">
                        Take a moment to reflect on your day
                      </p>
                      <Button
                        onClick={handleNewEntry}
                        className="bg-[#1E3A32] hover:bg-[#2B2725]"
                      >
                        Write Today's Entry
                      </Button>
                    </div>
                  )}

                  {/* Entry Editor */}
                  <AnimatePresence>
                    {isEditing && (
                      <DiaryEntryEditor
                        entry={editingEntry}
                        onSave={handleSave}
                        onCancel={() => {
                          setIsEditing(false);
                          setEditingEntry(null);
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Entries List */}
                  {!isEditing && (
                    <div className="space-y-4">
                      {allEntries.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-lg">
                          <BookOpen size={48} className="mx-auto text-[#D8B46B] mb-4" />
                          <h3 className="font-serif text-2xl text-[#1E3A32] mb-2">
                            Start Your Journey
                          </h3>
                          <p className="text-[#2B2725]/70 mb-6">
                            Your diary is empty. Create your first entry to begin tracking
                            your emotional patterns.
                          </p>
                          <Button
                            onClick={handleNewEntry}
                            className="bg-[#1E3A32] hover:bg-[#2B2725]"
                          >
                            Write First Entry
                          </Button>
                        </div>
                      ) : (
                        allEntries.map((entry) => (
                          <DiaryEntryCard
                            key={entry.id}
                            entry={entry}
                            onEdit={() => handleEdit(entry)}
                            onDelete={() => handleDelete(entry.id)}
                          />
                        ))
                      )}
                    </div>
                  )}
                </>
              )}

              {view === "calendar" && (
                <DiaryCalendar entries={allEntries} onDateSelect={setSelectedDate} />
              )}

              {view === "trends" && <MoodTrends entries={allEntries} />}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <DiaryPrompts onUsePrompt={handleUsePrompt} />

              {/* Quick Stats */}
              <div className="bg-white p-6 rounded-lg">
                <h3 className="font-serif text-xl text-[#1E3A32] mb-4">Your Journey</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#2B2725]/70">Total Entries</span>
                    <span className="font-bold text-[#1E3A32]">{allEntries.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#2B2725]/70">This Month</span>
                    <span className="font-bold text-[#1E3A32]">
                      {
                        allEntries.filter((e) =>
                          e.date.startsWith(
                            new Date().toISOString().substring(0, 7)
                          )
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#2B2725]/70">Favorites</span>
                    <span className="font-bold text-[#1E3A32]">
                      {allEntries.filter((e) => e.is_favorite).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
    </>
  );
}