import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Search, Filter, Loader2, Plus, Download,
  Eye, Trash2, Tag, Clock, ArrowRight, BookOpen, Brain,
  ArrowUpDown, SortAsc, SortDesc, Lock, Globe, FolderTree, Store,
} from "lucide-react";
import { VisibilityIcon } from "@/components/shared/AccessIcons";
import { FolderSidebar, useFolderSidebar } from "@/components/shared/FolderSidebar";
import { PublishToMarketplaceDialog } from "@/components/library/PublishToMarketplaceDialog";
import { ContributeDialog, ContributionsList } from "@/components/library/ContributeDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/motion/PageTransition";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ListPageSkeleton } from "@/components/skeletons/ListPageSkeleton";
import { ControlledSection } from "@/components/ControlledSection";
import { useTranslation } from "react-i18next";

interface Artifact {
  id: string;
  title: string;
  artifact_type: string;
  format: string;
  content: string;
  status: string;
  tags: string[];
  service_key: string | null;
  created_at: string;
  updated_at: string;
}

interface NeuronItem {
  id: number;
  title: string;
  status: string;
  lifecycle: string;
  content_category: string | null;
  created_at: string;
  updated_at: string;
  number: number;
  blockPreview?: string;
}

const TYPE_CONFIG: Record<string, { labelKey: string; color: string }> = {
  document: { labelKey: "artifacts.type_document", color: "bg-primary/10 text-primary" },
  article: { labelKey: "artifacts.type_article", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  script: { labelKey: "artifacts.type_script", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  framework: { labelKey: "artifacts.type_framework", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  course: { labelKey: "artifacts.type_course", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  social_post: { labelKey: "artifacts.type_social", color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
  copy: { labelKey: "artifacts.type_copy", color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
};

const STATUS_KEYS: Record<string, { labelKey: string; dot: string }> = {
  draft: { labelKey: "library.status_draft", dot: "bg-muted-foreground/40" },
  final: { labelKey: "library.status_final", dot: "bg-primary" },
  published: { labelKey: "library.status_published", dot: "bg-status-validated" },
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
        .order("updated_at", { ascending: false }),
      supabase
        .from("neurons")
        .select("id, title, status, lifecycle, content_category, created_at, updated_at, number, neuron_blocks(content, position)")
        .eq("workspace_id", currentWorkspace!.id)
        .order("updated_at", { ascending: false })
        .limit(200),
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
        id: n.id,
        title: n.title,
        status: n.status,
        lifecycle: n.lifecycle,
        content_category: n.content_category,
        created_at: n.created_at,
        updated_at: n.updated_at,
        number: n.number,
        blockPreview: preview,
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

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 border-b border-border">
          {([
            { key: "all" as const, label: `Toate (${neurons.length + artifacts.length})`, icon: BookOpen },
            { key: "neurons" as const, label: `Neuroni (${neurons.length})`, icon: Brain },
            { key: "artifacts" as const, label: `Artefacte (${artifacts.length})`, icon: FileText },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px",
                activeTab === tab.key
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="space-y-2 mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t("library.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
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
            <span className="text-[10px] text-muted-foreground ml-auto">
              {t("library.results_count", { count: filtered.length })}
            </span>
          </div>
        </div>

        {/* Neurons grid */}
        {(activeTab === "all" || activeTab === "neurons") && filteredNeurons.length > 0 && (
          <>
            {activeTab === "all" && (
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                <Brain className="h-3 w-3" /> Neuroni extrași ({filteredNeurons.length})
              </h3>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {filteredNeurons.map(neuron => (
                <div
                  key={neuron.id}
                  className="group bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => navigate(`/n/${neuron.number}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {neuron.content_category || "neuron"}
                      </span>
                      <Badge variant="outline" className="text-[8px]">#{neuron.number}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={cn("h-1.5 w-1.5 rounded-full", neuron.status === "published" ? "bg-status-validated" : "bg-muted-foreground/40")} />
                      <span className="text-[9px] text-muted-foreground">{neuron.status}</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium mb-1.5 line-clamp-2">{neuron.title}</h3>
                  {neuron.blockPreview && (
                    <p className="text-[11px] text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                      {neuron.blockPreview}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {format(new Date(neuron.updated_at), "dd MMM yyyy")}
                    </span>
                    <span className="text-[9px] text-muted-foreground/60">{neuron.lifecycle}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Artifacts grid */}
        {(activeTab === "all" || activeTab === "artifacts") && (
          <>
            {activeTab === "all" && artifacts.length > 0 && (
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                <FileText className="h-3 w-3" /> Artefacte generate ({filtered.length})
              </h3>
            )}
            {(activeTab === "artifacts" ? filtered.length === 0 : artifacts.length === 0) && neurons.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
            <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <h2 className="text-base font-bold mb-1">{t("library.no_artifacts")}</h2>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
              {t("library.no_artifacts_hint")}
            </p>
            <Button size="sm" onClick={() => navigate("/services")} className="gap-2">
              {t("library.view_services")} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : filtered.length === 0 && activeTab !== "all" ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">{t("library.no_filter_match")}</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(artifact => {
              const typeConf = TYPE_CONFIG[artifact.artifact_type];
              const typeLabel = typeConf ? t(typeConf.labelKey) : artifact.artifact_type;
              const typeColor = typeConf?.color || "bg-muted text-muted-foreground";
              const statusConf = STATUS_KEYS[artifact.status];
              const statusLabel = statusConf ? t(statusConf.labelKey) : artifact.status;
              const statusDot = statusConf?.dot || "bg-muted-foreground/40";

              return (
                <div
                  key={artifact.id}
                  className="group bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => navigate(`/library/${artifact.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-[9px] font-mono uppercase px-1.5 py-0.5 rounded", typeColor)}>
                        {typeLabel}
                      </span>
                      <VisibilityIcon visibility={artifact.status === "published" ? "public" : "private"} size="xs" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={cn("h-1.5 w-1.5 rounded-full", statusDot)} />
                      <span className="text-[9px] text-muted-foreground">{statusLabel}</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-medium mb-1.5 line-clamp-2">{artifact.title}</h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                    {artifact.content.slice(0, 150)}
                  </p>

                  {artifact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {artifact.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[8px] px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                      {artifact.tags.length > 3 && (
                        <span className="text-[8px] text-muted-foreground">+{artifact.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {format(new Date(artifact.updated_at), "dd MMM yyyy")}
                    </span>
                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title={t("library.publish_marketplace")}
                        onClick={(e) => { e.stopPropagation(); setPublishArtifact(artifact); }}
                      >
                        <Store className="h-3 w-3 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title={artifact.status === "published" ? t("library.make_private") : t("library.publish")}
                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(artifact.id, artifact.status); }}
                      >
                        {artifact.status === "published" ? <Globe className="h-3 w-3 text-status-validated" /> : <Lock className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => { e.stopPropagation(); navigate(`/library/${artifact.id}`); }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDelete(artifact.id); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewArtifact} onOpenChange={() => setPreviewArtifact(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          {previewArtifact && (
            <>
              <DialogHeader>
                <DialogTitle className="">{previewArtifact.title}</DialogTitle>
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
