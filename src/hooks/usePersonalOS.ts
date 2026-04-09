import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface IdentityDimension {
  id: string;
  dimension_key: string;
  dimension_label: string;
  extraction: {
    summary?: string;
    traits?: string[];
    strength_level?: number;
    evidence?: string[];
    recommendations?: string[];
  };
  confidence: number;
  source_neuron_ids: number[];
  updated_at: string;
}

export interface OSLayer {
  id: string;
  layer_key: string;
  layer_label: string;
  layer_data: {
    dimensions?: Array<{
      key: string;
      label: string;
      confidence: number;
      summary: string;
    }>;
  };
  completeness_pct: number;
  gap_details: Array<{
    dimension_key: string;
    gap_severity: string;
    suggestion_text: string;
  }>;
}

export interface ProfileGap {
  id: string;
  dimension_key: string;
  gap_severity: string;
  suggestion_text: string | null;
  suggested_service_slug: string | null;
  resolved: boolean;
}

export function usePersonalOS() {
  const { user } = useAuth();
  const [dimensions, setDimensions] = useState<IdentityDimension[]>([]);
  const [layers, setLayers] = useState<OSLayer[]>([]);
  const [gaps, setGaps] = useState<ProfileGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const [dimsRes, layersRes, gapsRes] = await Promise.all([
      supabase.from("identity_dimensions").select("*").eq("user_id", user.id).order("dimension_key"),
      supabase.from("personal_os_layers").select("*").eq("user_id", user.id).order("layer_key"),
      supabase.from("profile_gap_detections").select("*").eq("user_id", user.id).eq("resolved", false),
    ]);

    if (dimsRes.data) setDimensions(dimsRes.data as unknown as IdentityDimension[]);
    if (layersRes.data) setLayers(layersRes.data as unknown as OSLayer[]);
    if (gapsRes.data) setGaps(gapsRes.data as unknown as ProfileGap[]);

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const extractIdentity = useCallback(async (selectedDimensions?: string[]) => {
    if (!user) return null;
    setExtracting(true);

    try {
      const { data, error } = await supabase.functions.invoke("extract-identity", {
        body: { dimensions: selectedDimensions },
      });

      if (error) throw error;
      await load();
      return data;
    } finally {
      setExtracting(false);
    }
  }, [user, load]);

  const overallCompleteness = layers.length > 0
    ? Math.round(layers.reduce((sum, l) => sum + (l.completeness_pct || 0), 0) / layers.length)
    : 0;

  return {
    dimensions,
    layers,
    gaps,
    loading,
    extracting,
    extractIdentity,
    overallCompleteness,
    reload: load,
  };
}
