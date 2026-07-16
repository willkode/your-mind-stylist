import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StyleCalendar from "@/components/stylecheck/StyleCalendar";
import StateTrendsChart from "@/components/stylecheck/StateTrendsChart";
import IdentityFrequency from "@/components/stylecheck/IdentityFrequency";
import PatternInsights from "@/components/stylecheck/PatternInsights";
import { ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ManagerStyleInsights() {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState(null);

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: checkIns = [], isLoading: loadingCheckIns } = useQuery({
    queryKey: ["style-checks-for", selectedUser?.email],
    queryFn: () => base44.entities.DailyStyleCheck.filter({ created_by: selectedUser.email }, "-created_date", 365),
    enabled: !!selectedUser,
  });

  const { data: identities = [] } = useQuery({
    queryKey: ["identities-for", selectedUser?.email],
    queryFn: () => base44.entities.IdentityWardrobe.filter({ created_by: selectedUser.email }),
    enabled: !!selectedUser,
  });

  return (
    <div className="min-h-screen bg-[#F9F5EF] pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-[#1E3A32]/60 hover:text-[#1E3A32] mb-4 transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="font-serif text-3xl text-[#1E3A32] mb-1">Client Style Insights</h1>
          <p className="text-sm text-[#2B2725]/60">View any client's Style Journal to prepare for their session.</p>
        </div>

        {/* User Selector */}
        <div className="mb-8 p-4 bg-white rounded-xl border border-[#E4D9C4]">
          <label className="block text-xs font-medium text-[#2B2725]/60 mb-2 uppercase tracking-wider">Select Client</label>
          {loadingUsers ? (
            <div className="text-sm text-[#2B2725]/40">Loading clients...</div>
          ) : (
            <select
              value={selectedUser?.id || ""}
              onChange={e => {
                const u = users.find(u => u.id === e.target.value);
                setSelectedUser(u || null);
              }}
              className="w-full text-sm px-3 py-2 border border-[#E4D9C4] rounded focus:outline-none focus:border-[#D8B46B] bg-white"
            >
              <option value="">— Choose a client —</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email} {u.full_name ? `(${u.email})` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {!selectedUser ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-[#E4D9C4] flex items-center justify-center mx-auto mb-4">
              <Users size={22} className="text-[#1E3A32]/40" />
            </div>
            <p className="text-sm text-[#2B2725]/40">Select a client to view their Style Journal.</p>
          </div>
        ) : loadingCheckIns ? (
          <div className="text-center py-16 text-[#2B2725]/40">Loading check-ins...</div>
        ) : checkIns.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-[#2B2725]/50">No check-ins yet for {selectedUser.full_name || selectedUser.email}.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#D8B46B]/20 flex items-center justify-center text-xs font-bold text-[#1E3A32]">
                {(selectedUser.full_name || selectedUser.email)[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-[#1E3A32]">{selectedUser.full_name || selectedUser.email}</p>
                <p className="text-xs text-[#2B2725]/50">{checkIns.length} check-ins total</p>
              </div>
            </div>

            <Tabs defaultValue="insights">
              <TabsList className="mb-6 bg-[#E4D9C4]/50">
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
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
          </>
        )}
      </div>
    </div>
  );
}