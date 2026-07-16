import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useSmartSuggestions() {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const generateSuggestions = async () => {
      try {
        const user = await base44.auth.me();
        const newSuggestions = [];

        // Check for uncompleted onboarding
        const hasName = user?.full_name && user.full_name.length > 0;
        if (!hasName) {
          newSuggestions.push({
            id: "complete-profile",
            trigger: true,
            title: "Complete Your Profile",
            description: "Add your name to personalize your experience",
            actionLabel: "Update Profile",
            actionLink: "ProfileSettings",
            icon: "User",
          });
        }

        // Check for Style Check activity
        const styleChecks = await base44.entities.DailyStyleCheck.filter({
          created_by: user.email,
        });
        
        const today = new Date().toDateString();
        const todayCheck = styleChecks.find(
          (check) => new Date(check.created_date).toDateString() === today
        );

        if (!todayCheck && styleChecks.length > 0) {
          newSuggestions.push({
            id: "daily-check",
            trigger: true,
            title: "Daily Style Check™",
            description: "Take a moment to check in with yourself",
            actionLabel: "Check In Now",
            actionLink: "Dashboard?open_check_in=1",
            icon: "Sparkles",
          });
        }

        // Check for bookings without notes
        const bookings = await base44.entities.Booking.filter({
          user_email: user.email,
          booking_status: "confirmed",
        });

        const upcomingBooking = bookings.find((b) => {
          if (!b.scheduled_date) return false;
          const scheduledTime = new Date(b.scheduled_date);
          const now = new Date();
          const hoursUntil = (scheduledTime - now) / (1000 * 60 * 60);
          return hoursUntil > 0 && hoursUntil < 48;
        });

        if (upcomingBooking && !upcomingBooking.notes) {
          newSuggestions.push({
            id: "add-session-notes",
            trigger: true,
            title: "Session Coming Up",
            description: "Share what you'd like to focus on in your upcoming session",
            actionLabel: "Add Notes",
            actionLink: "ClientBookings",
            icon: "Calendar",
          });
        }

        // Check for incomplete courses
        const courseProgress = await base44.entities.UserCourseProgress.filter({
          user_id: user.id,
          status: "in_progress",
        });

        if (courseProgress.length > 0) {
          const incompleteCourse = courseProgress[0];
          if (incompleteCourse.completion_percentage < 100) {
            newSuggestions.push({
              id: "continue-course",
              trigger: true,
              title: "Continue Your Journey",
              description: "Pick up where you left off in your course",
              actionLabel: "Resume Learning",
              actionLink: "Library",
              icon: "BookOpen",
            });
          }
        }

        setSuggestions(newSuggestions);
      } catch (error) {
        console.error("Error generating suggestions:", error);
      }
    };

    generateSuggestions();
  }, []);

  return suggestions;
}