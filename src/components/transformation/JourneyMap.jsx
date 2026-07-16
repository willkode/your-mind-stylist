import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Heart, BookOpen, Award, Camera, Sparkles, 
  TrendingUp, MapPin, ChevronRight
} from "lucide-react";
import { format } from "date-fns";

const EVENT_ICONS = {
  reflection: Heart,
  milestone: Award,
  snapshot: Camera,
  course_complete: BookOpen,
  consultation: Sparkles,
  breakthrough: TrendingUp
};

const EVENT_COLORS = {
  reflection: "#6E4F7D",
  milestone: "#D8B46B",
  snapshot: "#A6B7A3",
  course_complete: "#1E3A32",
  consultation: "#D8B46B",
  breakthrough: "#D8B46B"
};

export default function JourneyMap({ events = [] }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Group events by month
  const eventsByMonth = events.reduce((acc, event) => {
    const monthKey = format(new Date(event.date), 'yyyy-MM');
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(event);
    return acc;
  }, {});

  const months = Object.keys(eventsByMonth).sort().reverse();

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[#E4D9C4]"></div>

      {/* Events by Month */}
      <div className="space-y-12">
        {months.map((month, monthIdx) => {
          const monthEvents = eventsByMonth[month];
          const monthDate = new Date(month + '-01');
          
          return (
            <motion.div
              key={month}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: monthIdx * 0.1 }}
            >
              {/* Month Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#1E3A32] flex items-center justify-center flex-shrink-0 relative z-10">
                  <Calendar size={24} className="text-[#D8B46B]" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-[#1E3A32]">
                    {format(monthDate, 'MMMM yyyy')}
                  </h3>
                  <p className="text-sm text-[#2B2725]/60">
                    {monthEvents.length} {monthEvents.length === 1 ? 'event' : 'events'}
                  </p>
                </div>
              </div>

              {/* Month Events */}
              <div className="ml-24 space-y-4">
                {monthEvents.map((event, idx) => {
                  const IconComponent = EVENT_ICONS[event.type] || MapPin;
                  const color = EVENT_COLORS[event.type] || "#D8B46B";

                  return (
                    <motion.button
                      key={idx}
                      onClick={() => setSelectedEvent(event)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: monthIdx * 0.1 + idx * 0.05 }}
                      className="w-full text-left bg-white p-4 rounded-lg hover:shadow-lg transition-all group border-l-4"
                      style={{ borderColor: color }}
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <IconComponent size={20} style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-[#1E3A32] group-hover:text-[#D8B46B] transition-colors">
                              {event.title}
                            </h4>
                            <ChevronRight size={16} className="text-[#2B2725]/40 group-hover:text-[#D8B46B] transition-colors" />
                          </div>
                          <p className="text-xs text-[#2B2725]/60 mb-2">
                            {format(new Date(event.date), 'MMM d, h:mm a')}
                          </p>
                          {event.preview && (
                            <p className="text-sm text-[#2B2725]/70 line-clamp-2">
                              {event.preview}
                            </p>
                          )}
                          {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {event.tags.slice(0, 3).map((tag, i) => (
                                <span 
                                  key={i}
                                  className="text-xs px-2 py-1 rounded"
                                  style={{ 
                                    backgroundColor: `${color}10`,
                                    color: color
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEvent(null)}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div 
                className="p-6 border-l-8"
                style={{ borderColor: EVENT_COLORS[selectedEvent.type] || "#D8B46B" }}
              >
                <div className="flex items-start gap-4 mb-4">
                  {(() => {
                    const IconComponent = EVENT_ICONS[selectedEvent.type] || MapPin;
                    const color = EVENT_COLORS[selectedEvent.type] || "#D8B46B";
                    return (
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <IconComponent size={24} style={{ color }} />
                      </div>
                    );
                  })()}
                  <div className="flex-1">
                    <h2 className="font-serif text-2xl text-[#1E3A32] mb-2">
                      {selectedEvent.title}
                    </h2>
                    <p className="text-sm text-[#2B2725]/60">
                      {format(new Date(selectedEvent.date), 'MMMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                </div>

                {selectedEvent.data && (
                  <div className="space-y-4">
                    {selectedEvent.data.reflection_text && (
                      <div>
                        <h3 className="font-medium text-[#1E3A32] mb-2">Reflection</h3>
                        <p className="text-[#2B2725]/80 leading-relaxed">
                          {selectedEvent.data.reflection_text}
                        </p>
                      </div>
                    )}
                    
                    {selectedEvent.data.what_shifted && (
                      <div>
                        <h3 className="font-medium text-[#1E3A32] mb-2">What Shifted</h3>
                        <p className="text-[#2B2725]/80 italic">
                          "{selectedEvent.data.what_shifted}"
                        </p>
                      </div>
                    )}

                    {selectedEvent.data.milestone_description && (
                      <div>
                        <h3 className="font-medium text-[#1E3A32] mb-2">Achievement</h3>
                        <p className="text-[#2B2725]/80">
                          {selectedEvent.data.milestone_description}
                        </p>
                      </div>
                    )}

                    {selectedEvent.data.calm_score !== undefined && (
                      <div>
                        <h3 className="font-medium text-[#1E3A32] mb-3">Emotional State</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-[#1E3A32]">
                              {selectedEvent.data.calm_score}
                            </p>
                            <p className="text-xs text-[#2B2725]/60">Calm</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-[#1E3A32]">
                              {selectedEvent.data.grounded_score}
                            </p>
                            <p className="text-xs text-[#2B2725]/60">Grounded</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-[#1E3A32]">
                              {selectedEvent.data.open_score}
                            </p>
                            <p className="text-xs text-[#2B2725]/60">Open</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedEvent.data.breakthrough_tagged && (
                      <div className="bg-[#D8B46B]/10 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-[#D8B46B]">
                          <Sparkles size={20} />
                          <span className="font-medium">Breakthrough Moment</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}