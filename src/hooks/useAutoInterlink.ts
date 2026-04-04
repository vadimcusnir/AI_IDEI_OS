import { useMemo } from "react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  tags?: string[];
  category?: string;
}

interface InterlinkedPost {
  id: string;
  title: string;
  slug: string;
  score: number;
}

/**
 * Client-side auto-interlinking hook.
 * Given a current post and all published posts, returns 3-5 semantically related posts.
 */
export function useAutoInterlink(
  currentPost: BlogPost | null,
  allPosts: BlogPost[] | undefined
): InterlinkedPost[] {
  return useMemo(() => {
    if (!currentPost || !allPosts?.length) return [];

    const currentTags = new Set(
      (currentPost.tags || []).map((t) => t.toLowerCase())
    );
    const currentCategory = currentPost.category?.toLowerCase() || "";

    // Extract keywords from title
    const titleWords = new Set(
      currentPost.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

    const scored = allPosts
      .filter((p) => p.id !== currentPost.id)
      .map((p) => {
        let score = 0;

        // Category match
        if (p.category?.toLowerCase() === currentCategory) score += 2;

        // Tag overlap
        const pTags = (p.tags || []).map((t) => t.toLowerCase());
        for (const t of pTags) {
          if (currentTags.has(t)) score += 3;
        }

        // Title keyword overlap
        const pTitleWords = p.title
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .split(/\s+/)
          .filter((w) => w.length > 3);
        for (const w of pTitleWords) {
          if (titleWords.has(w)) score += 1;
        }

        return { id: p.id, title: p.title, slug: p.slug, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return scored;
  }, [currentPost, allPosts]);
}
