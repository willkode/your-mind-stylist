import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShoppingCart, Eye, MousePointer, CheckCircle, XCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ManagerPurchaseFunnel() {
  const [timeRange, setTimeRange] = useState("30");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["purchaseEvents", timeRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));
      
      const allEvents = await base44.entities.ActivityLog.filter({
        event_category: "purchase_funnel"
      });
      
      return allEvents.filter(e => new Date(e.created_date) >= daysAgo);
    },
  });

  // Calculate funnel metrics
  const metrics = {
    views: events.filter(e => e.event_type === 'purchase_center.viewed').length,
    clicks: events.filter(e => e.event_type === 'product.card_clicked').length,
    details: events.filter(e => e.event_type === 'product.detail_viewed').length,
    checkouts: events.filter(e => e.event_type === 'product.checkout_started').length,
    purchases: events.filter(e => e.event_type === 'purchase.completed').length,
  };

  const conversionRates = {
    viewToClick: metrics.views > 0 ? ((metrics.clicks / metrics.views) * 100).toFixed(1) : 0,
    clickToDetail: metrics.clicks > 0 ? ((metrics.details / metrics.clicks) * 100).toFixed(1) : 0,
    detailToCheckout: metrics.details > 0 ? ((metrics.checkouts / metrics.details) * 100).toFixed(1) : 0,
    checkoutToPurchase: metrics.checkouts > 0 ? ((metrics.purchases / metrics.checkouts) * 100).toFixed(1) : 0,
    overall: metrics.views > 0 ? ((metrics.purchases / metrics.views) * 100).toFixed(1) : 0,
  };

  // Product performance
  const productPerformance = {};
  events.forEach(event => {
    if (event.event_data?.product_key) {
      const key = event.event_data.product_key;
      if (!productPerformance[key]) {
        productPerformance[key] = {
          views: 0,
          clicks: 0,
          checkouts: 0,
          purchases: 0
        };
      }
      
      if (event.event_type === 'product.detail_viewed') productPerformance[key].views++;
      if (event.event_type === 'product.card_clicked') productPerformance[key].clicks++;
      if (event.event_type === 'product.checkout_started') productPerformance[key].checkouts++;
      if (event.event_type === 'purchase.completed') productPerformance[key].purchases++;
    }
  });

  const topProducts = Object.entries(productPerformance)
    .map(([key, stats]) => ({ key, ...stats }))
    .sort((a, b) => b.purchases - a.purchases)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Purchase Funnel Analytics</h1>
            <p className="text-[#2B2725]/70">Track user journey from discovery to purchase</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Funnel Stages */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-[#2B2725]/70">
                <Eye size={16} />
                Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#1E3A32]">{metrics.views}</p>
              <p className="text-xs text-[#2B2725]/60 mt-1">Purchase Center visits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-[#2B2725]/70">
                <MousePointer size={16} />
                Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#1E3A32]">{metrics.clicks}</p>
              <p className="text-xs text-green-600 mt-1">{conversionRates.viewToClick}% from views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-[#2B2725]/70">
                <Eye size={16} />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#1E3A32]">{metrics.details}</p>
              <p className="text-xs text-green-600 mt-1">{conversionRates.clickToDetail}% from clicks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-[#2B2725]/70">
                <ShoppingCart size={16} />
                Checkouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#1E3A32]">{metrics.checkouts}</p>
              <p className="text-xs text-green-600 mt-1">{conversionRates.detailToCheckout}% from details</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-[#2B2725]/70">
                <CheckCircle size={16} />
                Purchases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{metrics.purchases}</p>
              <p className="text-xs text-green-600 mt-1">{conversionRates.checkoutToPurchase}% from checkouts</p>
            </CardContent>
          </Card>
        </div>

        {/* Overall Conversion */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} />
              Overall Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold text-[#1E3A32]">{conversionRates.overall}%</div>
              <div className="text-[#2B2725]/70">
                of visitors who view the Purchase Center complete a purchase
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.key} className="flex items-center justify-between p-4 bg-[#F9F5EF] rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-[#D8B46B]">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-[#1E3A32]">{product.key}</p>
                      <p className="text-sm text-[#2B2725]/60">
                        {product.views} views • {product.clicks} clicks • {product.checkouts} checkouts
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{product.purchases}</p>
                    <p className="text-xs text-[#2B2725]/60">purchases</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}