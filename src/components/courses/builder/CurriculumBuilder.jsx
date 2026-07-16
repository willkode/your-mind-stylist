import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, GripVertical, Edit, Trash2, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import AILessonOutlineGenerator from "./AILessonOutlineGenerator";

export default function CurriculumBuilder({ modules, onUpdate, onEditLesson }) {
  // Initialize with all modules expanded
  const [expandedModules, setExpandedModules] = useState(() => {
    const expanded = {};
    modules.forEach(mod => {
      expanded[mod.id] = true;
    });
    return expanded;
  });
  const [editingModule, setEditingModule] = useState(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  // Update expandedModules when modules change (new modules added)
  React.useEffect(() => {
    const expanded = { ...expandedModules };
    modules.forEach(mod => {
      if (!(mod.id in expanded)) {
        expanded[mod.id] = true;
      }
    });
    setExpandedModules(expanded);
  }, [modules.length]);

  const addModule = () => {
    const newModule = {
      id: `temp-${Date.now()}`,
      title: "New Module",
      description: "",
      order: modules.length + 1,
      lessons: [],
    };
    onUpdate([...modules, newModule]);
    setExpandedModules({ ...expandedModules, [newModule.id]: true });
    setEditingModule(newModule.id);
  };

  const addLesson = (moduleId) => {
    const updatedModules = modules.map((mod) => {
      if (mod.id === moduleId) {
        const newLesson = {
          id: `temp-${Date.now()}`,
          title: "New Lesson",
          type: "video",
          order: (mod.lessons || []).length + 1,
        };
        return { ...mod, lessons: [...(mod.lessons || []), newLesson] };
      }
      return mod;
    });
    onUpdate(updatedModules);
    const newLessonId = `temp-${Date.now()}`;
    if (onEditLesson) {
      onEditLesson({ moduleId, lessonId: newLessonId });
    }
  };

  const updateModule = (moduleId, field, value) => {
    const updatedModules = modules.map((mod) =>
      mod.id === moduleId ? { ...mod, [field]: value } : mod
    );
    onUpdate(updatedModules);
  };

  const deleteModule = (moduleId) => {
    if (confirm("Delete this module and all its lessons?")) {
      onUpdate(modules.filter((mod) => mod.id !== moduleId));
    }
  };

  const deleteLesson = (moduleId, lessonId) => {
    if (confirm("Delete this lesson?")) {
      const updatedModules = modules.map((mod) => {
        if (mod.id === moduleId) {
          return { ...mod, lessons: mod.lessons.filter((l) => l.id !== lessonId) };
        }
        return mod;
      });
      onUpdate(updatedModules);
    }
  };

  const toggleModule = (moduleId) => {
    setExpandedModules({ ...expandedModules, [moduleId]: !expandedModules[moduleId] });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    // Reorder modules
    if (type === "MODULE") {
      const reordered = Array.from(modules);
      const [removed] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, removed);
      
      // Update order numbers
      const updatedModules = reordered.map((mod, idx) => ({ ...mod, order: idx + 1 }));
      onUpdate(updatedModules);
      return;
    }

    // Reorder lessons within a module
    if (type === "LESSON") {
      const moduleId = result.draggableId.split("-")[0];
      const updatedModules = modules.map(mod => {
        if (mod.id === moduleId) {
          const reordered = Array.from(mod.lessons || []);
          const [removed] = reordered.splice(source.index, 1);
          reordered.splice(destination.index, 0, removed);
          return { ...mod, lessons: reordered.map((l, idx) => ({ ...l, order: idx + 1 })) };
        }
        return mod;
      });
      onUpdate(updatedModules);
    }
  };

  const handleAIGenerate = (generatedModules) => {
    onUpdate(generatedModules);
    setShowAIGenerator(false);
    // Expand all modules after generation
    const expanded = {};
    generatedModules.forEach(mod => {
      expanded[mod.id] = true;
    });
    setExpandedModules(expanded);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-serif text-3xl text-[#1E3A32] mb-3">
          Build Your Curriculum
        </h2>
        <p className="text-[#2B2725]/70">
          Organize your course into modules and lessons
        </p>
        {modules.length === 0 && (
          <Button
            type="button"
            onClick={() => setShowAIGenerator(true)}
            className="mt-4 bg-gradient-to-r from-[#6E4F7D] to-[#8B659B] hover:from-[#5D3E6C] hover:to-[#7A5487] text-white"
          >
            <Sparkles size={16} className="mr-2" />
            Generate with AI
          </Button>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="modules" type="MODULE">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4 mb-6"
            >
              <AnimatePresence>
                {modules.map((module, moduleIndex) => (
                  <Draggable key={module.id} draggableId={module.id} index={moduleIndex}>
                    {(provided, snapshot) => (
                      <motion.div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`bg-white border border-[#E4D9C4] rounded-lg overflow-hidden ${
                          snapshot.isDragging ? "shadow-xl" : ""
                        }`}
                      >
                        {/* Module Header */}
                        <div className="flex items-start gap-3 p-4 bg-[#F9F5EF]">
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="text-[#2B2725]/40 mt-1 cursor-move" size={20} />
                          </div>
                <div className="flex-1">
                  {editingModule === module.id ? (
                    <div className="space-y-2">
                      <Input
                        value={module.title}
                        onChange={(e) => updateModule(module.id, "title", e.target.value)}
                        onBlur={() => setEditingModule(null)}
                        autoFocus
                        className="font-medium"
                      />
                      <Textarea
                        value={module.description || ""}
                        onChange={(e) => updateModule(module.id, "description", e.target.value)}
                        placeholder="Module description (optional)"
                        className="text-sm"
                      />
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium text-[#1E3A32] mb-1">
                        Module {moduleIndex + 1}: {module.title}
                      </h3>
                      {module.description && (
                        <p className="text-sm text-[#2B2725]/70">{module.description}</p>
                      )}
                      <p className="text-xs text-[#2B2725]/50 mt-1">
                        {(module.lessons || []).length} lesson(s)
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleModule(module.id)}
                  >
                    {expandedModules[module.id] ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingModule(module.id)}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteModule(module.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

                        {/* Lessons */}
                        <AnimatePresence>
                          {expandedModules[module.id] && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              className="border-t border-[#E4D9C4]"
                            >
                              <Droppable droppableId={module.id} type="LESSON">
                                {(provided) => (
                                  <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="p-4 space-y-2"
                                  >
                                    {(module.lessons || []).map((lesson, lessonIndex) => (
                                      <Draggable key={lesson.id} draggableId={`${module.id}-${lesson.id}`} index={lessonIndex}>
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`flex items-center gap-3 p-3 bg-[#F9F5EF] rounded ${
                                              snapshot.isDragging ? "shadow-md" : ""
                                            }`}
                                          >
                                            <div {...provided.dragHandleProps}>
                                              <GripVertical className="text-[#2B2725]/40 cursor-move" size={16} />
                                            </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#1E3A32]">
                              {lessonIndex + 1}. {lesson.title}
                            </p>
                            <p className="text-xs text-[#2B2725]/60 capitalize">{lesson.type}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditLesson && onEditLesson({ moduleId: module.id, lessonId: lesson.id })}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteLesson(module.id, lesson.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addLesson(module.id)}
                        className="w-full border-dashed"
                      >
                        <Plus size={16} className="mr-2" />
                        Add Lesson
                                    </Button>
                                  </div>
                                )}
                              </Droppable>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </Draggable>
                ))}
              </AnimatePresence>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Button
        type="button"
        onClick={addModule}
        className="w-full bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
      >
        <Plus size={16} className="mr-2" />
        Add Module
      </Button>

      {showAIGenerator && (
        <AILessonOutlineGenerator
          onGenerate={handleAIGenerate}
          onClose={() => setShowAIGenerator(false)}
        />
      )}
    </div>
  );
}