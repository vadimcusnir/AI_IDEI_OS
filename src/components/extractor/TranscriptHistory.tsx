import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Clock, ChevronDown, ChevronUp, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface EpisodeRow {
  id: string;
  title: string;
  source_url: string | null;
  language: string | null;
  duration_seconds: number | null;
  transcript: string | null;
  created_at: string;
  metadata: Record<string, any> | null;
}

export function TranscriptHistory() {
  const { user } = useAuth();
  const [episodes, setEpisodes] = useState<EpisodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("episodes")
      .select("id, title, source_url, language, duration_seconds, transcript, created_at, metadata")
      .eq("author_id", user.id)
      .eq("status", "transcribed")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setEpisodes((data as unknown as EpisodeRow[]) || []);
        setLoading(false);
      });
  }, [user]);

  if (loading || episodes.length === 0) return null;

  const downloadTxt = (ep: EpisodeRow) => {
    if (!ep.transcript) return;
    const slug = (ep.title || "transcript")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
    const blob = new Blob([ep.transcript], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${slug}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mt-8">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
        <Clock className="h-3.5 w-3.5" />
        Transcrieri recente
      </h3>
      <div className="space-y-2">
        {episodes.map((ep) => (
          <motion.div
            key={ep.id}
            layout
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <button
              onClick={() => setExpanded(expanded === ep.id ? null : ep.id)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
            >
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ep.title || "Untitled"}</p>
                <div className="flex items-center gap-2 text-micro text-muted-foreground mt-0.5">
                  <span>{new Date(ep.created_at).toLocaleDateString("ro-RO")}</span>
                  {ep.language && (
                    <>
                      <span>·</span>
                      <span className="uppercase flex items-center gap-0.5">
                        <Globe className="h-2.5 w-2.5" />
                        {ep.language}
                      </span>
                    </>
                  )}
                  {ep.duration_seconds && (
                    <>
                      <span>·</span>
                      <span>{Math.floor(ep.duration_seconds / 60)} min</span>
                    </>
                  )}
                  {ep.transcript && (
                    <>
                      <span>·</span>
                      <span>{ep.transcript.split(/\s+/).length.toLocaleString()} cuv.</span>
                    </>
                  )}
                </div>
              </div>
              {expanded === ep.id ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </button>

            <AnimatePresence>
              {expanded === ep.id && ep.transcript && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3">
                    <div className="bg-muted/40 rounded-lg p-3 max-h-32 overflow-y-auto text-xs text-foreground/70 font-mono leading-relaxed">
                      {ep.transcript.slice(0, 800)}
                      {ep.transcript.length > 800 && <span className="text-muted-foreground"> …</span>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-dense gap-1.5"
                        onClick={() => downloadTxt(ep)}
                      >
                        <Download className="h-3 w-3" /> TXT
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-dense gap-1.5"
                        onClick={async () => {
                          await navigator.clipboard.writeText(ep.transcript || "");
                        }}
                      >
                        Copiază
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
