import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, DollarSign, Calendar, TrendingUp, BookOpen, Mail, Clock, User } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, differenceInDays } from "date-fns";

export default function ManagerClientAnalytics() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [timeRange, setTimeRange] = useState("all");

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list("-created_date"),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["allBookings"],
    queryFn: () => base44.entities.Booking.list(),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => base44.entities.Course.list(),
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["courseProgress"],
    queryFn: () => base44.entities.UserCourseProgress.list(),
  });

  const { data: lessonProgress = [] } = useQuery({
    queryKey: ["lessonProgress"],
    queryFn: () => base44.entities.UserLessonProgress.list(),
  });

  // Calculate client metrics
  const getClientMetrics = (userEmail) => {
    const clientBookings = bookings.filter(b => b.user_email === userEmail);
    const clientProgress = progress.filter(p => p.user_id === users.find(u => u.email === userEmail)?.id);
    const userId = users.find(u => u.email === userEmail)?.id;
    const clientLessons = lessonProgress.filter(l => l.user_id === userId);

    // Lifetime Value
    const ltv = clientBookings
      .filter(b => b.payment_status === "paid")
      .reduce((sum, b) => sum + (b.amount || 0), 0);

    // Booking frequency
    const completedBookings = clientBookings.filter(b => b.booking_status === "completed");
    const firstBooking = completedBookings.sort((a, b) => 
      new Date(a.created_date) - new Date(b.created_date)
    )[0];
    const daysSinceFirst = firstBooking 
      ? differenceInDays(new Date(), new Date(firstBooking.created_date))
      : 0;
    const bookingsPerMonth = daysSinceFirst > 0 
      ? (completedBookings.length / daysSinceFirst) * 30 
      : 0;

    // Course engagement
    const coursesEnrolled = clientProgress.length;
    const coursesCompleted = clientProgress.filter(p => p.status === "completed").length;
    const avgProgress = clientProgress.length > 0
      ? clientProgress.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / clientProgress.length
      : 0;

    // Lesson completion
    const lessonsCompleted = clientLessons.filter(l => l.completed).length;
    const totalWatchTime = clientLessons.reduce((sum, l) => sum + (l.watch_time || 0), 0);

    // Retention status
    const lastBooking = completedBookings.sort((a, b) => 
      new Date(b.scheduled_date || b.created_date) - new Date(a.scheduled_date || a.created_date)
    )[0];
    const daysSinceLastBooking = lastBooking
      ? differenceInDays(new Date(), new Date(lastBooking.scheduled_date || lastBooking.created_date))
      : 999;
    const retentionStatus = daysSinceLastBooking < 30 ? "active" : daysSinceLastBooking < 90 ? "at_risk" : "churned";

    return {
      ltv,
      totalBookings: clientBookings.length,
      completedBookings: completedBookings.length,
      bookingsPerMonth: bookingsPerMonth.toFixed(1),
      coursesEnrolled,
      coursesCompleted,
      avgProgress: avgProgress.toFixed(0),
      lessonsCompleted,
      totalWatchTime: Math.round(totalWatchTime / 60), // minutes
      retentionStatus,
      daysSinceLastBooking,
      firstBookingDate: firstBooking?.created_date,
      lastBookingDate: lastBooking?.scheduled_date || lastBooking?.created_date,
    };
  };

  // Get all clients with bookings or course enrollment
  const clients = users.filter(u => {
    const hasBookings = bookings.some(b => b.user_email === u.email);
    const hasCourses = progress.some(p => p.user_id === u.id);
    return hasBookings || hasCourses;
  }).map(u => ({
    ...u,
    metrics: getClientMetrics(u.email)
  })).filter(c => 
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by LTV
  clients.sort((a, b) => b.metrics.ltv - a.metrics.ltv);

  // Overall stats
  const totalRevenue = clients.reduce((sum, c) => sum + c.metrics.ltv, 0);
  const avgLTV = clients.length > 0 ? totalRevenue / clients.length : 0;
  const activeClients = clients.filter(c => c.metrics.retentionStatus === "active").length;
  const churnedClients = clients.filter(c => c.metrics.retentionStatus === "churned").length;

  const retentionColors = {
    active: "#10b981",
    at_risk: "#f59e0b",
    churned: "#ef4444",
  };

  // Chart data for selected client
  const getClientBookingTrend = (userEmail) => {
    const clientBookings = bookings
      .filter(b => b.user_email === userEmail && b.payment_status === "paid")
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    return clientBookings.map((booking, idx) => ({
      booking: idx + 1,
      amount: booking.amount / 100,
      date: format(new Date(booking.created_date), "MMM d"),
    }));
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Client-Specific Analytics</h1>
          <p className="text-[#2B2725]/70">Track individual client value, engagement, and retention</p>
        </div>

        {/* Overall Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Total Revenue</p>
                  <p className="text-2xl font-bold text-[#1E3A32]">
                    ${(totalRevenue / 100).toFixed(0)}
                  </p>
                </div>
                <DollarSign size={32} className="text-[#D8B46B]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Avg Client LTV</p>
                  <p className="text-2xl font-bold text-[#1E3A32]">
                    ${(avgLTV / 100).toFixed(0)}
                  </p>
                </div>
                <TrendingUp size={32} className="text-[#6E4F7D]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Active Clients</p>
                  <p className="text-2xl font-bold text-[#1E3A32]">{activeClients}</p>
                </div>
                <User size={32} className="text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Retention Rate</p>
                  <p className="text-2xl font-bold text-[#1E3A32]">
                    {clients.length > 0 ? Math.round((activeClients / clients.length) * 100) : 0}%
                  </p>
                </div>
                <TrendingUp size={32} className="text-[#A6B7A3]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" size={20} />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Client List */}
        <div className="grid lg:grid-cols-2 gap-6">
          {clients.map((client) => (
            <Card 
              key={client.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedClient(client)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{client.full_name}</CardTitle>
                    <p className="text-sm text-[#2B2725]/60">{client.email}</p>
                  </div>
                  <Badge 
                    style={{ 
                      backgroundColor: retentionColors[client.metrics.retentionStatus] + "20",
                      color: retentionColors[client.metrics.retentionStatus]
                    }}
                  >
                    {client.metrics.retentionStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#2B2725]/60 mb-1">Lifetime Value</p>
                    <p className="text-xl font-bold text-[#1E3A32]">
                      ${(client.metrics.ltv / 100).toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#2B2725]/60 mb-1">Total Bookings</p>
                    <p className="text-xl font-bold text-[#1E3A32]">
                      {client.metrics.totalBookings}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#2B2725]/60 mb-1">Courses Enrolled</p>
                    <p className="text-xl font-bold text-[#1E3A32]">
                      {client.metrics.coursesEnrolled}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#2B2725]/60 mb-1">Avg Progress</p>
                    <p className="text-xl font-bold text-[#1E3A32]">
                      {client.metrics.avgProgress}%
                    </p>
                  </div>
                </div>

                {client.metrics.lastBookingDate && (
                  <div className="mt-4 pt-4 border-t border-[#E4D9C4]">
                    <p className="text-xs text-[#2B2725]/60">
                      Last booking: {format(new Date(client.metrics.lastBookingDate), "MMM d, yyyy")}
                      {client.metrics.daysSinceLastBooking > 0 && 
                        ` (${client.metrics.daysSinceLastBooking} days ago)`
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {clients.length === 0 && (
          <div className="text-center py-12">
            <User size={48} className="mx-auto text-[#2B2725]/30 mb-4" />
            <p className="text-[#2B2725]/60">No clients found</p>
          </div>
        )}

        {/* Detailed Client Modal */}
        {selectedClient && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#E4D9C4]">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-serif text-2xl text-[#1E3A32]">
                      {selectedClient.full_name}
                    </h2>
                    <p className="text-[#2B2725]/60">{selectedClient.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="text-[#2B2725]/60 hover:text-[#2B2725]"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#F9F5EF] p-4 rounded">
                    <p className="text-sm text-[#2B2725]/60 mb-1">Lifetime Value</p>
                    <p className="text-2xl font-bold text-[#1E3A32]">
                      ${(selectedClient.metrics.ltv / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-[#F9F5EF] p-4 rounded">
                    <p className="text-sm text-[#2B2725]/60 mb-1">Bookings/Month</p>
                    <p className="text-2xl font-bold text-[#1E3A32]">
                      {selectedClient.metrics.bookingsPerMonth}
                    </p>
                  </div>
                  <div className="bg-[#F9F5EF] p-4 rounded">
                    <p className="text-sm text-[#2B2725]/60 mb-1">Watch Time</p>
                    <p className="text-2xl font-bold text-[#1E3A32]">
                      {selectedClient.metrics.totalWatchTime}m
                    </p>
                  </div>
                </div>

                {/* Booking Trend Chart */}
                {selectedClient.metrics.totalBookings > 0 && (
                  <div>
                    <h3 className="font-medium text-[#1E3A32] mb-4">Booking Value Over Time</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={getClientBookingTrend(selectedClient.email)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="amount" stroke="#D8B46B" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Course Progress */}
                <div>
                  <h3 className="font-medium text-[#1E3A32] mb-4">Course Enrollment</h3>
                  <div className="space-y-2">
                    {progress
                      .filter(p => p.user_id === selectedClient.id)
                      .map(p => {
                        const course = courses.find(c => c.id === p.course_id);
                        return course ? (
                          <div key={p.id} className="flex justify-between items-center p-3 bg-[#F9F5EF] rounded">
                            <span className="text-sm text-[#1E3A32]">{course.title}</span>
                            <div className="flex items-center gap-3">
                              <div className="w-32 h-2 bg-[#E4D9C4] rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-[#D8B46B]"
                                  style={{ width: `${p.completion_percentage || 0}%` }}
                                />
                              </div>
                              <span className="text-sm text-[#2B2725]/60 w-12 text-right">
                                {p.completion_percentage || 0}%
                              </span>
                            </div>
                          </div>
                        ) : null;
                      })}
                    {progress.filter(p => p.user_id === selectedClient.id).length === 0 && (
                      <p className="text-sm text-[#2B2725]/60 text-center py-4">
                        No course enrollment yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Engagement Summary */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E4D9C4]">
                  <div>
                    <p className="text-sm text-[#2B2725]/60 mb-2">Client Since</p>
                    <p className="text-sm text-[#1E3A32]">
                      {format(new Date(selectedClient.created_date), "MMMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#2B2725]/60 mb-2">Retention Status</p>
                    <Badge 
                      style={{ 
                        backgroundColor: retentionColors[selectedClient.metrics.retentionStatus] + "20",
                        color: retentionColors[selectedClient.metrics.retentionStatus]
                      }}
                    >
                      {selectedClient.metrics.retentionStatus}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}