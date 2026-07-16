import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Target, Image, Download, Sparkles, FileText, Mail, Headphones, FileVideo, Search, Shuffle, Video, Presentation, Mic, ArrowLeft } from "lucide-react";
import SocialMediaTransformer from "@/components/alchemy/SocialMediaTransformer";
import VisualIntelligence from "@/components/alchemy/VisualIntelligence";
import LeadMagnetGenerator from "@/components/alchemy/LeadMagnetGenerator";
import QuoteGraphicsGenerator from "@/components/alchemy/QuoteGraphicsGenerator";
import ScriptWriter from "@/components/alchemy/ScriptWriter";
import EmailSequenceGenerator from "@/components/alchemy/EmailSequenceGenerator";
import PocketScriptGenerator from "@/components/alchemy/PocketScriptGenerator";
import CourseOutlineGenerator from "@/components/alchemy/CourseOutlineGenerator";
import SEOOptimizer from "@/components/alchemy/SEOOptimizer";
import ContentRepurposer from "@/components/alchemy/ContentRepurposer";
import VideoScriptGenerator from "@/components/alchemy/VideoScriptGenerator";
import WebinarOutlineCreator from "@/components/alchemy/WebinarOutlineCreator";
import VoiceProfileManager from "@/components/alchemy/VoiceProfileManager";

export default function ContentStudio() {
  // Set auth layout
  if (typeof window !== 'undefined') {
    window.__USE_AUTH_LAYOUT = true;
  }

  const [activeTab, setActiveTab] = useState("social");

  const tools = [
    { id: "voice", icon: Mic, label: "My Voice", component: VoiceProfileManager },
    { id: "social", icon: Target, label: "Social Media", component: SocialMediaTransformer },
    { id: "repurpose", icon: Shuffle, label: "Content Repurposer", component: ContentRepurposer },
    { id: "seo", icon: Search, label: "SEO Optimizer", component: SEOOptimizer },
    { id: "visual", icon: Image, label: "Visual Intelligence", component: VisualIntelligence },
    { id: "lead", icon: Download, label: "Lead Magnets", component: LeadMagnetGenerator },
    { id: "quotes", icon: Sparkles, label: "Quote Graphics", component: QuoteGraphicsGenerator },
    { id: "video", icon: Video, label: "Video Scripts", component: VideoScriptGenerator },
    { id: "webinar", icon: Presentation, label: "Webinar Outlines", component: WebinarOutlineCreator },
    { id: "scripts", icon: FileText, label: "Script Writer", component: ScriptWriter },
    { id: "email", icon: Mail, label: "Email Sequences", component: EmailSequenceGenerator },
    { id: "pocket", icon: Headphones, label: "Pocket Scripts", component: PocketScriptGenerator },
    { id: "course", icon: FileVideo, label: "Course Outlines", component: CourseOutlineGenerator },
  ];

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to={createPageUrl("ManagerDashboard")}>
            <Button variant="ghost" className="mb-4 -ml-2">
              <ArrowLeft size={16} className="mr-2" />
              Back to Manager
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-8 h-8 text-[#D8B46B]" />
            <h1 className="font-serif text-4xl text-[#1E3A32]">Content Alchemy Suite</h1>
          </div>
          <p className="text-[#2B2725]/70 text-lg">
            Transform your content into multiple formats with AI-powered magic
          </p>
        </motion.div>

        {/* Tools Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 lg:grid-cols-6 gap-2 h-auto bg-white p-2 mb-6 overflow-x-auto">
              {tools.map((tool) => (
                <TabsTrigger
                  key={tool.id}
                  value={tool.id}
                  className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-[#1E3A32] data-[state=active]:text-[#F9F5EF]"
                >
                  <tool.icon size={20} />
                  <span className="text-xs">{tool.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {tools.map((tool) => (
              <TabsContent key={tool.id} value={tool.id}>
                <tool.component />
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}