import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Menu, X, ArrowLeft, ExternalLink, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import CookieBanner from "./components/legal/CookieBanner";
import AuthLayout from "./components/AuthLayout";
import ScrollToTop from "./components/ScrollToTop";
import AccessibilityWidget from "./components/accessibility/AccessibilityWidget";
import { base44 } from "@/api/base44Client";
import { EditModeProvider } from "./components/cms/EditModeProvider";
import ManagerBar from "./components/cms/ManagerBar";
import haptics from "./components/utils/haptics";
import AffiliateTracker from "./components/affiliate/AffiliateTracker";
import BooksMegaMenu from "./components/nav/BooksMegaMenu";
import ServicesMegaMenu from "./components/nav/ServicesMegaMenu";
import { useBookingUrl } from "./components/cms/useBookingUrl";
import { PageTransition } from "./components/ui/PageTransition";
import { CartProvider } from "./components/shop/CartContext";
import CartIcon from "./components/shop/CartIcon";

import GlobalSearch from "./components/GlobalSearch";
import { useNavigate } from "react-router-dom";

// Helper to detect if running in WebView
const isWebView = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return (ua.indexOf('FBAN') > -1) || (ua.indexOf('FBAV') > -1) || 
         (ua.indexOf('Instagram') > -1) || (ua.indexOf('wv') > -1);
};

// Handle external links in WebView
const handleExternalLink = (e, url) => {
  if (isWebView()) {
    e.preventDefault();
    // For WebView, try to open in external browser
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'openExternal', url }));
    } else {
      window.open(url, '_blank');
    }
  }
};

export default function Layout({ children, currentPageName }) {
  const [useAuthLayout, setUseAuthLayout] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [booksOpen, setBooksOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const bookingUrl = useBookingUrl();

  useEffect(() => {
    const checkAuthPages = async () => {
      // Skip layout rendering for login/auth pages
      if (!currentPageName) return;

      // Check if user is authenticated and get their info
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
        }
      } catch (error) {
        // User not authenticated
      }

      // Pattern-based detection for authenticated pages
      const isAuthPage = 
        currentPageName.startsWith('Admin') ||
        currentPageName.startsWith('Studio') ||
        currentPageName.startsWith('Manager') ||
        ['Dashboard', 'PurchaseCenter', 'Library', 'TransformationStory', 'Resources', 'CoursePage', 'CoursePreview', 'ClientPortal', 'KajabiImport', 'ClientsHub'].includes(currentPageName) ||
        currentPageName.endsWith('Editor') ||
        currentPageName.endsWith('Manager');

      // Hybrid pages that adapt to user's auth status
      const hybridPages = ['FreeMasterclass', 'Masterclass', 'CleaningOutYourCloset', 'PocketMindset', 'Blog', 'BlogPost'];
      const isHybridPage = hybridPages.includes(currentPageName);

      if (isAuthPage) {
        // Always use AuthLayout for auth pages - AuthLayout handles its own redirect
        setUseAuthLayout(true);
      } else if (isHybridPage) {
        // For hybrid pages, use auth layout if user is authenticated
        const isAuth = await base44.auth.isAuthenticated();
        setUseAuthLayout(isAuth);
      }
      
      setLayoutReady(true);
    };
    checkAuthPages();
  }, [currentPageName]);

  useEffect(() => {
    if (!useAuthLayout) {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 50);
      };
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [useAuthLayout]);

  // Show loading while checking auth for protected pages
  const authPagesList = currentPageName?.startsWith('Admin') ||
    currentPageName?.startsWith('Studio') ||
    currentPageName?.startsWith('Manager') ||
    ['Dashboard', 'PurchaseCenter', 'Library', 'TransformationStory', 'Resources'].includes(currentPageName) ||
    currentPageName?.endsWith('Editor') ||
    currentPageName?.endsWith('Manager');

  if (authPagesList && !layoutReady) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="animate-pulse text-[#1E3A32]">Loading...</div>
      </div>
    );
  }

  // Return AuthLayout if authenticated page
  if (useAuthLayout) {
    return <AuthLayout currentPageName={currentPageName}>{children}</AuthLayout>;
  }

  const navLinks = [
    { name: "Home", page: "Home" },
    { name: "About", page: "About" },
    { name: "Initial Consultation", page: "Consultations" },
    { name: "Book a Session", page: "Bookings", external: bookingUrl },
    { name: "Blog", page: "Blog" },
    { name: "Contact", page: "Contact" },
  ];

  const servicesMenu = [
    {
      category: "Transformational Programs",
      items: [
        { name: "Tools and Programs", page: "Programs", description: "Explore all offerings" },

        { name: "LENS™", page: "LENS", description: "Flagship Mind Styling framework" },
        { name: "Cleaning Out Your Closet", page: "CleaningOutYourCloset", description: "One-on-one hypnosis work" },
        { name: "Pocket Mindset™", page: "PocketMindset", description: "Daily guided experiences" },
      ]
    },
    {
      category: "Professional Development",
      items: [
        { name: "Hypnosis Training", page: "LearnHypnosis", description: "Become a certified hypnotist" },
        { name: "Speaking & Training", page: "SpeakingTraining", description: "Mind Styling for Organizations" },
      ]
    }
  ];

  // Check if user is a manager
  const isManager = user?.role === 'admin' || user?.role === 'manager' || user?.custom_role === 'manager';

  // Don't render layout for pages without a name (like login)
  if (!currentPageName) {
    return children;
  }

  return (
    <CartProvider>
    <EditModeProvider>
      <Helmet>
        <title>Your Mind Stylist</title>
        <link rel="icon" type="image/png" href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a98b3e154ab3b36c88ebb/7d5c32b99_Mind-stylist-dark-icon2x.png" />
      </Helmet>
      <div className="min-h-screen bg-[#F9F5EF]">
        <AffiliateTracker />
        <ManagerBar />
        <ScrollToTop />
        <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600&family=Inter:wght@300;400;500;600;700&display=swap');

        :root {
          --forest-green: #1E3A32;
          --soft-gold: #D8B46B;
          --cream: #F9F5EF;
          --charcoal: #2B2725;
          --dusty-sage: #A6B7A3;
          --soft-plum: #6E4F7D;
          --warm-sand: #E4D9C4;
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --forest-green: #2B4A40;
            --soft-gold: #E4C589;
            --cream: #1A1714;
            --charcoal: #E8E4DE;
            --dusty-sage: #7A8B77;
            --soft-plum: #8B6B9D;
            --warm-sand: #3D3430;
          }
        }

        body {
          font-family: 'Inter', sans-serif;
          background-color: var(--cream);
        }

        h1, h2, h3, h4, h5, h6 {
          font-family: 'Playfair Display', serif;
        }

        .font-serif {
          font-family: 'Playfair Display', serif;
        }

        .font-sans {
          font-family: 'Inter', sans-serif;
        }
      `}</style>

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 safe-area-top ${isScrolled ? 'bg-[#F9F5EF]/95 backdrop-blur-md shadow-sm' : (currentPageName === 'SignatureServices' ? 'bg-[#6E4F7D]' : (currentPageName === 'LearnHypnosis' || currentPageName === 'Consultations') ? 'bg-[#1E3A32]' : 'bg-transparent')}`}
      >
        {/* Determine if page has dark hero */}
        {(() => {
          const darkHeroPages = ['LearnHypnosis', 'Consultations', 'ProgramsCourses', 'ProgramsWebinars', 'SignatureServices'];
          const isBookingsDarkHero = currentPageName === 'Bookings' && document.body.hasAttribute('data-dark-hero');
          const hasDarkHero = (darkHeroPages.includes(currentPageName) || isBookingsDarkHero) && !isScrolled;
          const textColorClass = hasDarkHero ? 'text-white' : 'text-[#2B2725]';
          const textColorOpacity = hasDarkHero ? 'text-white/80' : 'text-[#2B2725]/60';
          const logoSrc = hasDarkHero 
            ? 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a98b3e154ab3b36c88ebb/60b825e58_Mind-stylist-light-icon2x.png'
            : 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a98b3e154ab3b36c88ebb/7d5c32b99_Mind-stylist-dark-icon2x.png';
          
          return (
            <>
        {/* Micro Header */}
        <div className={`hidden lg:block border-b ${hasDarkHero ? 'border-white/20' : 'border-[#D8B46B]/20'}`}>
          <div className="w-full px-6 py-2 flex justify-between items-center">
            <p className={`text-xs tracking-[0.2em] ${textColorOpacity} uppercase font-light`}>
              Las Vegas • Emotional Intelligence • Mind Styling • Hypnosis • Professional Development
            </p>
            <div className="flex flex-col items-end gap-1">
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs tracking-wide ${hasDarkHero ? 'text-white hover:text-[#D8B46B]' : 'text-[#1E3A32] hover:text-[#D8B46B]'} transition-colors font-medium`}
              >
                Schedule Your Complimentary Consultation
              </a>
              <Link
                to={createPageUrl("Consultations")}
                className={`text-[9px] ${hasDarkHero ? 'text-white/60 hover:text-white/80' : 'text-[#1E3A32]/60 hover:text-[#1E3A32]/80'} transition-colors`}
              >
                (Complete intake form before first session)
              </Link>
            </div>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="w-full px-6 py-4 flex justify-between items-center">
          {/* Back Button for child routes on mobile */}
          {currentPageName !== 'Home' && (
            <button
              onClick={() => {
                haptics.light();
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate(createPageUrl('Home'));
                }
              }}
              className={`lg:hidden p-2 ${hasDarkHero ? 'text-white hover:bg-white/10' : 'text-[#1E3A32] hover:bg-[#1E3A32]/5'} rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center`}
            >
              <ArrowLeft size={24} />
            </button>
          )}

          {/* Manager Dashboard Button - Only show on public pages for managers */}
          {isManager && !useAuthLayout && (
            <Link
              to={createPageUrl('ManagerDashboard')}
              className={`px-3 py-2 ${hasDarkHero ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-[#D8B46B]/20 text-[#1E3A32] hover:bg-[#D8B46B]/30'} text-xs font-medium transition-all duration-300 rounded backdrop-blur-sm hidden lg:block`}
            >
              Dashboard
            </Link>
          )}
          <Link to={createPageUrl("Home")} className={`group flex items-center gap-3 ${isManager && !useAuthLayout ? 'lg:ml-28' : ''} ${currentPageName !== 'Home' ? 'ml-12 lg:ml-0' : ''}`}>
            <img 
              src={hasDarkHero
                ? "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a98b3e154ab3b36c88ebb/60b825e58_Mind-stylist-light-icon2x.png"
                : "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a98b3e154ab3b36c88ebb/5fbe0fe56_mind-stylist-purple-m2x.png"
              }
              alt="Your Mind Stylist Logo" 
              className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 object-contain"
            />
            <div className="flex flex-col">
              <span className={`text-[10px] md:text-xs ${textColorOpacity} tracking-[0.2em] uppercase`}>
                Roberta Fernandez
              </span>
              <span className={`font-serif font-bold text-lg md:text-xl ${hasDarkHero ? 'text-white' : 'text-[#1E3A32]'} tracking-wide`}>
                Your Mind Stylist
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6">
            <Link
              to={createPageUrl("Home")}
              className={`text-sm tracking-wide transition-all duration-300 relative group ${
                currentPageName === "Home"
                  ? (hasDarkHero ? "text-white" : "text-[#1E3A32]")
                  : (hasDarkHero ? "text-white/80 hover:text-white" : "text-[#2B2725]/70 hover:text-[#1E3A32]")
              }`}
            >
              Home
              <span
                className={`absolute -bottom-1 left-0 h-[1px] bg-[#D8B46B] transition-all duration-300 ${
                  currentPageName === "Home" ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>

            {/* Services Mega Menu */}
            <div 
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <button
                className={`text-sm tracking-wide transition-all duration-300 relative group ${
                  hasDarkHero ? "text-white/80 hover:text-white" : "text-[#2B2725]/70 hover:text-[#1E3A32]"
                }`}
              >
                Services
                <span
                  className={`absolute -bottom-1 left-0 h-[1px] bg-[#D8B46B] transition-all duration-300 ${
                    servicesOpen ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </button>
              <ServicesMegaMenu isOpen={servicesOpen} />
            </div>

            {/* Books Mega Menu */}
            <div
              onMouseEnter={() => setBooksOpen(true)}
              onMouseLeave={() => setBooksOpen(false)}
            >
              <button
                className={`text-sm tracking-wide transition-all duration-300 relative group ${
                  hasDarkHero ? "text-white/80 hover:text-white" : "text-[#2B2725]/70 hover:text-[#1E3A32]"
                }`}
              >
                Books
                <span
                  className={`absolute -bottom-1 left-0 h-[1px] bg-[#D8B46B] transition-all duration-300 ${
                    booksOpen ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </button>
              <BooksMegaMenu isOpen={booksOpen} hasDarkHero={hasDarkHero} />
            </div>

                {navLinks.slice(1).map((link) => (
                link.external ? (
                <a
                key={link.page}
                href={link.external}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm tracking-wide transition-all duration-300 relative group ${
                  hasDarkHero ? "text-white/80 hover:text-white" : "text-[#2B2725]/70 hover:text-[#1E3A32]"
                }`}
                >
                {link.name}
                <span className="absolute -bottom-1 left-0 h-[1px] bg-[#D8B46B] transition-all duration-300 w-0 group-hover:w-full" />
                </a>
                ) : (
                <Link
                key={link.page}
                to={createPageUrl(link.page)}
                className={`text-sm tracking-wide transition-all duration-300 relative group ${
                  currentPageName === link.page
                    ? (hasDarkHero ? "text-white" : "text-[#1E3A32]")
                    : (hasDarkHero ? "text-white/80 hover:text-white" : "text-[#2B2725]/70 hover:text-[#1E3A32]")
                }`}
                >
                {link.name}
                <span
                  className={`absolute -bottom-1 left-0 h-[1px] bg-[#D8B46B] transition-all duration-300 ${
                    currentPageName === link.page ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
                </Link>
                )
                ))}

                <div className={`flex items-center gap-3 ml-6 pl-6 border-l ${hasDarkHero ? 'border-white/20' : 'border-[#D8B46B]/20'}`}>
                  <button
                    onClick={() => setSearchOpen(true)}
                    className={`p-2 ${hasDarkHero ? 'text-white/80 hover:text-white' : 'text-[#2B2725]/70 hover:text-[#1E3A32]'} transition-colors`}
                    title="Search"
                  >
                    <Search size={18} />
                  </button>
                  <CartIcon hasDarkHero={hasDarkHero} />
                  <Link
                    to="/login"
                    onClick={() => haptics.light()}
                    className={`text-sm tracking-wide ${hasDarkHero ? 'text-white/80 hover:text-white' : 'text-[#2B2725]/70 hover:text-[#1E3A32]'} transition-colors`}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => haptics.medium()}
                    className={`px-5 py-2 ${hasDarkHero ? 'bg-white text-[#1E3A32] hover:bg-[#F9F5EF]' : 'bg-[#1E3A32] text-[#F9F5EF] hover:bg-[#2B2725]'} text-sm tracking-wide transition-all duration-300`}
                  >
                    Get Started
                  </Link>
                </div>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => {
                    haptics.light();
                    setMobileMenuOpen(!mobileMenuOpen);
                  }}
                  className={`lg:hidden p-3 ${hasDarkHero ? 'text-white hover:bg-white/10' : 'text-[#1E3A32] hover:bg-[#1E3A32]/5'} rounded-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center`}
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                </nav>
                </>
                );
                })()}

        <CookieBanner />
        <AccessibilityWidget />

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-[#F9F5EF] border-t border-[#D8B46B]/20 max-h-[calc(100vh-80px)] overflow-y-auto"
            >
              <div className="px-6 py-8 flex flex-col gap-2">
                {/* Home */}
                <Link
                  to={createPageUrl("Home")}
                  onClick={() => { haptics.light(); setMobileMenuOpen(false); }}
                  className={`text-lg py-4 px-4 rounded-lg transition-colors active:scale-98 min-h-[52px] flex items-center ${
                    currentPageName === "Home" ? "text-[#1E3A32] font-medium bg-[#D8B46B]/10" : "text-[#2B2725]/70 hover:bg-[#E4D9C4]/50"
                  }`}
                >
                  Home
                </Link>

                {/* About */}
                <Link
                  to={createPageUrl("About")}
                  onClick={() => { haptics.light(); setMobileMenuOpen(false); }}
                  className={`text-lg py-4 px-4 rounded-lg transition-colors active:scale-98 min-h-[52px] flex items-center ${
                    currentPageName === "About" ? "text-[#1E3A32] font-medium bg-[#D8B46B]/10" : "text-[#2B2725]/70 hover:bg-[#E4D9C4]/50"
                  }`}
                >
                  About
                </Link>

                {/* Services Section */}
                <div className="mt-2">
                  <p className="text-xs tracking-[0.2em] text-[#D8B46B] uppercase px-4 py-2 font-medium">Services</p>
                  {[
                    { name: "Tools & Programs", page: "Programs" },
                    { name: "LENS™", page: "LENS" },
                    { name: "Cleaning Out Your Closet", page: "CleaningOutYourCloset" },
                    { name: "Pocket Mindset™", page: "PocketMindset" },
                    { name: "Hypnosis Training", page: "LearnHypnosis" },
                    { name: "Speaking & Training", page: "SpeakingTraining" },
                  ].map((link) => (
                    <Link
                      key={link.page}
                      to={createPageUrl(link.page)}
                      onClick={() => { haptics.light(); setMobileMenuOpen(false); }}
                      className={`text-base py-3 px-6 rounded-lg transition-colors active:scale-98 min-h-[48px] flex items-center ${
                        currentPageName === link.page ? "text-[#1E3A32] font-medium bg-[#D8B46B]/10" : "text-[#2B2725]/70 hover:bg-[#E4D9C4]/50"
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>

                {/* Books Section */}
                <div className="mt-2">
                  <p className="text-xs tracking-[0.2em] text-[#D8B46B] uppercase px-4 py-2 font-medium">Books</p>
                  <Link
                    to="/Books"
                    onClick={() => { haptics.light(); setMobileMenuOpen(false); }}
                    className={`text-base py-3 px-6 rounded-lg transition-colors active:scale-98 min-h-[48px] flex items-center ${
                      currentPageName === "ProgramsBooks" ? "text-[#1E3A32] font-medium bg-[#D8B46B]/10" : "text-[#2B2725]/70 hover:bg-[#E4D9C4]/50"
                    }`}
                  >
                    Browse All Books
                  </Link>
                </div>

                {/* Remaining nav links */}
                <div className="mt-2 border-t border-[#E4D9C4] pt-2">
                  {[
                    { name: "Initial Consultation", page: "Consultations" },
                    { name: "Book a Session", page: "Bookings", external: bookingUrl },
                    { name: "Blog", page: "Blog" },
                    { name: "Contact", page: "Contact" },
                  ].map((link) => (
                    link.external ? (
                    <a
                      key={link.page}
                      href={link.external}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => { haptics.light(); setMobileMenuOpen(false); }}
                      className="text-lg py-4 px-4 rounded-lg transition-colors active:scale-98 min-h-[52px] flex items-center text-[#2B2725]/70 hover:bg-[#E4D9C4]/50"
                    >
                      {link.name}
                    </a>
                    ) : (
                    <Link
                      key={link.page}
                      to={createPageUrl(link.page)}
                      onClick={() => { haptics.light(); setMobileMenuOpen(false); }}
                      className={`text-lg py-4 px-4 rounded-lg transition-colors active:scale-98 min-h-[52px] flex items-center ${
                        currentPageName === link.page ? "text-[#1E3A32] font-medium bg-[#D8B46B]/10" : "text-[#2B2725]/70 hover:bg-[#E4D9C4]/50"
                      }`}
                    >
                      {link.name}
                    </Link>
                    )
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-[#E4D9C4] flex flex-col gap-3">
                  <Link
                    to="/login"
                    onClick={() => { haptics.light(); setMobileMenuOpen(false); }}
                    className="px-6 py-4 border border-[#1E3A32] text-[#1E3A32] text-center text-sm tracking-wide rounded-lg hover:bg-[#1E3A32]/5 active:scale-98 transition-all min-h-[52px] flex items-center justify-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => { haptics.medium(); setMobileMenuOpen(false); }}
                    className="px-6 py-4 bg-[#1E3A32] text-[#F9F5EF] text-center text-sm tracking-wide rounded-lg hover:bg-[#2B2725] active:scale-98 transition-all min-h-[52px] flex items-center justify-center"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main>
        <PageTransition key={currentPageName}>{children}</PageTransition>
      </main>

      {/* Footer */}
      <footer className="bg-[#1E3A32] text-[#F9F5EF]">
        <div className="w-full px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a98b3e154ab3b36c88ebb/fad26f1a8_mind-stylist-whie-gold-logo2x.png" 
                    alt="Your Mind Stylist Logo" 
                    className="w-12 h-12 flex-shrink-0 object-contain"
                  />
                <div>
                  <p className="text-[#F9F5EF]/60 text-xs tracking-[0.2em] uppercase mb-1">
                    Roberta Fernandez
                  </p>
                  <h3 className="font-serif font-bold text-2xl text-[#F9F5EF]">
                    Your Mind Stylist
                  </h3>
                </div>
              </div>
              <p className="text-[#F9F5EF]/70 text-sm leading-relaxed mb-4">
                Emotional Intelligence • Mind Styling • Hypnosis • Professional Development
              </p>
              <div className="text-[#F9F5EF]/70 text-sm space-y-1">
                <p>8724 Spanish Ridge Ave #B</p>
                <p>Las Vegas, NV 89148</p>
                <p className="mt-2">612-839-2295</p>
                <p>roberta@yourmindstylist.com</p>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-[#D8B46B] text-xs tracking-[0.2em] uppercase mb-6">
                Quick Links
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {navLinks.map((link) => (
                  link.external ? (
                  <a
                    key={link.page}
                    href={link.external}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#F9F5EF]/70 hover:text-[#D8B46B] transition-colors"
                  >
                    {link.name}
                  </a>
                  ) : (
                  <Link
                    key={link.page}
                    to={createPageUrl(link.page)}
                    className="text-sm text-[#F9F5EF]/70 hover:text-[#D8B46B] transition-colors"
                  >
                    {link.name}
                  </Link>
                  )
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-[#D8B46B] text-xs tracking-[0.2em] uppercase mb-6">
                Connect
              </h4>
              <p className="text-[#F9F5EF]/70 text-sm mb-6 leading-relaxed">
                Ready to transform how you think?
                <br />
                Let's start a conversation.
              </p>
              <Link
                to={createPageUrl("Contact")}
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#D8B46B] text-[#D8B46B] text-sm tracking-wide hover:bg-[#D8B46B] hover:text-[#1E3A32] transition-all duration-300"
              >
                Get in Touch
              </Link>

              {/* Social Media */}
              <div className="flex items-center gap-4 mt-6">
                <a href="https://www.facebook.com/roberta.fernandez.777" target="_blank" rel="noopener noreferrer" className="text-[#F9F5EF]/50 hover:text-[#D8B46B] transition-colors" aria-label="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="https://www.instagram.com/roberta_k_fernandez/" target="_blank" rel="noopener noreferrer" className="text-[#F9F5EF]/50 hover:text-[#D8B46B] transition-colors" aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <a href="https://www.tiktok.com/@your.mind.stylist" target="_blank" rel="noopener noreferrer" className="text-[#F9F5EF]/50 hover:text-[#D8B46B] transition-colors" aria-label="TikTok">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.92a8.2 8.2 0 0 0 4.76 1.52V7a4.84 4.84 0 0 1-1-.31z"/></svg>
                </a>
                <a href="https://www.linkedin.com/in/robertafernandez/" target="_blank" rel="noopener noreferrer" className="text-[#F9F5EF]/50 hover:text-[#D8B46B] transition-colors" aria-label="LinkedIn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
                <a href="https://www.youtube.com/@RobertaF.YourAbilityActivator" target="_blank" rel="noopener noreferrer" className="text-[#F9F5EF]/50 hover:text-[#D8B46B] transition-colors" aria-label="YouTube">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-16 pt-8 border-t border-[#F9F5EF]/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[#F9F5EF]/40">
              © {new Date().getFullYear()} Your Mind Stylist. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link to={createPageUrl("LegalPage?slug=privacy-policy")} className="text-xs text-[#F9F5EF]/40 hover:text-[#D8B46B] transition-colors">
                Privacy Policy
              </Link>
              <Link to={createPageUrl("LegalPage?slug=terms-of-service")} className="text-xs text-[#F9F5EF]/40 hover:text-[#D8B46B] transition-colors">
                Terms of Service
              </Link>
              <Link to={createPageUrl("LegalPage?slug=cookie-policy")} className="text-xs text-[#F9F5EF]/40 hover:text-[#D8B46B] transition-colors">
                Cookies
              </Link>
              <Link to={createPageUrl("Accessibility")} className="text-xs text-[#F9F5EF]/40 hover:text-[#D8B46B] transition-colors">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </footer>
      </div>
      </EditModeProvider>
      </CartProvider>
  );
}