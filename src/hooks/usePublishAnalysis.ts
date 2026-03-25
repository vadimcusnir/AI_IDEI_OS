/**
 * usePublishAnalysis — Publishes execution outputs as public SEO-indexable analysis pages.
 */
import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    + "-" + Date.now().toString(36);
}

const AGENT_TYPE_MAP: Record<string, string> = {
  narrative: "narrative",
  viral: "viral",
  pricing: "pricing",
  funnel: "funnel",
  identity: "identity",
  leverage: "leverage",
  influence: "influence",
  arbitrage: "arbitrage",
  reputation: "reputation",
  offer: "offer",
  swarm: "swarm",
};

function detectAnalysisType(title: string, content: string): string {
  const combined = (title + " " + content).toLowerCase();
  for (const [key, type] of Object.entries(AGENT_TYPE_MAP)) {
    if (combined.includes(key)) return type;
  }
  return "general";
}

export function usePublishAnalysis() {
  const { user } = useAuth();
  const [publishing, setPublishing] = useState(false);

  const publish = useCallback(async (opts: {
    title: string;
    summary?: string;
    content: string;
    tags?: string[];
    artifactId?: string;
  }): Promise<{ slug: string; url: string } | null> => {
    if (!user) {
      toast.error("Sign in to publish analyses");
      return null;
    }

    setPublishing(true);
    try {
      const slug = generateSlug(opts.title);
      const analysisType = detectAnalysisType(opts.title, opts.content);

      const { error } = await supabase.from("public_analyses").insert({
        author_id: user.id,
        slug,
        title: opts.title,
        summary: opts.summary || opts.content.slice(0, 200).replace(/[#*_]/g, "").trim(),
        content: opts.content,
        analysis_type: analysisType,
        tags: opts.tags || [],
        source_artifact_id: opts.artifactId || null,
        meta_title: `${opts.title} — AI-IDEI Analysis`,
        meta_description: (opts.summary || opts.content.slice(0, 155)).replace(/[#*_]/g, "").trim(),
      });

      if (error) throw error;

      const url = `/analysis/${slug}`;
      toast.success("Analysis published!", {
        description: "Your analysis is now publicly accessible.",
        action: { label: "View", onClick: () => window.open(url, "_blank") },
      });

      return { slug, url };
    } catch (e) {
      toast.error("Failed to publish analysis");
      console.error("Publish error:", e);
      return null;
    } finally {
      setPublishing(false);
    }
  }, [user]);

  const unpublish = useCallback(async (slug: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from("public_analyses")
      .update({ is_published: false })
      .eq("slug", slug)
      .eq("author_id", user.id);
    if (error) {
      toast.error("Failed to unpublish");
      return false;
    }
    toast.success("Analysis unpublished");
    return true;
  }, [user]);

  return { publish, unpublish, publishing };
}
