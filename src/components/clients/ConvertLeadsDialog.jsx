import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import InviteEmailPreview from "./InviteEmailPreview";

export default function ConvertLeadsDialog({ open, onOpenChange, leads, onSuccess }) {
  const [step, setStep] = useState(1);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [includeEnrollment, setIncludeEnrollment] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [converting, setConverting] = useState(false);
  const [results, setResults] = useState(null);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [brandedEmailConfig, setBrandedEmailConfig] = useState(null);

  // Get all available courses
  const [courses, setCourses] = React.useState([]);
  React.useEffect(() => {
    if (open) {
      base44.entities.Course.list().then((data) => setCourses(data));
    }
  }, [open]);

  const unconvertedLeads = leads.filter((l) => !l.converted_to_client);

  const handleSelectLead = (leadId) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === unconvertedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(unconvertedLeads.map((l) => l.id));
    }
  };

  const handleConvert = async (emailConfig) => {
    if (selectedLeads.length === 0) {
      toast.error("Please select at least one lead");
      return;
    }

    setConverting(true);
    try {
      const leadsToConvert = unconvertedLeads.filter((l) => selectedLeads.includes(l.id));

      const response = await base44.functions.invoke("bulkImportKajabiUsers", {
        users: leadsToConvert.map((lead) => ({
          email: lead.email,
          full_name: lead.full_name || lead.email,
          first_name: lead.first_name || lead.full_name?.split(" ")[0] || "",
          last_name: lead.last_name || lead.full_name?.split(" ").slice(1).join(" ") || "",
        })),
        courses: includeEnrollment ? selectedCourses : [],
        brandedSubject: emailConfig?.subject,
        brandedBody: emailConfig?.body,
      });

      // Mark leads as converted
      for (const lead of leadsToConvert) {
        await base44.entities.Lead.update(lead.id, { converted_to_client: true });
      }

      setResults(response.data);
      setStep(3);
    } catch (error) {
      toast.error("Conversion failed: " + error.message);
      setConverting(false);
    }
  };

  const handleClose = () => {
    if (step === 3) {
      onSuccess();
      onOpenChange(false);
    }
    setStep(1);
    setSelectedLeads([]);
    setSelectedCourses([]);
    setIncludeEnrollment(false);
    setResults(null);
    setBrandedEmailConfig(null);
    setConverting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite to Platform</DialogTitle>
          <DialogDescription>
            {step === 1 && "Select people to invite — they'll receive an email to set up their account"}
            {step === 2 && "Optionally enroll them in courses (enrollment happens after they accept the invite)"}
            {step === 3 && "Invitations sent!"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select Leads */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 p-3 bg-[#F9F5EF] rounded-lg">
              <Checkbox
                checked={selectedLeads.length === unconvertedLeads.length && unconvertedLeads.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label className="font-medium cursor-pointer flex-1">
                Select All ({unconvertedLeads.length})
              </Label>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {unconvertedLeads.length === 0 ? (
                <p className="text-center py-8 text-[#2B2725]/60">All leads have been converted</p>
              ) : (
                unconvertedLeads.map((lead) => (
                  <div key={lead.id} className="flex items-start gap-3 p-3 border border-[#E4D9C4] rounded-lg">
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => handleSelectLead(lead.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[#1E3A32]">{lead.full_name || lead.email}</p>
                      <p className="text-sm text-[#2B2725]/60">{lead.email}</p>
                      {lead.what_inquired_about && (
                        <p className="text-xs text-[#2B2725]/50 mt-1">
                          Interested in: {lead.what_inquired_about}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => handleClose()}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={selectedLeads.length === 0}
                className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
              >
                Next ({selectedLeads.length} selected)
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select Courses (Optional) */}
        {step === 2 && (
          <div className="space-y-6">
            <Card className="border-[#D8B46B]/30">
              <CardHeader>
                <CardTitle className="text-lg">Enroll in Courses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={includeEnrollment}
                    onCheckedChange={setIncludeEnrollment}
                  />
                  <Label className="font-medium cursor-pointer">
                   Also enroll in courses after they accept the invite
                  </Label>
                </div>

                {includeEnrollment && (
                  <div className="space-y-3 pl-6 border-l-2 border-[#D8B46B] pt-2">
                    <p className="text-sm text-[#2B2725]/70">
                      Select courses for the {selectedLeads.length} invited people. Enrollment will be available after they create their account:
                    </p>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {courses.length === 0 ? (
                        <p className="text-sm text-[#2B2725]/60">No courses available</p>
                      ) : (
                        courses.map((course) => (
                          <div key={course.id} className="flex items-start gap-2">
                            <Checkbox
                              checked={selectedCourses.includes(course.id)}
                              onCheckedChange={(checked) => {
                                setSelectedCourses((prev) =>
                                  checked ? [...prev, course.id] : prev.filter((id) => id !== course.id)
                                );
                              }}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#1E3A32]">{course.title}</p>
                              <p className="text-xs text-[#2B2725]/60">{course.type}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={() => setEmailPreviewOpen(true)}
                disabled={converting}
                className="bg-[#6E4F7D] hover:bg-[#5A3F69] text-white"
              >
                <Eye size={16} className="mr-2" />
                Preview &amp; Send {selectedLeads.length} Invite{selectedLeads.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && results && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 size={20} className="text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">
                    {results.imported} invite{results.imported !== 1 ? "s" : ""} sent
                  </p>
                  <p className="text-sm text-green-700">
                    They'll appear as "Invite Sent — Awaiting Setup" until they create their account
                  </p>
                </div>
              </div>

              {results.enrolled > 0 && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <CheckCircle2 size={20} className="text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">
                      {results.enrolled} enrollment{results.enrolled !== 1 ? "s" : ""} completed
                    </p>
                    <p className="text-sm text-blue-700">
                      {selectedCourses.length} course{selectedCourses.length !== 1 ? "s" : ""} assigned
                    </p>
                  </div>
                </div>
              )}

              {results.failed > 0 && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">
                      {results.failed} failed
                    </p>
                    <p className="text-sm text-yellow-700">
                      Check the system logs for details
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleClose}
                className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Branded Email Preview (shown before bulk send) */}
      <InviteEmailPreview
        open={emailPreviewOpen}
        onOpenChange={setEmailPreviewOpen}
        recipientName={(() => {
          const first = unconvertedLeads.find((l) => selectedLeads.includes(l.id));
          return first?.full_name || first?.first_name || "Preview Recipient";
        })()}
        recipientEmail={(() => {
          const first = unconvertedLeads.find((l) => selectedLeads.includes(l.id));
          return first?.email || "";
        })()}
        onConfirmSend={async (config) => {
          setEmailPreviewOpen(false);
          await handleConvert(config);
        }}
      />
    </Dialog>
  );
}