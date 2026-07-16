import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserX, Loader2, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export default function OptOutLeadDialog({ open, onOpenChange, lead }) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (!lead) return null;

  const displayName = lead.full_name || lead.first_name || lead.email;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const nowISO = new Date().toISOString();
      const dateStr = format(new Date(), "M/d/yyyy");
      const existingTags = lead.tags || [];
      const existingNotes = lead.notes || "";

      const updates = {
        lead_status: "archived",
        opted_out_at: nowISO,
        tags: existingTags.includes("opted_out")
          ? existingTags
          : [...existingTags, "opted_out"],
        notes: `${existingNotes}\n[${dateStr}] Opted out / requested removal from email list.`.trim(),
      };

      await base44.entities.Lead.update(lead.id, updates);

      // Log the activity
      await base44.entities.ActivityLog.create({
        action: "lead_opted_out",
        actor: "manager",
        target: lead.email,
        details: `${displayName} opted out and was archived. They will not receive future emails or invites.`,
      });

      toast({
        title: "Opted out successfully",
        description: `${displayName} has been removed from future email batches. Their record is preserved for history.`,
      });

      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["person-lead", lead.email] });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-[#1E3A32] flex items-center gap-2">
            <UserX size={20} className="text-amber-600" />
            Opt Out / Archive
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-2">
              <p className="text-sm text-[#2B2725]/80">
                You are opting out <strong>{displayName}</strong> ({lead.email}).
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800 font-medium">This will:</p>
                </div>
                <ul className="text-sm text-amber-700 space-y-1 ml-6 list-disc">
                  <li>Remove them from all future invite and email batches</li>
                  <li>Archive their lead record (hidden from active list)</li>
                  <li>Add an "opted_out" tag for tracking</li>
                </ul>
              </div>
              <div className="bg-[#F9F5EF] border border-[#E4D9C4] rounded-lg p-3">
                <p className="text-sm text-[#1E3A32] font-medium">What is preserved:</p>
                <ul className="text-sm text-[#2B2725]/70 space-y-1 ml-4 list-disc mt-1">
                  <li>Their full record and history</li>
                  <li>Purchase and source information</li>
                  <li>All notes and activity logs</li>
                </ul>
                <p className="text-xs text-[#2B2725]/50 mt-2 italic">
                  Nothing is deleted. You can restore them later if needed.
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loading ? (
              <Loader2 size={15} className="mr-2 animate-spin" />
            ) : (
              <UserX size={15} className="mr-2" />
            )}
            Confirm Opt Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}