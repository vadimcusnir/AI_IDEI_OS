import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus, Loader2, Search, X, Upload, Sparkles, BookOpen,
  ClipboardList, Coins, BarChart3, LayoutDashboard, Download,
  Link2, List, Grid3X3, LayoutGrid, SortAsc, SortDesc,
  Pin, PinOff, Calendar, ArrowUpDown, Tag, Filter,
  ChevronDown, MoreHorizontal, Trash2, Copy, GitFork, Star,
  PanelLeftClose, PanelLeft, GripVertical
} from "lucide-react";
import logo from "@/assets/logo.gif";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { NeuronFolderSidebar, useNeuronFolders } from "@/components/neuron/NeuronFolderSidebar";
import { TemplatePicker } from "@/components/neuron/TemplatePicker";
import { ExportImportPanel } from "@/components/ExportImportPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NeuronListItem {
  id: number;
  number: number;
  title: string;
  status: string;
  updated_at: string;
  created_at: string;
  score: number;
  visibility: string;
}

type ViewMode = "list" | "grid" | "cards";
type SortField = "updated_at" | "created_at" | "title" | "number" | "score";
type SortDir = "asc" | "desc";
type GroupBy = "none" | "status" | "date";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/15 text-primary",
  published: "bg-status-validated/15 text-status-validated",
  archived: "bg-muted text-muted-foreground/60",
};

const STATUS_DOTS: Record<string, string> = {
  draft: "bg-muted-foreground/40",
  active: "bg-primary",
  published: "bg-status-validated",
  archived: "bg-muted-foreground/30",
};

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);

  // Folder state
  const { folders, assignments, importStructure } = useNeuronFolders();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showFolders, setShowFolders] = useState(true);
  const [aiSuggesting, setAiSuggesting] = useState(false);

  const handleAISuggest = useCallback(async () => {
    if (neurons.length === 0) { toast.info("Add some neurons first"); return; }
    setAiSuggesting(true);
    try {
      const titles = neurons.map(n => n.title).join(", ");
      const resp = await supabase.functions.invoke("neuron-chat", {
        body: {
          messages: [
            { role: "system", content: "You are an organization assistant. Given neuron titles, suggest a folder structure with 2-3 top-level categories and 2-3 subcategories each. Return ONLY valid JSON array like: [{\"name\":\"Category\",\"children\":[{\"name\":\"Sub\",\"children\":[]}]}]. No markdown, no explanation." },
            { role: "user", content: `Organize these neurons into folders: ${titles}` }
          ]
        }
      });
      if (resp.data) {
        const text = typeof resp.data === "string" ? resp.data : JSON.stringify(resp.data);
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const structure = JSON.parse(jsonMatch[0]);
          importStructure(structure);
          toast.success("AI folder structure created!");
        }
      }
    } catch (e) {
      toast.error("AI suggestion failed. Try creating folders manually.");
    }
    setAiSuggesting(false);
  }, [neurons, importStructure]);

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
    if (authLoading) return;
    if (!user) return;

    const fetchNeurons = async () => {
      const { data, error } = await supabase
        .from("neurons")
        .select("id, number, title, status, updated_at, created_at, score, visibility")
        .eq("author_id", user.id)
        .order("updated_at", { ascending: false });

      if (data) setNeurons(data as NeuronListItem[]);
      if (error) toast.error("Failed to load neurons");
      setLoading(false);
    };
    fetchNeurons();
  }, [user, authLoading]);

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

  const handleDelete = useCallback(async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const { error } = await supabase.from("neurons").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setNeurons(prev => prev.filter(n => n.id !== id));
    toast.success("Neuron deleted");
  }, []);

  // Filter by folder first
  const filteredByFolder = useMemo(() => {
    let list = searchResults !== null ? searchResults : neurons;
    if (selectedFolderId === "__unassigned") {
      const assigned = new Set(Object.keys(assignments).map(Number));
      list = list.filter(n => !assigned.has(n.id));
    } else if (selectedFolderId) {
      const idsInFolder = Object.entries(assignments)
        .filter(([, fId]) => fId === selectedFolderId)
        .map(([nId]) => Number(nId));
      list = list.filter(n => idsInFolder.includes(n.id));
    }
    return list;
  }, [neurons, searchResults, selectedFolderId, assignments]);

  // Sorted, filtered, grouped neurons
  const processedNeurons = useMemo(() => {
    let list = filteredByFolder;

    // Filter by status
    if (filterStatus) list = list.filter(n => n.status === filterStatus);

    // Sort
    list = [...list].sort((a, b) => {
      // Pinned always first
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
  }, [filteredByFolder, filterStatus, sortField, sortDir, pinnedIds]);

  // Group neurons
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
      const weekAgo = new Date(today.getTime() - 7 * 24 * 3600 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 3600 * 1000);

      const groups: Record<string, NeuronListItem[]> = {
        "Today": [], "This Week": [], "This Month": [], "Older": []
      };
      processedNeurons.forEach(n => {
        const d = new Date(n.updated_at);
        if (d >= today) groups["Today"].push(n);
        else if (d >= weekAgo) groups["This Week"].push(n);
        else if (d >= monthAgo) groups["This Month"].push(n);
        else groups["Older"].push(n);
      });
      return Object.entries(groups).filter(([, items]) => items.length > 0).map(([label, items]) => ({ label, items }));
    }

    return [{ label: null, items: processedNeurons }];
  }, [processedNeurons, groupBy]);

  const statuses = useMemo(() => {
    const s = new Set(neurons.map(n => n.status));
    return [...s];
  }, [neurons]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getPreview = (n: NeuronListItem) => {
    // Simple preview based on title
    return n.title === "Untitled Neuron" ? "Empty neuron — click to start editing" : "";
  };

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const renderNeuronItem = (n: NeuronListItem) => {
    const isPinned = pinnedIds.has(n.id);

    if (viewMode === "list") {
      return (
        <div
          key={n.id}
          draggable
          onDragStart={() => {
            // Store neuron id for folder drop
            (window as any).__dragNeuronId = n.id;
          }}
          onClick={() => navigate(`/n/${n.number}`)}
          className={cn(
            "group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all",
            "hover:bg-accent/50 border border-transparent hover:border-border",
            isPinned && "bg-primary/[0.03] border-primary/10"
          )}
        >
          {/* Pin indicator */}
          <button
            onClick={(e) => togglePin(n.id, e)}
            className={cn(
              "h-5 w-5 flex items-center justify-center rounded shrink-0 transition-all",
              isPinned ? "text-primary" : "text-transparent group-hover:text-muted-foreground/30 hover:!text-primary"
            )}
          >
            <Pin className="h-3 w-3" style={isPinned ? {} : { fill: "none" }} />
          </button>

          {/* Status dot */}
          <div className={cn("h-2 w-2 rounded-full shrink-0", STATUS_DOTS[n.status] || STATUS_DOTS.draft)} />

          {/* Number */}
          <span className="text-[11px] font-mono text-primary/70 w-10 shrink-0">#{n.number}</span>

          {/* Title */}
          <span className="flex-1 text-sm truncate">{n.title}</span>

          {/* Meta */}
          <span className="text-[10px] text-muted-foreground/60 shrink-0">{formatDate(n.updated_at)}</span>

          {/* Score */}
          {n.score > 0 && (
            <div className="flex items-center gap-0.5 shrink-0">
              <Star className="h-2.5 w-2.5 text-primary/40" />
              <span className="text-[9px] text-primary/40">{n.score}</span>
            </div>
          )}

          {/* Context menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <button className="h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin(n.id); }}>
                {isPinned ? <PinOff className="h-3.5 w-3.5 mr-2" /> : <Pin className="h-3.5 w-3.5 mr-2" />}
                {isPinned ? "Unpin" : "Pin to top"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/n/${n.number}`); }}>
                <BookOpen className="h-3.5 w-3.5 mr-2" />
                Open
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={(e) => handleDelete(n.id, e)}>
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    if (viewMode === "grid") {
      return (
        <div
          key={n.id}
          onClick={() => navigate(`/n/${n.number}`)}
          className={cn(
            "group relative flex flex-col p-4 rounded-xl border border-border bg-card cursor-pointer transition-all hover:shadow-md hover:border-primary/20",
            isPinned && "ring-1 ring-primary/20"
          )}
        >
          {/* Top row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className={cn("h-2 w-2 rounded-full", STATUS_DOTS[n.status] || STATUS_DOTS.draft)} />
              <span className="text-[10px] font-mono text-primary/60">#{n.number}</span>
            </div>
            <div className="flex items-center gap-1">
              {isPinned && <Pin className="h-3 w-3 text-primary/60" />}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                  <button className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                    <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin(n.id); }}>
                    {isPinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={(e) => handleDelete(n.id, e)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-medium line-clamp-2 mb-auto">{n.title}</h3>

          {/* Bottom */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
            <span className="text-[9px] text-muted-foreground/50">{formatDate(n.updated_at)}</span>
            <span className={cn("text-[8px] font-mono uppercase px-1.5 py-0.5 rounded", STATUS_COLORS[n.status] || STATUS_COLORS.draft)}>
              {n.status}
            </span>
          </div>
        </div>
      );
    }

    // Cards view (richer, like Apple Notes)
    return (
      <div
        key={n.id}
        onClick={() => navigate(`/n/${n.number}`)}
        className={cn(
          "group relative flex flex-col p-5 rounded-xl border border-border bg-card cursor-pointer transition-all hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5",
          isPinned && "ring-1 ring-primary/20 bg-primary/[0.02]"
        )}
      >
        {/* Pin badge */}
        {isPinned && (
          <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
            <Pin className="h-2.5 w-2.5 text-primary-foreground" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className={cn("h-2.5 w-2.5 rounded-full", STATUS_DOTS[n.status] || STATUS_DOTS.draft)} />
          <span className="text-[10px] font-mono text-primary/60">#{n.number}</span>
          <span className="text-[9px] text-muted-foreground/50 ml-auto">{formatDate(n.updated_at)}</span>
        </div>

        {/* Title */}
        <h3 className="text-base font-serif font-medium line-clamp-2 mb-1">{n.title}</h3>

        {/* Preview text */}
        {getPreview(n) && (
          <p className="text-[11px] text-muted-foreground/60 line-clamp-2 mb-3">{getPreview(n)}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/30">
          <span className={cn("text-[8px] font-mono uppercase px-1.5 py-0.5 rounded", STATUS_COLORS[n.status] || STATUS_COLORS.draft)}>
            {n.status}
          </span>
          {n.score > 0 && (
            <div className="flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 text-primary/30" />
              <span className="text-[9px] text-primary/40">{n.score}</span>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <button className="h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin(n.id); }}>
                {isPinned ? "Unpin" : "Pin to top"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={(e) => handleDelete(n.id, e)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-10 border-b border-border bg-card flex items-center justify-end px-4 gap-1">
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => navigate("/extractor")}>
          <Upload className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Extractor</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => navigate("/services")}>
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Services</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => navigate("/jobs")}>
          <ClipboardList className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Jobs</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => navigate("/credits")}>
          <Coins className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Credits</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => navigate("/intelligence")}>
          <BarChart3 className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Intel</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setShowExportImport(true)}>
          <Download className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setShowTemplatePicker(true)}>
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </div>

      {/* Content with sidebar */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 88px)' }}>
        {/* Folder Sidebar */}
        {showFolders && (
          <NeuronFolderSidebar
            neurons={neurons.map(n => ({ id: n.id, number: n.number, title: n.title, status: n.status }))}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onAISuggest={handleAISuggest}
            aiSuggesting={aiSuggesting}
          />
        )}

        {/* Main content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        {/* Mini Hero */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/5 via-card to-ai-accent/5 p-5 mb-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-serif font-bold mb-1">Knowledge Operating System</h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                Extrage, structurează și monetizează cunoștințele tale prin neuroni atomici și AI.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setShowTemplatePicker(true)}>
                <Plus className="h-3.5 w-3.5" />
                Creează Neuron
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => navigate("/dashboard")}>
                <BarChart3 className="h-3.5 w-3.5" />
                Stats
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => navigate("/links")}>
                <Link2 className="h-3.5 w-3.5" />
                Linktree
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => navigate("/services")}>
                <Sparkles className="h-3.5 w-3.5" />
                Services
              </Button>
            </div>
          </div>
        </div>

        {/* Title row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFolders(!showFolders)}
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title={showFolders ? "Hide folders" : "Show folders"}
            >
              {showFolders ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>
            <div>
              <h1 className="text-xl font-serif">Your Neurons</h1>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                {filteredByFolder.length} neuron{filteredByFolder.length !== 1 ? "s" : ""}
                {pinnedIds.size > 0 && ` · ${pinnedIds.size} pinned`}
                {filterStatus && ` · filtered: ${filterStatus}`}
                {selectedFolderId && selectedFolderId !== "__unassigned" && ` · in folder`}
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar: search + view controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
          {/* Search */}
          <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 focus-within:border-primary/50 transition-colors">
            {searching ? (
              <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin shrink-0" />
            ) : (
              <Search className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            )}
            <input
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search neurons..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchResults(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* View mode */}
          <div className="flex items-center gap-0.5 bg-card border border-border rounded-lg p-0.5">
            {([
              { mode: "list" as ViewMode, icon: List },
              { mode: "grid" as ViewMode, icon: Grid3X3 },
              { mode: "cards" as ViewMode, icon: LayoutGrid },
            ]).map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded transition-all",
                  viewMode === mode ? "bg-primary/10 text-primary" : "text-muted-foreground/50 hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <ArrowUpDown className="h-3 w-3" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {([
                { field: "updated_at" as SortField, label: "Last modified" },
                { field: "created_at" as SortField, label: "Date created" },
                { field: "title" as SortField, label: "Title" },
                { field: "number" as SortField, label: "Number" },
                { field: "score" as SortField, label: "Score" },
              ]).map(({ field, label }) => (
                <DropdownMenuItem
                  key={field}
                  onClick={() => {
                    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
                    else { setSortField(field); setSortDir("desc"); }
                  }}
                  className={cn(sortField === field && "text-primary")}
                >
                  {label}
                  {sortField === field && (
                    sortDir === "desc" ? <SortDesc className="h-3 w-3 ml-auto" /> : <SortAsc className="h-3 w-3 ml-auto" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Group */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Filter className="h-3 w-3" />
                Group
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {([
                { value: "none" as GroupBy, label: "No grouping" },
                { value: "status" as GroupBy, label: "By status" },
                { value: "date" as GroupBy, label: "By date" },
              ]).map(({ value, label }) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => setGroupBy(value)}
                  className={cn(groupBy === value && "text-primary")}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter by status */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={filterStatus ? "default" : "outline"} size="sm" className="h-8 gap-1.5 text-xs">
                <Tag className="h-3 w-3" />
                {filterStatus || "Status"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setFilterStatus(null)} className={cn(!filterStatus && "text-primary")}>
                All
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {statuses.map(s => (
                <DropdownMenuItem key={s} onClick={() => setFilterStatus(s)} className={cn(filterStatus === s && "text-primary")}>
                  <div className={cn("h-2 w-2 rounded-full mr-2", STATUS_DOTS[s] || STATUS_DOTS.draft)} />
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search results indicator */}
        {searchResults !== null && (
          <p className="text-[10px] text-muted-foreground mb-3">
            {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
          </p>
        )}

        {/* Neurons list */}
        {processedNeurons.length === 0 ? (
          <div className="text-center py-16">
            {searchResults !== null ? (
              <>
                <Search className="h-8 w-8 opacity-20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No neurons match your search.</p>
                <Button variant="outline" onClick={() => { setSearchQuery(""); setSearchResults(null); }} className="gap-1.5 text-xs">
                  Clear search
                </Button>
              </>
            ) : filterStatus ? (
              <>
                <Filter className="h-8 w-8 opacity-20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No "{filterStatus}" neurons found.</p>
                <Button variant="outline" onClick={() => setFilterStatus(null)} className="gap-1.5 text-xs">
                  Clear filter
                </Button>
              </>
            ) : (
              <>
                <img src={logo} className="h-10 w-10 opacity-30 mx-auto mb-3" alt="" />
                <p className="text-sm text-muted-foreground mb-4">No neurons yet. Create your first knowledge atom.</p>
                <Button onClick={() => setShowTemplatePicker(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Create Neuron
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {groupedNeurons.map((group, gi) => (
              <div key={gi}>
                {group.label && (
                  <div className="flex items-center gap-2 mb-2 mt-2">
                    <div className={cn("h-2 w-2 rounded-full", STATUS_DOTS[group.label] || "bg-muted-foreground/30")} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground/40">{group.items.length}</span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>
                )}
                <div className={cn(
                  viewMode === "list" && "space-y-0.5",
                  viewMode === "grid" && "grid grid-cols-2 sm:grid-cols-3 gap-2",
                  viewMode === "cards" && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",
                )}>
                  {group.items.map(renderNeuronItem)}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>{/* end main content */}
      </div>{/* end flex with sidebar */}

      {/* Modals */}
      <TemplatePicker isOpen={showTemplatePicker} onClose={() => setShowTemplatePicker(false)} />
      <ExportImportPanel isOpen={showExportImport} onClose={() => setShowExportImport(false)} />
    </div>
  );
}
