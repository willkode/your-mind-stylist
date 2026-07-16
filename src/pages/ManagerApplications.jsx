import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, Phone, Mail, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function ManagerApplications() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState(null);
  const [managerNotes, setManagerNotes] = useState("");

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: () => base44.entities.Application.list("-created_date"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Application.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Application updated");
      setSelectedApp(null);
    },
  });

  const handleStatusChange = (status) => {
    if (selectedApp) {
      updateMutation.mutate({
        id: selectedApp.id,
        data: {
          status,
          decision_date: ["accepted", "declined"].includes(status) ? new Date().toISOString() : null,
        },
      });
    }
  };

  const handleSaveNotes = () => {
    if (selectedApp) {
      updateMutation.mutate({
        id: selectedApp.id,
        data: { manager_notes: managerNotes },
      });
    }
  };

  const filteredApps = statusFilter === "all"
    ? applications
    : applications.filter((app) => app.status === statusFilter);

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    reviewing: "bg-blue-100 text-blue-800",
    interview_scheduled: "bg-purple-100 text-purple-800",
    accepted: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
    withdrawn: "bg-gray-100 text-gray-800",
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    declined: applications.filter((a) => a.status === "declined").length,
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Applications</h1>
          <p className="text-[#2B2725]/70">Manage Salon and Couture program applications</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#1E3A32]">{stats.total}</p>
                <p className="text-sm text-[#2B2725]/70">Total Applications</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-[#2B2725]/70">Pending Review</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
                <p className="text-sm text-[#2B2725]/70">Accepted</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{stats.declined}</p>
                <p className="text-sm text-[#2B2725]/70">Declined</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-64 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <Card
              key={app.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setSelectedApp(app);
                setManagerNotes(app.manager_notes || "");
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-lg text-[#1E3A32]">{app.user_name}</h3>
                      <Badge className={statusColors[app.status]}>
                        {app.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline">{app.product_name}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#2B2725]/70">
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        {app.user_email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone size={14} />
                        {app.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {format(new Date(app.created_date), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Application Detail Dialog */}
        <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedApp && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    {selectedApp.user_name}
                    <Badge className={statusColors[selectedApp.status]}>
                      {selectedApp.status.replace("_", " ")}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Contact Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#2B2725]/70 mb-1">Email</p>
                      <p className="text-[#1E3A32]">{selectedApp.user_email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#2B2725]/70 mb-1">Phone</p>
                      <p className="text-[#1E3A32]">{selectedApp.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#2B2725]/70 mb-1">Product</p>
                      <p className="text-[#1E3A32]">{selectedApp.product_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#2B2725]/70 mb-1">Timeline</p>
                      <p className="text-[#1E3A32]">{selectedApp.timeline.replace("_", " ")}</p>
                    </div>
                  </div>

                  {/* Application Details */}
                  <div>
                    <p className="text-sm font-medium text-[#2B2725]/70 mb-2">Current Situation</p>
                    <p className="text-[#1E3A32] whitespace-pre-wrap">{selectedApp.current_situation}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[#2B2725]/70 mb-2">Goals</p>
                    <p className="text-[#1E3A32] whitespace-pre-wrap">{selectedApp.goals}</p>
                  </div>

                  {selectedApp.previous_experience && (
                    <div>
                      <p className="text-sm font-medium text-[#2B2725]/70 mb-2">Previous Experience</p>
                      <p className="text-[#1E3A32] whitespace-pre-wrap">{selectedApp.previous_experience}</p>
                    </div>
                  )}

                  {selectedApp.additional_info && (
                    <div>
                      <p className="text-sm font-medium text-[#2B2725]/70 mb-2">Additional Info</p>
                      <p className="text-[#1E3A32] whitespace-pre-wrap">{selectedApp.additional_info}</p>
                    </div>
                  )}

                  {/* Manager Notes */}
                  <div>
                    <p className="text-sm font-medium text-[#2B2725]/70 mb-2">Manager Notes</p>
                    <Textarea
                      value={managerNotes}
                      onChange={(e) => setManagerNotes(e.target.value)}
                      rows={4}
                      placeholder="Add your notes about this application..."
                    />
                    <Button
                      onClick={handleSaveNotes}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Save Notes
                    </Button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => handleStatusChange("reviewing")}
                      variant="outline"
                      className="flex-1"
                    >
                      <Clock size={16} className="mr-2" />
                      Mark Reviewing
                    </Button>
                    <Button
                      onClick={() => handleStatusChange("accepted")}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleStatusChange("declined")}
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      <XCircle size={16} className="mr-2" />
                      Decline
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}