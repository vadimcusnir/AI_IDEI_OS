import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface IntelPerson {
  id: string;
  name: string;
  normalized_name: string | null;
  entity_type: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  statements_count?: number;
  confidence?: number;
}

export interface PersonTrait {
  trait_id: string;
  code: string;
  name: string;
  category: string;
  polarity: string;
  score: number;
  signal_count: number;
}

export interface PersonDimension {
  dimension_id: string;
  code: string;
  name: string;
  score: number;
}

export interface PersonProfile {
  id: string;
  profile_version: string;
  summary: string | null;
  strengths: any;
  risks: any;
  communication_style: any;
  strategic_profile: any;
  confidence_score: number | null;
  created_at: string;
}

export function useIntelligenceProfiles() {
  const { user } = useAuth();
  const [persons, setPersons] = useState<IntelPerson[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPersons = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const { data } = await supabase
      .from("intel_persons")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      // Enrich with statement counts
      const enriched = await Promise.all(
        data.map(async (p) => {
          const { count } = await supabase
            .from("intel_statements")
            .select("*", { count: "exact", head: true })
            .eq("person_id", p.id);
          return {
            ...p,
            statements_count: count ?? 0,
            confidence: 1 - Math.exp(-0.02 * (count ?? 0)),
          };
        })
      );
      setPersons(enriched);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadPersons(); }, [loadPersons]);

  return { persons, loading, reload: loadPersons };
}

export function usePersonDetail(personId: string | null) {
  const [traits, setTraits] = useState<PersonTrait[]>([]);
  const [dimensions, setDimensions] = useState<PersonDimension[]>([]);
  const [profile, setProfile] = useState<PersonProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!personId) return;
    setLoading(true);

    const [traitsRes, dimsRes, profileRes] = await Promise.all([
      supabase
        .from("person_traits")
        .select("trait_id, score, signal_count")
        .eq("person_id", personId),
      supabase
        .from("person_dimension_scores")
        .select("dimension_id, score")
        .eq("person_id", personId),
      supabase
        .from("person_profiles")
        .select("*")
        .eq("person_id", personId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // Enrich traits with definitions
    if (traitsRes.data && traitsRes.data.length > 0) {
      const traitIds = traitsRes.data.map((t) => t.trait_id);
      const { data: defs } = await supabase
        .from("trait_definitions")
        .select("id, code, name, category, polarity")
        .in("id", traitIds);

      const defMap = new Map((defs || []).map((d) => [d.id, d]));
      setTraits(
        traitsRes.data
          .map((t) => {
            const def = defMap.get(t.trait_id);
            return def
              ? { ...t, code: def.code, name: def.name, category: def.category, polarity: def.polarity }
              : null;
          })
          .filter(Boolean) as PersonTrait[]
      );
    } else {
      setTraits([]);
    }

    // Enrich dimensions
    if (dimsRes.data && dimsRes.data.length > 0) {
      const dimIds = dimsRes.data.map((d) => d.dimension_id);
      const { data: dimDefs } = await supabase
        .from("personality_dimensions")
        .select("id, code, name")
        .in("id", dimIds);

      const dimMap = new Map((dimDefs || []).map((d) => [d.id, d]));
      setDimensions(
        dimsRes.data
          .map((d) => {
            const def = dimMap.get(d.dimension_id);
            return def ? { ...d, code: def.code, name: def.name } : null;
          })
          .filter(Boolean) as PersonDimension[]
      );
    } else {
      setDimensions([]);
    }

    if (profileRes.data) setProfile(profileRes.data as PersonProfile);
    else setProfile(null);

    setLoading(false);
  }, [personId]);

  useEffect(() => { load(); }, [load]);

  return { traits, dimensions, profile, loading, reload: load };
}
