import HeroSection from "@/components/home/HeroSection";
import WhatIDo from "@/components/home/WhatIDo";
import MindStylingSuite from "@/components/home/MindStylingSuite";
import FreeMasterclass from "@/components/home/FreeMasterclass";
import Testimonials from "@/components/home/Testimonials";
import FinalCTA from "@/components/home/FinalCTA";

// Registry of designer-enabled pages and their sections.
// To make another page designable, add its sections here and render it via usePageLayout.
export const PAGE_SECTIONS = {
  Home: [
    { key: "hero", label: "Hero Section", description: "Main headline, intro and primary call to action", component: HeroSection },
    { key: "what_i_do", label: "What I Do", description: "Overview of services and approach", component: WhatIDo },
    { key: "suite", label: "Mind Styling Suite", description: "Programs and tools showcase", component: MindStylingSuite },
    { key: "masterclass", label: "Free Masterclass", description: "Masterclass signup promotion", component: FreeMasterclass },
    { key: "testimonials", label: "Testimonials", description: "Client success stories", component: Testimonials },
    { key: "final_cta", label: "Final Call to Action", description: "Closing invitation to get started", component: FinalCTA },
  ],
};

export const DESIGNER_PAGES = Object.keys(PAGE_SECTIONS);