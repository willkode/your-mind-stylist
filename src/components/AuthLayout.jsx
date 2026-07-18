import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { Menu, X, LogOut, User, Settings, ChevronDown, Search, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MobileBottomNav from "./MobileBottomNav";
import GlobalSearch from "./GlobalSearch";
import haptics from "./utils/haptics";
import BugReportButton from "./bug-tracker/BugReportButton";
import AccountBlockedScreen from "./AccountBlockedScreen";
import FloatingCreditTracker from "./credits/FloatingCreditTracker";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditModeProvider } from "./cms/EditModeProvider";
import ManagerBar from "./cms/ManagerBar";
import { PageTransition } from "./ui/PageTransition";
import { CartProvider } from "./shop/CartContext";
import CartIcon from "./shop/CartIcon";
import { getEffectiveRole, hasMinRole, getPageMinRole } from "@/lib/permissions";
import AccessDenied from "./admin/AccessDenied";
import RoleBadge from "./admin/RoleBadge";

export default function AuthLayout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountBlocked, setAccountBlocked] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          // Redirect to login if not authenticated
          base44.auth.redirectToLogin(window.location.pathname);
          return;
        }
        
        const currentUser = await base44.auth.me();
        
        // ACCESS GUARD: block inactive/archived/deleted accounts
        const blockedStatuses = ["inactive", "archived", "deleted"];
        if (blockedStatuses.includes(currentUser.account_status)) {
          setUser(currentUser);
          setAccountBlocked(currentUser.account_status);
          return;
        }
        
        setUser(currentUser);
      } catch (error) {
        console.error("Error fetching user:", error);
        // Redirect to login on error
        base44.auth.redirectToLogin(window.location.pathname);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      // Force redirect to home page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect anyway
      window.location.href = '/';
    }
  };

  // Role-based navigation
  const getNavLinks = () => {
    if (!user) return [];

    // Centralized role hierarchy: owner > admin > manager > support_staff > user
    const effectiveRole = getEffectiveRole(user);
    const isAdmin = hasMinRole(user, "admin");
    const isManager = hasMinRole(user, "manager");
    const isSupport = effectiveRole === "support_staff";

    const commonLinks = [
      { name: "Dashboard", page: isAdmin ? "AdminDashboard" : isManager ? "ManagerDashboard" : "Dashboard" },
    ];

    if (isAdmin) {
      return [
        ...commonLinks,
        { name: "User Dashboard", page: "Dashboard" },
        { name: "Clients", page: "ClientsHub" },
        { name: "Library", page: "ClientPortal" },
        { name: "Style Insights", page: "ManagerStyleInsights", group: "Studio" },
        { name: "Audiobooks", page: "ManagerAudiobooks", group: "Studio" },
        { name: "Studio Dashboard", page: "StudioDashboard", group: "Studio" },
        { name: "Staff", page: "StaffManagement", group: "Manage" },
        { name: "Roadmap", page: "AdminRoadmap", group: "Manage" },
        { name: "Web Analytics", page: "ManagerWebAnalytics", group: "Manage" },
        { name: "Activity Logs", page: "AdminActivityLogs", group: "Manage" },
        { name: "Roles & Permissions", page: "AdminRoles", group: "Manage" },
        { name: "Settings", page: "StudioSettings", group: "Manage" },
      ];
    }

    if (isManager) {
      return [
        ...commonLinks,
        { name: "User Dashboard", page: "Dashboard" },
        { name: "Clients", page: "ClientsHub" },
        { name: "Library", page: "ClientPortal" },
        { name: "Blog", page: "BlogManager", group: "Content" },
        { name: "Author Profile", page: "AuthorProfile", group: "Content" },
        { name: "Courses", page: "CourseManager", group: "Content" },
        { name: "Audio", page: "StudioAudio", group: "Studio" },
        { name: "Audiobooks", page: "ManagerAudiobooks", group: "Studio" },
        { name: "Staff", page: "StaffManagement", group: "More" },
        { name: "Affiliates", page: "ManagerAffiliates", group: "More" },
        { name: "Web Analytics", page: "ManagerWebAnalytics", group: "More" },
      ];
    }

    if (isSupport) {
      return [
        { name: "Bookings", page: "ManagerBookings" },
        { name: "Appointments", page: "ManagerAppointments" },
        { name: "Waiting List", page: "ManagerWaitingList" },
        { name: "Intake Review", page: "ManagerIntakeReview" },
        { name: "My Dashboard", page: "Dashboard" },
      ];
    }

    // Regular user
    return [
      { name: "Studio", page: "Dashboard" },
      { name: "Style Journal", page: "StyleJournal" },
      { name: "Audio", page: "StudioAudio" },
      { name: "Style Pauses", page: "StylePauses" },
      { name: "Book", page: "ClientBookings" },
      { name: "Client Portal", page: "ClientPortal" },
      { name: "Shop", page: "Shop" },
      { name: "Notes", page: "StudioNotes" },
      { name: "Blog", page: "Blog" },
      { name: "Affiliate", page: "AffiliatePortal" },
    ];
  };

  const navLinks = getNavLinks();

  // Fetch new bug reports count for admin (only bugs created in last 24 hours)
  const { data: newBugsCount = 0 } = useQuery({
    queryKey: ["newBugsCount"],
    queryFn: async () => {
      if (user?.role !== "admin") return 0;
      const bugs = await base44.entities.BugReport.filter({ status: "New" });
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return bugs.filter(b => new Date(b.created_date) > oneDayAgo).length;
    },
    enabled: !!user && user.role === "admin",
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Render blocked screen if account is inactive/archived/deleted
  if (accountBlocked) {
    return <AccountBlockedScreen status={accountBlocked} user={user} onLogout={handleLogout} />;
  }

  // CENTRAL ROLE GUARD — protects admin/manager/studio pages from direct URL access
  const requiredRole = getPageMinRole(currentPageName);
  if (requiredRole) {
    if (!user) {
      return (
        <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
          <div className="animate-pulse text-[#1E3A32]">Loading...</div>
        </div>
      );
    }
    if (!hasMinRole(user, requiredRole)) {
      return <AccessDenied userRole={getEffectiveRole(user)} />;
    }
  }

  return (
    <CartProvider>
    <EditModeProvider>
    <div className="min-h-screen bg-[#F9F5EF]">
      <ManagerBar />
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#1E3A32] shadow-md">
        {/* Main Nav */}
        <nav className="w-full px-4 py-2 flex justify-between items-center">
          <Link to={createPageUrl(navLinks[0]?.page || "Dashboard")} className="group flex items-center gap-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a98b3e154ab3b36c88ebb/fad26f1a8_mind-stylist-whie-gold-logo2x.png" 
              alt="Your Mind Stylist Logo" 
              className="w-7 h-7 md:w-8 md:h-8 flex-shrink-0 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-[7px] md:text-[8px] text-[#F9F5EF]/60 tracking-[0.15em] uppercase leading-tight">
                Roberta Fernandez
              </span>
              <span className="font-serif font-bold text-sm md:text-base text-[#F9F5EF] tracking-wide leading-tight">
                Your Mind Stylist
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-4">
            {navLinks.filter(l => !l.group).map((link) => (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                className={`text-xs tracking-wide transition-all duration-300 relative group whitespace-nowrap ${
                  currentPageName === link.page
                    ? "text-[#F9F5EF]"
                    : "text-[#F9F5EF]/70 hover:text-[#F9F5EF]"
                }`}
              >
                {link.name}
                <span
                  className={`absolute -bottom-1 left-0 h-[1px] bg-[#D8B46B] transition-all duration-300 ${
                    currentPageName === link.page ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            ))}

            {/* Grouped dropdown menus */}
            {(() => {
              const groups = {};
              navLinks.filter(l => l.group).forEach(l => {
                if (!groups[l.group]) groups[l.group] = [];
                groups[l.group].push(l);
              });
              return Object.entries(groups).map(([groupName, links]) => (
                <DropdownMenu key={groupName}>
                  <DropdownMenuTrigger asChild>
                    <button className={`text-xs tracking-wide transition-all duration-300 flex items-center gap-1 whitespace-nowrap ${
                      links.some(l => l.page === currentPageName)
                        ? "text-[#F9F5EF]"
                        : "text-[#F9F5EF]/70 hover:text-[#F9F5EF]"
                    }`}>
                      {groupName}
                      <ChevronDown size={12} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="bg-white min-w-[160px]">
                    {links.map(link => (
                      <DropdownMenuItem key={link.page} asChild>
                        <Link
                          to={createPageUrl(link.page)}
                          className={`flex items-center cursor-pointer text-sm ${
                            currentPageName === link.page ? "font-medium text-[#1E3A32]" : ""
                          }`}
                        >
                          {link.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ));
            })()}

            {/* Search Button */}
            <button
              onClick={() => {
                haptics.light();
                setSearchOpen(true);
              }}
              className="p-2 hover:bg-[#F9F5EF]/10 rounded-full transition-colors active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Search"
            >
              <Search size={16} className="text-[#F9F5EF]/70" />
            </button>

            {/* Bug Report Notifications (Admin Only) */}
             {user?.role === "admin" && (
               <Link
                 to={createPageUrl("AdminRoadmap")}
                 className="relative p-2 hover:bg-[#F9F5EF]/10 rounded-full transition-colors active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center"
                 aria-label="Bug Reports"
               >
                <Bell size={16} className="text-[#F9F5EF]/70" />
                {newBugsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {newBugsCount > 9 ? "9+" : newBugsCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart Icon */}
            <CartIcon hasDarkHero={true} />

            {/* User Menu */}
            <div className="flex items-center gap-3 border-l border-[#F9F5EF]/20 pl-4">
              <DropdownMenu open={profileDropdownOpen} onOpenChange={setProfileDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-7 h-7 rounded-full bg-[#D8B46B]/30 flex items-center justify-center overflow-hidden">
                      {user?.profile_photo ? (
                        <img
                          src={user.profile_photo}
                          alt={user.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={14} className="text-[#F9F5EF]" />
                      )}
                    </div>
                    <span className="text-[#F9F5EF] text-xs font-medium">
                      {user?.full_name || user?.email}
                    </span>
                    <ChevronDown size={14} className="text-[#F9F5EF]/70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white">
                  <div className="px-3 py-2 border-b border-[#E4D9C4]">
                    <p className="text-sm font-medium text-[#1E3A32]">
                      {user?.full_name || "User"}
                    </p>
                    <p className="text-xs text-[#2B2725]/60">{user?.email}</p>
                    <div className="mt-1.5">
                      <RoleBadge role={getEffectiveRole(user)} />
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link
                      to={createPageUrl("ProfileSettings")}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <User size={16} />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  {(user?.role === "admin" || user?.role === "manager" || user?.custom_role === "manager") && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link
                          to={createPageUrl("StudioSettings")}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Settings size={16} />
                          Studio Settings
                        </Link>
                      </DropdownMenuItem>
                      {user?.role === "admin" && (
                        <DropdownMenuItem asChild>
                          <Link
                            to={createPageUrl("AdminDashboard")}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Settings size={16} />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link
                          to={createPageUrl("ManagerDashboard")}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Settings size={16} />
                          Manager Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 cursor-pointer text-red-600"
                  >
                    <LogOut size={16} />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => {
              haptics.light();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="lg:hidden p-3 text-[#F9F5EF] hover:bg-[#F9F5EF]/10 rounded-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden bg-[#1E3A32] border-t border-[#F9F5EF]/10"
            >
              <div className="px-6 py-8 flex flex-col gap-2 max-h-[calc(100vh-100px)] overflow-y-auto">
                {navLinks.map((link) => (
                  <Link
                    key={link.page}
                    to={createPageUrl(link.page)}
                    onClick={() => {
                      haptics.light();
                      setMobileMenuOpen(false);
                    }}
                    className={`text-base py-4 px-4 rounded-lg transition-colors active:scale-98 min-h-[52px] flex items-center ${
                      currentPageName === link.page
                        ? "text-[#F9F5EF] font-medium bg-[#F9F5EF]/20"
                        : "text-[#F9F5EF]/70 hover:bg-[#F9F5EF]/10"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-4 border-t border-[#F9F5EF]/10">
                  <p className="text-[#F9F5EF]/70 text-sm mb-2">
                    {user?.full_name || user?.email}
                  </p>
                  <button
                    onClick={() => {
                      haptics.medium();
                      handleLogout();
                    }}
                    className="w-full px-4 py-4 bg-[#F9F5EF]/10 hover:bg-[#F9F5EF]/20 text-[#F9F5EF] text-sm rounded-lg flex items-center justify-center gap-2 active:scale-98 min-h-[52px] transition-all"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="pt-14 pb-20 lg:pb-0">
        <PageTransition key={currentPageName}>{children}</PageTransition>
      </main>

      {/* Bug Report Button */}
      <BugReportButton />

      {/* Floating Credit Tracker (manager only) */}
      {user?.email && (
        <FloatingCreditTracker userEmail={user.email} userRole={user.role} />
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        user={user}
        currentPageName={currentPageName}
        navLinks={navLinks}
        onLogout={handleLogout}
      />

      {/* Global Search */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
    </EditModeProvider>
    </CartProvider>
  );
}