import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import i18next from "i18next";
import { trackInternalEvent, AnalyticsEvents } from "@/lib/internalAnalytics";

export interface NeuronTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  blocks_template: any[];
  default_tags: string[];
  is_public: boolean;
  author_id: string | null;
  usage_count: number;
  created_at: string;
}

export function useNeuronTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<NeuronTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("neuron_templates")
      .select("*")
      .order("usage_count", { ascending: false });

    if (data) setTemplates(data as unknown as NeuronTemplate[]);
    if (error) console.error("Failed to fetch templates:", error);
    setLoading(false);
  }, []);

  const createFromTemplate = useCallback(async (templateId: string) => {
    if (!user) return null;

    const template = templates.find(t => t.id === templateId);
    if (!template) return null;

    // Create neuron
    const { data: neuron, error: nErr } = await supabase
      .from("neurons")
      .insert({ author_id: user.id, title: template.name })
      .select()
      .single();

    if (nErr || !neuron) {
      toast.error(i18next.t("common:template_create_failed"));
      return null;
    }

    // Create blocks
    const blocks = template.blocks_template.map((b: any, i: number) => ({
      neuron_id: neuron.id,
      type: b.type || "text",
      content: b.content || "",
      position: i,
      execution_mode: b.execution_mode || "passive",
      language: b.language || null,
      checked: b.type === "todo" ? false : null,
    }));

    if (blocks.length) {
      await supabase.from("neuron_blocks").insert(blocks);
    }

    // Increment usage count
    await supabase
      .from("neuron_templates")
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq("id", templateId);
    trackInternalEvent({ event: AnalyticsEvents.TEMPLATE_USED, params: { template_id: templateId, template_name: template.name } });

    toast.success(`Created neuron from "${template.name}" template`);
    return neuron;
  }, [user, templates]);

  const saveAsTemplate = useCallback(async (
    name: string,
    description: string,
    category: string,
    blocksTemplate: any[],
    isPublic = false,
    defaultTags: string[] = []
  ) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("neuron_templates")
      .insert({
        name,
        description,
        category,
        blocks_template: blocksTemplate,
        is_public: isPublic,
        author_id: user.id,
        default_tags: defaultTags,
      } as any)
      .select()
      .single();

    if (error) {
      toast.error("Failed to save template");
      return null;
    }

    toast.success("Template saved");
    await fetchTemplates();
    return data;
  }, [user, fetchTemplates]);

  return { templates, loading, fetchTemplates, createFromTemplate, saveAsTemplate };
}
