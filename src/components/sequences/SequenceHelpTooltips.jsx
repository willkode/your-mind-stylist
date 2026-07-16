import React from "react";
import { HelpCircle, Lightbulb } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function SequenceInfoBanner() {
  return (
    <div className="bg-gradient-to-r from-[#1E3A32]/5 to-[#D8B46B]/10 border border-[#E4D9C4] rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Lightbulb size={20} className="text-[#D8B46B] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[#2B2725]/70 space-y-2">
          <p className="font-medium text-[#1E3A32]">How Email Sequences Work</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li><span className="font-medium">Create a sequence</span> — Choose a name and a trigger (what starts the sequence)</li>
            <li><span className="font-medium">Add email steps</span> — Write the emails people will receive, with delays between each</li>
            <li><span className="font-medium">Activate it</span> — Toggle the sequence on, and it runs automatically</li>
            <li><span className="font-medium">Sync to MailerLite</span> — Optionally push the sequence to MailerLite for delivery</li>
          </ol>
          <p className="text-xs text-[#2B2725]/50 pt-1 border-t border-[#E4D9C4]">
            <span className="font-medium">Tip:</span> Use triggers like "Product Purchase" to automatically send a thank-you series when someone buys, or "Consultation Submitted" to follow up with new prospects.
          </p>
        </div>
      </div>
    </div>
  );
}

export function TriggerHelpTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="p-1 text-[#2B2725]/40 hover:text-[#1E3A32] transition-colors">
            <HelpCircle size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs bg-[#1E3A32] text-[#F9F5EF] border-0">
          <div className="space-y-2 text-xs">
            <p className="font-semibold text-sm">What are triggers?</p>
            <p>Triggers determine <span className="font-medium">when</span> someone gets enrolled in this email sequence. For example:</p>
            <ul className="space-y-1 ml-2">
              <li>• <span className="font-medium text-[#D8B46B]">Product Purchase</span> — Send a thank-you + onboarding series after they buy</li>
              <li>• <span className="font-medium text-[#D8B46B]">Consultation Submitted</span> — Nurture leads who filled out the intake form</li>
              <li>• <span className="font-medium text-[#D8B46B]">Lead Magnet Download</span> — Follow up with people who grabbed a free resource</li>
              <li>• <span className="font-medium text-[#D8B46B]">Manual</span> — You hand-pick who enters the sequence</li>
            </ul>
            <p className="text-[#F9F5EF]/60 pt-1 border-t border-[#F9F5EF]/20">Some triggers let you pick a specific product, course, or tag to narrow who gets enrolled.</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function StepDelayTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="p-1 text-[#2B2725]/40 hover:text-[#1E3A32] transition-colors">
            <HelpCircle size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs bg-[#1E3A32] text-[#F9F5EF] border-0">
          <div className="text-xs space-y-1">
            <p className="font-semibold text-sm">Email Timing</p>
            <p>Each email is sent after a delay from the <span className="font-medium">previous</span> email (or the trigger event for the first email).</p>
            <p className="text-[#F9F5EF]/60">Example: Email 1 at 0 days (immediately), Email 2 at 2 days, Email 3 at 5 days.</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}