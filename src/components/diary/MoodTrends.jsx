import React from "react";
import { format, subDays } from "date-fns";
import { TrendingUp, Calendar } from "lucide-react";

const MOOD_EMOJI = {
  joyful: "😄",
  content: "😊",
  calm: "😌",
  neutral: "😐",
  anxious: "😰",
  sad: "😢",
  frustrated: "😤",
  energized: "⚡",
  tired: "😴",
  grateful: "🙏",
};

export default function MoodTrends({ entries }) {
  // Get last 30 days of entries
  const last30Days = entries.filter((e) => {
    const entryDate = new Date(e.date);
    const thirtyDaysAgo = subDays(new Date(), 30);
    return entryDate >= thirtyDaysAgo;
  });

  // Calculate mood distribution
  const moodCounts = last30Days.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {});

  const sortedMoods = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Calculate average energy
  const avgEnergy =
    last30Days.length > 0
      ? (
          last30Days.reduce((sum, e) => sum + (e.energy_level || 0), 0) / last30Days.length
        ).toFixed(1)
      : 0;

  // Most used tags
  const tagCounts = last30Days.reduce((acc, entry) => {
    (entry.tags || []).forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={24} className="text-[#1E3A32]" />
          <h2 className="font-serif text-2xl text-[#1E3A32]">Your Emotional Patterns</h2>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-[#2B2725]/60 mb-1">Entries (Last 30 Days)</p>
            <p className="text-3xl font-bold text-[#1E3A32]">{last30Days.length}</p>
          </div>
          <div>
            <p className="text-sm text-[#2B2725]/60 mb-1">Average Energy</p>
            <p className="text-3xl font-bold text-[#1E3A32]">{avgEnergy}/10</p>
          </div>
        </div>
      </div>

      {/* Mood Distribution */}
      <div className="bg-white p-6 rounded-lg">
        <h3 className="font-serif text-xl text-[#1E3A32] mb-4">Most Common Moods</h3>
        {sortedMoods.length > 0 ? (
          <div className="space-y-4">
            {sortedMoods.map(([mood, count]) => (
              <div key={mood}>
                <div className="flex justify-between items-center mb-2">
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">{MOOD_EMOJI[mood]}</span>
                    <span className="capitalize text-[#2B2725]">{mood}</span>
                  </span>
                  <span className="text-sm text-[#2B2725]/60">
                    {count} {count === 1 ? "time" : "times"}
                  </span>
                </div>
                <div className="h-2 bg-[#E4D9C4] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#D8B46B] transition-all duration-500"
                    style={{ width: `${(count / last30Days.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#2B2725]/60 text-center py-8">
            Not enough data yet. Keep journaling!
          </p>
        )}
      </div>

      {/* Top Tags */}
      {topTags.length > 0 && (
        <div className="bg-white p-6 rounded-lg">
          <h3 className="font-serif text-xl text-[#1E3A32] mb-4">Common Themes</h3>
          <div className="flex flex-wrap gap-2">
            {topTags.map(([tag, count]) => (
              <span
                key={tag}
                className="px-3 py-2 bg-[#D8B46B]/20 text-[#1E3A32] rounded-full text-sm"
              >
                {tag} <span className="text-[#2B2725]/60">({count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Pattern */}
      <div className="bg-white p-6 rounded-lg">
        <h3 className="font-serif text-xl text-[#1E3A32] mb-4">Recent Entries</h3>
        <div className="space-y-3">
          {last30Days.slice(0, 7).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-3 bg-[#F9F5EF] rounded"
            >
              <span className="text-2xl">{MOOD_EMOJI[entry.mood]}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1E3A32]">
                  {format(new Date(entry.date), "MMM d, yyyy")}
                </p>
                <p className="text-xs text-[#2B2725]/60">
                  Energy: {entry.energy_level}/10
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}