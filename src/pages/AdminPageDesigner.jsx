import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, ExternalLink, Layout, Pencil } from "lucide-react";
import { PAGE_SECTIONS, DESIGNER_PAGES } from "@/components/cms/pageSections";
import DesignerSectionList from "@/components/admin/DesignerSectionList";
import { useToast } from "@/components/ui/use-toast";

const PAGE_ROUTES = { Home: "/" };

export default function AdminPageDesigner() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedPage, setSelectedPage] = useState(DESIGNER_PAGES[0]);
  const [sections, setSections] = useState([]);
  const [dirty, setDirty] = useState(false);

  const { data: layouts = [], isLoading } = useQuery({
    queryKey: ["page-layout", selectedPage],
    queryFn: () => base44.entities.PageLayout.filter({ page: selectedPage }),
  });
  const layout = layouts[0];

  // Initialize local section list from saved layout merged with the code registry
  useEffect(() => {
    const defaults = PAGE_SECTIONS[selectedPage] || [];
    if (!layout || !Array.isArray(layout.sections)) {
      setSections(defaults.map((d) => ({ key: d.key, label: d.label, description: d.description, visible: true })));
    } else {
      const byKey = Object.fromEntries(defaults.map((d) => [d.key, d]));
      const merged = layout.sections
        .filter((s) => byKey[s.key])
        .map((s) => ({ ...byKey[s.key], visible: s.visible !== false }));
      defaults.forEach((d) => {
        if (!layout.sections.some((s) => s.key === d.key)) {
          merged.push({ ...d, visible: true });
        }
      });
      setSections(merged);
    }
    setDirty(false);
  }, [selectedPage, layout]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        page: selectedPage,
        sections: sections.map((s) => ({ key: s.key, visible: s.visible !== false })),
      };
      if (layout) {
        await base44.entities.PageLayout.update(layout.id, payload);
      } else {
        await base44.entities.PageLayout.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-layout"] });
      setDirty(false);
      toast({ title: "Layout published", description: `${selectedPage} page updated for all visitors.` });
    },
  });

  const handleReorder = (items) => {
    setSections(items);
    setDirty(true);
  };

  const handleToggle = (key, visible) => {
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, visible } : s)));
    setDirty(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-2">
        <Layout className="text-[#D8B46B]" size={28} />
        <h1 className="text-3xl font-serif text-[#1E3A32]">Page Designer</h1>
      </div>
      <p className="text-gray-600 mb-8">
        Drag sections to reorder them, or toggle them off to hide them. Changes go live when you publish.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={selectedPage} onValueChange={setSelectedPage}>
          <SelectTrigger className="w-56 bg-white">
            <SelectValue placeholder="Select a page" />
          </SelectTrigger>
          <SelectContent>
            {DESIGNER_PAGES.map((page) => (
              <SelectItem key={page} value={page}>{page}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <a href={PAGE_ROUTES[selectedPage] || "/"} target="_blank" rel="noopener noreferrer">
          <Button variant="outline">
            <ExternalLink size={16} className="mr-2" />
            View Page
          </Button>
        </a>

        <div className="flex-1" />

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!dirty || saveMutation.isPending}
          className="bg-[#1E3A32] hover:bg-[#2B2725]"
        >
          <Save size={16} className="mr-2" />
          {saveMutation.isPending ? "Publishing..." : "Publish Layout"}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-gray-500 py-12 text-center">Loading layout...</div>
      ) : (
        <DesignerSectionList sections={sections} onReorder={handleReorder} onToggle={handleToggle} />
      )}

      <div className="mt-8 bg-[#F9F5EF] border border-[#D8B46B]/30 rounded-lg p-4 flex items-start gap-3">
        <Pencil size={18} className="text-[#D8B46B] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[#1E3A32]">
          To edit the text and images <em>inside</em> a section, open the page and turn on <strong>Edit Mode</strong> from
          the manager bar — then click any highlighted text or image directly on the page.
        </p>
      </div>
    </div>
  );
}