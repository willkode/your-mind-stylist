import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { PAGE_SECTIONS } from "./pageSections";

// Returns the ordered, visible sections for a page, honoring any saved PageLayout.
export function usePageLayout(page) {
  const defaults = PAGE_SECTIONS[page] || [];

  const { data: layouts = [] } = useQuery({
    queryKey: ["page-layout", page],
    queryFn: () => base44.entities.PageLayout.filter({ page }),
    staleTime: 60 * 60 * 1000,
  });

  const layout = layouts[0];
  if (!layout || !Array.isArray(layout.sections)) return defaults;

  const byKey = Object.fromEntries(defaults.map((d) => [d.key, d]));
  const ordered = layout.sections
    .filter((s) => byKey[s.key] && s.visible !== false)
    .map((s) => byKey[s.key]);

  // Append any new sections added in code that aren't in the saved layout yet
  defaults.forEach((d) => {
    if (!layout.sections.some((s) => s.key === d.key)) ordered.push(d);
  });

  return ordered;
}