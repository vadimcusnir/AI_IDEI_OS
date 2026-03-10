import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Upload, FileText, X, Clock, Trash2, Pencil,
  FileAudio, Film, Type, Globe, Loader2, Brain,
  ChevronDown, ChevronUp, Copy, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Episode {
  id: string;
  title: string;
  source_type: string;
  source_url: string | null;
  status: string;
  transcript: string | null;
  duration_seconds: number | null;
  language: string | null;
  created_at: string;
}

const SOURCE_ICONS: Record<string, React.ElementType> = {
  text: Type, audio: FileAudio, video: Film, url: Globe,
};

const STATUS_COLORS: Record<string, string> = {
  uploaded: "bg-muted text-muted-foreground",
  transcribing: "bg-primary/15 text-primary",
  transcribed: "bg-status-validated/15 text-status-validated",
  analyzing: "bg-ai-accent/15 text-ai-accent",
  analyzed: "bg-primary/15 text-primary",
  error: "bg-destructive/15 text-destructive",
};

export default function Extractor() {
  const { user, loading: authLoading } = useAuth();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Inline create form state
  const [showForm, setShowForm] = useState(true);
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<"text" | "audio" | "video" | "url">("url");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [autoTitleApplied, setAutoTitleApplied] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    fetchEpisodes();
  }, [user, authLoading]);

  // Auto-show form when no episodes
  useEffect(() => {
    if (!loading && episodes.length === 0) setShowForm(true);
  }, [loading, episodes.length]);

  // Focus URL input on form open
  useEffect(() => {
    if (showForm && sourceType === "url") setTimeout(() => urlRef.current?.focus(), 100);
    else if (showForm) setTimeout(() => titleRef.current?.focus(), 100);
  }, [showForm, sourceType]);

  const fetchEpisodes = async () => {
    const { data, error } = await supabase
      .from("episodes")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setEpisodes(data as Episode[]);
    if (error) toast.error("Failed to load episodes");
    setLoading(false);
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setSourceType("url");
    setAutoTitleApplied(false);
  };

  // Extract a readable title from URL
  const extractTitleFromUrl = (url: string): string => {
    try {
      const parsed = new URL(url);
      // YouTube
      const ytMatch = parsed.searchParams.get("v");
      if (parsed.hostname.includes("youtube") && ytMatch) {
        return `YouTube: ${ytMatch}`;
      }
      // Path-based title
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        const last = decodeURIComponent(pathParts[pathParts.length - 1])
          .replace(/[-_]/g, " ")
          .replace(/\.\w+$/, "") // remove file extension
          .replace(/\b\w/g, c => c.toUpperCase());
        if (last.length > 2) return last;
      }
      // Fallback to hostname
      return parsed.hostname.replace("www.", "");
    } catch {
      return "";
    }
  };

  const handleUrlChange = (url: string) => {
    setContent(url);
    // Auto-fill title if user hasn't manually edited it
    if (!autoTitleApplied || !title.trim()) {
      const extracted = extractTitleFromUrl(url);
      if (extracted) {
        setTitle(extracted);
        setAutoTitleApplied(true);
      }
    }
  };

  const handleCreate = async () => {
    if (!user || !title.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("episodes").insert({
      author_id: user.id,
      title: title.trim(),
      source_type: sourceType,
      transcript: sourceType === "text" ? content : null,
      source_url: sourceType === "url" ? content : null,
      status: sourceType === "text" && content ? "transcribed" : "uploaded",
    } as any);

    if (error) {
      toast.error("Nu s-a putut crea episodul");
    } else {
      toast.success("Episod creat");
      resetForm();
      if (episodes.length > 0) setShowForm(false);
      fetchEpisodes();
    }
    setCreating(false);
  };

  const handleDeleteEpisode = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("episodes").delete().eq("id", id);
    if (error) {
      toast.error("Nu s-a putut șterge episodul");
    } else {
      toast.success("Episod șters");
      setEpisodes(prev => prev.filter(e => e.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
    setDeletingId(null);
  };

  const copyTranscript = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Transcript copiat în clipboard");
  };

  const handleExtractNeurons = async (episode: Episode) => {
    if (!user || !episode.transcript?.trim()) {
      toast.error("Episodul nu are conținut transcript pentru extracție.");
      return;
    }
    setExtractingId(episode.id);
    toast.info("Se extrag neuroni din episod... (100 credite)");
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-neurons`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ episode_id: episode.id, user_id: user.id }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);
      toast.success(`${data.neurons_created} neuroni extrași! (${data.credits_spent} credite consumate)`);
      fetchEpisodes();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Extracția a eșuat");
    } finally {
      setExtractingId(null);
    }
  };

  const stats = {
    total: episodes.length,
    transcribed: episodes.filter(e => e.status === "transcribed").length,
    analyzed: episodes.filter(e => e.status === "analyzed").length,
    pending: episodes.filter(e => e.status === "uploaded").length,
  };

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">

        {/* Page title row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">Extractor</h1>
            {episodes.length > 0 && (
              <div className="flex items-center gap-3 ml-1">
                {[
                  { label: "Total", value: stats.total },
                  { label: "Transcrise", value: stats.transcribed, color: "text-status-validated" },
                  { label: "Analizate", value: stats.analyzed, color: "text-primary" },
                  { label: "În așteptare", value: stats.pending },
                ].filter(s => s.value > 0).map(s => (
                  <div key={s.label} className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">{s.label}</span>
                    <span className={cn("text-xs font-mono font-bold", s.color)}>{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {episodes.length > 0 && (
            <Button
              variant={showForm ? "secondary" : "default"}
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setShowForm(f => !f)}
            >
              {showForm ? <ChevronUp className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
              {showForm ? "Ascunde" : "Episod Nou"}
            </Button>
          )}
        </div>

        {/* Inline create form */}
        <div className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          showForm ? "max-h-[500px] opacity-100 mb-6" : "max-h-0 opacity-0 mb-0"
        )}>
          <div className="border border-border rounded-xl bg-card p-5 space-y-4">
            {episodes.length === 0 && (
              <div className="mb-2">
                <h3 className="text-base font-semibold mb-1">Adaugă primul episod</h3>
                <p className="text-xs text-muted-foreground">
                  Episoadele sunt materialele brute ale sistemului. Lipește un transcript sau un URL pentru a începe.
                </p>
              </div>
            )}

            {/* URL/Content input — shown FIRST for URL mode */}
            {sourceType === "url" && (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">URL</label>
                <input
                  ref={urlRef}
                  value={content}
                  onChange={e => handleUrlChange(e.target.value)}
                  placeholder="Lipește un URL — titlul se completează automat"
                  className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors font-mono text-xs"
                  onKeyDown={e => { if (e.key === "Enter" && title.trim()) handleCreate(); }}
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Titlu {sourceType === "url" && title && autoTitleApplied && (
                    <span className="text-primary/50 normal-case font-normal ml-1">· auto-detectat</span>
                  )}
                </label>
                <input
                  ref={titleRef}
                  value={title}
                  onChange={e => { setTitle(e.target.value); setAutoTitleApplied(false); }}
                  placeholder="Titlul episodului..."
                  className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors"
                  onKeyDown={e => {
                    if (e.key === "Enter" && sourceType !== "text") handleCreate();
                  }}
                />
              </div>
              <div className="shrink-0">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Tip sursă</label>
                <div className="flex gap-1">
                  {([
                    { value: "url", label: "URL", icon: Globe },
                    { value: "text", label: "Text", icon: Type },
                    { value: "audio", label: "Audio", icon: FileAudio },
                    { value: "video", label: "Video", icon: Film },
                  ] as const).map(st => (
                    <button
                      key={st.value}
                      onClick={() => setSourceType(st.value)}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors",
                        sourceType === st.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      <st.icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {sourceType === "text" && (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Conținut / Transcript
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Lipește transcriptul sau conținutul text..."
                  rows={5}
                  className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors resize-none font-mono text-xs"
                />
              </div>
            )}

            {(sourceType === "audio" || sourceType === "video") && (
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                <Upload className="h-6 w-6 opacity-20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Upload fișiere — în curând</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">Folosește URL sau Text deocamdată</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-muted-foreground/50">
                {sourceType === "url" && content.trim()
                  ? `URL detectat · titlu: ${title || "—"}`
                  : sourceType === "text" && content.length > 0
                    ? `${content.length.toLocaleString()} caractere · ~${Math.ceil(content.split(/\s+/).length)} cuvinte`
                    : sourceType === "url" ? "Lipește un URL pentru a începe" : "Completează câmpurile și apasă Creează"}
              </p>
              <div className="flex items-center gap-2">
                {episodes.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { resetForm(); setShowForm(false); }}>
                    Anulează
                  </Button>
                )}
                <Button size="sm" className="h-7 text-xs gap-1.5" onClick={handleCreate} disabled={!title.trim() || creating}>
                  {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  Creează Episod
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Episodes list */}
        {episodes.length > 0 && (
          <div className="space-y-1.5">
            {episodes.map(ep => {
              const Icon = SOURCE_ICONS[ep.source_type] || FileText;
              const isExtracting = extractingId === ep.id;
              const canExtract = (ep.status === "transcribed" || ep.status === "uploaded") && ep.transcript?.trim();
              const isAnalyzed = ep.status === "analyzed";
              const isExpanded = expandedId === ep.id;
              const isDeleting = deletingId === ep.id;
              const hasTranscript = !!ep.transcript?.trim();
              const wordCount = hasTranscript ? ep.transcript!.split(/\s+/).length : 0;

              return (
                <div key={ep.id} className={cn(
                  "rounded-xl border bg-card transition-colors",
                  isExpanded ? "border-primary/30" : "border-border hover:border-primary/20"
                )}>
                  {/* Row header — clickable */}
                  <button
                    className="w-full flex items-center gap-4 px-4 py-3 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : ep.id)}
                  >
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ep.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(ep.created_at).toLocaleDateString("ro-RO")}
                        </span>
                        {ep.duration_seconds && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {Math.round(ep.duration_seconds / 60)}min
                          </span>
                        )}
                        {ep.language && (
                          <span className="text-[10px] text-muted-foreground/60 uppercase">{ep.language}</span>
                        )}
                        {hasTranscript && (
                          <span className="text-[10px] text-muted-foreground/40">
                            {wordCount.toLocaleString()} cuvinte
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      "text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                      STATUS_COLORS[ep.status] || STATUS_COLORS.uploaded
                    )}>
                      {ep.status}
                    </span>

                    {canExtract && !isExtracting && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 shrink-0"
                        onClick={e => { e.stopPropagation(); handleExtractNeurons(ep); }}
                      >
                        <Brain className="h-3 w-3" /> Extrage
                      </Button>
                    )}
                    {isExtracting && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-ai-accent" />
                        <span className="text-[10px] text-ai-accent font-medium">Se extrage...</span>
                      </div>
                    )}
                    {isAnalyzed && (
                      <span className="text-[10px] text-status-validated font-medium shrink-0">✓ Extras</span>
                    )}

                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 text-muted-foreground/40 shrink-0 transition-transform",
                      isExpanded && "rotate-180"
                    )} />
                  </button>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 py-4 space-y-3">
                      {/* Metadata row */}
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                        <span>Tip: <strong className="text-foreground">{ep.source_type}</strong></span>
                        {ep.source_url && (
                          <a
                            href={ep.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-primary hover:underline"
                          >
                            <ExternalLink className="h-2.5 w-2.5" /> Sursă
                          </a>
                        )}
                        <span>Creat: {new Date(ep.created_at).toLocaleString("ro-RO")}</span>
                      </div>

                      {/* Transcript preview */}
                      {hasTranscript ? (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Transcript</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] gap-1"
                              onClick={() => copyTranscript(ep.transcript!)}
                            >
                              <Copy className="h-2.5 w-2.5" /> Copiază
                            </Button>
                          </div>
                          <div className="bg-muted/50 rounded-lg px-3 py-2.5 max-h-48 overflow-y-auto">
                            <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">
                              {ep.transcript}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-muted/30 rounded-lg px-3 py-4 text-center">
                          <p className="text-xs text-muted-foreground/60">Niciun transcript disponibil</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteEpisode(ep.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          Șterge
                        </Button>
                        <div className="flex items-center gap-1.5">
                          {canExtract && !isExtracting && (
                            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleExtractNeurons(ep)}>
                              <Brain className="h-3 w-3" /> Extrage Neuroni
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

