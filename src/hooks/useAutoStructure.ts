import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StructureResult {
  clusters: Array<{ name: string; theme: string; neuron_ids: number[]; depth_avg?: number }>;
  relations: number;
  depth_assignments: Array<{ neuron_id: number; depth: number }>;
  structured_count: number;
}

export function useAutoStructure() {
  const [structuring, setStructuring] = useState(false);
  const [result, setResult] = useState<StructureResult | null>(null);

  const structureNeurons = async (neuronIds?: number[]) => {
    setStructuring(true);
    setResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("structure-neurons", {
        body: neuronIds?.length ? { neuron_ids: neuronIds } : {},
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data);
      toast.success(
        `Structured ${data.structured_count} neurons into ${data.clusters?.length || 0} clusters with ${data.relations} relationships`
      );
      return data;
    } catch (err: any) {
      toast.error(err.message || "Auto-structure failed");
      return null;
    } finally {
      setStructuring(false);
    }
  };

  return { structureNeurons, structuring, result };
}
