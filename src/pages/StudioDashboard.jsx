import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Users, ShoppingCart, FileText, FileVideo, Headphones, 
  ListTodo, BookOpen, Shield, Settings, Activity, FileCheck
} from "lucide-react";

export default function StudioDashboard() {
  const { data: users = [] } = useQuery({
    queryKey: ["studio-users"],
    queryFn: () => base44.entities.User.list("-created_date"),
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ["studio-blogs"],
    queryFn: () => base44.entities.BlogPost.list(),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["studio-courses"],
    queryFn: () => base44.entities.Course.list(),
  });

  const { data: audioSessions = [] } = useQuery({
    queryKey: ["studio-audio"],
    queryFn: () => base44.entities.AudioSession.list(),
  });

  const { data: roadmapItems = [] } = useQuery({
    queryKey: ["studio-roadmap"],
    queryFn: () => base44.entities.RoadmapItem.filter({ status: "In Progress" }),
  });

  const newUsersThisWeek = users.filter(u => {
    const created = new Date(u.created_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created >= weekAgo;
  }).length;

  const stats = [
    { icon: Users, label: "Total Users", value: users.length, color: "#A6B7A3" },
    { icon: ShoppingCart, label: "Active Subscriptions", value: "—", color: "#D8B46B" },
    { icon: Users, label: "New Users (Last 7 Days)", value: newUsersThisWeek, color: "#6E4F7D" },
    { icon: ShoppingCart, label: "New Purchases (Last 7 Days)", value: "—", color: "#1E3A32" },
  ];

  const { data: stylePauses = [] } = useQuery({
    queryKey: ["studio-style-pauses"],
    queryFn: () => base44.entities.StylePause.list(),
  });

  const { data: identityWardrobe = [] } = useQuery({
    queryKey: ["studio-identity-wardrobe"],
    queryFn: () => base44.entities.IdentityWardrobe.list(),
  });

  const { data: dailyChecks = [] } = useQuery({
    queryKey: ["studio-daily-checks"],
    queryFn: () => base44.entities.DailyStyleCheck.list(),
  });

  const { data: pauseCompletions = [] } = useQuery({
    queryKey: ["studio-pause-completions"],
    queryFn: () => base44.entities.StylePauseCompletion.list(),
  });

  const contentOverview = [
    { 
      label: "Blog Posts", 
      draft: blogPosts.filter(p => p.status === "draft").length,
      scheduled: blogPosts.filter(p => p.status === "scheduled").length,
      published: blogPosts.filter(p => p.status === "published").length,
    },
    { 
      label: "Courses", 
      draft: courses.filter(c => c.status === "draft").length,
      published: courses.filter(c => c.status === "published").length,
    },
    { 
      label: "Style Pauses™", 
      draft: stylePauses.filter(s => !s.is_published).length,
      published: stylePauses.filter(s => s.is_published).length,
    },
    { 
      label: "Inner Rehearsal Sessions", 
      draft: audioSessions.filter(a => a.status === "draft").length,
      published: audioSessions.filter(a => a.status === "published").length,
    },
    {
      label: "Identity Wardrobe",
      draft: identityWardrobe.filter(i => i.is_default).length,
      published: identityWardrobe.filter(i => !i.is_default).length,
      draftLabel: "Default",
      publishedLabel: "User-Created"
    },
    {
      label: "Daily Style Checks",
      total: dailyChecks.length,
      thisWeek: dailyChecks.filter(c => {
        const created = new Date(c.created_date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created >= weekAgo;
      }).length,
      totalLabel: "Total Check-ins",
      weekLabel: "This Week"
    },
    {
      label: "Style Pause Completions",
      total: pauseCompletions.length,
      completed: pauseCompletions.filter(p => p.completion_status === "completed").length,
      totalLabel: "Total Sessions",
      completedLabel: "Completed"
    },
  ];

  const quickLinks = [
    { icon: Users, label: "Open Manager Dashboard", link: "ManagerDashboard", color: "#1E3A32" },
    { icon: FileText, label: "Go to Blog Manager", link: "BlogManager", color: "#D8B46B" },
    { icon: FileVideo, label: "Go to Course Manager", link: "StudioCourses", color: "#A6B7A3" },
    { icon: Headphones, label: "Style Pauses™", link: "StylePauses", color: "#6E4F7D" },
    { icon: ListTodo, label: "Roadmap", link: "AdminRoadmap", color: "#6E4F7D" },
    { icon: BookOpen, label: "Dev Docs", link: "StudioDevDocs", color: "#2B2725" },
    { icon: Shield, label: "Roles & Access", link: "StudioRoles", color: "#1E3A32" },
    { icon: FileCheck, label: "Legal Pages", link: "StudioLegal", color: "#D8B46B" },
    { icon: Settings, label: "Studio Settings", link: "StudioSettings", color: "#A6B7A3" },
  ];

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-3">
            <Activity size={32} className="text-[#1E3A32]" />
            <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32]">
              Studio Admin Dashboard
            </h1>
          </div>
          <p className="text-[#2B2725]/70 text-lg">
            Welcome back, Indy. Here's a snapshot of The Mind Stylist platform.
          </p>
        </motion.div>

        {/* High-Level Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">High-Level Stats</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-white p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <stat.icon size={28} style={{ color: stat.color }} />
                  <span className="text-3xl font-serif" style={{ color: stat.color }}>
                    {stat.value}
                  </span>
                </div>
                <p className="text-[#2B2725]/70 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Content Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Content Overview</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {contentOverview.map((content, index) => (
              <div key={index} className="bg-white p-6">
                <h3 className="font-medium text-[#1E3A32] mb-4">{content.label}</h3>
                <div className="space-y-2">
                  {content.draft !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#2B2725]/60">{content.draftLabel || "Draft"}</span>
                      <span className="font-medium">{content.draft}</span>
                    </div>
                  )}
                  {content.scheduled !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#2B2725]/60">Scheduled</span>
                      <span className="font-medium">{content.scheduled}</span>
                    </div>
                  )}
                  {content.published !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#2B2725]/60">{content.publishedLabel || "Published"}</span>
                      <span className="font-medium">{content.published}</span>
                    </div>
                  )}
                  {content.total !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#2B2725]/60">{content.totalLabel || "Total"}</span>
                      <span className="font-medium">{content.total}</span>
                    </div>
                  )}
                  {content.thisWeek !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#2B2725]/60">{content.weekLabel || "This Week"}</span>
                      <span className="font-medium">{content.thisWeek}</span>
                    </div>
                  )}
                  {content.completed !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#2B2725]/60">{content.completedLabel || "Completed"}</span>
                      <span className="font-medium">{content.completed}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">System Status</h2>
          <div className="bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#2B2725]/70">Portal Status</span>
              <span className="px-3 py-1 bg-[#A6B7A3]/20 text-[#1E3A32] text-sm">OK</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#2B2725]/70">Active Roadmap Items</span>
              <span className="font-medium text-[#1E3A32]">{roadmapItems.length}</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Quick Links</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => (
              <Link
                key={index}
                to={createPageUrl(link.link)}
                className="bg-white p-6 hover:shadow-lg transition-shadow group"
              >
                <link.icon size={28} style={{ color: link.color }} className="mb-4" />
                <p className="text-[#1E3A32] font-medium group-hover:text-[#D8B46B] transition-colors text-sm">
                  {link.label}
                </p>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}