import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Single shared query — fetches ALL CMS content once, all CmsText components share it
export function useCmsText(key, fallback = "") {
  const { data: allBlocks = [] } = useQuery({
    queryKey: ["cms-content-all"],
    queryFn: () => base44.entities.CmsContent.list(),
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const block = allBlocks.find(b => b.key === key);

  if (!block) {
    return { content: fallback, block: null };
  }

  return {
    content: block.is_draft ? (block.draft_content || block.content) : block.content,
    block,
  };
}