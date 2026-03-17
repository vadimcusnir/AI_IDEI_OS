import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import i18next from "i18next";

export interface ContentContribution {
  id: string;
  title: string;
  content: string;
  contribution_type: string;
  tags: string[];
  quality_score: number;
  word_count: number;
  status: string;
  neurons_awarded: number;
  created_at: string;
  updated_at: string;
}

export function useMyContributions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-contributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_contributions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContentContribution[];
    },
    enabled: !!user,
  });
}

export function useCreateContribution() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ title, content, tags, contribution_type }: {
      title: string; content: string; tags?: string[]; contribution_type?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
      const { data, error } = await supabase
        .from("content_contributions")
        .insert({
          author_id: user.id,
          title,
          content,
          tags: tags || [],
          contribution_type: contribution_type || "text",
          word_count: wordCount,
        })
        .select()
        .single();
      if (error) throw error;

      // Trigger quality scoring
      await supabase.rpc("score_contribution", { _contribution_id: data.id });

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-contributions"] });
      toast.success("Contribution submitted for review!");
    },
    onError: (e: any) => toast.error(e.message),
  });
}
