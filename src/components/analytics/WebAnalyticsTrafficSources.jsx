import React from "react";
import { Globe } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ['#1E3A32', '#D8B46B', '#6E4F7D', '#A6B7A3', '#2B2725', '#E4D9C4', '#8B6B9D', '#7A8B77'];

function formatSourceName(sourceMedium) {
  if (sourceMedium === '(direct) / (none)') return 'Direct';
  if (sourceMedium === '(not set)') return 'Unknown';
  return sourceMedium;
}

export default function WebAnalyticsTrafficSources({ sources }) {
  if (!sources || sources.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E4D9C4] p-6">
        <h3 className="font-serif text-lg font-bold text-[#1E3A32] mb-4">Traffic Sources</h3>
        <p className="text-sm text-[#2B2725]/50">No traffic source data available yet.</p>
      </div>
    );
  }

  const totalSessions = sources.reduce((sum, s) => sum + s.sessions, 0);

  const chartData = sources.slice(0, 8).map(s => ({
    name: formatSourceName(s.sourceMedium),
    value: s.sessions,
  }));

  return (
    <div className="bg-white rounded-xl border border-[#E4D9C4] p-6">
      <div className="flex items-center gap-2 mb-4">
        <Globe size={18} className="text-[#1E3A32]" />
        <h3 className="font-serif text-lg font-bold text-[#1E3A32]">Traffic Sources</h3>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Pie Chart */}
        <div className="w-full lg:w-1/3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [value.toLocaleString(), 'Sessions']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E4D9C4', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Source List */}
        <div className="flex-1 space-y-2">
          {sources.map((source, index) => {
            const percent = totalSessions > 0 ? ((source.sessions / totalSessions) * 100).toFixed(1) : '0';
            return (
              <div key={index} className="flex items-center justify-between text-sm py-1.5 border-b border-[#F9F5EF] last:border-0">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-[#2B2725] font-medium truncate max-w-[200px]">
                    {formatSourceName(source.sourceMedium)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[#2B2725]/60 text-xs">
                  <span>{source.sessions.toLocaleString()} sessions</span>
                  <span>{source.users.toLocaleString()} users</span>
                  <span className="w-12 text-right font-medium text-[#1E3A32]">{percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}