import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import MilestoneCelebration from "./MilestoneCelebration";

/**
 * Component that checks for uncelebrated milestones and shows celebrations
 * Add this to Dashboard or AuthLayout to check on every page load
 */
export default function MilestoneChecker() {
  const [currentMilestone, setCurrentMilestone] = useState(null);
  const [queuedMilestones, setQueuedMilestones] = useState([]);

  const { data: uncelebratedMilestones = [] } = useQuery({
    queryKey: ["uncelebrated-milestones"],
    queryFn: async () => {
      const milestones = await base44.entities.Milestone.filter({
        celebrated: false
      }, '-unlocked_date');
      return milestones;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  useEffect(() => {
    if (uncelebratedMilestones.length > 0 && !currentMilestone) {
      // Show first uncelebrated milestone
      setCurrentMilestone(uncelebratedMilestones[0]);
      setQueuedMilestones(uncelebratedMilestones.slice(1));
    }
  }, [uncelebratedMilestones]);

  const handleClose = () => {
    // Show next milestone if any in queue
    if (queuedMilestones.length > 0) {
      setCurrentMilestone(queuedMilestones[0]);
      setQueuedMilestones(queuedMilestones.slice(1));
    } else {
      setCurrentMilestone(null);
    }
  };

  return (
    <AnimatePresence>
      {currentMilestone && (
        <MilestoneCelebration
          milestone={currentMilestone}
          onClose={handleClose}
        />
      )}
    </AnimatePresence>
  );
}