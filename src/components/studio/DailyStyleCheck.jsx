import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Sparkles, ArrowRight, Plus } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

const STARTER_IDENTITIES = [
  { name: "The Grounded One", description: "Calm, clear, connected to yourself. You're leading from intention, not reaction.", is_default: true },
  { name: "The Performer", description: "You're showing up, but it's costing you. Powering through, people-pleasing, or masking.", is_default: true },
  { name: "The Old Pattern", description: "The default autopilot. Reactive, contracted, running familiar survival scripts.", is_default: true }
];

export default function DailyStyleCheck({ onClose, onComplete }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: state, 2: voice, 3: identity, 4: done
  const [showAddIdentity, setShowAddIdentity] = useState(false);
  const [newIdentityName, setNewIdentityName] = useState("");
  const [newIdentityDesc, setNewIdentityDesc] = useState("");
  const [checkInData, setCheckInData] = useState({
    state_key: "calm_activated",
    state_value: 50,
    voice_tone: null,
    identity_id: null,
    identity_name: null,
    notes: ""
  });

  // Fetch identities
  const { data: identities = [] } = useQuery({
    queryKey: ["identity-wardrobe"],
    queryFn: async () => {
      const user = await base44.auth.me();
      const existing = await base44.entities.IdentityWardrobe.filter({ created_by: user.email });
      if (existing.length === 0) {
        // Auto-seed starter identities for new users
        await Promise.all(STARTER_IDENTITIES.map(i => base44.entities.IdentityWardrobe.create(i)));
        return base44.entities.IdentityWardrobe.filter({ created_by: user.email });
      }
      return existing;
    }
  });

  // Add custom identity mutation
  const addIdentityMutation = useMutation({
    mutationFn: (data) => base44.entities.IdentityWardrobe.create(data),
    onSuccess: (newIdentity) => {
      queryClient.invalidateQueries({ queryKey: ["identity-wardrobe"] });
      handleIdentitySelect(newIdentity);
      setShowAddIdentity(false);
      setNewIdentityName("");
      setNewIdentityDesc("");
    }
  });

  // Save check-in
  const saveCheckInMutation = useMutation({
    mutationFn: (data) => base44.entities.DailyStyleCheck.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-style-checks"] });
      setStep(4);
    }
  });

  const handleStateChange = (value) => {
    setCheckInData({ ...checkInData, state_value: value });
  };

  const handleStateKeyChange = (key) => {
    setCheckInData({ ...checkInData, state_key: key, state_value: 50 });
  };

  const handleVoiceToneSelect = (tone) => {
    setCheckInData({ ...checkInData, voice_tone: tone });
  };

  const handleIdentitySelect = (identity) => {
    setCheckInData({ 
      ...checkInData, 
      identity_id: identity?.id || null,
      identity_name: identity?.name || null
    });
  };

  const handleSubmit = () => {
    const dataToSave = { ...checkInData };
    // Remove null/empty fields
    Object.keys(dataToSave).forEach(key => {
      if (dataToSave[key] === null || dataToSave[key] === "") {
        delete dataToSave[key];
      }
    });
    saveCheckInMutation.mutate(dataToSave);
  };

  const stateOptions = [
    { key: "calm_activated", left: "Calm", right: "Activated" },
    { key: "grounded_scattered", left: "Grounded", right: "Scattered" },
    { key: "open_guarded", left: "Open", right: "Guarded" }
  ];

  const voiceTones = [
      { value: "supportive", label: "Kind", icon: "💚" },
      { value: "neutral", label: "Neutral", icon: "⚪" },
      { value: "critical", label: "Critical", icon: "🔴" },
      { value: "urgent", label: "Urgent", icon: "⚡" },
      { value: "avoidant", label: "Avoidant", icon: "🌫️" }
    ];

  const selectedState = stateOptions.find(s => s.key === checkInData.state_key);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ paddingBottom: "120px" }}
        className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4 overflow-y-auto lg:overflow-visible lg:pb-0"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg lg:rounded-xl shadow-2xl w-full mx-4 max-w-lg max-h-[calc(100vh-240px)] lg:max-h-[90vh] overflow-y-auto my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-[#E4D9C4] p-3 lg:p-6 flex justify-between items-start gap-2 lg:gap-4">
            <div className="flex-1">
              <h2 className="font-serif text-base lg:text-2xl text-[#1E3A32]">Daily Style Check™</h2>
              <p className="text-[10px] lg:text-sm text-[#2B2725]/60">Quick check-in • Everything optional</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
              <X size={18} />
            </Button>
          </div>

          {/* Content */}
          <div className="p-3 lg:p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: State Selection */}
              {step === 1 && (
                <motion.div
                  key="state"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 lg:space-y-6"
                >
                  <div>
                    <h3 className="font-medium text-[#1E3A32] text-sm lg:text-base mb-3 lg:mb-4">How are you showing up?</h3>
                    
                    {/* State Type Selector */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {stateOptions.map((option) => (
                        <button
                          key={option.key}
                          onClick={() => handleStateKeyChange(option.key)}
                          className={`px-2 lg:px-3 py-1.5 rounded text-xs lg:text-sm transition-colors flex-1 lg:flex-none ${
                            checkInData.state_key === option.key
                              ? "bg-[#D8B46B] text-white"
                              : "bg-[#F9F5EF] text-[#2B2725]/70 hover:bg-[#E4D9C4]"
                          }`}
                        >
                          {option.left} ↔ {option.right}
                        </button>
                      ))}
                    </div>

                    {/* Slider */}
                    <div className="space-y-2 lg:space-y-3">
                      <div className="flex justify-between text-[11px] lg:text-sm text-[#2B2725]/70">
                        <span>{selectedState.left}</span>
                        <span>{selectedState.right}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={checkInData.state_value}
                        onChange={(e) => handleStateChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-[#E4D9C4] rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #D8B46B ${checkInData.state_value}%, #E4D9C4 ${checkInData.state_value}%)`
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 lg:gap-3 pt-4 flex-col lg:flex-row">
                    <Button variant="outline" onClick={() => { handleSubmit(); }} className="flex-1 text-sm lg:text-base">
                      Skip to Save
                    </Button>
                    <Button onClick={() => setStep(2)} className="flex-1 bg-[#1E3A32] hover:bg-[#2B2725] text-sm lg:text-base">
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Voice Tone */}
              {step === 2 && (
                <motion.div
                  key="voice"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 lg:space-y-6"
                >
                  <div>
                    <h3 className="font-medium text-[#1E3A32] text-sm lg:text-base mb-3 lg:mb-4">What's your inner voice tone?</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-3">
                      {voiceTones.map((tone) => (
                        <button
                          key={tone.value}
                          onClick={() => handleVoiceToneSelect(tone.value)}
                          className={`p-3 lg:p-4 rounded-lg border-2 transition-all text-center ${
                            checkInData.voice_tone === tone.value
                              ? "border-[#D8B46B] bg-[#D8B46B]/10"
                              : "border-[#E4D9C4] hover:border-[#D8B46B]/50"
                          }`}
                        >
                          <div className="text-lg lg:text-2xl mb-1 lg:mb-2">{tone.icon}</div>
                          <div className="text-xs lg:text-sm font-medium text-[#1E3A32]">{tone.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 lg:gap-3 pt-4 flex-col lg:flex-row">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1 text-sm lg:text-base">
                      Back
                    </Button>
                    <Button variant="outline" onClick={() => setStep(3)} className="flex-1 text-sm lg:text-base">
                      Skip
                    </Button>
                    <Button onClick={() => setStep(3)} disabled={!checkInData.voice_tone} className="flex-1 bg-[#1E3A32] hover:bg-[#2B2725] text-sm lg:text-base">
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Identity Selection */}
              {step === 3 && (
                <motion.div
                  key="identity"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 lg:space-y-6"
                >
                  <div>
                    <h3 className="font-medium text-[#1E3A32] text-sm lg:text-base mb-1">Which outfit are you wearing?</h3>
                    <p className="text-xs text-[#2B2725]/60 mb-3">Which version of you showed up today?</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {identities.map((identity) => (
                        <button
                          key={identity.id}
                          onClick={() => handleIdentitySelect(identity)}
                          className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                            checkInData.identity_id === identity.id
                              ? "border-[#D8B46B] bg-[#D8B46B]/10"
                              : "border-[#E4D9C4] hover:border-[#D8B46B]/50"
                          }`}
                        >
                          <div className="text-sm font-medium text-[#1E3A32]">{identity.name}</div>
                          {identity.description && (
                            <div className="text-xs text-[#2B2725]/60 mt-1">{identity.description}</div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Add custom identity */}
                    {!showAddIdentity ? (
                      <button
                        onClick={() => setShowAddIdentity(true)}
                        className="mt-3 flex items-center gap-1.5 text-xs text-[#1E3A32]/60 hover:text-[#1E3A32] transition-colors"
                      >
                        <Plus size={13} /> Add your own identity
                      </button>
                    ) : (
                      <div className="mt-3 p-3 bg-[#F9F5EF] rounded-lg border border-[#E4D9C4] space-y-2">
                        <input
                          type="text"
                          placeholder="Identity name (e.g. 'The Nurturer')"
                          value={newIdentityName}
                          onChange={(e) => setNewIdentityName(e.target.value)}
                          className="w-full text-sm px-3 py-2 border border-[#E4D9C4] rounded bg-white focus:outline-none focus:border-[#D8B46B]"
                        />
                        <input
                          type="text"
                          placeholder="Short description (optional)"
                          value={newIdentityDesc}
                          onChange={(e) => setNewIdentityDesc(e.target.value)}
                          className="w-full text-sm px-3 py-2 border border-[#E4D9C4] rounded bg-white focus:outline-none focus:border-[#D8B46B]"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={!newIdentityName.trim() || addIdentityMutation.isPending}
                            onClick={() => addIdentityMutation.mutate({ name: newIdentityName.trim(), description: newIdentityDesc.trim(), is_default: false })}
                            className="flex-1 bg-[#1E3A32] hover:bg-[#2B2725] text-xs"
                          >
                            Save Identity
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setShowAddIdentity(false)} className="text-xs">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 lg:gap-3 pt-4 flex-col lg:flex-row">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1 text-sm lg:text-base">
                      Back
                    </Button>
                    <Button variant="outline" onClick={handleSubmit} className="flex-1 text-sm lg:text-base">
                      Skip & Save
                    </Button>
                    <Button onClick={handleSubmit} className="flex-1 bg-[#1E3A32] hover:bg-[#2B2725] text-sm lg:text-base">
                      Save Check-In
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Complete */}
              {step === 4 && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-6"
                >
                  <div className="w-16 h-16 bg-[#D8B46B]/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={32} className="text-[#D8B46B]" />
                  </div>
                  
                  <div>
                    <h3 className="font-serif text-2xl text-[#1E3A32] mb-2">Check-in saved</h3>
                    <p className="text-[#2B2725]/70">You can check in again anytime</p>
                  </div>

                  <div className="space-y-3">
                    <Button onClick={() => { onComplete?.(); onClose(); navigate('/StyleJournal'); }} className="w-full bg-[#1E3A32] hover:bg-[#2B2725] text-sm lg:text-base">
                      See My Patterns →
                    </Button>
                    <button onClick={() => { onComplete?.(); onClose(); }} className="w-full text-xs text-[#2B2725]/50 hover:text-[#2B2725] transition-colors py-1">
                      Back to Studio
                    </button>

                     <div className="pt-4 border-t border-[#E4D9C4] bg-[#D8B46B]/5 -mx-3 lg:-mx-6 px-3 lg:px-6 py-4">
                      <div className="flex items-start gap-2 mb-3">
                        <Sparkles size={16} className="text-[#D8B46B] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs lg:text-sm text-[#1E3A32] font-medium">Your Stylist's Pick™</p>
                          <p className="text-[9px] lg:text-xs text-[#2B2725]/60 mt-1">
                            Based on your check-in, Roberta recommends a personalized Style Pause to support your current state.
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-[#1E3A32] mb-3 font-medium bg-white/50 p-2 rounded">
                        💡 
                        {checkInData.state_value > 70 && checkInData.state_key === "calm_activated"
                          ? "A quick reset to bring your system down a notch"
                          : checkInData.state_key === "grounded_scattered" && checkInData.state_value > 60
                          ? "A 2-minute pause to help you land back in your body"
                          : "A 2-minute pause to lock in the state you want to carry forward"
                        }
                      </p>
                      <div className="flex flex-col lg:flex-row gap-2">
                        <Link to={createPageUrl('StylePauses')} className="flex-1">
                          <Button 
                            size="sm" 
                            className="w-full text-xs lg:text-sm bg-[#D8B46B] hover:bg-[#C9A55A] text-[#1E3A32]"
                            onClick={onClose}
                          >
                            <Sparkles size={14} className="mr-2" />
                            Browse Style Pauses™
                            <ArrowRight size={14} className="ml-1" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={onClose} className="text-xs lg:text-sm flex-1 lg:flex-none">
                          Skip
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}