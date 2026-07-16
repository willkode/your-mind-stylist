/**
 * Credit system configuration — single source of truth.
 * 
 * Model:
 *   Standard subscription — $79/mo → 500 credits/month
 *   Top-Up pack — $25 one-time → 50 credits added immediately
 * 
 * Weights represent "app credits" per integration call.
 */

// Stripe Price IDs (Indy's Stripe account)
export const STRIPE_PRICE_IDS = {
  standard: "price_1TarvnGtV3XinJAoMmuobhQR",  // $79/mo recurring
  topup: "price_1TarwOGtV3XinJAogCaEcm5V",      // $25 one-time
};

export const CREDIT_WEIGHTS = {
  // Blog Tools
  blog_content_generator: 3,
  blog_summarizer: 2,
  seo_analyzer: 2,
  seo_optimizer: 2,
  image_generator: 5,

  // Alchemy Suite
  content_repurposer: 3,
  lead_magnet_generator: 3,
  pocket_script_generator: 3,
  video_script_generator: 3,
  email_sequence_generator: 3,
  course_outline_generator: 3,
  script_writer: 2,
  social_media_transformer: 2,
  webinar_outline_creator: 3,

  // Assistants
  ai_helper: 2,
  ai_manager_assistant: 2,
  ai_client_assistant: 1,

  // Default
  other: 1,
};

export const PLAN_CONFIG = {
  standard: {
    name: "Standard",
    monthly_limit: 250,
    price_cents: 7900,
    price_display: "$79/mo",
    description: "Full AI-powered content creation suite",
    features: [
      "250 AI credits per month",
      "Blog content generation & SEO tools",
      "AI image generation",
      "Content Alchemy Suite (repurpose, scripts, sequences)",
      "Course & webinar outline generation",
      "Lead magnet & email sequence creation",
      "Pocket Visualization™ script writer",
      "AI business insights assistant",
      "Credits reset monthly",
    ],
  },
  topup: {
    name: "Credit Top-Up",
    credits: 50,
    price_cents: 2500,
    price_display: "$25",
    description: "50 additional credits — added instantly",
  },
};

/**
 * Example Month — a realistic content creation month that fits within 250 credits.
 * Each row: { label, qty, cost_each, icon }
 * Total should be ≤250 to show comfortable headroom.
 */
export const EXAMPLE_MONTH = [
  { label: "Blog posts", qty: 20, cost_each: 3, icon: "FileText" },
  { label: "Social media transforms", qty: 15, cost_each: 2, icon: "Repeat" },
  { label: "SEO analyses", qty: 8, cost_each: 2, icon: "Search" },
  { label: "Lead magnets", qty: 3, cost_each: 3, icon: "Magnet" },
  { label: "Email sequences", qty: 3, cost_each: 3, icon: "Mail" },
  { label: "Course outlines", qty: 2, cost_each: 3, icon: "GraduationCap" },
  { label: "Video scripts", qty: 3, cost_each: 3, icon: "Video" },
  { label: "AI images", qty: 4, cost_each: 5, icon: "Image" },
  { label: "Business insights", qty: 10, cost_each: 2, icon: "Sparkles" },
];
// Sum: 60 + 30 + 16 + 9 + 9 + 6 + 9 + 20 + 20 = 179 credits → 71 to spare

export const FEATURE_LABELS = {
  blog_content_generator: "Blog Content Generator",
  blog_summarizer: "Blog Summarizer",
  seo_analyzer: "SEO Analyzer",
  seo_optimizer: "SEO Optimizer",
  image_generator: "Image Generator",
  content_repurposer: "Content Repurposer",
  lead_magnet_generator: "Lead Magnet Generator",
  pocket_script_generator: "Pocket Script Generator",
  video_script_generator: "Video Script Generator",
  email_sequence_generator: "Email Sequence Generator",
  course_outline_generator: "Course Outline Generator",
  script_writer: "Script Writer",
  social_media_transformer: "Social Media Transformer",
  webinar_outline_creator: "Webinar Outline Creator",
  ai_helper: "AI Helper",
  ai_manager_assistant: "AI Business Insights",
  ai_client_assistant: "Client AI Assistant",
  other: "Other",
};