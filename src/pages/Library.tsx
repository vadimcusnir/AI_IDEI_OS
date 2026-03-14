import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Search, Filter, Loader2, Plus, Download,
  Eye, Trash2, Tag, Clock, ArrowRight, BookOpen, Brain,
  ArrowUpDown, SortAsc, SortDesc, Lock, Globe,
} from "lucide-react";
import { VisibilityIcon } from "@/components/shared/AccessIcons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  document: { label: "Document", color: "bg-primary/10 text-primary" },
  article: { label: "Articol", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  script: { label: "Script", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  framework: { label: "Framework", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  course: { label: "Curs", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  social_post: { label: "Social", color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
  copy: { label: "Copy", color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
};

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  draft: { label: "Draft", dot: "bg-muted-foreground/40" },
  final: { label: "Final", dot: "bg-primary" },
  published: { label: "Publicat", dot: "bg-status-validated" },
};

export default function Library() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"updated_at" | "created_at" | "title">("updated_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [previewArtifact, setPreviewArtifact] = useState<Artifact | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    loadArtifacts();
  }, [user, authLoading]);

  const loadArtifacts = async () => {
    const { data } = await supabase
      .from("artifacts")
      .select("id, title, artifact_type, format, content, status, tags, service_key, created_at, updated_at")
      .eq("author_id", user!.id)
      .order("updated_at", { ascending: false });
    setArtifacts((data as Artifact[]) || []);
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

  const filtered = useMemo(() => {
    let list = artifacts.filter(a => {
      if (typeFilter !== "all" && a.artifact_type !== typeFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "title") cmp = a.title.localeCompare(b.title);
      else if (sortField === "created_at") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [artifacts, search, typeFilter, statusFilter, sortField, sortDir]);

  // Extract unique types from data
  const types = useMemo(() => {
    const set = new Set(artifacts.map(a => a.artifact_type));
    return Array.from(set);
  }, [artifacts]);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <SEOHead title="Library — AI-IDEI" description="Browse and manage your generated artifacts, documents and deliverables." />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-serif font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Biblioteca
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {artifacts.length} artefacte generate • deliverables din serviciile AI
            </p>
          </div>
        </div>

        {/* Library vs Neurons explainer */}
        <div className="rounded-xl border border-border bg-card p-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold mb-1">Bibliotecă vs. Neuroni — care e diferența?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-muted-foreground leading-relaxed">
                <div className="bg-muted/30 rounded-lg p-2.5">
                  <p className="font-semibold text-foreground mb-0.5 flex items-center gap-1">
                    <Brain className="h-3 w-3 text-primary" /> Neuroni
                  </p>
                  <p>Unități atomice de cunoaștere extrase din conținut — frameworks, idei, structuri, pattern-uri. Sursa brută a inteligenței.</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-2.5">
                  <p className="font-semibold text-foreground mb-0.5 flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-primary" /> Artefacte (Bibliotecă)
                  </p>
                  <p>Livrabile finale generate de AI: articole, scripturi, cursuri, social posts. Produsele gata de utilizat.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Caută artefacte..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Tip" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate tipurile</SelectItem>
              {types.map(t => (
                <SelectItem key={t} value={t}>
                  {TYPE_CONFIG[t]?.label || t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="final">Final</SelectItem>
              <SelectItem value="published">Publicat</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <ArrowUpDown className="h-3 w-3" /> Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {([
                { field: "updated_at" as const, label: "Ultima modificare" },
                { field: "created_at" as const, label: "Data creării" },
                { field: "title" as const, label: "Titlu" },
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
            {filtered.length} rezultate
          </span>
        </div>

        {/* Empty state */}
        {artifacts.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
            <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <h2 className="text-base font-serif font-bold mb-1">Niciun artefact încă</h2>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
              Artefactele sunt generate automat când rulezi servicii AI. Începe prin a rula un serviciu.
            </p>
            <Button size="sm" onClick={() => navigate("/services")} className="gap-2">
              Vezi Servicii <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">Niciun artefact nu corespunde filtrelor.</p>
          </div>
        ) : (
          /* Artifact grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(artifact => {
              const typeConf = TYPE_CONFIG[artifact.artifact_type] || { label: artifact.artifact_type, color: "bg-muted text-muted-foreground" };
              const statusConf = STATUS_CONFIG[artifact.status] || { label: artifact.status, dot: "bg-muted-foreground/40" };

              return (
                <div
                  key={artifact.id}
                  className="group bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => navigate(`/library/${artifact.id}`)}
                >
                  {/* Type + Status */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-[9px] font-mono uppercase px-1.5 py-0.5 rounded", typeConf.color)}>
                      {typeConf.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className={cn("h-1.5 w-1.5 rounded-full", statusConf.dot)} />
                      <span className="text-[9px] text-muted-foreground">{statusConf.label}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-medium mb-1.5 line-clamp-2">{artifact.title}</h3>

                  {/* Preview snippet */}
                  <p className="text-[11px] text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                    {artifact.content.slice(0, 150)}
                  </p>

                  {/* Tags */}
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

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {format(new Date(artifact.updated_at), "dd MMM yyyy")}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title={artifact.status === "published" ? "Fă privat" : "Publică"}
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
                <DialogTitle className="font-serif">{previewArtifact.title}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2 mb-4">
                <span className={cn(
                  "text-[9px] font-mono uppercase px-1.5 py-0.5 rounded",
                  TYPE_CONFIG[previewArtifact.artifact_type]?.color || "bg-muted text-muted-foreground"
                )}>
                  {TYPE_CONFIG[previewArtifact.artifact_type]?.label || previewArtifact.artifact_type}
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
    </div>
  );
}
