import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function ClientIntakeForm({ onBack, onContinue }) {
  const [formData, setFormData] = useState({
    phone: "",
    contact_preference: "",
    how_heard: "",
    goals: "",
    concerns: "",
    previous_experience: "",
    health_considerations: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onContinue(formData);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D8B46B] to-[#A6B7A3] flex items-center justify-center">
              <Heart size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-[#1E3A32]">Tell Us About Yourself</h2>
              <p className="text-sm text-[#2B2725]/60">Help us prepare for your session</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phone Number */}
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="(555) 555-5555"
              required
            />
          </div>

          {/* Contact Preference */}
          <div>
            <Label htmlFor="contact_preference">Preferred Contact Method</Label>
            <Select value={formData.contact_preference} onValueChange={(val) => updateField("contact_preference", val)} required>
              <SelectTrigger>
                <SelectValue placeholder="How should we reach you?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="text">Text Message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* How They Heard */}
          <div>
            <Label htmlFor="how_heard">How did you hear about us?</Label>
            <Select value={formData.how_heard} onValueChange={(val) => updateField("how_heard", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select one..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google Search</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="referral">Friend/Family Referral</SelectItem>
                <SelectItem value="blog">Blog/Article</SelectItem>
                <SelectItem value="podcast">Podcast</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Goals */}
          <div>
            <Label htmlFor="goals">What are you hoping to achieve in this session?</Label>
            <Textarea
              id="goals"
              value={formData.goals}
              onChange={(e) => updateField("goals", e.target.value)}
              placeholder="Share what you'd like to work on..."
              className="h-24 resize-none"
              required
            />
            <p className="text-xs text-[#2B2725]/50 mt-1">
              This helps us tailor the session to your specific needs
            </p>
          </div>

          {/* Concerns */}
          <div>
            <Label htmlFor="concerns">Any specific concerns or topics you'd like to address?</Label>
            <Textarea
              id="concerns"
              value={formData.concerns}
              onChange={(e) => updateField("concerns", e.target.value)}
              placeholder="What's on your mind?"
              className="h-20 resize-none"
            />
          </div>

          {/* Previous Experience */}
          <div>
            <Label htmlFor="previous_experience">Previous experience with hypnosis or coaching?</Label>
            <Select value={formData.previous_experience} onValueChange={(val) => updateField("previous_experience", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Tell us about your experience..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No previous experience</SelectItem>
                <SelectItem value="some">Some experience</SelectItem>
                <SelectItem value="extensive">Extensive experience</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Health Considerations */}
          <div>
            <Label htmlFor="health_considerations">
              Any medical or mental health considerations we should be aware of?
            </Label>
            <Textarea
              id="health_considerations"
              value={formData.health_considerations}
              onChange={(e) => updateField("health_considerations", e.target.value)}
              placeholder="Optional - anything that helps us serve you better"
              className="h-20 resize-none"
            />
            <p className="text-xs text-[#2B2725]/50 mt-1 italic">
              Your information is confidential and helps us provide the best care
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              Continue
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}