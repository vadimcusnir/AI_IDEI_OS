/**
 * P2-003: Query prefetching on hover/focus
 */
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useQueryPrefetch() {
  const queryClient = useQueryClient();

  const prefetchNeuron = useCallback((neuronId: number) => {
    queryClient.prefetchQuery({
      queryKey: ["neuron", neuronId],
      queryFn: async () => {
        const { data } = await supabase
          .from("neurons")
          .select("*")
          .eq("id", neuronId)
          .single();
        return data;
      },
      staleTime: 30_000,
    });
  }, [queryClient]);

  const prefetchEntity = useCallback((entityId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["entity", entityId],
      queryFn: async () => {
        const { data } = await supabase
          .from("entities")
          .select("*")
          .eq("id", entityId)
          .single();
        return data;
      },
      staleTime: 30_000,
    });
  }, [queryClient]);

  const prefetchArtifact = useCallback((artifactId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["artifact", artifactId],
      queryFn: async () => {
        const { data } = await supabase
          .from("artifacts")
          .select("*")
          .eq("id", artifactId)
          .single();
        return data;
      },
      staleTime: 30_000,
    });
  }, [queryClient]);

  /** Attach to onMouseEnter/onFocus for instant perceived load */
  const createPrefetchHandlers = useCallback(
    (type: "neuron" | "entity" | "artifact", id: string | number) => ({
      onMouseEnter: () => {
        if (type === "neuron") prefetchNeuron(Number(id));
        else if (type === "entity") prefetchEntity(String(id));
        else prefetchArtifact(String(id));
      },
      onFocus: () => {
        if (type === "neuron") prefetchNeuron(Number(id));
        else if (type === "entity") prefetchEntity(String(id));
        else prefetchArtifact(String(id));
      },
    }),
    [prefetchNeuron, prefetchEntity, prefetchArtifact]
  );

  return { prefetchNeuron, prefetchEntity, prefetchArtifact, createPrefetchHandlers };
}
