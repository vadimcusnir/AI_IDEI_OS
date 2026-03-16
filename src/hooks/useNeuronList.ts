import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NeuronListItem {
  id: number;
  number: number;
  title: string;
  status: string;
  updated_at: string;
  created_at: string;
  score: number;
  visibility: string;
  content_category: string | null;
  lifecycle: string | null;
  episode_id: string | null;
}

export type ViewMode = "list" | "grid" | "cards";
export type SortField = "updated_at" | "created_at" | "title" | "number" | "score";
export type SortDir = "asc" | "desc";
export type GroupBy = "none" | "status" | "date";

export function useNeuronList() {
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [neurons, setNeurons] = useState<NeuronListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortField, setSortField] = useState<SortField>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem("pinned_neurons");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NeuronListItem[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (authLoading || !user || !currentWorkspace) return;
    const fetchNeurons = async () => {
      const { data, error } = await supabase
        .from("neurons")
        .select("id, number, title, status, updated_at, created_at, score, visibility")
        .eq("workspace_id", currentWorkspace.id)
        .order("updated_at", { ascending: false });
      if (data) setNeurons(data as NeuronListItem[]);
      if (error) toast.error("Failed to load neurons");
      setLoading(false);
    };
    fetchNeurons();
  }, [user, authLoading, currentWorkspace]);

  // Persist pins
  useEffect(() => {
    localStorage.setItem("pinned_neurons", JSON.stringify([...pinnedIds]));
  }, [pinnedIds]);

  const togglePin = useCallback((id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults(null); return; }
    setSearching(true);
    const { data, error } = await supabase
      .from("neurons")
      .select("id, number, title, status, updated_at, created_at, score, visibility")
      .textSearch("title", query)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (data) setSearchResults(data as NeuronListItem[]);
    if (error) {
      const { data: fallback } = await supabase
        .from("neurons")
        .select("id, number, title, status, updated_at, created_at, score, visibility")
        .ilike("title", `%${query}%`)
        .order("updated_at", { ascending: false })
        .limit(20);
      setSearchResults((fallback || []) as NeuronListItem[]);
    }
    setSearching(false);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults(null);
  }, []);

  const handleDelete = useCallback(async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const { error } = await supabase.from("neurons").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setNeurons(prev => prev.filter(n => n.id !== id));
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    toast.success("Neuron deleted");
  }, []);

  const toggleSelect = useCallback((id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const list = searchResults ?? neurons;
    setSelectedIds(new Set(list.map(n => n.id)));
  }, [neurons, searchResults]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const bulkDelete = useCallback(async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    const { error } = await supabase.from("neurons").delete().in("id", ids);
    if (error) { toast.error("Bulk delete failed"); return; }
    setNeurons(prev => prev.filter(n => !selectedIds.has(n.id)));
    setSelectedIds(new Set());
    toast.success(`${ids.length} neuroni șterși`);
  }, [selectedIds]);

  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }, [sortField]);

  // Processed (sorted, filtered) neurons
  const baseList = searchResults ?? neurons;

  const processedNeurons = useMemo(() => {
    let list = baseList;
    if (filterStatus) list = list.filter(n => n.status === filterStatus);

    list = [...list].sort((a, b) => {
      const aPinned = pinnedIds.has(a.id) ? 1 : 0;
      const bPinned = pinnedIds.has(b.id) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;

      let cmp = 0;
      if (sortField === "title") cmp = a.title.localeCompare(b.title);
      else if (sortField === "number") cmp = a.number - b.number;
      else if (sortField === "score") cmp = a.score - b.score;
      else if (sortField === "created_at") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      return sortDir === "desc" ? -cmp : cmp;
    });

    return list;
  }, [baseList, filterStatus, sortField, sortDir, pinnedIds]);

  const groupedNeurons = useMemo(() => {
    if (groupBy === "none") return [{ label: null, items: processedNeurons }];
    if (groupBy === "status") {
      const groups: Record<string, NeuronListItem[]> = {};
      processedNeurons.forEach(n => {
        if (!groups[n.status]) groups[n.status] = [];
        groups[n.status].push(n);
      });
      return Object.entries(groups).map(([label, items]) => ({ label, items }));
    }
    if (groupBy === "date") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 86400000);
      const monthAgo = new Date(today.getTime() - 30 * 86400000);
      const groups: Record<string, NeuronListItem[]> = { "Azi": [], "Săptămâna asta": [], "Luna asta": [], "Mai vechi": [] };
      processedNeurons.forEach(n => {
        const d = new Date(n.updated_at);
        if (d >= today) groups["Azi"].push(n);
        else if (d >= weekAgo) groups["Săptămâna asta"].push(n);
        else if (d >= monthAgo) groups["Luna asta"].push(n);
        else groups["Mai vechi"].push(n);
      });
      return Object.entries(groups).filter(([, items]) => items.length > 0).map(([label, items]) => ({ label, items }));
    }
    return [{ label: null, items: processedNeurons }];
  }, [processedNeurons, groupBy]);

  const statuses = useMemo(() => [...new Set(neurons.map(n => n.status))], [neurons]);

  return {
    neurons, loading, authLoading,
    viewMode, setViewMode,
    sortField, sortDir, toggleSort,
    groupBy, setGroupBy,
    filterStatus, setFilterStatus,
    pinnedIds, togglePin,
    searchQuery, searchResults, searching, handleSearch, clearSearch,
    handleDelete,
    selectedIds, toggleSelect, selectAll, clearSelection, bulkDelete,
    processedNeurons, groupedNeurons, statuses,
    baseList,
  };
}
