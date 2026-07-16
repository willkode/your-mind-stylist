import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Mail, Phone, Calendar, User, Filter, CheckCircle, X, MessageSquare, Zap, TrendingUp, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

export default function ManagerWaitingList() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("waiting");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [contactNotes, setContactNotes] = useState("");
  const [communicationDialogOpen, setCommunicationDialogOpen] = useState(false);
  const [communicationMessage, setCommunicationMessage] = useState("");
  const [communicationMethod, setCommunicationMethod] = useState("note");
  const [sendEmail, setSendEmail] = useState(false);

  const { data: waitingList = [], isLoading } = useQuery({
    queryKey: ["waitingList"],
    queryFn: () => base44.entities.WaitingList.list("-requested_date"),
  });

  const { data: appointmentTypes = [] } = useQuery({
    queryKey: ["appointmentTypes"],
    queryFn: () => base44.entities.AppointmentType.list(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }) => 
      base44.entities.WaitingList.update(id, {
        status,
        manager_notes: notes,
        contacted_date: status === "contacted" ? new Date().toISOString() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitingList"] });
      toast.success("Status updated");
    },
  });

  const sendContactEmailMutation = useMutation({
    mutationFn: async ({ entry }) => {
      await base44.integrations.Core.SendEmail({
        to: entry.user_email,
        subject: "We have availability for you!",
        body: `
          <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="font-family: 'Playfair Display', serif; color: #1E3A32;">Good news, ${entry.user_name}!</h2>
            
            <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
              We have availability that matches your preferences. 
            </p>
            
            <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
              Please visit your dashboard to book your session, or reply to this email and we'll help you schedule.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://yourmindstylist.com/Bookings" 
                 style="display: inline-block; background: #1E3A32; color: #F9F5EF; padding: 16px 32px; text-decoration: none; font-weight: 500;">
                BOOK YOUR SESSION
              </a>
            </div>
            
            <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
              Roberta Fernandez<br>
              <span style="color: #D8B46B;">Your Mind Stylist</span>
            </p>
          </div>
        `,
      });

      await base44.entities.WaitingList.update(entry.id, {
        status: "contacted",
        contacted_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitingList"] });
      toast.success("Contact email sent");
    },
  });

  const calculatePriorityMutation = useMutation({
    mutationFn: (waitlist_id) => base44.functions.invoke('calculateWaitlistPriority', { waitlist_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitingList"] });
      toast.success("Priority calculated");
    },
  });

  const autoMatchMutation = useMutation({
    mutationFn: () => base44.functions.invoke('autoMatchWaitlist', {}),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["waitingList"] });
      toast.success(`Auto-match completed! ${result.data.matches_found} matches found.`);
    },
  });

  const sendCommunicationMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('sendWaitlistCommunication', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitingList"] });
      setCommunicationDialogOpen(false);
      setCommunicationMessage("");
      toast.success('Communication logged');
    },
  });

  const handleViewDetails = (entry) => {
    setSelectedEntry(entry);
    setContactNotes(entry.manager_notes || "");
    setDetailsOpen(true);
  };

  const handleUpdateStatus = (newStatus) => {
    if (!selectedEntry) return;
    updateStatusMutation.mutate({
      id: selectedEntry.id,
      status: newStatus,
      notes: contactNotes,
    });
    setDetailsOpen(false);
  };

  const filteredList = statusFilter === "all"
    ? waitingList
    : waitingList.filter((entry) => entry.status === statusFilter);

  const getAppointmentTypeName = (id) => {
    const apt = appointmentTypes.find((a) => a.id === id);
    return apt?.name || "Any available session";
  };

  const statusColors = {
    waiting: "bg-yellow-100 text-yellow-800",
    contacted: "bg-blue-100 text-blue-800",
    booked: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    expired: "bg-gray-100 text-gray-800",
  };

  if (isLoading) {
    return <div className="p-8">Loading waiting list...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Client Waiting List</h1>
            <p className="text-[#2B2725]/70">
              Manage clients waiting for appointment slots
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[#2B2725]/60" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 border-l-4 border-yellow-500">
            <p className="text-sm text-[#2B2725]/60 mb-1">Waiting</p>
            <p className="text-3xl font-serif text-[#1E3A32]">
              {waitingList.filter((e) => e.status === "waiting").length}
            </p>
          </div>
          <div className="bg-white p-6 border-l-4 border-blue-500">
            <p className="text-sm text-[#2B2725]/60 mb-1">Contacted</p>
            <p className="text-3xl font-serif text-[#1E3A32]">
              {waitingList.filter((e) => e.status === "contacted").length}
            </p>
          </div>
          <div className="bg-white p-6 border-l-4 border-green-500">
            <p className="text-sm text-[#2B2725]/60 mb-1">Booked</p>
            <p className="text-3xl font-serif text-[#1E3A32]">
              {waitingList.filter((e) => e.status === "booked").length}
            </p>
          </div>
          <div className="bg-white p-6 border-l-4 border-[#D8B46B]">
            <p className="text-sm text-[#2B2725]/60 mb-1">Total</p>
            <p className="text-3xl font-serif text-[#1E3A32]">
              {waitingList.length}
            </p>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="bg-white p-4 mb-6 flex gap-3">
          <Button
            onClick={() => autoMatchMutation.mutate()}
            disabled={autoMatchMutation.isPending}
            className="bg-[#1E3A32] hover:bg-[#2B2725]"
          >
            <Zap size={16} className="mr-2" />
            {autoMatchMutation.isPending ? 'Running...' : 'Run Auto-Match'}
          </Button>
        </div>

        {/* Waiting List Table */}
        <div className="bg-white overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-[#F9F5EF] border-b border-[#E4D9C4]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#2B2725] uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#2B2725] uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#2B2725] uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#2B2725] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#2B2725] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4D9C4]">
              {filteredList.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#F9F5EF]/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#D8B46B]/20 flex items-center justify-center">
                        <User size={16} className="text-[#D8B46B]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1E3A32]">{entry.user_name}</p>
                        <div className="flex items-center gap-2 text-sm text-[#2B2725]/60">
                          <Mail size={12} />
                          {entry.user_email}
                        </div>
                        {entry.user_phone && (
                          <div className="flex items-center gap-2 text-sm text-[#2B2725]/60">
                            <Phone size={12} />
                            {entry.user_phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#1E3A32]">
                      {getAppointmentTypeName(entry.appointment_type_id)}
                    </p>
                    {entry.flexible && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Flexible
                      </Badge>
                    )}
                    {entry.priority_score !== undefined && entry.priority_score > 0 && (
                      <Badge variant="outline" className="mt-1 text-xs bg-[#D8B46B]/10">
                        Priority: {entry.priority_score}
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-[#2B2725]/80">
                      <Clock size={14} />
                      {format(new Date(entry.requested_date || entry.created_date), "MMM d, yyyy")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={statusColors[entry.status]}>
                      {entry.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => calculatePriorityMutation.mutate(entry.id)}
                        disabled={calculatePriorityMutation.isPending}
                        title="Calculate Priority Score"
                      >
                        <TrendingUp size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(entry)}
                      >
                        View Details
                      </Button>
                      {entry.status === "waiting" && (
                        <Button
                          size="sm"
                          onClick={() => sendContactEmailMutation.mutate({ entry })}
                          disabled={sendContactEmailMutation.isPending}
                          className="bg-[#1E3A32] hover:bg-[#2B2725]"
                        >
                          <Mail size={14} className="mr-1" />
                          Contact
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredList.length === 0 && (
            <div className="text-center py-12">
              <Clock size={48} className="mx-auto text-[#2B2725]/30 mb-4" />
              <p className="text-[#2B2725]/60">
                No clients in waiting list with status: {statusFilter}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Waiting List Entry Details</DialogTitle>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-6 py-4">
              {/* Client Info */}
              <div>
                <h3 className="font-medium text-[#1E3A32] mb-3">Client Information</h3>
                <div className="bg-[#F9F5EF] p-4 rounded space-y-2">
                  <p><strong>Name:</strong> {selectedEntry.user_name}</p>
                  <p><strong>Email:</strong> {selectedEntry.user_email}</p>
                  {selectedEntry.user_phone && (
                    <p><strong>Phone:</strong> {selectedEntry.user_phone}</p>
                  )}
                </div>
              </div>

              {/* Request Details */}
              <div>
                <h3 className="font-medium text-[#1E3A32] mb-3">Request Details</h3>
                <div className="bg-[#F9F5EF] p-4 rounded space-y-2">
                  <p><strong>Service:</strong> {getAppointmentTypeName(selectedEntry.appointment_type_id)}</p>
                  <p><strong>Requested:</strong> {format(new Date(selectedEntry.requested_date || selectedEntry.created_date), "MMMM d, yyyy 'at' h:mm a")}</p>
                  <p><strong>Flexible:</strong> {selectedEntry.flexible ? "Yes" : "No"}</p>
                  {selectedEntry.preferred_times && selectedEntry.preferred_times.length > 0 && (
                    <p><strong>Preferred Times:</strong> {selectedEntry.preferred_times.join(", ")}</p>
                  )}
                </div>
              </div>

              {/* Client Notes */}
              {selectedEntry.notes && (
                <div>
                  <h3 className="font-medium text-[#1E3A32] mb-3">Client Notes</h3>
                  <div className="bg-[#F9F5EF] p-4 rounded">
                    <p className="text-sm text-[#2B2725]/80 whitespace-pre-wrap">
                      {selectedEntry.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Manager Notes */}
              <div>
                <h3 className="font-medium text-[#1E3A32] mb-3">Manager Notes</h3>
                <Textarea
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCommunicationDialogOpen(true);
                  }}
                >
                  <MessageSquare size={16} className="mr-2" />
                  Add Communication
                </Button>
                <Button
                  variant="outline"
                  onClick={() => calculatePriorityMutation.mutate(selectedEntry.id)}
                  disabled={calculatePriorityMutation.isPending}
                >
                  <TrendingUp size={16} className="mr-2" />
                  Recalculate Priority
                </Button>
                {selectedEntry.status === "waiting" && (
                  <>
                    <Button
                      onClick={() => handleUpdateStatus("contacted")}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Mark as Contacted
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus("cancelled")}
                      variant="outline"
                      className="flex-1"
                    >
                      <X size={16} className="mr-2" />
                      Cancel Request
                    </Button>
                  </>
                )}
                {selectedEntry.status === "contacted" && (
                  <Button
                    onClick={() => handleUpdateStatus("booked")}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Calendar size={16} className="mr-2" />
                    Mark as Booked
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Communication Dialog */}
      <Dialog open={communicationDialogOpen} onOpenChange={setCommunicationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Communication</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Method</label>
                <Select value={communicationMethod} onValueChange={setCommunicationMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Internal Note</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="text">Text Message</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={communicationMessage}
                  onChange={(e) => setCommunicationMessage(e.target.value)}
                  rows={4}
                  placeholder="Enter your message or notes..."
                />
              </div>

              {communicationMethod === 'email' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sendEmailCheck"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                  />
                  <label htmlFor="sendEmailCheck" className="text-sm">Send email to client</label>
                </div>
              )}

              <Button
                onClick={() => {
                  sendCommunicationMutation.mutate({
                    waitlist_id: selectedEntry.id,
                    method: communicationMethod,
                    message: communicationMessage,
                    send_email: sendEmail
                  });
                }}
                disabled={!communicationMessage || sendCommunicationMutation.isPending}
                className="w-full"
              >
                <Send size={16} className="mr-2" />
                {sendCommunicationMutation.isPending ? 'Sending...' : 'Add Communication'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}