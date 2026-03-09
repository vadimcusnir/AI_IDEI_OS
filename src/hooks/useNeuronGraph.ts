import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NeuronLink {
  id: string;
  sourceNeuronId: number;
  targetNeuronId: number;
  relationType: string;
  targetTitle?: string;
  sourceTitle?: string;
  direction: "outgoing" | "incoming";
}

export interface NeuronVersion {
  id: string;
  version: number;
  title: string;
  createdAt: string;
  authorId: string | null;
  blocksSnapshot: any;
}

export interface GraphAddress {
  id: string;
  domain: string;
  path: string;
  depth: number;
  level1: string | null;
  level2: string | null;
  level3: string | null;
  level4: string | null;
}

export function useNeuronGraph(neuronId?: number) {
  const { user } = useAuth();
  const [links, setLinks] = useState<NeuronLink[]>([]);
  const [versions, setVersions] = useState<NeuronVersion[]>([]);
  const [addresses, setAddresses] = useState<GraphAddress[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const fetchLinks = useCallback(async () => {
    if (!neuronId) return;
    setLoadingLinks(true);
    try {
      // Fetch outgoing links
      const { data: outgoing } = await supabase
        .from("neuron_links")
        .select("id, source_neuron_id, target_neuron_id, relation_type")
        .eq("source_neuron_id", neuronId);

      // Fetch incoming links
      const { data: incoming } = await supabase
        .from("neuron_links")
        .select("id, source_neuron_id, target_neuron_id, relation_type")
        .eq("target_neuron_id", neuronId);

      const allLinks: NeuronLink[] = [];

      // Resolve titles for outgoing
      if (outgoing?.length) {
        const targetIds = outgoing.map(l => l.target_neuron_id);
        const { data: targets } = await supabase
          .from("neurons")
          .select("id, title")
          .in("id", targetIds);
        const titleMap = new Map(targets?.map(t => [t.id, t.title]) || []);

        outgoing.forEach(l => {
          allLinks.push({
            id: l.id,
            sourceNeuronId: l.source_neuron_id,
            targetNeuronId: l.target_neuron_id,
            relationType: l.relation_type,
            targetTitle: titleMap.get(l.target_neuron_id) || `Neuron #${l.target_neuron_id}`,
            direction: "outgoing",
          });
        });
      }

      // Resolve titles for incoming
      if (incoming?.length) {
        const sourceIds = incoming.map(l => l.source_neuron_id);
        const { data: sources } = await supabase
          .from("neurons")
          .select("id, title")
          .in("id", sourceIds);
        const titleMap = new Map(sources?.map(t => [t.id, t.title]) || []);

        incoming.forEach(l => {
          allLinks.push({
            id: l.id,
            sourceNeuronId: l.source_neuron_id,
            targetNeuronId: l.target_neuron_id,
            relationType: l.relation_type,
            sourceTitle: titleMap.get(l.source_neuron_id) || `Neuron #${l.source_neuron_id}`,
            direction: "incoming",
          });
        });
      }

      setLinks(allLinks);
    } catch (err) {
      console.error("Failed to fetch links:", err);
    }
    setLoadingLinks(false);
  }, [neuronId]);

  const fetchVersions = useCallback(async () => {
    if (!neuronId) return;
    setLoadingVersions(true);
    try {
      const { data } = await supabase
        .from("neuron_versions")
        .select("*")
        .eq("neuron_id", neuronId)
        .order("version", { ascending: false })
        .limit(20);

      if (data) {
        setVersions(data.map(v => ({
          id: v.id,
          version: v.version,
          title: v.title,
          createdAt: v.created_at,
          authorId: v.author_id,
          blocksSnapshot: v.blocks_snapshot,
        })));
      }
    } catch (err) {
      console.error("Failed to fetch versions:", err);
    }
    setLoadingVersions(false);
  }, [neuronId]);

  const fetchAddresses = useCallback(async () => {
    if (!neuronId) return;
    try {
      const { data } = await supabase
        .from("neuron_addresses")
        .select("*")
        .eq("neuron_id", neuronId);

      if (data) {
        setAddresses(data.map(a => ({
          id: a.id,
          domain: a.domain,
          path: a.path,
          depth: a.depth,
          level1: a.level_1,
          level2: a.level_2,
          level3: a.level_3,
          level4: a.level_4,
        })));
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    }
  }, [neuronId]);

  const addLink = useCallback(async (targetNeuronId: number, relationType: string) => {
    if (!neuronId) return;
    const { data, error } = await supabase
      .from("neuron_links")
      .insert({
        source_neuron_id: neuronId,
        target_neuron_id: targetNeuronId,
        relation_type: relationType,
      })
      .select()
      .single();

    if (!error && data) {
      await fetchLinks();
    }
    return { data, error };
  }, [neuronId, fetchLinks]);

  const removeLink = useCallback(async (linkId: string) => {
    const { error } = await supabase
      .from("neuron_links")
      .delete()
      .eq("id", linkId);

    if (!error) {
      setLinks(prev => prev.filter(l => l.id !== linkId));
    }
    return { error };
  }, []);

  const createVersion = useCallback(async (title: string, blocksSnapshot: any) => {
    if (!neuronId || !user) return;
    const nextVersion = versions.length > 0 ? versions[0].version + 1 : 1;
    const { error } = await supabase
      .from("neuron_versions")
      .insert({
        neuron_id: neuronId,
        version: nextVersion,
        title,
        blocks_snapshot: blocksSnapshot,
        author_id: user.id,
      });

    if (!error) {
      await fetchVersions();
    }
    return { error };
  }, [neuronId, user, versions, fetchVersions]);

  useEffect(() => {
    if (neuronId) {
      fetchLinks();
      fetchVersions();
      fetchAddresses();
    }
  }, [neuronId, fetchLinks, fetchVersions, fetchAddresses]);

  return {
    links,
    versions,
    addresses,
    loadingLinks,
    loadingVersions,
    fetchLinks,
    fetchVersions,
    addLink,
    removeLink,
    createVersion,
  };
}
