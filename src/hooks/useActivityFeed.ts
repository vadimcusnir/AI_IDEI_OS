import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface ActivityItem {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

/**
 * P3-008: Activity Feed
 * Fetches recent workspace activities for team awareness.
 */
export function useActivityFeed(workspaceId?: string, limit = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activity-feed", user?.id, workspaceId, limit],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async () => {
      const [neurons, artifacts, runs] = await Promise.all([
        supabase
          .from("neurons" as any)
          .select("id, title, created_at, author_id")
          .eq("author_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("artifacts")
          .select("id, title, artifact_type, created_at, author_id")
          .eq("author_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("service_run_history")
          .select("id, service_key, status, created_at, user_id")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(limit),
      ]);

      const feed: ActivityItem[] = [];

      for (const n of (neurons.data || []) as any[]) {
        feed.push({
          id: `neuron-${n.id}`,
          event_type: "neuron_created",
          description: `Created neuron: ${n.title}`,
          created_at: n.created_at,
          metadata: null,
        });
      }

      for (const a of (artifacts.data || []) as any[]) {
        feed.push({
          id: `artifact-${a.id}`,
          event_type: "artifact_created",
          description: `Generated ${a.artifact_type}: ${a.title}`,
          created_at: a.created_at,
          metadata: { type: a.artifact_type },
        });
      }

      for (const r of (runs.data || []) as any[]) {
        feed.push({
          id: `run-${r.id}`,
          event_type: "job_completed",
          description: `Service ${r.service_key} → ${r.status}`,
          created_at: r.created_at,
          metadata: { service: r.service_key, status: r.status },
        });
      }

      feed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return feed.slice(0, limit);
    },
  });
}
