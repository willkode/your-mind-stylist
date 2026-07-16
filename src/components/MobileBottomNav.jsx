import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Home, BookOpen, ShoppingCart, Menu, X, Settings, Users, FileText, MessageSquare, Headphones, LayoutDashboard, UsersRound, Bug, MessageCircle, Sparkles, Calendar, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import haptics from "@/components/utils/haptics";
import BugReportModal from "./bug-tracker/BugReportModal";

export default function MobileBottomNav({ user, currentPageName, navLinks, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [chatConversation, setChatConversation] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const navigate = useNavigate();

  const handleNavClick = (pageName) => {
    haptics.light();
    setMenuOpen(false);
    // Use replace for tab navigation to preserve back-stack correctly
    navigate(createPageUrl(pageName), { replace: true });
  };

  const getIcon = (pageName) => {
    const iconMap = {
      Dashboard: Home,
      AdminDashboard: LayoutDashboard,
      ManagerDashboard: LayoutDashboard,
      StudioDashboard: LayoutDashboard,
      Library: BookOpen,
      PurchaseCenter: ShoppingCart,
      Purchase: ShoppingCart,
      BuyPrograms: ShoppingCart,
      AdminRoadmap: FileText,
      Roadmap: FileText,
      AdminUsers: Users,
      Users: Users,
      StaffManagement: UsersRound,
      Staff: UsersRound,
      StudioSettings: Settings,
      Settings: Settings,
      BlogManager: FileText,
      Blog: FileText,
      CourseManager: BookOpen,
      Courses: BookOpen,
      AudioManager: Headphones,
      Audio: Headphones,
      MessagesManager: MessageSquare,
      Messages: MessageSquare,
      StylePauses: Sparkles,
      ClientBookings: Calendar,
      ClientPortal: UserCircle,
      ManagerCalendar: Calendar,
    };
    return iconMap[pageName] || Home;
  };

  const quickLinks = navLinks.slice(0, 3);
  const moreLinks = navLinks.slice(3);

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1E3A32] border-t border-[#F9F5EF]/10 z-50 safe-area-bottom">
        <div className={`grid ${moreLinks.length > 0 ? 'grid-cols-4' : 'grid-cols-3'} h-16`}>
          {quickLinks.map((link) => {
            const Icon = getIcon(link.page);
            return (
              <button
                key={link.page}
                onClick={() => {
                  haptics.light();
                  handleNavClick(link.page);
                }}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  currentPageName === link.page
                    ? "text-[#D8B46B]"
                    : "text-[#F9F5EF]/70"
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px]">{link.name}</span>
              </button>
            );
          })}
          {moreLinks.length > 0 && (
            <button
              onClick={() => {
                haptics.light();
                setMenuOpen(!menuOpen);
              }}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                menuOpen ? "text-[#D8B46B]" : "text-[#F9F5EF]/70"
              }`}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
              <span className="text-[10px]">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* Slide-up Menu Panel */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40 pointer-events-auto"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed bottom-16 left-0 right-0 bg-[#1E3A32] rounded-t-3xl z-50 max-h-[70vh] overflow-y-auto safe-area-bottom"
            >
              <div className="px-6 py-6">
                {/* User Info */}
                <div className="pb-4 mb-4 border-b border-[#F9F5EF]/10">
                  <p className="text-[#F9F5EF] font-medium">
                    {user?.full_name || user?.email}
                  </p>
                  <p className="text-[#F9F5EF]/60 text-sm">{user?.email}</p>
                </div>

                {/* More Navigation Links */}
                <div className="space-y-2 mb-4">
                  {moreLinks.map((link) => (
                    <button
                      key={link.page}
                      onClick={() => handleNavClick(link.page)}
                      className={`block w-full text-left py-3 px-4 rounded-lg transition-colors ${
                        currentPageName === link.page
                          ? "bg-[#D8B46B]/20 text-[#D8B46B]"
                          : "text-[#F9F5EF]/80 hover:bg-[#F9F5EF]/10"
                      }`}
                    >
                      {link.name}
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="py-4 border-t border-[#F9F5EF]/10 space-y-2">
                  {/* Bug Report Button */}
                  <button
                    onClick={() => {
                      haptics.light();
                      setBugReportOpen(true);
                    }}
                    className="flex items-center gap-3 w-full text-left py-3 px-4 rounded-lg text-[#F9F5EF]/80 hover:bg-[#F9F5EF]/10 transition-colors"
                  >
                    <Bug size={18} className="text-[#D8B46B]" />
                    Report a Bug
                  </button>

                  {/* Chat Button */}
                  <button
                    onClick={() => {
                      haptics.light();
                      setChatOpen(!chatOpen);
                    }}
                    className="flex items-center gap-3 w-full text-left py-3 px-4 rounded-lg text-[#F9F5EF]/80 hover:bg-[#F9F5EF]/10 transition-colors"
                  >
                    <MessageCircle size={18} className="text-[#D8B46B]" />
                    Ask Anything
                  </button>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    haptics.medium();
                    onLogout();
                  }}
                  className="w-full py-3 px-4 bg-[#F9F5EF]/10 hover:bg-[#F9F5EF]/20 text-[#F9F5EF] rounded-lg transition-colors min-h-[48px]"
                >
                  Logout
                </button>
              </div>
            </motion.div>

            {/* Bug Report Modal */}
            <AnimatePresence>
              {bugReportOpen && <BugReportModal onClose={() => setBugReportOpen(false)} />}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
              {chatOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-2xl z-50 overflow-hidden w-[calc(100%-2rem)]"
                >
                  <div className="bg-[#1E3A32] text-white p-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-sm flex items-center gap-2">
                        <MessageCircle size={16} />
                        Ask Me Anything
                      </h3>
                      <button
                        onClick={() => setChatOpen(false)}
                        className="text-white/80 hover:text-white"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <p className="text-xs text-white/70 mt-1">Quick answers</p>
                  </div>

                  <div className="p-3 space-y-2 bg-[#F9F5EF] max-h-48 overflow-y-auto">
                    {chatConversation.length === 0 ? (
                      <p className="text-xs text-[#2B2725]/70">How can I help?</p>
                    ) : (
                      chatConversation.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded text-xs ${
                            msg.role === "user"
                              ? "bg-[#D8B46B] text-white"
                              : "bg-white text-[#2B2725]"
                          }`}
                        >
                          {msg.content}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </>
  );
}