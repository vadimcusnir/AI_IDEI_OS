/**
 * useRealtimeSteps — Subscribes to agent_steps changes for a given action_id
 * and updates the CommandState TaskTree in real time.
 */
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TaskStep } from "./useCommandState";

interface UseRealtimeStepsOptions {
  actionId: string | null;
  enabled: boolean;
  onStepUpdate: (toolName: string, update: Partial<TaskStep>) => void;
  onAllCompleted: () => void;
}

export function useRealtimeSteps({
  actionId,
  enabled,
  onStepUpdate,
  onAllCompleted,
}: UseRealtimeStepsOptions) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!enabled || !actionId) return;

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`steps-${actionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agent_steps",
          filter: `action_id=eq.${actionId}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (!row) return;

          const toolName = row.tool_name;
          const status = row.status as TaskStep["status"];

          onStepUpdate(toolName, {
            status,
            startedAt: row.started_at || undefined,
            completedAt: row.completed_at || undefined,
            output: row.output_data || undefined,
            error: row.error_message || undefined,
          });

          // Check if this was the last step
          if (status === "completed" || status === "failed") {
            // Small delay to allow remaining step updates to arrive
            setTimeout(() => {
              // Query to check if all steps are done
              supabase
                .from("agent_steps")
                .select("status")
                .eq("action_id", actionId)
                .then(({ data }) => {
                  if (!data) return;
                  const allDone = data.every(
                    (s: any) => s.status === "completed" || s.status === "failed" || s.status === "skipped"
                  );
                  if (allDone) onAllCompleted();
                });
            }, 500);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [actionId, enabled]);
}
