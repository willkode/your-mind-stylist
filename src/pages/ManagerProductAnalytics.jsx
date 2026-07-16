import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, TrendingUp, Package, Loader2 } from "lucide-react";

export default function ManagerProductAnalytics() {
  const [timeRange, setTimeRange] = useState("30");

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("-created_date"),
  });

  // Mock payment data - in production, you'd fetch actual Stripe data or store purchase records
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["product-analytics", timeRange],
    queryFn: async () => {
      // This would call a backend function that fetches Stripe payment data
      // For now, returning mock data structure
      const days = parseInt(timeRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // In production: const response = await base44.functions.invoke('getProductAnalytics', { days });
      
      return {
        totalRevenue: 15420.50,
        totalSales: 42,
        conversionRate: 3.2,
        averageOrderValue: 367.15,
        revenueByProduct: [
          { name: "Certification", revenue: 5985, sales: 3 },
          { name: "Private Sessions", revenue: 4795, sales: 6 },
          { name: "Toolkit Bundle", revenue: 2876, sales: 4 },
          { name: "Pocket Visualization", revenue: 1764, sales: 252 },
        ],
        revenueOverTime: [
          { date: "Week 1", revenue: 2100 },
          { date: "Week 2", revenue: 3400 },
          { date: "Week 3", revenue: 4200 },
          { date: "Week 4", revenue: 5720 },
        ],
        topProducts: [
          { name: "Certification", value: 38, color: "#1E3A32" },
          { name: "Private Sessions", value: 28, color: "#D8B46B" },
          { name: "Toolkit", value: 20, color: "#A6B7A3" },
          { name: "Pocket Viz", value: 14, color: "#6E4F7D" },
        ],
      };
    },
  });

  const isLoading = productsLoading || analyticsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D8B46B]" size={32} />
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Product Analytics</h1>
            <p className="text-[#2B2725]/70">
              Track revenue, sales performance, and conversion metrics
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#2B2725]/70">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-[#A6B7A3]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1E3A32]">
                {formatCurrency(analytics.totalRevenue)}
              </div>
              <p className="text-xs text-[#A6B7A3] mt-1">
                +12.5% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#2B2725]/70">
                Total Sales
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-[#A6B7A3]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1E3A32]">
                {analytics.totalSales}
              </div>
              <p className="text-xs text-[#A6B7A3] mt-1">
                +8 from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#2B2725]/70">
                Conversion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-[#A6B7A3]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1E3A32]">
                {analytics.conversionRate}%
              </div>
              <p className="text-xs text-[#A6B7A3] mt-1">
                +0.4% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#2B2725]/70">
                Avg. Order Value
              </CardTitle>
              <Package className="h-4 w-4 text-[#A6B7A3]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1E3A32]">
                {formatCurrency(analytics.averageOrderValue)}
              </div>
              <p className="text-xs text-[#A6B7A3] mt-1">
                +5.2% from last period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#1E3A32]">Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4D9C4" />
                  <XAxis dataKey="date" stroke="#2B2725" />
                  <YAxis stroke="#2B2725" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#F9F5EF', border: '1px solid #E4D9C4' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1E3A32"
                    strokeWidth={2}
                    dot={{ fill: '#D8B46B', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#1E3A32]">Sales Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.topProducts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Revenue by Product */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-[#1E3A32]">Revenue by Product</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analytics.revenueByProduct}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4D9C4" />
                <XAxis dataKey="name" stroke="#2B2725" />
                <YAxis stroke="#2B2725" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#F9F5EF', border: '1px solid #E4D9C4' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#1E3A32" name="Revenue" />
                <Bar dataKey="sales" fill="#D8B46B" name="Sales Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product Performance Table */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg text-[#1E3A32]">Product Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E4D9C4]">
                    <th className="text-left py-3 px-4 text-[#2B2725]/70 font-medium">Product</th>
                    <th className="text-right py-3 px-4 text-[#2B2725]/70 font-medium">Revenue</th>
                    <th className="text-right py-3 px-4 text-[#2B2725]/70 font-medium">Sales</th>
                    <th className="text-right py-3 px-4 text-[#2B2725]/70 font-medium">Avg. Price</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.revenueByProduct.map((product, idx) => (
                    <tr key={idx} className="border-b border-[#E4D9C4] hover:bg-[#F9F5EF]">
                      <td className="py-3 px-4 text-[#1E3A32]">{product.name}</td>
                      <td className="py-3 px-4 text-right text-[#1E3A32] font-medium">
                        {formatCurrency(product.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right text-[#2B2725]/70">{product.sales}</td>
                      <td className="py-3 px-4 text-right text-[#2B2725]/70">
                        {formatCurrency(product.revenue / product.sales)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}