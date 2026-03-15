/**
 * Shared prompt loader — reads prompts from prompt_registry table.
 * Falls back to provided default if no DB entry exists.
 * Used by all edge functions that need AI prompts.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

interface PromptEntry {
  id: string;
  core_prompt: string;
  modifiers: Record<string, unknown> | null;
  execution_mode: string;
  cost_profile: Record<string, unknown> | null;
  version: number;
}

// In-memory cache per function invocation (edge functions are short-lived)
const promptCache = new Map<string, PromptEntry>();

/**
 * Load a prompt from the registry by ID.
 * @param promptId - The prompt_registry.id (e.g., "extract_insights")
 * @param fallbackPrompt - Default prompt if DB entry doesn't exist
 * @returns The prompt string to use
 */
export async function loadPrompt(
  promptId: string,
  fallbackPrompt: string
): Promise<{ prompt: string; version: number; executionMode: string }> {
  // Check cache first
  const cached = promptCache.get(promptId);
  if (cached) {
    return {
      prompt: applyModifiers(cached.core_prompt, cached.modifiers),
      version: cached.version,
      executionMode: cached.execution_mode,
    };
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("prompt_registry")
      .select("id, core_prompt, modifiers, execution_mode, cost_profile, version")
      .eq("id", promptId)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      console.log(`[prompt-loader] No DB entry for "${promptId}", using fallback`);
      return { prompt: fallbackPrompt, version: 0, executionMode: "balanced" };
    }

    promptCache.set(promptId, data as PromptEntry);

    return {
      prompt: applyModifiers(data.core_prompt, data.modifiers as Record<string, unknown> | null),
      version: data.version,
      executionMode: data.execution_mode,
    };
  } catch (e) {
    console.error(`[prompt-loader] Error loading prompt "${promptId}":`, e);
    return { prompt: fallbackPrompt, version: 0, executionMode: "balanced" };
  }
}

/**
 * Load multiple prompts at once (batch).
 */
export async function loadPrompts(
  promptIds: string[],
  fallbacks: Record<string, string>
): Promise<Record<string, { prompt: string; version: number; executionMode: string }>> {
  const result: Record<string, { prompt: string; version: number; executionMode: string }> = {};

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data } = await supabase
      .from("prompt_registry")
      .select("id, core_prompt, modifiers, execution_mode, cost_profile, version")
      .in("id", promptIds)
      .eq("is_active", true);

    const dbMap = new Map((data || []).map((d: any) => [d.id, d]));

    for (const id of promptIds) {
      const entry = dbMap.get(id);
      if (entry) {
        promptCache.set(id, entry as PromptEntry);
        result[id] = {
          prompt: applyModifiers(entry.core_prompt, entry.modifiers as Record<string, unknown> | null),
          version: entry.version,
          executionMode: entry.execution_mode,
        };
      } else {
        result[id] = {
          prompt: fallbacks[id] || "",
          version: 0,
          executionMode: "balanced",
        };
      }
    }
  } catch (e) {
    console.error("[prompt-loader] Batch load error:", e);
    for (const id of promptIds) {
      if (!result[id]) {
        result[id] = { prompt: fallbacks[id] || "", version: 0, executionMode: "balanced" };
      }
    }
  }

  return result;
}

/**
 * Apply modifier overrides to core prompt.
 * Modifiers can contain: { tone?, language?, max_items?, format? }
 */
function applyModifiers(
  corePrompt: string,
  modifiers: Record<string, unknown> | null
): string {
  if (!modifiers || Object.keys(modifiers).length === 0) return corePrompt;

  let prompt = corePrompt;

  if (modifiers.tone) {
    prompt += `\n\nTone: ${modifiers.tone}`;
  }
  if (modifiers.language) {
    prompt += `\nRespond in ${modifiers.language}.`;
  }
  if (modifiers.max_items) {
    prompt = prompt.replace(/\d+-\d+/g, `1-${modifiers.max_items}`);
  }
  if (modifiers.format) {
    prompt += `\nOutput format: ${modifiers.format}`;
  }
  if (modifiers.suffix && typeof modifiers.suffix === "string") {
    prompt += `\n${modifiers.suffix}`;
  }

  return prompt;
}
