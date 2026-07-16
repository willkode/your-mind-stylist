import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function EmotionalTrends({ trendsData = [] }) {
  const emotionColors = {
    calm: "#A6B7A3",
    clarity: "#D8B46B",
    resistance: "#6E4F7D",
    overwhelm: "#2B2725",
    confidence: "#1E3A32",
    curiosity: "#E4D9C4",
    tension: "#8B7355",
    momentum: "#5A8B7A",
  };

  // Get the current emotional thread (last 3-5 emotions)
  const recentEmotions = trendsData.slice(-5);
  
  // Format data for chart
  const chartData = trendsData.map((item, index) => ({
    index,
    date: item.date,
    value: getEmotionValue(item.emotion),
    emotion: item.emotion,
  }));

  // Map emotions to numerical values for chart (calm=high, overwhelm=low)
  function getEmotionValue(emotion) {
    const values = {
      calm: 9,
      clarity: 8,
      confidence: 7,
      momentum: 7,
      curiosity: 6,
      tension: 4,
      resistance: 3,
      overwhelm: 2,
    };
    return values[emotion] || 5;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-[#E4D9C4] shadow-lg">
          <p className="font-serif text-[#1E3A32] mb-1">{payload[0].payload.emotion}</p>
          <p className="text-xs text-[#2B2725]/60">{payload[0].payload.date}</p>
        </div>
      );
    }
    return null;
  };

  if (trendsData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 text-center"
      >
        <Activity size={48} className="text-[#D8B46B]/30 mx-auto mb-4" />
        <p className="text-[#2B2725]/60">Your emotional thread will appear here as you create notes</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[#D8B46B]/10 flex items-center justify-center">
          <TrendingUp size={20} className="text-[#D8B46B]" />
        </div>
        <div>
          <h3 className="font-serif text-xl text-[#1E3A32]">Your Emotional Thread</h3>
          <p className="text-sm text-[#2B2725]/60">The arc of your recent inner landscape</p>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6" style={{ height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis 
              dataKey="index" 
              hide 
            />
            <YAxis 
              hide 
              domain={[0, 10]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#D8B46B"
              strokeWidth={3}
              dot={{ fill: '#D8B46B', r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Thread */}
      <div>
        <p className="text-xs text-[#2B2725]/60 tracking-wide uppercase mb-3">Recent Thread</p>
        <div className="flex items-center gap-3 flex-wrap">
          {recentEmotions.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: emotionColors[item.emotion] }}
              />
              <span className="text-sm text-[#2B2725]">{item.emotion}</span>
              {index < recentEmotions.length - 1 && (
                <span className="text-[#2B2725]/30">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Insight */}
      {recentEmotions.length >= 3 && (
        <div className="mt-6 p-4 bg-[#F9F5EF]">
          <p className="text-sm text-[#2B2725]/80 italic">
            {generateInsight(recentEmotions)}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function generateInsight(emotions) {
  const emotionNames = emotions.map(e => e.emotion);
  
  // Check for clarity after resistance
  if (emotionNames.includes('resistance') && emotionNames.slice(-1)[0] === 'clarity') {
    return "You moved through resistance into clarity. That's the work.";
  }
  
  // Check for calm trend
  if (emotionNames.slice(-3).every(e => ['calm', 'clarity', 'confidence'].includes(e))) {
    return "You're in a steady, grounded place. Notice how that feels.";
  }
  
  // Check for tension/overwhelm
  if (emotionNames.slice(-2).every(e => ['tension', 'overwhelm', 'resistance'].includes(e))) {
    return "You're feeling the weight. This might be a moment for rest or support.";
  }
  
  // Default insight
  return "Your emotional landscape is shifting. Keep tracking what you notice.";
}