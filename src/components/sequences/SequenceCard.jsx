import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, Edit2, Trash2, ChevronDown, ChevronUp, RefreshCw, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SequenceTimeline from "./SequenceTimeline";
import toast from "react-hot-toast";

const TRIGGER_LABELS = {
  manual: "Manual",
  signup: "User Signup",
  masterclass_signup: "Masterclass Signup",
  product_purchase: "Product Purchase",
  booking_completed: "Booking Completed",
  course_started: "Course Started",
  course_completed: "Course Completed",
  abandoned_cart: "Abandoned Cart",
  inactive_user: "Inactive User",
  lead_magnet_download: "Lead Magnet Download",
  consultation_submitted: "Consultation Submitted",
  webinar_registered: "Webinar Registered",
  tag_added: "Tag Added",
  form_submitted: "Form Submitted",
};

export default function SequenceCard({
  sequence,
  steps,
  enrollmentCount,
  onToggleActive,
  onEdit,
  onDelete,
  onReorderSteps,
  onEditStep,
  onDeleteStep,
  onAddStep,
  onSyncMailerLite,
  syncing,
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-[#E4D9C4] rounded-lg bg-white overflow-hidden"
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-serif text-lg text-[#1E3A32]">{sequence.name}</h3>
              <Badge className={sequence.active ? "bg-green-100 text-green-800 text-[10px]" : "bg-gray-100 text-gray-600 text-[10px]"}>
                {sequence.active ? "Active" : "Paused"}
              </Badge>
              <Badge variant="outline" className="text-[10px]">{TRIGGER_LABELS[sequence.trigger_type] || sequence.trigger_type}</Badge>
            </div>
            {sequence.description && (
              <p className="text-sm text-[#2B2725]/60 mb-2">{sequence.description}</p>
            )}
            <div className="flex gap-4 text-xs text-[#2B2725]/60">
              <span>{steps.length} emails</span>
              <span>{enrollmentCount} subscribers</span>
              {sequence.mailerlite_automation_id && (
                <span className="text-[#6E4F7D]">MailerLite synced</span>
              )}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0 ml-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onToggleActive} title={sequence.active ? "Pause" : "Activate"}>
              {sequence.active ? <Pause size={14} /> : <Play size={14} />}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onEdit} title="Edit">
              <Edit2 size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onSyncMailerLite}
              disabled={syncing}
              title="Sync to MailerLite"
            >
              {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
              onClick={() => { if (confirm("Delete this sequence and all its steps?")) onDelete(); }}
              title="Delete"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-[#D8B46B] hover:text-[#1E3A32] mt-3 transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Hide" : "Show"} email timeline
        </button>
      </div>

      {/* Expanded timeline */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-[#E4D9C4]/60">
              <SequenceTimeline
                steps={steps}
                onReorder={onReorderSteps}
                onEditStep={onEditStep}
                onDeleteStep={onDeleteStep}
                onAddStep={onAddStep}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}