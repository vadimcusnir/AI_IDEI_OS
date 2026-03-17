import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { trackInternalEvent, AnalyticsEvents } from "@/lib/internalAnalytics";
import { useTranslation } from "react-i18next";

export function useNeuronClone() {
  const { t } = useTranslation("common");
  const { user } = useAuth();

  const cloneNeuron = useCallback(async (sourceNeuronId: number) => {
    if (!user) return null;

    // Get source neuron
    const { data: source, error: srcErr } = await supabase
      .from("neurons")
      .select("*")
      .eq("id", sourceNeuronId)
      .single();

    if (srcErr || !source) {
      toast.error(t("source_not_found"));
      return null;
    }

    // Create cloned neuron
    const { data: cloned, error: cloneErr } = await supabase
      .from("neurons")
      .insert({ author_id: user.id, title: `${source.title} (clone)` })
      .select()
      .single();

    if (cloneErr || !cloned) {
      toast.error(t("clone_failed"));
      return null;
    }

    // Copy blocks
    const { data: srcBlocks } = await supabase
      .from("neuron_blocks")
      .select("*")
      .eq("neuron_id", source.id)
      .order("position");

    if (srcBlocks?.length) {
      const newBlocks = srcBlocks.map(b => ({
        neuron_id: cloned.id,
        type: b.type,
        content: b.content,
        position: b.position,
        execution_mode: b.execution_mode,
        language: b.language,
        checked: b.checked,
        metadata: b.metadata,
      }));
      await supabase.from("neuron_blocks").insert(newBlocks);
    }

    // Track lineage
    await supabase.from("neuron_clones").insert({
      source_neuron_id: source.id,
      cloned_neuron_id: cloned.id,
      cloned_by: user.id,
      clone_type: "full",
    } as any);

    toast.success(t("cloned_neuron", { title: source.title, number: cloned.number }));
    trackInternalEvent({ event: AnalyticsEvents.NEURON_CLONED, params: { source_id: source.id, clone_id: cloned.id } });
    return cloned;
  }, [user]);

  const forkNeuron = useCallback(async (sourceNeuronId: number) => {
    if (!user) return null;

    const { data: source } = await supabase
      .from("neurons").select("*").eq("id", sourceNeuronId).single();
    if (!source) { toast.error(t("source_not_found")); return null; }

    const { data: forked } = await supabase
      .from("neurons")
      .insert({ author_id: user.id, title: `${source.title} (fork)` })
      .select().single();
    if (!forked) { toast.error("Failed to fork"); return null; }

    // Copy blocks
    const { data: srcBlocks } = await supabase
      .from("neuron_blocks").select("*").eq("neuron_id", source.id).order("position");
    if (srcBlocks?.length) {
      await supabase.from("neuron_blocks").insert(
        srcBlocks.map(b => ({
          neuron_id: forked.id, type: b.type, content: b.content,
          position: b.position, execution_mode: b.execution_mode,
          language: b.language, checked: b.checked, metadata: b.metadata,
        }))
      );
    }

    // Track + link
    await supabase.from("neuron_clones").insert({
      source_neuron_id: source.id, cloned_neuron_id: forked.id,
      cloned_by: user.id, clone_type: "fork",
    } as any);
    await supabase.from("neuron_links").insert({
      source_neuron_id: forked.id, target_neuron_id: source.id,
      relation_type: "derived_from",
    });

    toast.success(`Forked "${source.title}" → #${forked.number}`);
    return forked;
  }, [user]);

  return { cloneNeuron, forkNeuron };
}
