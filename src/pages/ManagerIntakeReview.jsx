import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, Download, Search, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function ManagerIntakeReview() {
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null); // intake to delete
  const [downloading, setDownloading] = useState(false);
  const queryClient = useQueryClient();

  const { data: intakes = [], isLoading } = useQuery({
    queryKey: ['consultation-intakes'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getIntakeForms', {});
      return res.data?.intakes || [];
    }
  });

  const filteredIntakes = intakes.filter(intake => {
    const matchesSearch = intake.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         intake.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || intake.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDownloadPDF = async (intakeId) => {
    setDownloading(true);
    try {
      const { data } = await base44.functions.invoke('generateIntakePDF', { intake_id: intakeId });
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `intake_${intakeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadThenDelete = async (intake) => {
    await handleDownloadPDF(intake.id);
    setDeleteTarget(intake);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await base44.entities.ConsultationIntake.delete(deleteTarget.id);
    queryClient.invalidateQueries({ queryKey: ['consultation-intakes'] });
    setDeleteTarget(null);
    setSelectedIntake(null);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'submitted': return 'bg-green-100 text-green-800';
      case 'incomplete': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading intake forms...</div>;
  }

  return (
    <div className="p-6 bg-[#F9F5EF] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Consultation Intake Forms</h1>
          <p className="text-[#2B2725]/70">Review and manage client intake questionnaires</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" size={20} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "submitted" ? "default" : "outline"}
              onClick={() => setStatusFilter("submitted")}
            >
              Submitted
            </Button>
            <Button
              variant={statusFilter === "incomplete" ? "default" : "outline"}
              onClick={() => setStatusFilter("incomplete")}
            >
              Incomplete
            </Button>
            <Button
              variant={statusFilter === "reviewed" ? "default" : "outline"}
              onClick={() => setStatusFilter("reviewed")}
            >
              Reviewed
            </Button>
          </div>
        </div>

        {/* Intake List */}
        <div className="grid gap-4">
          {filteredIntakes.map((intake) => (
            <Card key={intake.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-lg text-[#1E3A32]">{intake.name}</h3>
                      <Badge className={getStatusColor(intake.status)}>
                        {intake.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-[#2B2725]/70 space-y-1">
                      <p>{intake.email} • {intake.phone}</p>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>
                          Submitted: {intake.submitted_date ? format(new Date(intake.submitted_date), 'MMM dd, yyyy h:mm a') : 'Not yet submitted'}
                        </span>
                      </div>
                      {intake.consultation_date && (
                        <div className="flex items-center gap-2 text-[#D8B46B]">
                          <Calendar size={14} />
                          <span>Consultation: {format(new Date(intake.consultation_date), 'MMM dd, yyyy h:mm a')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedIntake(intake)}
                      className="border-[#D8B46B] text-[#1E3A32]"
                    >
                      <FileText size={16} className="mr-2" />
                      View Details
                    </Button>
                    {intake.status === 'submitted' && (
                      <Button
                        onClick={() => handleDownloadPDF(intake.id)}
                        disabled={downloading}
                        className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
                      >
                        <Download size={16} className="mr-2" />
                        Download PDF
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setDeleteTarget(intake)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      title="Delete this submission"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredIntakes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText size={48} className="mx-auto text-[#2B2725]/30 mb-4" />
              <p className="text-[#2B2725]/60">No intake forms found</p>
            </CardContent>
          </Card>
        )}

        {/* Detail Dialog */}
        {selectedIntake && (
          <Dialog open={!!selectedIntake} onOpenChange={() => setSelectedIntake(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">
                  Intake Form: {selectedIntake.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-[#1E3A32] mb-3">Personal Information</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedIntake.name}</div>
                    <div><span className="font-medium">DOB:</span> {selectedIntake.birth_date}</div>
                    <div><span className="font-medium">Phone:</span> {selectedIntake.phone}</div>
                    <div><span className="font-medium">Email:</span> {selectedIntake.email}</div>
                    <div className="col-span-2"><span className="font-medium">Address:</span> {selectedIntake.address}, {selectedIntake.city}, {selectedIntake.state} {selectedIntake.zip}</div>
                    <div><span className="font-medium">Occupation:</span> {selectedIntake.occupation}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-[#1E3A32] mb-3">Primary Concerns</h3>
                  <p className="text-sm text-[#2B2725]/80 whitespace-pre-wrap">{selectedIntake.primary_concerns}</p>
                </div>

                {selectedIntake.goals_expectations && (
                  <div>
                    <h3 className="font-medium text-[#1E3A32] mb-3">Goals & Expectations</h3>
                    <p className="text-sm text-[#2B2725]/80 whitespace-pre-wrap">{selectedIntake.goals_expectations}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-medium text-[#1E3A32] mb-3">Health Information</h3>
                  <div className="text-sm space-y-2">
                    {selectedIntake.health_diagnosis && selectedIntake.health_diagnosis.length > 0 && (
                      <div><span className="font-medium">Diagnosed Conditions:</span> {Array.isArray(selectedIntake.health_diagnosis) ? selectedIntake.health_diagnosis.join(', ') : selectedIntake.health_diagnosis}</div>
                    )}
                    {selectedIntake.health_conditions && selectedIntake.health_conditions.length > 0 && (
                      <div><span className="font-medium">Other Health Conditions:</span> {Array.isArray(selectedIntake.health_conditions) ? selectedIntake.health_conditions.join(', ') : selectedIntake.health_conditions}</div>
                    )}
                    {selectedIntake.other_conditions && (
                      <div><span className="font-medium">Other Conditions Detail:</span> {selectedIntake.other_conditions}</div>
                    )}
                    {selectedIntake.current_medications && (
                      <div><span className="font-medium">Medications:</span> {selectedIntake.current_medications}</div>
                    )}
                    {selectedIntake.current_therapy && (
                      <div><span className="font-medium">Currently Seeing Someone:</span> {selectedIntake.current_therapy}</div>
                    )}
                    {selectedIntake.addictions && (
                      <div><span className="font-medium">Substance Use:</span> {selectedIntake.addictions}</div>
                    )}
                    {selectedIntake.emotions && selectedIntake.emotions.length > 0 && (
                      <div><span className="font-medium">Excessive Emotions:</span> {Array.isArray(selectedIntake.emotions) ? selectedIntake.emotions.join(', ') : selectedIntake.emotions}</div>
                    )}
                    {selectedIntake.events && selectedIntake.events.length > 0 && (
                      <div><span className="font-medium">Life Events:</span> {Array.isArray(selectedIntake.events) ? selectedIntake.events.join(', ') : selectedIntake.events}</div>
                    )}
                    {selectedIntake.events_explain && (
                      <div><span className="font-medium">Events Detail:</span> {selectedIntake.events_explain}</div>
                    )}
                    {selectedIntake.boundaries && (
                      <div><span className="font-medium">Diagnosis Boundaries:</span> {selectedIntake.boundaries}</div>
                    )}
                    {selectedIntake.mental_health_diagnosis && (
                      <div><span className="font-medium">Mental Health Diagnosis:</span> {selectedIntake.mental_health_diagnosis}</div>
                    )}
                    {selectedIntake.mental_health_details && (
                      <div><span className="font-medium">Mental Health Details:</span> {selectedIntake.mental_health_details}</div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center gap-3 pt-4 border-t flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteTarget(selectedIntake)}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete Submission
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedIntake(null)}>
                      Close
                    </Button>
                    <Button
                      onClick={() => handleDownloadThenDelete(selectedIntake)}
                      disabled={downloading}
                      className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
                    >
                      <Download size={16} className="mr-2" />
                      Download & Delete
                    </Button>
                    <Button
                      onClick={() => handleDownloadPDF(selectedIntake.id)}
                      disabled={downloading}
                      className="bg-[#D8B46B] hover:bg-[#c9a45a] text-[#1E3A32]"
                    >
                      <Download size={16} className="mr-2" />
                      Download Only
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Intake Submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTarget?.name}'s intake form submission. This action cannot be undone. Make sure you have downloaded a copy first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}