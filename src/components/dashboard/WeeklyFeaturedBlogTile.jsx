import React from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function WeeklyFeaturedBlogTile() {
  const { data: featuredPost } = useQuery({
    queryKey: ["dashboard-featured-blog"],
    queryFn: async () => {
      const posts = await base44.entities.BlogPost.filter({ status: "published" }, "-publish_date");
      const now = new Date();
      const live = posts.filter(p => !p.publish_date || new Date(p.publish_date) <= now);
      return live.find(p => p.featured_image) || live[0] || null;
    },
  });

  if (!featuredPost) return null;

  return (
    <Link
      to={createPageUrl(`BlogPost?slug=${featuredPost.slug}`)}
      onClick={() => window.scrollTo(0, 0)}
      className="bg-[#E8DCEB] rounded-xl p-5 hover:shadow-md transition-all flex items-start gap-3"
    >
      <BookOpen size={24} className="text-[#1E3A32] flex-shrink-0" />
      <h4 className="font-medium text-[#1E3A32]">Weekly Featured Blog: {featuredPost.title}</h4>
    </Link>
  );
}