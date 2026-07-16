import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function SafeDeleteUserDialog({ open, onOpenChange, user }) {
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");

  const userEmail = user?.email || "";
  const emailMatches = confirmEmail.toLowerCase() === userEmail.toLowerCase();

  const handleConfirm = async () => {
    if (!user?.id || !emailMatches) return;
    setProcessing(true);
    try {
      await base44.functions.invoke("safeDeleteUser", {
        userId: user.id,
        confirmationEmail: confirmEmail,
      });
      toast.success("User data permanently deleted and account anonymized.");
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      setConfirmEmail("");
      onOpenChange(false);
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) setConfirmEmail(""); onOpenChange(v); }}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-700">
            <ShieldAlert size={20} />
            Permanently Delete User Data
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-sm">
              <p>
                This will permanently anonymize <strong>{user?.full_name || user?.email}</strong>'s profile
                and delete all their personal data. This action <strong>cannot be undone</strong>.
              </p>

              {/* What's preserved */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium text-green-800 flex items-center gap-1.5 mb-1.5">
                  <CheckCircle size={14} /> Preserved
                </p>
                <ul className="text-green-700 space-y-0.5 ml-5 list-disc">
                  <li>Booking history & payment records</li>
                  <li>Email send history</li>
                  <li>Lead & source records</li>
                  <li>Activity audit log</li>
                </ul>
              </div>

              {/* What's deleted */}
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-medium text-red-800 flex items-center gap-1.5 mb-1.5">
                  <XCircle size={14} /> Permanently Deleted
                </p>
                <ul className="text-red-700 space-y-0.5 ml-5 list-disc">
                  <li>Course progress & lesson completion</li>
                  <li>Diary entries & personal notes</li>
                  <li>Quiz attempts & reflections</li>
                  <li>Audio sessions & style data</li>
                  <li>Name, phone, address, bio, photo (anonymized)</li>
                </ul>
              </div>

              {/* Confirmation */}
              <div className="pt-2">
                <p className="text-[#2B2725] font-medium mb-2">
                  Type the user's email to confirm:
                </p>
                <Input
                  placeholder={userEmail}
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  className={confirmEmail && !emailMatches ? "border-red-300" : emailMatches ? "border-green-400" : ""}
                />
                {confirmEmail && !emailMatches && (
                  <p className="text-xs text-red-500 mt-1">Email doesn't match</p>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={processing} onClick={() => setConfirmEmail("")}>
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={processing || !emailMatches}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {processing && <Loader2 size={14} className="mr-2 animate-spin" />}
            {processing ? "Deleting..." : "Permanently Delete Data"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}