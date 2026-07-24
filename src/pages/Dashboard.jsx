import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, Calendar, Play, User, Edit3, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CmsText from "../components/cms/CmsText";
import OnboardingModal from "../components/onboarding/OnboardingModal";
import OnboardingQuickCards from "../components/onboarding/OnboardingQuickCards";
import DashboardTooltips from "../components/onboarding/DashboardTooltips";
import PaymentFailureBanner from "../components/purchase/PaymentFailureBanner";
import { base44 } from "@/api/base44Client";
import EmotionalWeather from "@/components/studio/EmotionalWeather";
import DailyPocketPrompt from "@/components/studio/DailyPocketPrompt";
import ConstellationMap from "@/components/studio/ConstellationMap";
import InnerMomentumMeter from "@/components/studio/InnerMomentumMeter";
import NotesDrawer from "@/components/studio/NotesDrawer";
import RecommendationCard from "@/components/studio/RecommendationCard";
import UpcomingSessions from "@/components/dashboard/UpcomingSessions";
import BookingHistory from "@/components/dashboard/BookingHistory";
import NextSessionWidget from "@/components/dashboard/NextSessionWidget";
import DailyStyleCheck from "@/components/studio/DailyStyleCheck";
import { Button } from "@/components/ui/button";
import MilestoneChecker from "@/components/transformation/MilestoneChecker";
import PostMasterclassOnboarding from "../components/onboarding/PostMasterclassOnboarding";
import AIClientAssistant from "@/components/ai/AIClientAssistant";
import { PersonalizedGreeting } from "../components/ui/PersonalizedGreeting";
import { SmartSuggestion } from "../components/ui/SmartSuggestion";
import { useSmartSuggestions } from "../components/ui/useSmartSuggestions";
import haptics from "@/components/utils/haptics";
import { usePullToRefresh } from "@/components/utils/usePullToRefresh";
import ProductCard from "@/components/dashboard/ProductCard.jsx";
import ProfileCompletionBanner from "@/components/profile/ProfileCompletionBanner";
import WeeklyFeaturedBlogTile from "@/components/dashboard/WeeklyFeaturedBlogTile";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [studioStats, setStudioStats] = useState(null);
  const [dailyPrompt, setDailyPrompt] = useState(null);
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
  const [notesContext, setNotesContext] = useState({});
  const [showStyleCheck, setShowStyleCheck] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('open_check_in') === '1';
  });
  const [recommendations, setRecommendations] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const suggestions = useSmartSuggestions();
  const queryClient = useQueryClient();

  const { data: publishedProducts = [] } = useQuery({
    queryKey: ["dashboard-published-products"],
    queryFn: () => base44.entities.Product.filter({ status: "published" }, "display_order"),
  });


  const { pullY, isRefreshing, handlers: pullToRefreshHandlers } = usePullToRefresh(async () => {
    await handleRefresh();
  });

  const fetchBookings = useCallback(async (currentUser) => {
    const allBookings = await base44.entities.Booking.filter({ user_email: currentUser.email });
    const now = new Date();
    
    const upcoming = allBookings.filter(b => 
      ['confirmed', 'scheduled', 'pending_payment'].includes(b.booking_status) &&
      (!b.scheduled_date || new Date(b.scheduled_date) >= now)
    ).sort((a, b) => {
      if (!a.scheduled_date) return 1;
      if (!b.scheduled_date) return -1;
      return new Date(a.scheduled_date) - new Date(b.scheduled_date);
    });
    
    const past = allBookings.filter(b => 
      b.booking_status === 'completed' || 
      b.booking_status === 'cancelled' ||
      b.booking_status === 'expired' ||
      (b.scheduled_date && new Date(b.scheduled_date) < now)
    ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    
    setUpcomingBookings(upcoming);
    setPastBookings(past);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Auto-assign manager role if applicable
        if (currentUser && currentUser.email === 'roberta@robertafernandez.com' && currentUser.role === 'user') {
          await base44.functions.invoke('autoAssignManagerRole', {});
          window.location.reload();
        }
        
        // Fetch studio stats
        const stats = await base44.functions.invoke('getStudioStats', {});
        setStudioStats(stats.data);
        
        // Fetch daily prompt
        const prompts = await base44.entities.DailyPrompt.filter({ active: true });
        if (prompts.length > 0) {
          const today = new Date().getDate();
          setDailyPrompt(prompts[today % prompts.length]);
        }
        
        // Track app session and streak
        await base44.functions.invoke('trackEvent', {
          event_type: 'app_session',
          points: 1
        });
        
        await base44.functions.invoke('trackStreak', {
          action_type: 'dashboard_visited'
        });
        
        // Fetch personalized recommendations
        const recs = await base44.functions.invoke('getRecommendations', {});
        if (recs?.data?.recommendations) {
          setRecommendations(recs.data.recommendations);
        }
        
        // Fetch bookings
        await fetchBookings(currentUser);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const handleUpdatePayment = () => {
    // TODO: Open Stripe billing portal
    // window.location.href = billingPortalUrl;
    console.log("Opening billing portal...");
  };

  const handleRefresh = async () => {
    try {
      await fetchBookings(user);
      const stats = await base44.functions.invoke('getStudioStats', {});
      setStudioStats(stats.data);
    } catch (error) {
      console.error('Refresh error:', error);
    }
  };
  
  return (
    <div className="bg-[#F9F5EF] min-h-screen pt-32 pb-24">
      <div className="hidden md:block"><AIClientAssistant variant="widget" /></div>
      {/* PostMasterclassOnboarding is a modal overlay - does not render inline content */}
      <PostMasterclassOnboarding />
      <MilestoneChecker />
      {user && <OnboardingModal role="user" />}
      <DashboardTooltips />
      <NotesDrawer
        isOpen={notesDrawerOpen}
        onClose={() => setNotesDrawerOpen(false)}
        context={notesContext}
      />
      
      {showStyleCheck && (
        <DailyStyleCheck
          onClose={() => setShowStyleCheck(false)}
          onComplete={(data) => {
            setShowStyleCheck(false);
            if (data?.showPauseSuggestion) {
              // Could show pause suggestion modal here
              // For now, user can navigate to Style Pauses via quick link
            }
          }}
        />
      )}
      
      <div 
        className="max-w-6xl mx-auto px-6"
        {...pullToRefreshHandlers}
      >
        {user && <ProfileCompletionBanner user={user} />}
        <PaymentFailureBanner 
          status={subscriptionStatus}
          onUpdatePayment={handleUpdatePayment}
        />

        {/* Onboarding Quick Cards */}
         {user && <OnboardingQuickCards user={user} />}
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="touch-pan-y"
        >
          {/* Pull to Refresh Indicator */}
          {pullY > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: pullY / 100 }}
              className="flex justify-center py-4"
            >
              <div className={`text-[#D8B46B] ${isRefreshing ? 'animate-spin' : ''}`}>
                {isRefreshing ? '↻' : '↓'} {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
              </div>
            </motion.div>
          )}
          {/* Personalized Greeting */}
          <PersonalizedGreeting user={user} variant="dashboard" />

          {/* Next Session Widget - Featured */}
          {upcomingBookings.length > 0 && (
            <div className="mb-12">
              <NextSessionWidget booking={upcomingBookings[0]} />
            </div>
          )}



          {/* Mind Styling Studio Hub */}
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">
            Let's Style Today's Emotional Outfit
          </h2>
          <div className="grid lg:grid-cols-2 gap-6 mb-12">
            <div data-tour="emotional-weather">
              <EmotionalWeather sentiment={studioStats?.sentiment} className="h-full" />
            </div>
            <div data-tour="daily-prompt">
              <DailyPocketPrompt 
                prompt={dailyPrompt?.prompt_text}
                onCreateNote={(promptData) => {
                  setNotesContext(promptData);
                  setNotesDrawerOpen(true);
                }}
                className="h-full"
              />
            </div>
            <button
              onClick={() => setShowStyleCheck(true)}
              className="bg-[#E8DCEB] p-6 rounded-lg text-left w-full hover:shadow-md transition-shadow flex flex-col justify-center min-h-[100px]"
            >
              <p className="font-serif text-lg text-[#1E3A32]">The Daily Style Check</p>
            </button>
            <Link
              to={createPageUrl("StylePauses")}
              onClick={() => window.scrollTo(0, 0)}
              className="bg-[#DCE7DA] p-6 rounded-lg hover:shadow-md transition-shadow flex flex-col justify-center min-h-[100px]"
            >
              <p className="font-serif text-lg text-[#1E3A32]">Style Pauses™</p>
            </Link>
            <Link
              to="/StyleJournal"
              onClick={() => window.scrollTo(0, 0)}
              className="bg-[#F2DCE2] p-6 rounded-lg hover:shadow-md transition-shadow flex flex-col justify-center min-h-[100px]"
            >
              <p className="font-serif text-lg text-[#1E3A32]">Style Journal</p>
            </Link>
            <Link
              to={createPageUrl("StudioNotes")}
              onClick={() => window.scrollTo(0, 0)}
              className="bg-[#F7E3D8] p-6 rounded-lg hover:shadow-md transition-shadow flex flex-col justify-center min-h-[100px]"
            >
              <p className="font-serif text-lg text-[#1E3A32]">Notes</p>
            </Link>
            <Link
              to={createPageUrl("PocketMindset")}
              onClick={() => window.scrollTo(0, 0)}
              className="bg-[#D9E6EC] p-6 rounded-lg hover:shadow-md transition-shadow flex flex-col justify-center min-h-[100px]"
            >
              <p className="font-serif text-lg text-[#1E3A32]">Pocket Mindset™</p>
            </Link>
          </div>

          {/* Your Purchased Products / Client Portal */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-[#1E3A32]">
                Your Purchased Products
              </h2>
              <Link to={createPageUrl("ClientPortal")} className="text-sm text-[#D8B46B] hover:underline font-medium">
                Full Portal →
              </Link>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-[#1E3A32] to-[#2B4A40] p-8 rounded-lg text-white"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h3 className="font-serif text-2xl mb-2">Access Your Content</h3>
                  <p className="text-white/90 mb-4">
                    All your courses, webinars, coaching materials, and resources are organized in your Client Portal.
                  </p>
                  <Link to={createPageUrl("ClientPortal")}>
                    <Button className="bg-[#D8B46B] hover:bg-[#C9A55A] text-[#1E3A32]">
                      Go to Client Portal
                    </Button>
                  </Link>
                </div>
                <div className="text-white/20 flex-shrink-0">
                  <ShoppingCart size={80} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* This Week's Free Offerings + Announcements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">
                This Week's Free Offerings
              </h2>
              <div className="flex flex-col gap-4">
                <Link
                  to={createPageUrl("FreeMasterclass")}
                  onClick={() => window.scrollTo(0, 0)}
                  className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-2 border-amber-200 rounded-xl p-5 hover:shadow-md transition-all flex items-start gap-3"
                >
                  <Play size={24} className="text-[#1E3A32] flex-shrink-0" />
                  <h4 className="font-medium text-[#1E3A32]">Imposter Syndrome Webinar</h4>
                </Link>
                <WeeklyFeaturedBlogTile />
              </div>
            </div>
            <div>
              <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">
                Announcements
              </h2>
              <div className="bg-white rounded-xl p-5 border border-[#E4D9C4]">
                <p className="text-[#2B2725]/80 leading-relaxed">
                  <CmsText
                    contentKey="dashboard.announcements.text"
                    page="Dashboard"
                    blockTitle="Dashboard Announcements"
                    fallback="There's a new Pocket Mindset™ recording called Setting Priorities, in the Emotional and Mental Wellbeing section."
                    contentType="rich_text"
                  />
                </p>
              </div>
            </div>
          </div>

          {/* Smart Suggestions */}
          {suggestions.slice(0, 1).map((suggestion) => (
            <SmartSuggestion
              key={suggestion.id}
              trigger={suggestion.trigger}
              title={suggestion.title}
              description={suggestion.description}
              actionLabel={suggestion.actionLabel}
              actionLink={suggestion.actionLink}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}