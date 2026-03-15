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

function mapRow(data: {
  visible: boolean;
  enabled: boolean;
  label: string;
  action: string | null;
  permissions: string[] | null;
  state_overrides: unknown;
}): UIControlConfig {
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

async function fetchControl(elementId: string): Promise<UIControlConfig> {
  const { data, error } = await supabase
    .from("ui_control_registry")
    .select("visible, enabled, label, action, permissions, state_overrides")
    .eq("id", elementId)
    .maybeSingle();

  if (error || !data) {
    return { ...DEFAULT_CONFIG, loading: false };
  }

  return mapRow(data);
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
 */
export async function prefetchUIControls(): Promise<void> {
  const { data } = await supabase
    .from("ui_control_registry")
    .select("id, visible, enabled, label, action, permissions, state_overrides");

  if (data) {
    for (const row of data) {
      cache.set(row.id, mapRow(row));
    }
  }
}

/** Clear cache — useful after admin edits */
export function clearUIControlCache(): void {
  cache.clear();
}
