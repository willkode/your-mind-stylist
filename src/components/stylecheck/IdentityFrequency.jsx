import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { differenceInCalendarDays, format, startOfMonth, endOfMonth } from "date-fns";

const STARTER_COLORS = {
  "The Grounded One": "#A6B7A3",
  "The Performer":    "#D8B46B",
  "The Old Pattern":  "#B0AAA4",
};

function getColor(name) {
  return STARTER_COLORS[name] || "#6E4F7D";
}

function calcStreak(checkIns) {
  if (!checkIns.length) return 0;
  const days = [...new Set(checkIns.map(ci => format(new Date(ci.created_date), "yyyy-MM-dd")))].sort().reverse();
  let streak = 0;
  let expected = format(new Date(), "yyyy-MM-dd");
  for (const day of days) {
    if (day === expected) {
      streak++;
      const d = new Date(day);
      d.setDate(d.getDate() - 1);
      expected = format(d, "yyyy-MM-dd");
    } else break;
  }
  return streak;
}

export default function IdentityFrequency({ checkIns, identities }) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // All-time frequency
  const allTimeCounts = {};
  checkIns.forEach(ci => {
    if (ci.identity_name) {
      allTimeCounts[ci.identity_name] = (allTimeCounts[ci.identity_name] || 0) + 1;
    }
  });

  // This month
  const thisMonthCheckins = checkIns.filter(ci => {
    const d = new Date(ci.created_date);
    return d >= monthStart && d <= monthEnd;
  });
  const monthTotal = thisMonthCheckins.length;

  const groundedThisMonth = thisMonthCheckins.filter(ci => ci.identity_name === "The Grounded One").length;

  const chartData = Object.entries(allTimeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const topIdentity = chartData[0]?.name;
  const streak = calcStreak(checkIns);
  const totalCheckIns = [...new Set(checkIns.map(ci => format(new Date(ci.created_date), "yyyy-MM-dd")))].length;

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-serif text-[#1E3A32] font-bold">{streak}</div>
          <div className="text-[10px] text-[#2B2725]/50 mt-1">Day Streak</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-serif text-[#1E3A32] font-bold">{totalCheckIns}</div>
          <div className="text-[10px] text-[#2B2725]/50 mt-1">Total Check-ins</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-serif text-[#1E3A32] font-bold">{monthTotal}</div>
          <div className="text-[10px] text-[#2B2725]/50 mt-1">This Month</div>
        </div>
      </div>

      {/* Insight callout */}
      {monthTotal > 0 && groundedThisMonth > 0 && (
        <div className="bg-[#A6B7A3]/15 border border-[#A6B7A3]/40 rounded-xl p-4">
          <p className="text-sm text-[#1E3A32]">
            You've shown up as <strong>The Grounded One</strong> {groundedThisMonth} out of {monthTotal} days this month
            {monthTotal > 0 ? ` — that's ${Math.round((groundedThisMonth / monthTotal) * 100)}%.` : "."}
          </p>
        </div>
      )}

      {/* Bar chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-serif text-[#1E3A32] font-medium mb-4">Identity Frequency (All Time)</h3>
        {chartData.length === 0 ? (
          <div className="text-center py-8 text-[#2B2725]/40 text-sm">No identity data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 40 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#2B272570" }}
                tickLine={false}
                axisLine={false}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{ fontSize: 11, border: "none", borderRadius: 8, backgroundColor: "#1E3A32", color: "white" }}
                formatter={(val) => [val + " check-ins"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={getColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Most worn badge */}
      {topIdentity && (
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(topIdentity) }} />
          <div>
            <div className="text-xs text-[#2B2725]/50">Most worn identity</div>
            <div className="text-sm font-medium text-[#1E3A32]">{topIdentity}</div>
          </div>
          <div className="ml-auto text-lg font-serif text-[#1E3A32] font-bold">{allTimeCounts[topIdentity]}×</div>
        </div>
      )}
    </div>
  );
}