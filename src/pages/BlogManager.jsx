import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ResponsiveSelect from "@/components/ui/ResponsiveSelect";
import { PenSquare, Eye, Trash2, Plus, UserPlus, CheckCircle, XCircle, Headphones } from "lucide-react";
import { format } from "date-fns";
import PodcastManager from "@/components/blog/PodcastManager";

export default function BlogManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("posts"); // "posts" | "podcasts"
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blogPosts"],
    queryFn: () => base44.entities.BlogPost.list("-created_date"),
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ["allAnalytics"],
    queryFn: () => base44.entities.BlogAnalytics.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BlogPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogPosts"] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id) => base44.entities.BlogPost.update(id, { status: "published" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogPosts"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => 
      base44.entities.BlogPost.update(id, { status: "rejected", rejection_reason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogPosts"] });
    },
  });

  const filteredPosts = posts.filter((post) => {
    const statusMatch = statusFilter === "all" || post.status === statusFilter;
    const categoryMatch = categoryFilter === "all" || post.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  const handleDelete = (id, title) => {
    if (window.confirm(`Delete "${title}"? This can't be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleApprove = (id) => {
    if (window.confirm("Approve and publish this guest post?")) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id) => {
    const reason = window.prompt("Rejection reason (will be sent to author):");
    if (reason) {
      rejectMutation.mutate({ id, reason });
    }
  };

  const getAnalytics = (postId) => {
    return analytics.find(a => a.blog_post_id === postId) || { views: 0, likes: 0, shares: 0 };
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">
              Blog & Podcast Manager
            </h1>
            <p className="text-[#2B2725]/70">The Mind Styling Journal</p>
          </div>
          {activeTab === "posts" && (
            <div className="flex gap-3">
              <Link to={createPageUrl("GuestAuthorInvite")}>
                <Button variant="outline" className="border-[#D8B46B] text-[#1E3A32]">
                  <UserPlus size={20} className="mr-2" />
                  Invite Guest Author
                </Button>
              </Link>
              <Link to={createPageUrl("BlogEditor?mode=new")}>
                <Button className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]">
                  <Plus size={20} className="mr-2" />
                  Create New Blog Post
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-[#E4D9C4] p-1 w-fit rounded-lg">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-6 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2 ${
              activeTab === "posts" ? "bg-[#1E3A32] text-white" : "text-[#2B2725]/70 hover:text-[#1E3A32]"
            }`}
          >
            <PenSquare size={16} /> Blog Posts
          </button>
          <button
            onClick={() => setActiveTab("podcasts")}
            className={`px-6 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2 ${
              activeTab === "podcasts" ? "bg-[#1E3A32] text-white" : "text-[#2B2725]/70 hover:text-[#1E3A32]"
            }`}
          >
            <Headphones size={16} /> Podcast
          </button>
        </div>

        {/* Podcast Tab */}
        {activeTab === "podcasts" && (
          <PodcastManager />
        )}

        {/* Blog Posts Tab */}
        {activeTab === "posts" && (<>

        {/* Filters */}
        <div className="bg-white p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-[#2B2725]/70 mb-2 block">Status</label>
              <ResponsiveSelect 
                value={statusFilter} 
                onValueChange={setStatusFilter}
                title="Filter by Status"
                placeholder="All Statuses"
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "draft", label: "Draft" },
                  { value: "pending_review", label: "Pending Review" },
                  { value: "scheduled", label: "Scheduled" },
                  { value: "published", label: "Published" },
                  { value: "rejected", label: "Rejected" }
                ]}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-[#2B2725]/70 mb-2 block">Category</label>
              <ResponsiveSelect 
                value={categoryFilter} 
                onValueChange={setCategoryFilter}
                title="Filter by Category"
                placeholder="All Categories"
                options={[
                  { value: "all", label: "All Categories" },
                  { value: "Restyle Monday", label: "Restyle Monday" },
                  { value: "Thursday Tailoring", label: "Thursday Tailoring" },
                  { value: "Emotional Intelligence", label: "Emotional Intelligence" },
                  { value: "Culture", label: "Culture" },
                  { value: "Leadership & Teams", label: "Leadership & Teams" },
                  { value: "Communication", label: "Communication" },
                  { value: "Identity & Confidence", label: "Identity & Confidence" },
                  { value: "Stress & Regulation", label: "Stress & Regulation" },
                  { value: "Relationships", label: "Relationships" },
                  { value: "Inner Rehearsal", label: "Inner Rehearsal" },
                  { value: "Hypnosis & the Brain", label: "Hypnosis & the Brain" },
                  { value: "Personal & Professional Development", label: "Personal & Professional Development" }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-[#2B2725]/60">Loading your posts...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[#2B2725]/60 mb-2">No posts here yet.</p>
              <p className="text-[#2B2725]/40 text-sm">When you're ready, your first idea can live here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F9F5EF]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">
                      Analytics
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">
                      Published On
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-[#2B2725]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4D9C4]">
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-[#F9F5EF]/50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#1E3A32]">{post.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[#2B2725]/70">{post.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs uppercase tracking-wide ${
                            post.status === "published"
                              ? "bg-[#A6B7A3]/20 text-[#1E3A32]"
                              : post.status === "pending_review"
                              ? "bg-[#D8B46B]/20 text-[#2B2725]"
                              : post.status === "scheduled"
                              ? "bg-[#6E4F7D]/20 text-[#2B2725]"
                              : post.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-[#E4D9C4] text-[#2B2725]/70"
                          }`}
                        >
                          {post.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {post.status === "published" && (() => {
                          const stats = getAnalytics(post.id);
                          return (
                            <div className="flex items-center gap-3 text-xs text-[#2B2725]/60">
                              <span title="Views">{stats.views} 👁</span>
                              <span title="Likes">{stats.likes} ❤️</span>
                              <span title="Shares">{stats.shares} 📤</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#2B2725]/70">
                        {post.publish_date
                          ? format(new Date(post.publish_date), "MMM d, yyyy")
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {post.status === "pending_review" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleApprove(post.id)}
                                title="Approve & Publish"
                              >
                                <CheckCircle size={18} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleReject(post.id)}
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </Button>
                            </>
                          )}
                          <Link to={createPageUrl(`BlogEditor?mode=edit&id=${post.id}`)}>
                            <Button variant="ghost" size="icon" className="text-[#1E3A32]">
                              <PenSquare size={18} />
                            </Button>
                          </Link>
                          {post.status === "published" && (
                            <Link to={createPageUrl(`BlogPost?slug=${post.slug}`)}>
                              <Button variant="ghost" size="icon" className="text-[#1E3A32]">
                                <Eye size={18} />
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(post.id, post.title)}
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>)}
      </div>
    </div>
  );
}