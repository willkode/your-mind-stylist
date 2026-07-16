import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Mail, TrendingUp, Play, CheckCircle, DollarSign, Search, Filter, MousePointer } from "lucide-react";
import MasterclassConversionChart from "@/components/masterclass/MasterclassConversionChart";
import EmailSequenceStatus from "@/components/masterclass/EmailSequenceStatus";
import LeadsList from "@/components/masterclass/LeadsList";
import FunnelVisualization from "@/components/masterclass/FunnelVisualization";

export default function ManagerMasterclass() {
  const [timeRange, setTimeRange] = useState("30");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  const { data: signups = [], isLoading } = useQuery({
    queryKey: ["masterclassSignups"],
    queryFn: () => base44.entities.MasterclassSignup.list("-signup_date"),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => base44.entities.Booking.list(),
  });

  const sendEmailsMutation = useMutation({
    mutationFn: async (emailType) => {
      const response = await base44.functions.invoke('sendMasterclassEmails', { 
        email_type: emailType 
      });
      return response.data;
    },
    onSuccess: (data) => {
      alert(`Successfully sent ${data.sent_count} emails`);
      queryClient.invalidateQueries({ queryKey: ["masterclassSignups"] });
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Failed to send emails');
    }
  });

  // Filter signups by time range
  const filteredSignups = signups.filter((signup) => {
    const daysAgo = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    return new Date(signup.signup_date || signup.created_date) >= cutoffDate;
  });

  // Apply search and status filters
  const displayedSignups = filteredSignups.filter((signup) => {
    const matchesSearch = searchTerm === "" || 
      signup.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signup.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "watched" && signup.watched) ||
      (filterStatus === "not_watched" && !signup.watched) ||
      (filterStatus === "converted" && signup.converted_to);
    
    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const totalSignups = filteredSignups.length;
  const watchedCount = filteredSignups.filter(s => s.watched).length;
  const watchRate = totalSignups > 0 ? ((watchedCount / totalSignups) * 100).toFixed(1) : 0;
  
  const convertedCount = filteredSignups.filter(s => s.converted_to).length;
  const conversionRate = totalSignups > 0 ? ((convertedCount / totalSignups) * 100).toFixed(1) : 0;

  // Email status counts
  const confirmationsSent = filteredSignups.filter(s => s.confirmation_sent).length;
  const remindersSent = filteredSignups.filter(s => s.reminder_sent).length;
  const postEmail1Sent = filteredSignups.filter(s => s.post_email_1_sent).length;
  const postEmail2Sent = filteredSignups.filter(s => s.post_email_2_sent).length;
  const postEmail3Sent = filteredSignups.filter(s => s.post_email_3_sent).length;

  // CTA metrics
  const ctaClicks = filteredSignups.filter(s => s.clicked_cta).length;
  const ctaClickRate = watchedCount > 0 ? ((ctaClicks / watchedCount) * 100).toFixed(1) : 0;

  // Calculate revenue from conversions
  const conversionRevenue = filteredSignups
    .filter(s => s.converted_to)
    .reduce((sum, signup) => {
      const userBookings = bookings.filter(b => 
        b.user_email === signup.email && b.payment_status === 'paid'
      );
      return sum + userBookings.reduce((s, b) => s + (b.amount || 0), 0);
    }, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A32] mx-auto mb-4"></div>
          <p className="text-[#2B2725]/70">Loading masterclass data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Masterclass Funnel</h1>
            <p className="text-[#2B2725]/70">Track signups, engagement, and conversions</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
              <SelectItem value="99999">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-[#6E4F7D]" />
              <span className="text-xs text-[#2B2725]/60 uppercase tracking-wide">Signups</span>
            </div>
            <div className="font-serif text-3xl text-[#1E3A32] mb-1">{totalSignups}</div>
            <p className="text-sm text-[#2B2725]/60">Total leads</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <Play className="w-8 h-8 text-[#2D8CFF]" />
              <span className="text-xs text-[#2B2725]/60 uppercase tracking-wide">Watch Rate</span>
            </div>
            <div className="font-serif text-3xl text-[#1E3A32] mb-1">{watchRate}%</div>
            <p className="text-sm text-[#2B2725]/60">{watchedCount} watched</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <MousePointer className="w-8 h-8 text-[#D8B46B]" />
              <span className="text-xs text-[#2B2725]/60 uppercase tracking-wide">CTA Clicks</span>
            </div>
            <div className="font-serif text-3xl text-[#1E3A32] mb-1">{ctaClickRate}%</div>
            <p className="text-sm text-[#2B2725]/60">{ctaClicks} clicked</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-[#A6B7A3]" />
              <span className="text-xs text-[#2B2725]/60 uppercase tracking-wide">Conversion</span>
            </div>
            <div className="font-serif text-3xl text-[#1E3A32] mb-1">{conversionRate}%</div>
            <p className="text-sm text-[#2B2725]/60">{convertedCount} converted</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-[#1E3A32]" />
              <span className="text-xs text-[#2B2725]/60 uppercase tracking-wide">Revenue</span>
            </div>
            <div className="font-serif text-3xl text-[#1E3A32] mb-1">
              ${(conversionRevenue / 100).toLocaleString()}
            </div>
            <p className="text-sm text-[#2B2725]/60">From conversions</p>
          </motion.div>
        </div>

        {/* Email Automation Controls */}
        <div className="bg-white p-6 shadow-md mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-[#1E3A32]" />
              <h3 className="font-serif text-xl text-[#1E3A32]">Email Automation</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-[#F9F5EF] p-4 text-center">
              <div className="text-2xl font-serif text-[#1E3A32] mb-1">{confirmationsSent}</div>
              <div className="text-xs text-[#2B2725]/70">Confirmations</div>
            </div>
            <div className="bg-[#F9F5EF] p-4 text-center">
              <div className="text-2xl font-serif text-[#1E3A32] mb-1">{remindersSent}</div>
              <div className="text-xs text-[#2B2725]/70">Reminders</div>
            </div>
            <div className="bg-[#F9F5EF] p-4 text-center">
              <div className="text-2xl font-serif text-[#1E3A32] mb-1">{postEmail1Sent}</div>
              <div className="text-xs text-[#2B2725]/70">Follow-up 1</div>
            </div>
            <div className="bg-[#F9F5EF] p-4 text-center">
              <div className="text-2xl font-serif text-[#1E3A32] mb-1">{postEmail2Sent}</div>
              <div className="text-xs text-[#2B2725]/70">Follow-up 2</div>
            </div>
            <div className="bg-[#F9F5EF] p-4 text-center">
              <div className="text-2xl font-serif text-[#1E3A32] mb-1">{postEmail3Sent}</div>
              <div className="text-xs text-[#2B2725]/70">Follow-up 3</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button 
              size="sm"
              onClick={() => sendEmailsMutation.mutate('confirmation')}
              disabled={sendEmailsMutation.isPending}
            >
              Send Confirmations
            </Button>
            <Button 
              size="sm"
              onClick={() => sendEmailsMutation.mutate('reminder')}
              disabled={sendEmailsMutation.isPending}
            >
              Send Reminders
            </Button>
            <Button 
              size="sm"
              onClick={() => sendEmailsMutation.mutate('post_1')}
              disabled={sendEmailsMutation.isPending}
            >
              Send Follow-up 1
            </Button>
            <Button 
              size="sm"
              onClick={() => sendEmailsMutation.mutate('post_2')}
              disabled={sendEmailsMutation.isPending}
            >
              Send Follow-up 2
            </Button>
            <Button 
              size="sm"
              onClick={() => sendEmailsMutation.mutate('post_3')}
              disabled={sendEmailsMutation.isPending}
            >
              Send Follow-up 3
            </Button>
          </div>
        </div>

        {/* Funnel & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <FunnelVisualization signups={filteredSignups} />
          <MasterclassConversionChart signups={filteredSignups} />
          <EmailSequenceStatus signups={filteredSignups} />
        </div>

        {/* Leads List */}
        <div className="bg-white p-6 shadow-md">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#2B2725]/40" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leads</SelectItem>
                <SelectItem value="watched">Watched</SelectItem>
                <SelectItem value="not_watched">Not Watched</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <LeadsList signups={displayedSignups} />
        </div>
      </div>
    </div>
  );
}