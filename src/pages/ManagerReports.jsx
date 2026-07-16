import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, Calendar, DollarSign, Users, TrendingUp } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";

export default function ManagerReports() {
  const [dateRange, setDateRange] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [segmentFilter, setSegmentFilter] = useState("all");

  const { data: bookings = [] } = useQuery({
    queryKey: ["allBookings"],
    queryFn: () => base44.entities.Booking.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list(),
  });

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "week":
        return { start: new Date(now.setDate(now.getDate() - 7)), end: new Date() };
      case "month":
        return { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };
      case "quarter":
        return { start: new Date(now.setMonth(now.getMonth() - 3)), end: new Date() };
      case "year":
        return { start: startOfYear(new Date()), end: endOfYear(new Date()) };
      case "custom":
        return { start: startDate ? new Date(startDate) : null, end: endDate ? new Date(endDate) : null };
      default:
        return { start: null, end: null };
    }
  };

  const { start, end } = getDateRange();

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    // Date filter
    const bookingDate = new Date(booking.created_date);
    if (start && end && !isWithinInterval(bookingDate, { start, end })) {
      return false;
    }

    // Service filter
    if (serviceFilter !== "all" && booking.service_type !== serviceFilter) {
      return false;
    }

    // Segment filter (based on user tags)
    if (segmentFilter !== "all") {
      const user = users.find(u => u.email === booking.user_email);
      if (segmentFilter === "new" && user) {
        const daysSinceJoined = (new Date() - new Date(user.created_date)) / (1000 * 60 * 60 * 24);
        if (daysSinceJoined > 30) return false;
      }
      if (segmentFilter === "returning" && user) {
        const userBookings = bookings.filter(b => b.user_email === booking.user_email);
        if (userBookings.length < 2) return false;
      }
    }

    return true;
  });

  // Calculate metrics
  const totalRevenue = filteredBookings
    .filter(b => b.payment_status === "paid")
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  const avgBookingValue = filteredBookings.length > 0
    ? totalRevenue / filteredBookings.filter(b => b.payment_status === "paid").length
    : 0;

  const uniqueClients = new Set(filteredBookings.map(b => b.user_email)).size;

  const conversionRate = filteredBookings.length > 0
    ? (filteredBookings.filter(b => b.payment_status === "paid").length / filteredBookings.length) * 100
    : 0;

  // Revenue by service
  const revenueByService = filteredBookings
    .filter(b => b.payment_status === "paid")
    .reduce((acc, booking) => {
      const service = booking.service_type || "other";
      if (!acc[service]) {
        acc[service] = { service, revenue: 0, count: 0 };
      }
      acc[service].revenue += booking.amount || 0;
      acc[service].count += 1;
      return acc;
    }, {});

  const serviceData = Object.values(revenueByService).map(s => ({
    ...s,
    revenue: s.revenue / 100,
  }));

  // Revenue trend (by day/week/month based on range)
  const revenueTrend = filteredBookings
    .filter(b => b.payment_status === "paid")
    .reduce((acc, booking) => {
      const date = format(new Date(booking.created_date), "MMM d");
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, bookings: 0 };
      }
      acc[date].revenue += (booking.amount || 0) / 100;
      acc[date].bookings += 1;
      return acc;
    }, {});

  const trendData = Object.values(revenueTrend).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  // Client segments
  const segments = {
    new: users.filter(u => {
      const daysSinceJoined = (new Date() - new Date(u.created_date)) / (1000 * 60 * 60 * 24);
      return daysSinceJoined <= 30;
    }).length,
    returning: users.filter(u => {
      const userBookings = bookings.filter(b => b.user_email === u.email);
      return userBookings.length >= 2;
    }).length,
    inactive: users.filter(u => {
      const userBookings = bookings.filter(b => b.user_email === u.email);
      const lastBooking = userBookings.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      )[0];
      if (!lastBooking) return false;
      const daysSinceLast = (new Date() - new Date(lastBooking.created_date)) / (1000 * 60 * 60 * 24);
      return daysSinceLast > 90;
    }).length,
  };

  const segmentData = [
    { name: "New Clients", value: segments.new, color: "#10b981" },
    { name: "Returning", value: segments.returning, color: "#D8B46B" },
    { name: "Inactive 90d", value: segments.inactive, color: "#ef4444" },
  ];

  const COLORS = ["#D8B46B", "#6E4F7D", "#A6B7A3", "#1E3A32"];

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Client Name",
      "Client Email",
      "Service Type",
      "Amount",
      "Status",
      "Payment Status",
    ];

    const rows = filteredBookings.map(b => [
      format(new Date(b.created_date), "yyyy-MM-dd"),
      b.user_name,
      b.user_email,
      b.service_type,
      `$${((b.amount || 0) / 100).toFixed(2)}`,
      b.booking_status,
      b.payment_status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bookings-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("Bookings Report", 20, 20);

    // Date range
    doc.setFontSize(10);
    const dateRangeText = start && end
      ? `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`
      : "All time";
    doc.text(`Report Period: ${dateRangeText}`, 20, 30);

    // Summary metrics
    doc.setFontSize(12);
    doc.text("Summary", 20, 45);
    doc.setFontSize(10);
    doc.text(`Total Revenue: $${(totalRevenue / 100).toFixed(2)}`, 20, 55);
    doc.text(`Total Bookings: ${filteredBookings.length}`, 20, 62);
    doc.text(`Unique Clients: ${uniqueClients}`, 20, 69);
    doc.text(`Avg Booking Value: $${(avgBookingValue / 100).toFixed(2)}`, 20, 76);
    doc.text(`Conversion Rate: ${conversionRate.toFixed(1)}%`, 20, 83);

    // Bookings table
    doc.setFontSize(12);
    doc.text("Bookings", 20, 100);
    doc.setFontSize(8);

    let y = 110;
    filteredBookings.slice(0, 20).forEach((booking) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const row = `${format(new Date(booking.created_date), "MM/dd")} | ${booking.user_name} | ${booking.service_type} | $${((booking.amount || 0) / 100).toFixed(2)}`;
      doc.text(row, 20, y);
      y += 7;
    });

    doc.save(`report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("PDF exported");
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Advanced Reports</h1>
            <p className="text-[#2B2725]/70">Generate custom reports with filtering and export</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleExportCSV} variant="outline">
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleExportPDF} variant="outline">
              <Download size={16} className="mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Report Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">Last 3 Months</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === "custom" && (
                <>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div>
                <Label>Service Type</Label>
                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    <SelectItem value="private_sessions">Private Sessions</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Client Segment</Label>
                <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    <SelectItem value="new">New (&lt; 30 days)</SelectItem>
                    <SelectItem value="returning">Returning (2+ bookings)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Total Revenue</p>
                  <p className="text-2xl font-bold text-[#1E3A32]">
                    ${(totalRevenue / 100).toLocaleString()}
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
                  <p className="text-sm text-[#2B2725]/60">Total Bookings</p>
                  <p className="text-2xl font-bold text-[#1E3A32]">
                    {filteredBookings.length}
                  </p>
                </div>
                <Calendar size={32} className="text-[#6E4F7D]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Unique Clients</p>
                  <p className="text-2xl font-bold text-[#1E3A32]">
                    {uniqueClients}
                  </p>
                </div>
                <Users size={32} className="text-[#A6B7A3]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Avg Booking Value</p>
                  <p className="text-2xl font-bold text-[#1E3A32]">
                    ${(avgBookingValue / 100).toFixed(0)}
                  </p>
                </div>
                <TrendingUp size={32} className="text-[#1E3A32]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#D8B46B" strokeWidth={2} name="Revenue ($)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by Service */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Service</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceData}
                    dataKey="revenue"
                    nameKey="service"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.service}: $${entry.revenue.toFixed(0)}`}
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Client Segments */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Client Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={segmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#D8B46B">
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Details ({filteredBookings.length} records)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[#E4D9C4]">
                  <tr>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Client</th>
                    <th className="text-left py-3 px-4">Service</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4D9C4]">
                  {filteredBookings.slice(0, 50).map((booking) => (
                    <tr key={booking.id} className="hover:bg-[#F9F5EF]">
                      <td className="py-3 px-4">
                        {format(new Date(booking.created_date), "MMM d, yyyy")}
                      </td>
                      <td className="py-3 px-4">{booking.user_name}</td>
                      <td className="py-3 px-4">{booking.service_type}</td>
                      <td className="py-3 px-4">${((booking.amount || 0) / 100).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          booking.payment_status === "paid" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {booking.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredBookings.length > 50 && (
                <p className="text-xs text-[#2B2725]/60 mt-4 text-center">
                  Showing first 50 of {filteredBookings.length} results. Export for full data.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}