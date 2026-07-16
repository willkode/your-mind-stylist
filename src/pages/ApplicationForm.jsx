import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle, Send } from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function ApplicationForm() {
  const navigate = useNavigate();
  const [productKey, setProductKey] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    user_name: "",
    user_email: "",
    phone: "",
    current_situation: "",
    goals: "",
    timeline: "flexible",
    budget_confirmed: false,
    previous_experience: "",
    referral_source: "",
    additional_info: "",
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const product = urlParams.get("product");
    if (product) {
      setProductKey(product);
    }
  }, []);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.Application.create({
        ...data,
        user_email: user.email,
        product_key: productKey,
        product_name: productKey === "salon-coaching" ? "Salon (Group Coaching)" : "Couture (1:1 Premium Coaching)"
      });
    },
    onSuccess: () => {
      toast.success("Application submitted successfully!");
      navigate(createPageUrl("Dashboard"));
    },
    onError: () => {
      toast.error("Failed to submit application");
    },
  });

  const steps = [
    {
      title: "Contact Information",
      fields: ["user_name", "user_email", "phone"],
    },
    {
      title: "Your Situation",
      fields: ["current_situation", "goals"],
    },
    {
      title: "Timeline & Background",
      fields: ["timeline", "previous_experience"],
    },
    {
      title: "Final Details",
      fields: ["referral_source", "budget_confirmed", "additional_info"],
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  const isStepValid = () => {
    const currentFields = steps[currentStep].fields;
    return currentFields.every((field) => {
      if (field === "budget_confirmed" || field === "additional_info" || field === "referral_source" || field === "previous_experience") return true;
      return formData[field] && formData[field].trim() !== "";
    });
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">
            {productKey === "salon-coaching" ? "Salon Group Coaching" : "Couture 1:1 Coaching"} Application
          </h1>
          <p className="text-[#2B2725]/70">Step {currentStep + 1} of {steps.length}</p>
        </div>

        <Progress value={progress} className="mb-8" />

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white p-8 rounded-lg shadow-lg mb-6">
                <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">
                  {steps[currentStep].title}
                </h2>

                <div className="space-y-6">
                  {currentStep === 0 && (
                    <>
                      <div>
                        <Label htmlFor="user_name">Full Name *</Label>
                        <Input
                          id="user_name"
                          value={formData.user_name}
                          onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="user_email">Email Address *</Label>
                        <Input
                          id="user_email"
                          type="email"
                          value={formData.user_email}
                          onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                        />
                      </div>
                    </>
                  )}

                  {currentStep === 1 && (
                    <>
                      <div>
                        <Label htmlFor="current_situation">What brings you here today? *</Label>
                        <Textarea
                          id="current_situation"
                          value={formData.current_situation}
                          onChange={(e) => setFormData({ ...formData, current_situation: e.target.value })}
                          rows={5}
                          placeholder="Share your current challenges, what you're working through, or what prompted you to apply..."
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="goals">What would you like to achieve? *</Label>
                        <Textarea
                          id="goals"
                          value={formData.goals}
                          onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                          rows={5}
                          placeholder="Describe your goals, what success looks like for you, or what you hope changes through this work..."
                          required
                        />
                      </div>
                    </>
                  )}

                  {currentStep === 2 && (
                    <>
                      <div>
                        <Label>When are you hoping to start?</Label>
                        <Select
                          value={formData.timeline}
                          onValueChange={(v) => setFormData({ ...formData, timeline: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">Immediately</SelectItem>
                            <SelectItem value="1-3_months">Within 1-3 months</SelectItem>
                            <SelectItem value="3-6_months">Within 3-6 months</SelectItem>
                            <SelectItem value="flexible">Flexible / Not sure</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="previous_experience">Previous Coaching or Therapy Experience</Label>
                        <Textarea
                          id="previous_experience"
                          value={formData.previous_experience}
                          onChange={(e) => setFormData({ ...formData, previous_experience: e.target.value })}
                          rows={4}
                          placeholder="Have you worked with a coach, therapist, or hypnotist before? What was that experience like?"
                        />
                      </div>
                    </>
                  )}

                  {currentStep === 3 && (
                    <>
                      <div>
                        <Label htmlFor="referral_source">How did you hear about us?</Label>
                        <Input
                          id="referral_source"
                          value={formData.referral_source}
                          onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })}
                          placeholder="Friend, social media, search, etc."
                        />
                      </div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="budget_confirmed"
                          checked={formData.budget_confirmed}
                          onCheckedChange={(v) => setFormData({ ...formData, budget_confirmed: v })}
                        />
                        <label htmlFor="budget_confirmed" className="text-sm text-[#2B2725]/80 leading-relaxed">
                          I understand the investment for this program and am prepared to move forward if accepted.
                        </label>
                      </div>
                      <div>
                        <Label htmlFor="additional_info">Anything else you'd like to share?</Label>
                        <Textarea
                          id="additional_info"
                          value={formData.additional_info}
                          onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                          rows={4}
                          placeholder="Any questions, concerns, or additional context you'd like us to know..."
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft size={16} className="mr-2" />
                  Back
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="bg-[#1E3A32] hover:bg-[#2B2725]"
                  >
                    Next
                    <ChevronRight size={16} className="ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!isStepValid() || submitMutation.isPending}
                    className="bg-[#1E3A32] hover:bg-[#2B2725]"
                  >
                    {submitMutation.isPending ? (
                      "Submitting..."
                    ) : (
                      <>
                        Submit Application
                        <Send size={16} className="ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}