/**
 * useProfileGenerator — Hook for generating intelligence profiles from episodes
 */
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GenerateInput {
  episode_id?: string;
  person_name: string;
  profile_type: "public_figure" | "local_figure" | "anonymized_client";
  source_type: "podcast" | "interview" | "conversation";
  source_ref?: string;
}

interface GenerateResult {
  success: boolean;
  profile_id: string;
  slug: string;
  status: string;
  signal_count: number;
  neuron_count: number;
}

export function useProfileGenerator() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);

  const generate = useCallback(async (input: GenerateInput): Promise<GenerateResult | null> => {
    setGenerating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-public-profile", {
        body: input,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const res = data as GenerateResult;
      setResult(res);
      toast.success("Profil generat cu succes!", {
        description: `${res.signal_count} semnale extrase din ${res.neuron_count} neuroni`,
      });
      return res;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Generare eșuată";
      toast.error(message);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  return { generate, generating, result };
}
