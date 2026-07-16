import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function CourseBasicsForm({ formData, onChange, onImageUpload }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-serif text-3xl text-[#1E3A32] mb-3">
          Course Details
        </h2>
        <p className="text-[#2B2725]/70">
          Let's capture the essence of your course
        </p>
      </div>

      {/* Course Title */}
      <div>
        <Label htmlFor="title" className="text-[#2B2725] mb-2 block">
          Course Title *
        </Label>
        <Input
          id="title"
          value={formData.title || ""}
          onChange={(e) => onChange({ ...formData, title: e.target.value })}
          placeholder="e.g., Mastering Emotional Intelligence"
          className="border-[#E4D9C4] focus:border-[#D8B46B]"
        />
      </div>

      {/* Subtitle */}
      <div>
        <Label htmlFor="subtitle" className="text-[#2B2725] mb-2 block">
          Subtitle / Tagline
        </Label>
        <Input
          id="subtitle"
          value={formData.subtitle || ""}
          onChange={(e) => onChange({ ...formData, subtitle: e.target.value })}
          placeholder="A compelling one-liner that captures your course"
          className="border-[#E4D9C4] focus:border-[#D8B46B]"
        />
      </div>

      {/* Short Description */}
      <div>
        <Label htmlFor="short_description" className="text-[#2B2725] mb-2 block">
          Short Description
        </Label>
        <Textarea
          id="short_description"
          value={formData.short_description || ""}
          onChange={(e) => onChange({ ...formData, short_description: e.target.value })}
          placeholder="A brief overview for course listings (1-2 sentences)"
          className="border-[#E4D9C4] focus:border-[#D8B46B] h-24"
        />
      </div>

      {/* Long Description */}
      <div>
        <Label htmlFor="long_description" className="text-[#2B2725] mb-2 block">
          Full Description
        </Label>
        <Textarea
          id="long_description"
          value={formData.long_description || ""}
          onChange={(e) => onChange({ ...formData, long_description: e.target.value })}
          placeholder="The complete course description that will appear on the course page"
          className="border-[#E4D9C4] focus:border-[#D8B46B] h-32"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Duration */}
        <div>
          <Label htmlFor="duration" className="text-[#2B2725] mb-2 block">
            Duration
          </Label>
          <Input
            id="duration"
            value={formData.duration || ""}
            onChange={(e) => onChange({ ...formData, duration: e.target.value })}
            placeholder="e.g., 2 hours, 4 weeks"
            className="border-[#E4D9C4] focus:border-[#D8B46B]"
          />
        </div>

        {/* Difficulty */}
        <div>
          <Label className="text-[#2B2725] mb-2 block">Difficulty Level</Label>
          <Select
            value={formData.difficulty || ""}
            onValueChange={(value) => onChange({ ...formData, difficulty: value })}
          >
            <SelectTrigger className="border-[#E4D9C4] focus:border-[#D8B46B]">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Intro">Intro</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Deep Work">Deep Work</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Thumbnail */}
      <div>
        <Label className="text-[#2B2725] mb-2 block">Course Thumbnail</Label>
        {formData.thumbnail ? (
          <div className="relative">
            <img
              src={formData.thumbnail}
              alt="Course thumbnail"
              className="w-full h-48 object-cover rounded-lg"
            />
            <Button
              type="button"
              onClick={() => onChange({ ...formData, thumbnail: "" })}
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
            >
              Remove
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#E4D9C4] rounded-lg p-8 text-center">
            <Upload className="mx-auto text-[#D8B46B] mb-3" size={40} />
            <p className="text-[#2B2725]/70 mb-3">
              Upload a course thumbnail (16:9 ratio recommended)
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
              id="thumbnail-upload"
            />
            <label htmlFor="thumbnail-upload">
              <Button type="button" variant="outline" asChild>
                <span>Choose Image</span>
              </Button>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}