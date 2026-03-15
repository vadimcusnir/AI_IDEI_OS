import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UIControlConfig {
  visible: boolean;
  enabled: boolean;
  label: string | null;
  action: string | null;
  permissions: string[];
  state_overrides: Record<string, unknown>;
  loading: boolean;
}

const DEFAULT_CONFIG: UIControlConfig = {
  visible: true,
  enabled: true,
  label: null,
  action: null,
  permissions: [],
  state_overrides: {},
  loading: true,
};

// In-memory cache shared across hook instances
const cache = new Map<string, UIControlConfig>();
const pendingFetches = new Map<string, Promise<UIControlConfig>>();

async function fetchControl(elementId: string): Promise<UIControlConfig> {
  const { data, error } = await supabase
    .from("ui_control_registry")
    .select("visible, enabled, label, action, permissions, state_overrides")
    .eq("element_id", elementId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    // No override = default (visible + enabled)
    return { ...DEFAULT_CONFIG, loading: false };
  }

  return {
    visible: data.visible ?? true,
    enabled: data.enabled ?? true,
    label: data.label ?? null,
    action: data.action ?? null,
    permissions: (data.permissions as string[]) ?? [],
    state_overrides: (data.state_overrides as Record<string, unknown>) ?? {},
    loading: false,
  };
}

/**
 * Hook to read UI element config from ui_control_registry.
 * Falls back to visible+enabled if no entry exists.
 * Results are cached in memory per element_id.
 */
export function useUIControl(elementId: string): UIControlConfig {
  const [config, setConfig] = useState<UIControlConfig>(
    () => cache.get(elementId) ?? DEFAULT_CONFIG
  );

  useEffect(() => {
    if (cache.has(elementId)) {
      setConfig(cache.get(elementId)!);
      return;
    }

    // Deduplicate concurrent fetches for the same element
    let promise = pendingFetches.get(elementId);
    if (!promise) {
      promise = fetchControl(elementId);
      pendingFetches.set(elementId, promise);
    }

    promise.then((result) => {
      cache.set(elementId, result);
      pendingFetches.delete(elementId);
      setConfig(result);
    });
  }, [elementId]);

  return config;
}

/**
 * Bulk prefetch — call once on app mount to prime the cache.
 * Fetches ALL active UI controls in a single query.
 */
export async function prefetchUIControls(): Promise<void> {
  const { data } = await supabase
    .from("ui_control_registry")
    .select("element_id, visible, enabled, label, action, permissions, state_overrides")
    .eq("is_active", true);

  if (data) {
    for (const row of data) {
      cache.set(row.element_id, {
        visible: row.visible ?? true,
        enabled: row.enabled ?? true,
        label: row.label ?? null,
        action: row.action ?? null,
        permissions: (row.permissions as string[]) ?? [],
        state_overrides: (row.state_overrides as Record<string, unknown>) ?? {},
        loading: false,
      });
    }
  }
}

/** Clear cache — useful after admin edits */
export function clearUIControlCache(): void {
  cache.clear();
}
