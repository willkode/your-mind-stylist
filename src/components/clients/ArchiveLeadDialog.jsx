import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Archive, CheckCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

export default function ArchiveLeadDialog({ open, onOpenChange, lead, action }) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isArchive = action === "archive";

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await base44.entities.Lead.update(lead.id, {
        lead_status: isArchive ? "archived" : "active",
      });

      // Log the activity
      await base44.entities.ActivityLog.create({
        action: isArchive ? "lead_archived" : "lead_restored",
        actor: "manager",
        target: lead.email,
        details: isArchive
          ? `Lead ${lead.full_name || lead.email} archived`
          : `Lead ${lead.full_name || lead.email} restored from archive`,
      });

      toast({
        title: isArchive ? "Lead archived" : "Lead restored",
        description: isArchive
          ? `${lead.full_name || lead.email} has been archived.`
          : `${lead.full_name || lead.email} has been restored to active leads.`,
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
          <DialogTitle className="font-serif text-[#1E3A32]">
            {isArchive ? "Archive Lead" : "Restore Lead"}
          </DialogTitle>
          <DialogDescription>
            {isArchive
              ? `Are you sure you want to archive ${lead.full_name || lead.email}? They will be hidden from the active leads list but their data will be preserved.`
              : `Restore ${lead.full_name || lead.email} back to active leads?`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={isArchive ? "bg-gray-600 hover:bg-gray-700" : "bg-green-600 hover:bg-green-700"}
          >
            {loading ? (
              <Loader2 size={15} className="mr-2 animate-spin" />
            ) : isArchive ? (
              <Archive size={15} className="mr-2" />
            ) : (
              <CheckCircle size={15} className="mr-2" />
            )}
            {isArchive ? "Archive" : "Restore"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}