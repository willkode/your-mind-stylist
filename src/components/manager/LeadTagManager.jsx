import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";

export default function LeadTagManager({ tags = [], onChange }) {
  const [newTagInput, setNewTagInput] = useState("");

  const addTag = (tag) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setNewTagInput("");
    }
  };

  const removeTag = (tag) => {
    onChange(tags.filter(t => t !== tag));
  };

  return (
    <div>
      <Label className="mb-2 block">Tags (Unique to this lead)</Label>
      
      {/* Display existing tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-[#D8B46B]/20 text-[#1E3A32] text-xs px-2 py-1 rounded-full"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:text-red-600 transition-colors ml-1"
              type="button"
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>

      {/* Add new tag */}
      <div className="flex gap-2">
        <Input
          value={newTagInput}
          onChange={(e) => setNewTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(newTagInput);
            }
          }}
          placeholder="Add tag, press Enter..."
          className="h-8 text-sm flex-1"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => addTag(newTagInput)}
          type="button"
        >
          <Plus size={14} />
        </Button>
      </div>
    </div>
  );
}