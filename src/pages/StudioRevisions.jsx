import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, RotateCcw, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function StudioRevisions() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [pageFilter, setPageFilter] = useState("all");
  const [selectedContent, setSelectedContent] = useState(null);

  const { data: allContent = [] } = useQuery({
    queryKey: ["cms-content"],
    queryFn: () => base44.entities.CmsContent.list("-updated_date"),
  });

  const { data: allRevisions = [] } = useQuery({
    queryKey: ["cms-revisions"],
    queryFn: () => base44.entities.CmsRevision.list("-created_date"),
  });

  const { data: selectedRevisions = [] } = useQuery({
    queryKey: ["cms-revisions", selectedContent?.key],
    queryFn: () =>
      base44.entities.CmsRevision.filter({ content_key: selectedContent.key }, "-created_date"),
    enabled: !!selectedContent,
  });

  const restoreMutation = useMutation({
    mutationFn: async ({ contentId, revisionContent, contentKey, userEmail }) => {
      // Get current content to save as revision
      const currentBlock = allContent.find((c) => c.id === contentId);

      // Save current state as revision
      await base44.entities.CmsRevision.create({
        content_key: contentKey,
        content: currentBlock.content,
        edited_by: userEmail,
        action: "updated",
      });

      // Restore the selected revision
      await base44.entities.CmsContent.update(contentId, {
        content: revisionContent,
        is_draft: false,
      });

      // Create restored revision marker
      await base44.entities.CmsRevision.create({
        content_key: contentKey,
        content: revisionContent,
        edited_by: userEmail,
        action: "restored",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-content"] });
      queryClient.invalidateQueries({ queryKey: ["cms-revisions"] });
      alert("Content restored successfully!");
      setSelectedContent(null);
    },
  });

  const handleRestore = async (revision) => {
    const content = allContent.find((c) => c.key === revision.content_key);
    if (!content) {
      alert("Content block not found");
      return;
    }

    if (
      window.confirm(
        "Restore this version? The current content will be saved in history before restoring."
      )
    ) {
      const user = await base44.auth.me();
      restoreMutation.mutate({
        contentId: content.id,
        revisionContent: revision.content,
        contentKey: revision.content_key,
        userEmail: user.email,
      });
    }
  };

  const filteredContent = allContent.filter((content) => {
    const matchesSearch =
      searchQuery === "" ||
      content.block_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.key.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPage = pageFilter === "all" || content.page === pageFilter;

    return matchesSearch && matchesPage;
  });

  const uniquePages = [...new Set(allContent.map((c) => c.page))].sort();

  const getRevisionCount = (contentKey) => {
    return allRevisions.filter((r) => r.content_key === contentKey).length;
  };

  const getActionBadge = (action) => {
    const colors = {
      created: "bg-green-100 text-green-800",
      updated: "bg-blue-100 text-blue-800",
      restored: "bg-purple-100 text-purple-800",
    };
    return colors[action] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Clock size={32} className="text-[#1E3A32]" />
              <h1 className="font-serif text-4xl text-[#1E3A32]">Content Revision History</h1>
            </div>
            <p className="text-[#2B2725]/70">
              View and restore previous versions of your content
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40"
                />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search content blocks..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <Select value={pageFilter} onValueChange={setPageFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pages</SelectItem>
                  {uniquePages.map((page) => (
                    <SelectItem key={page} value={page}>
                      {page}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Content Blocks List */}
            <div className="bg-white p-6 rounded-lg">
              <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">Content Blocks</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredContent.length === 0 ? (
                  <p className="text-[#2B2725]/60 text-center py-8">No content blocks found</p>
                ) : (
                  filteredContent.map((content) => (
                    <button
                      key={content.id}
                      onClick={() => setSelectedContent(content)}
                      className={`w-full text-left p-4 rounded border-2 transition-all ${
                        selectedContent?.id === content.id
                          ? "border-[#1E3A32] bg-[#1E3A32]/5"
                          : "border-[#E4D9C4] hover:border-[#D8B46B]"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-[#1E3A32]">{content.block_title}</h3>
                        <span className="text-xs px-2 py-1 bg-[#D8B46B]/20 text-[#2B2725] rounded">
                          {getRevisionCount(content.key)} versions
                        </span>
                      </div>
                      <p className="text-sm text-[#2B2725]/60 mb-1">{content.key}</p>
                      <p className="text-xs text-[#2B2725]/50">Page: {content.page}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Revision Timeline */}
            <div className="bg-white p-6 rounded-lg">
              <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">Revision Timeline</h2>
              {!selectedContent ? (
                <div className="text-center py-16">
                  <Clock size={48} className="mx-auto text-[#D8B46B] mb-4" />
                  <p className="text-[#2B2725]/60">
                    Select a content block to view its revision history
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {/* Current Version */}
                  <div className="border-2 border-[#1E3A32] rounded-lg p-4 bg-[#1E3A32]/5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="inline-block px-2 py-1 bg-[#1E3A32] text-white text-xs rounded mb-2">
                          CURRENT VERSION
                        </span>
                        <p className="text-xs text-[#2B2725]/60">
                          Last updated: {format(new Date(selectedContent.updated_date), "PPpp")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="text-sm text-[#2B2725] line-clamp-3">
                        {selectedContent.content}
                      </p>
                    </div>
                  </div>

                  {/* Previous Versions */}
                  {selectedRevisions.length === 0 ? (
                    <p className="text-sm text-[#2B2725]/60 text-center py-8">
                      No previous versions yet
                    </p>
                  ) : (
                    selectedRevisions.map((revision, idx) => (
                      <motion.div
                        key={revision.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span
                              className={`inline-block px-2 py-1 text-xs rounded mb-2 ${getActionBadge(
                                revision.action
                              )}`}
                            >
                              {revision.action.toUpperCase()}
                            </span>
                            <p className="text-xs text-[#2B2725]/60">
                              {format(new Date(revision.created_date), "PPpp")}
                            </p>
                            <p className="text-xs text-[#2B2725]/60">by {revision.edited_by}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(revision)}
                            disabled={restoreMutation.isPending}
                          >
                            <RotateCcw size={14} className="mr-1" />
                            Restore
                          </Button>
                        </div>
                        <div className="mt-3 p-3 bg-[#F9F5EF] rounded">
                          <p className="text-sm text-[#2B2725] line-clamp-3">
                            {revision.content}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}