import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Search, Filter, BookOpen, Brain,
  ArrowUpDown, SortAsc, SortDesc, FolderTree,
} from "lucide-react";
import { FolderSidebar, useFolderSidebar } from "@/components/shared/FolderSidebar";
import { PublishToMarketplaceDialog } from "@/components/library/PublishToMarketplaceDialog";
import { ContributeDialog } from "@/components/library/ContributeDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/motion/PageTransition";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ListPageSkeleton } from "@/components/skeletons/ListPageSkeleton";
import { useTranslation } from "react-i18next";
import { FlowTip } from "@/components/onboarding/FlowTip";
import { NeuronGrid, type NeuronItem } from "@/components/library/NeuronGrid";
import { ArtifactGrid, type Artifact } from "@/components/library/ArtifactGrid";

const TYPE_CONFIG: Record<string, { labelKey: string; color: string }> = {
  document: { labelKey: "artifacts.type_document", color: "bg-primary/10 text-primary" },
  article: { labelKey: "artifacts.type_article", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  script: { labelKey: "artifacts.type_script", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  framework: { labelKey: "artifacts.type_framework", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  course: { labelKey: "artifacts.type_course", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  social_post: { labelKey: "artifacts.type_social", color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
  copy: { labelKey: "artifacts.type_copy", color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
};

export default function Library() {
  const { t } = useTranslation("pages");
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const navigate = useNavigate();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [neurons, setNeurons] = useState<NeuronItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "neurons" | "artifacts">("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"updated_at" | "created_at" | "title">("updated_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [previewArtifact, setPreviewArtifact] = useState<Artifact | null>(null);
  const [showFolders, setShowFolders] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [publishArtifact, setPublishArtifact] = useState<Artifact | null>(null);
  const { assignments } = useFolderSidebar("library_folders");

  useEffect(() => {
    if (authLoading || wsLoading) return;
    if (!user || !currentWorkspace) { setLoading(false); return; }
    loadData();
  }, [user, authLoading, wsLoading, currentWorkspace]);

  const loadData = async () => {
    const [artifactsRes, neuronsRes] = await Promise.all([
      supabase
        .from("artifacts")
        .select("id, title, artifact_type, format, content, status, tags, service_key, created_at, updated_at")
        .eq("workspace_id", currentWorkspace!.id)
        .order("updated_at", { ascending: false })
        .limit(500),
      supabase
        .from("neurons")
        .select("id, title, status, lifecycle, content_category, created_at, updated_at, number, neuron_blocks(content, position)")
        .eq("workspace_id", currentWorkspace!.id)
        .order("updated_at", { ascending: false })
        .limit(500),
    ]);
    setArtifacts((artifactsRes.data as Artifact[]) || []);
    
    const neuronItems: NeuronItem[] = (neuronsRes.data || []).map((n: any) => {
      const blocks = Array.isArray(n.neuron_blocks) ? n.neuron_blocks : [];
      const preview = blocks
        .sort((a: any, b: any) => a.position - b.position)
        .map((b: any) => b.content)
        .filter(Boolean)
        .join(" ")
        .slice(0, 200);
      return {
        id: n.id, title: n.title, status: n.status, lifecycle: n.lifecycle,
        content_category: n.content_category, created_at: n.created_at,
        updated_at: n.updated_at, number: n.number, blockPreview: preview,
      };
    });
    setNeurons(neuronItems);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("artifacts").delete().eq("id", id);
    setArtifacts(prev => prev.filter(a => a.id !== id));
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    const { error } = await supabase.from("artifacts").update({ status: newStatus }).eq("id", id);
    if (!error) {
      setArtifacts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    }
  };

  const filteredNeurons = useMemo(() => {
    let list = neurons;
    if (search) list = list.filter(n => n.title.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== "all") list = list.filter(n => n.status === statusFilter);
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "title") cmp = a.title.localeCompare(b.title);
      else if (sortField === "created_at") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [neurons, search, statusFilter, sortField, sortDir]);

  const filtered = useMemo(() => {
    let list = artifacts.filter(a => {
      if (typeFilter !== "all" && a.artifact_type !== typeFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    if (selectedFolderId === "__unassigned") {
      const assigned = new Set(Object.keys(assignments));
      list = list.filter(a => !assigned.has(a.id));
    } else if (selectedFolderId) {
      list = list.filter(a => assignments[a.id] === selectedFolderId);
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "title") cmp = a.title.localeCompare(b.title);
      else if (sortField === "created_at") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [artifacts, search, typeFilter, statusFilter, sortField, sortDir, selectedFolderId, assignments]);

  const types = useMemo(() => {
    const set = new Set(artifacts.map(a => a.artifact_type));
    return Array.from(set);
  }, [artifacts]);

  if (authLoading || wsLoading || loading) {
    return <ListPageSkeleton columns={3} />;
  }

  return (
    <PageTransition>
    <div className="flex-1 flex overflow-hidden">
      {showFolders && (
        <FolderSidebar storageKey="library_folders" items={artifacts.map(a => ({ id: a.id, label: a.title }))}
          selectedFolderId={selectedFolderId} onSelectFolder={setSelectedFolderId} allLabel={t("library.all_artifacts")} headerLabel={t("library.folders_header")} />
      )}
      <div className="flex-1 overflow-auto">
      <SEOHead title="Library — AI-IDEI" description="Browse and manage your generated artifacts, documents and deliverables." />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant={showFolders ? "default" : "ghost"} size="sm" className="h-7 w-7 p-0" onClick={() => setShowFolders(!showFolders)}>
              <FolderTree className="h-3.5 w-3.5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> {t("library.title")}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {neurons.length} neuroni · {artifacts.length} artefacte
              </p>
            </div>
          </div>
          <ContributeDialog />
        </div>

        <FlowTip tipId="library-intro" variant="info" title="Your knowledge library"
          description="Everything you generate is saved here — neurons (knowledge units) and artifacts (deliverables like articles, strategies, posts). You can search, filter, organize into folders, and publish to the Marketplace."
          show={neurons.length === 0 && artifacts.length === 0} className="mb-4" />
        <FlowTip tipId="library-has-content" variant="tip" title="Publish to the Marketplace"
          description="Your best artifacts can be published to the Marketplace for others to discover. Click the ⋯ menu on any artifact to publish it."
          show={artifacts.length >= 3} className="mb-4" />

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 border-b border-border">
          {([
            { key: "all" as const, label: `Toate (${neurons.length + artifacts.length})`, icon: BookOpen },
            { key: "neurons" as const, label: `Neuroni (${neurons.length})`, icon: Brain },
            { key: "artifacts" as const, label: `Artefacte (${artifacts.length})`, icon: FileText },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px",
                activeTab === tab.key ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
              )}>
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="space-y-2 mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder={t("library.search_placeholder")} value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder={t("library.all_types")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("library.all_types")}</SelectItem>
                {types.map(tp => (
                  <SelectItem key={tp} value={tp}>
                    {TYPE_CONFIG[tp] ? t(TYPE_CONFIG[tp].labelKey) : tp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-auto min-w-[90px] h-8 text-xs">
                <SelectValue placeholder={t("library.all_statuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("library.all_statuses")}</SelectItem>
                <SelectItem value="draft">{t("library.status_draft")}</SelectItem>
                <SelectItem value="final">{t("library.status_final")}</SelectItem>
                <SelectItem value="published">{t("library.status_published")}</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <ArrowUpDown className="h-3 w-3" /> {t("library.sort_label")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {([
                  { field: "updated_at" as const, label: t("library.sort_updated") },
                  { field: "created_at" as const, label: t("library.sort_created") },
                  { field: "title" as const, label: t("library.sort_title") },
                ]).map(({ field, label }) => (
                  <DropdownMenuItem key={field}
                    onClick={() => {
                      if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
                      else { setSortField(field); setSortDir("desc"); }
                    }}
                    className={cn(sortField === field && "text-primary")}>
                    {label}
                    {sortField === field && (
                      sortDir === "desc" ? <SortDesc className="h-3 w-3 ml-auto" /> : <SortAsc className="h-3 w-3 ml-auto" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {t("library.results_count", { count: filtered.length })}
            </span>
          </div>
        </div>

        {/* Neurons grid */}
        {(activeTab === "all" || activeTab === "neurons") && (
          <NeuronGrid neurons={filteredNeurons} showHeader={activeTab === "all"} />
        )}

        {/* Artifacts grid */}
        {(activeTab === "all" || activeTab === "artifacts") && (
          <>
            {(activeTab === "artifacts" ? filtered.length === 0 : artifacts.length === 0) && neurons.length === 0 ? (
              <ArtifactGrid artifacts={[]} onDelete={handleDelete} onToggleStatus={handleToggleStatus} onPublish={setPublishArtifact} />
            ) : filtered.length === 0 && activeTab !== "all" ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">{t("library.no_filter_match")}</p>
              </div>
            ) : filtered.length > 0 ? (
              <ArtifactGrid
                artifacts={filtered}
                showHeader={activeTab === "all"}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onPublish={setPublishArtifact}
              />
            ) : null}
          </>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewArtifact} onOpenChange={() => setPreviewArtifact(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          {previewArtifact && (
            <>
              <DialogHeader>
                <DialogTitle>{previewArtifact.title}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2 mb-4">
                <span className={cn(
                  "text-[9px] font-mono uppercase px-1.5 py-0.5 rounded",
                  TYPE_CONFIG[previewArtifact.artifact_type]?.color || "bg-muted text-muted-foreground"
                )}>
                  {TYPE_CONFIG[previewArtifact.artifact_type] ? t(TYPE_CONFIG[previewArtifact.artifact_type].labelKey) : previewArtifact.artifact_type}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(previewArtifact.created_at), "dd MMM yyyy HH:mm")}
                </span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                {previewArtifact.content}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {publishArtifact && (
        <PublishToMarketplaceDialog
          open={!!publishArtifact}
          onOpenChange={(open) => { if (!open) setPublishArtifact(null); }}
          artifact={publishArtifact}
        />
      )}
      </div>
    </div>
    </PageTransition>
  );
}
