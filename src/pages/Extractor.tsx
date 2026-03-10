import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.gif";
import { Button } from "@/components/ui/button";
import {
  Upload, FileText, X, Clock,
  FileAudio, Film, Type, Globe, Loader2, Brain, Sparkles,
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
  const navigate = useNavigate();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [extractingId, setExtractingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    fetchEpisodes();
  }, [user, authLoading]);

  const fetchEpisodes = async () => {
    const { data, error } = await supabase
      .from("episodes")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setEpisodes(data as Episode[]);
    if (error) toast.error("Failed to load episodes");
    setLoading(false);
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
          body: JSON.stringify({
            episode_id: episode.id,
            user_id: user.id,
          }),
        }
      );

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);

      toast.success(`${data.neurons_created} neuroni extrași! (${data.credits_spent} credite consumate)`);
      fetchEpisodes();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Extracția a eșuat";
      toast.error(msg);
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
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setShowCreateModal(true)}>
            <Upload className="h-3.5 w-3.5" /> Episod Nou
          </Button>
        </div>

        {/* Episodes list */}
        {episodes.length === 0 ? (
          <div className="text-center py-20">
            <Upload className="h-10 w-10 opacity-20 mx-auto mb-4" />
            <h3 className="text-lg font-serif font-medium mb-2">Niciun episod încă</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Episoadele sunt materialele brute ale sistemului de cunoaștere. Încarcă conținut pentru a începe extracția.
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="gap-1.5">
              <Upload className="h-4 w-4" /> Creează Primul Episod
            </Button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {episodes.map(ep => {
              const Icon = SOURCE_ICONS[ep.source_type] || FileText;
              const isExtracting = extractingId === ep.id;
              const canExtract = (ep.status === "transcribed" || ep.status === "uploaded") && ep.transcript?.trim();
              const isAnalyzed = ep.status === "analyzed";

              return (
                <div
                  key={ep.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
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
                      onClick={() => handleExtractNeurons(ep)}
                    >
                      <Brain className="h-3 w-3" />
                      Extrage
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Episode Modal */}
      {showCreateModal && (
        <CreateEpisodeModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchEpisodes(); }}
        />
      )}
    </div>
  );
}

function CreateEpisodeModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<"text" | "audio" | "video" | "url">("text");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);

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
      onCreated();
    }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold">Episod Nou</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Conținut brut pentru extracția de cunoștințe</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Titlu</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Titlul episodului..."
              className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Tip sursă</label>
            <div className="flex gap-1.5">
              {([
                { value: "text", label: "Text", icon: Type },
                { value: "audio", label: "Audio", icon: FileAudio },
                { value: "video", label: "Video", icon: Film },
                { value: "url", label: "URL", icon: Globe },
              ] as const).map(st => (
                <button
                  key={st.value}
                  onClick={() => setSourceType(st.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    sourceType === st.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <st.icon className="h-3.5 w-3.5" />
                  {st.label}
                </button>
              ))}
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
                rows={6}
                className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors resize-none font-mono text-xs"
              />
            </div>
          )}

          {sourceType === "url" && (
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">URL</label>
              <input
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors font-mono text-xs"
              />
            </div>
          )}

          {(sourceType === "audio" || sourceType === "video") && (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <Upload className="h-8 w-8 opacity-20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Upload fișiere — în curând</p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">Folosește Text sau URL deocamdată</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">Anulează</Button>
          <Button size="sm" onClick={handleCreate} disabled={!title.trim() || creating} className="text-xs gap-1.5">
            {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            Creează Episod
          </Button>
        </div>
      </div>
    </div>
  );
}
