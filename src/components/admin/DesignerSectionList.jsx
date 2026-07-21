import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Eye, EyeOff } from "lucide-react";

export default function DesignerSectionList({ sections, onReorder, onToggle }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(sections);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    onReorder(items);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="sections">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
            {sections.map((section, index) => (
              <Draggable key={section.key} draggableId={section.key} index={index}>
                {(dragProvided, snapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    className={`bg-white border rounded-lg p-4 flex items-center gap-4 transition-shadow ${
                      snapshot.isDragging ? "shadow-lg border-[#D8B46B]" : "border-gray-200 shadow-sm"
                    } ${section.visible === false ? "opacity-60" : ""}`}
                  >
                    <div
                      {...dragProvided.dragHandleProps}
                      className="text-gray-400 hover:text-[#1E3A32] cursor-grab active:cursor-grabbing p-1"
                      title="Drag to reorder"
                    >
                      <GripVertical size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1E3A32]">{section.label}</p>
                      <p className="text-sm text-gray-500 truncate">{section.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {section.visible === false ? (
                        <EyeOff size={16} className="text-gray-400" />
                      ) : (
                        <Eye size={16} className="text-[#1E3A32]" />
                      )}
                      <Switch
                        checked={section.visible !== false}
                        onCheckedChange={(checked) => onToggle(section.key, checked)}
                      />
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}