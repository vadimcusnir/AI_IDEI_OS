import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUPPORTED_LANGUAGES = ["en", "ro", "ru"] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

interface TranslationRecord {
  id: string;
  entity_id: string;
  entity_type: string;
  language: string;
  content: string;
  title: string | null;
  version: number;
  is_auto_translated: boolean;
  source_language: string | null;
  created_at: string;
  updated_at: string;
}

interface TranslateParams {
  entity_id: string;
  entity_type: "neuron" | "artifact" | "ui" | "prompt";
  source_language: SupportedLanguage;
  title?: string;
  content: string;
  target_languages?: SupportedLanguage[];
}

/**
 * Hook for auto-translating content to all supported languages.
 * Calls the auto-translate edge function and stores results in the translations table.
 */
export function useAutoTranslate() {
  const qc = useQueryClient();

  const translateMutation = useMutation({
    mutationFn: async (params: TranslateParams) => {
      const { data, error } = await supabase.functions.invoke("auto-translate", {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["translations"] });
      const translatedCount = data?.translated?.length || 0;
      if (translatedCount > 0) {
        toast.success(`Translated to ${translatedCount} language(s)`);
      }
    },
    onError: (err: Error) => {
      toast.error("Translation failed: " + err.message);
    },
  });

  return {
    translate: translateMutation.mutate,
    translateAsync: translateMutation.mutateAsync,
    isTranslating: translateMutation.isPending,
  };
}

/**
 * Hook for fetching translations for a specific entity.
 */
export function useEntityTranslations(entityId: string | undefined) {
  return useQuery({
    queryKey: ["translations", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("translations")
        .select("*")
        .eq("entity_id", entityId!)
        .order("language");
      if (error) throw error;
      return data as TranslationRecord[];
    },
    enabled: !!entityId,
  });
}

/**
 * Hook for fetching translated content in a specific language.
 */
export function useTranslatedContent(entityId: string | undefined, language: SupportedLanguage) {
  return useQuery({
    queryKey: ["translation", entityId, language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("translations")
        .select("*")
        .eq("entity_id", entityId!)
        .eq("language", language)
        .maybeSingle();
      if (error) throw error;
      return data as TranslationRecord | null;
    },
    enabled: !!entityId,
  });
}

/**
 * Hook for checking if an entity has all required translations.
 */
export function useTranslationCompleteness(entityId: string | undefined) {
  const { data: translations } = useEntityTranslations(entityId);

  const languages = (translations || []).map(t => t.language);
  const missing = SUPPORTED_LANGUAGES.filter(l => !languages.includes(l));
  const isComplete = missing.length === 0 && translations && translations.length >= 3;

  return {
    isComplete,
    missing,
    languages,
    coverage: translations ? (translations.length / 3) * 100 : 0,
  };
}

/**
 * Hook for fetching the global i18n coverage report.
 */
export function useI18nCoverage() {
  return useQuery({
    queryKey: ["i18n-coverage"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("i18n_coverage_report");
      if (error) throw error;
      return data as {
        total_entities: number;
        fully_translated: number;
        missing_translations: number;
        coverage_by_type: Array<{
          entity_type: string;
          total_entities: number;
          en_count: number;
          ro_count: number;
          ru_count: number;
        }>;
        auto_translated_pct: number;
        last_updated: string;
      };
    },
    staleTime: 60_000,
  });
}

/**
 * Guard: throws if translation is incomplete. Use in pipelines.
 */
export function assertTranslationComplete(
  translations: TranslationRecord[] | undefined,
  entityId: string
): void {
  if (!translations || translations.length < 3) {
    const existing = (translations || []).map(t => t.language);
    const missing = SUPPORTED_LANGUAGES.filter(l => !existing.includes(l));
    throw new Error(
      `I18N_BLOCK: Missing translations for entity ${entityId}. Missing: ${missing.join(", ")}`
    );
  }
}
