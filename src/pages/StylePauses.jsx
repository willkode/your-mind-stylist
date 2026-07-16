import React, { useState } from "react";
import { motion } from "framer-motion";
import StylePausesList from "../components/studio/StylePausesList";
import StylePausePlayer from "../components/studio/StylePausePlayer";

export default function StylePauses() {
  const [selectedPause, setSelectedPause] = useState(null);
  const [sourceContext, setSourceContext] = useState("browse");

  const handleSelectPause = (pause, context) => {
    setSelectedPause(pause);
    setSourceContext(context);
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <StylePausesList onSelectPause={handleSelectPause} sourceContext="browse" />
        </motion.div>
      </div>

      {selectedPause && (
        <StylePausePlayer
          pause={selectedPause}
          onClose={() => setSelectedPause(null)}
          sourceContext={sourceContext}
        />
      )}
    </div>
  );
}