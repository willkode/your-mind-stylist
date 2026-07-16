import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Layers, Sparkles, BookOpen, Calendar, Play, User, Edit3, ShoppingCart, Headphones } from "lucide-react";
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
  
  const buyLinks = useMemo(() => [
    {
      label: "LENS™",
      slug: "lens",
      description: "Transform through a new lens",
      color: "#6E4F7D",
    },
    {
      label: "Cleaning Out Your Closet™",
      slug: "closet",
      description: "Clear your emotional closet",
      color: "#1E3A32",
    },
  ], []);

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

        {/* Daily Style Check CTA - Featured at top */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-[#D8B46B] to-[#C9A55A] p-6 rounded-lg text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl mb-2">
                  <CmsText cmsKey="dashboard.style_check.title" defaultText="Daily Style Check™" />
                </h3>
                <p className="text-white/90 text-sm mb-2">
                  <CmsText cmsKey="dashboard.style_check.subtitle" defaultText="Quick check-in • Everything optional" />
                </p>
                <p className="text-white/80 text-xs">
                  Track your emotional state, inner voice tone, and identity. This is a personal tool to develop self-awareness and choose which "outfit" (identity) you want to wear each day.
                </p>
              </div>
              <Button
                onClick={() => setShowStyleCheck(true)}
                className="bg-white text-[#1E3A32] hover:bg-white/90 min-h-[48px] px-6 w-full md:w-auto"
              >
                Check In Now
              </Button>
            </div>
          </div>
        </div>

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
          <div className="grid lg:grid-cols-2 gap-6 mb-12">
            <div data-tour="emotional-weather">
              <EmotionalWeather sentiment={studioStats?.sentiment} />
            </div>
            <div data-tour="daily-prompt">
              <DailyPocketPrompt 
                prompt={dailyPrompt?.prompt_text}
                onCreateNote={(promptData) => {
                  setNotesContext(promptData);
                  setNotesDrawerOpen(true);
                }}
              />
            </div>
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

          {/* Explore More Programs */}
          <div className="mb-12">
            <div className="bg-white p-8 text-center border border-[#E4D9C4]">
              <h2 className="font-serif text-2xl text-[#1E3A32] mb-3">Explore All Tools & Programs</h2>
              <p className="text-[#2B2725]/70 leading-relaxed mb-6">
                Discover the full range of transformational offerings — from introductory tools to deep transformation coaching.
              </p>
              <Link to={createPageUrl("Programs")} className="inline-flex items-center gap-2 px-8 py-3 bg-[#1E3A32] text-white text-sm hover:bg-[#2B2725] transition-colors">
                View All Programs →
              </Link>
            </div>
          </div>

          {/* Links to Buy */}
          <div className="mb-12">
            <h2 className="font-serif text-xl text-[#1E3A32] mb-6">
              <CmsText cmsKey="dashboard.buy.title" defaultText="Explore Transformational Offerings" />
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {buyLinks.map((link) => (
                <Link
                  key={link.slug}
                  to={createPageUrl(`ProductPage?slug=${link.slug}`)}
                  onClick={() => window.scrollTo(0, 0)}
                  className="bg-white p-6 hover:shadow-lg transition-shadow border-l-4 active:scale-98 touch-manipulation"
                  style={{ borderLeftColor: link.color }}
                >
                  <h3 className="font-serif text-lg text-[#1E3A32] mb-2">{link.label}</h3>
                  <p className="text-[#2B2725]/60 text-sm">{link.description}</p>
                  <div className="mt-4 text-sm text-[#D8B46B] font-medium">Learn More →</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="font-serif text-xl text-[#1E3A32] mb-6">
              <CmsText cmsKey="dashboard.quicklinks.title" defaultText="Quick Links" />
            </h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Client Portal", page: "ClientPortal", icon: ShoppingCart, descriptionKey: "dashboard.quicklinks.portal", fallback: "Your purchased products." },
                { label: "Style Pauses™", page: "StylePauses", icon: Sparkles, descriptionKey: "dashboard.quicklinks.style_pauses", fallback: "1-3 minute resets." },

                { label: "My Library", page: "ClientPortal", icon: Layers, descriptionKey: "dashboard.quicklinks.library", fallback: "Course progress & learning." },
                { label: "Pocket Mindset™", page: "PocketMindset", icon: Sparkles, descriptionKey: "dashboard.quicklinks.pocket_mindset", fallback: "Enter your favorite sessions in the notes section of your dashboard." },
                { label: "Audiobooks", page: "ClientPortal", icon: Headphones, descriptionKey: "dashboard.quicklinks.audiobooks", fallback: "Listen or download your audiobooks." },
                { label: "Notes", page: "StudioNotes", icon: Edit3, descriptionKey: "dashboard.quicklinks.notes", fallback: "Capture insights as you learn." },
                { label: "Free Masterclass", page: "FreeMasterclass", icon: Play, descriptionKey: "dashboard.quicklinks.masterclass", fallback: "Watch anytime." },
              ].map((link) => (
                <Link
                  key={link.label}
                  to={createPageUrl(link.page)}
                  onClick={() => window.scrollTo(0, 0)}
                  className="bg-white p-4 hover:shadow-md transition-shadow flex flex-col gap-2 min-h-[100px] active:scale-98 touch-manipulation"
                >
                  <link.icon size={20} className="text-[#D8B46B]" />
                  <span className="text-[#1E3A32] text-sm font-medium">{link.label}</span>
                  <span className="text-[#2B2725]/60 text-xs">
                    <CmsText 
                      contentKey={link.descriptionKey}
                      page="Dashboard"
                      blockTitle={`Quick Link ${link.label} Description`}
                      fallback={link.fallback}
                      contentType="short_text"
                    />
                  </span>
                </Link>
              ))}
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