import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PatternInsights from "@/components/stylecheck/PatternInsights";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StyleCalendar from "@/components/stylecheck/StyleCalendar";
import StateTrendsChart from "@/components/stylecheck/StateTrendsChart";
import IdentityFrequency from "@/components/stylecheck/IdentityFrequency";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, Download } from "lucide-react";

export default function StyleJournal() {
  const navigate = useNavigate();

  const { data: checkIns = [], isLoading: loadingCheckIns } = useQuery({
    queryKey: ["daily-style-checks"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.DailyStyleCheck.filter({ created_by: user.email }, "-created_date", 365);
    }
  });

  const { data: identities = [] } = useQuery({
    queryKey: ["identity-wardrobe"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.IdentityWardrobe.filter({ created_by: user.email });
    }
  });

  return (
    <div className="min-h-screen bg-[#F9F5EF] pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-[#1E3A32]/60 hover:text-[#1E3A32] mb-4 transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl text-[#1E3A32] mb-1">Style Journal</h1>
              <p className="text-sm text-[#2B2725]/60">Your check-in patterns over time</p>
            </div>
            <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const { default: jsPDF } = await import('jspdf');
                const doc = new jsPDF();
                doc.setFontSize(18);
                doc.text('Style Journal Export', 20, 20);
                doc.setFontSize(10);
                doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy')}`, 20, 30);
                doc.setFontSize(11);
                doc.text('Check-in History', 20, 45);
                doc.setFontSize(9);
                let y = 55;
                checkIns.forEach(ci => {
                  if (y > 270) { doc.addPage(); y = 20; }
                  doc.text(`${format(new Date(ci.created_date), 'MMM d, yyyy')} — ${ci.identity_name || 'N/A'} | State: ${ci.state_value || 'N/A'} | Voice: ${ci.inner_voice_tone || 'N/A'}`, 20, y);
                  y += 8;
                });
                doc.save('style-journal.pdf');
              }}
              className="flex items-center gap-1.5 text-xs text-[#1E3A32]/60 hover:text-[#1E3A32] transition-colors border border-[#E4D9C4] rounded-lg px-3 py-2"
            >
              <Download size={13} /> Export PDF
            </button>
            <button
              onClick={() => navigate('/MyIdentities')}
              className="flex items-center gap-1.5 text-xs text-[#1E3A32]/60 hover:text-[#1E3A32] transition-colors border border-[#E4D9C4] rounded-lg px-3 py-2"
            >
              <Settings size={13} /> Manage Identities
            </button>
            </div>
          </div>
        </div>

        {loadingCheckIns ? (
          <div className="text-center py-16 text-[#2B2725]/40">Loading your patterns...</div>
        ) : checkIns.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#2B2725]/50 text-sm mb-2">No check-ins yet.</p>
            <p className="text-[#2B2725]/40 text-xs">Complete your first Daily Style Check to start seeing your patterns here.</p>
          </div>
        ) : (
          <Tabs defaultValue="insights">
            <TabsList className="mb-6 bg-[#E4D9C4]/50">
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="trends">State Trends</TabsTrigger>
              <TabsTrigger value="identities">Identities</TabsTrigger>
            </TabsList>

            <TabsContent value="insights">
              <PatternInsights checkIns={checkIns} />
            </TabsContent>

            <TabsContent value="calendar">
              <StyleCalendar checkIns={checkIns} identities={identities} />
            </TabsContent>

            <TabsContent value="trends">
              <StateTrendsChart checkIns={checkIns} />
            </TabsContent>

            <TabsContent value="identities">
              <IdentityFrequency checkIns={checkIns} identities={identities} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}