import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";

const STATE_LABELS = {
  calm_activated:    { low: "Calm", high: "Activated", color: "#A6B7A3" },
  grounded_scattered:{ low: "Grounded", high: "Scattered", color: "#D8B46B" },
  open_guarded:      { low: "Open", high: "Guarded", color: "#6E4F7D" },
};

const RANGES = [
  { label: "30 days", days: 30 },
  { label: "60 days", days: 60 },
  { label: "90 days", days: 90 },
];

export default function StateTrendsChart({ checkIns }) {
  const [range, setRange] = useState(30);
  const [activeDimension, setActiveDimension] = useState("calm_activated");

  const cutoff = new Date(Date.now() - range * 24 * 60 * 60 * 1000);
  const filtered = checkIns
    .filter(ci => new Date(ci.created_date) >= cutoff && ci.state_key === activeDimension)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .map(ci => ({
      date: format(new Date(ci.created_date), "MMM d"),
      value: ci.state_value,
    }));

  const config = STATE_LABELS[activeDimension];

  // Voice tone frequency
  const toneCounts = {};
  checkIns.forEach(ci => {
    if (ci.voice_tone) toneCounts[ci.voice_tone] = (toneCounts[ci.voice_tone] || 0) + 1;
  });
  const toneEntries = Object.entries(toneCounts).sort((a, b) => b[1] - a[1]);
  const maxTone = toneEntries[0]?.[1] || 1;

  return (
    <div className="space-y-6">
      {/* State Line Chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-serif text-[#1E3A32] font-medium">State Over Time</h3>
          <div className="flex gap-1">
            {RANGES.map(r => (
              <button
                key={r.days}
                onClick={() => setRange(r.days)}
                className={`px-3 py-1 text-xs rounded transition-colors ${range === r.days ? "bg-[#1E3A32] text-white" : "bg-[#F9F5EF] text-[#2B2725]/60 hover:bg-[#E4D9C4]"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dimension toggles */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(STATE_LABELS).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setActiveDimension(key)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                activeDimension === key
                  ? "border-transparent text-white"
                  : "border-[#E4D9C4] text-[#2B2725]/60 hover:border-[#D8B46B]"
              }`}
              style={activeDimension === key ? { backgroundColor: cfg.color } : {}}
            >
              {cfg.low} ↔ {cfg.high}
            </button>
          ))}
        </div>

        {filtered.length < 2 ? (
          <div className="text-center py-8 text-[#2B2725]/40 text-sm">Not enough data for this range yet.</div>
        ) : (
          <>
            <div className="flex justify-between text-[10px] text-[#2B2725]/40 mb-1 px-1">
              <span>← {config.low}</span>
              <span>{config.high} →</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={filtered} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#2B272560" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} hide />
                <ReferenceLine y={50} stroke="#E4D9C4" strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: "none", borderRadius: 8, backgroundColor: "#1E3A32", color: "white" }}
                  formatter={(val) => [`${val}`, config.low + " ↔ " + config.high]}
                />
                <Line type="monotone" dataKey="value" stroke={config.color} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Voice Tone Frequency */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-serif text-[#1E3A32] font-medium mb-4">Inner Voice Frequency</h3>
        {toneEntries.length === 0 ? (
          <div className="text-center py-4 text-[#2B2725]/40 text-sm">No voice tone data yet.</div>
        ) : (
          <div className="space-y-2">
            {toneEntries.map(([tone, count]) => (
              <div key={tone} className="flex items-center gap-3">
                <span className="text-xs capitalize text-[#2B2725]/70 w-20 flex-shrink-0">{tone}</span>
                <div className="flex-1 bg-[#F9F5EF] rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-[#1E3A32] transition-all"
                    style={{ width: `${(count / maxTone) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-[#2B2725]/50 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}