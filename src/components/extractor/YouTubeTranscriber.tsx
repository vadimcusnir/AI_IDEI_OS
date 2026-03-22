import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { InlineTopUp } from "@/components/credits/InlineTopUp";
import {
  Youtube, Loader2, CheckCircle2, Download, FileText, Subtitles,
  FileType, Copy, Sparkles, Coins, ArrowRight, Gift, Lock,
  FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Stage = "idle" | "detecting" | "fetching" | "processing" | "ready" | "error";

interface TranscriptData {
  text: string;
  language: string;
  segments: Array<{ start: number; end: number; text: string }>;
  word_count: number;
  source: string;
  title: string;
  duration_seconds: number | null;
}

const TRANSCRIPT_COST = 50; // NEURONS per transcription after first free

export function YouTubeTranscriber() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { balance, loading: balanceLoading, refetch: refetchBalance } = useCreditBalance();
  const [url, setUrl] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [error, setError] = useState("");
  const [episodeCount, setEpisodeCount] = useState<number | null>(null);
  const [showTopUp, setShowTopUp] = useState(false);

  const isFree = episodeCount === 0;
  const canAfford = isFree || balance >= TRANSCRIPT_COST;

  // Check episode count for free tier logic
  useEffect(() => {
    if (!user) return;
    supabase
      .from("episodes")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id)
      .then(({ count }) => setEpisodeCount(count ?? 0));
  }, [user]);

  const isYouTubeUrl = useCallback((val: string): boolean => {
    return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/)[\w-]{11}/.test(val.trim());
  }, []);

  const validUrl = url.trim() && isYouTubeUrl(url);

  const handleTranscribe = async () => {
    if (!user || !currentWorkspace || !validUrl) return;

    // Credit check (skip for first free)
    if (!isFree && balance < TRANSCRIPT_COST) {
      setShowTopUp(true);
      return;
    }

    setError("");
    setTranscript(null);
    setStage("detecting");
    setProgress(10);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token || "";

      // Charge credits (skip for first free)
      if (!isFree) {
        const { data: spent } = await supabase.rpc("spend_credits", {
          _user_id: user.id,
          _amount: TRANSCRIPT_COST,
          _description: "YouTube transcript download",
        });
        if (!spent) {
          setShowTopUp(true);
          setStage("idle");
          return;
        }
      }

      setStage("fetching");
      setProgress(30);

      // Create episode
      const { data: ep, error: epErr } = await supabase.from("episodes").insert({
        author_id: user.id,
        workspace_id: currentWorkspace.id,
        title: "YouTube Transcript",
        source_type: "video",
        source_url: url.trim(),
        status: "uploaded",
        metadata: { platform: "youtube", free_transcript: isFree },
      } as any).select("*").single();

      if (epErr || !ep) throw new Error("Failed to create episode");

      setProgress(50);
      setStage("processing");

      // Call transcribe-source
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-source`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            url: url.trim(),
            episode_id: ep.id,
          }),
        }
      );

      setProgress(80);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Transcription failed");

      setProgress(100);

      // Fetch updated episode for title
      const { data: updated } = await supabase
        .from("episodes")
        .select("title, duration_seconds, language, transcript")
        .eq("id", ep.id)
        .single();

      setTranscript({
        text: data.transcript || updated?.transcript || "",
        language: data.language || updated?.language || "unknown",
        segments: data.segments || [],
        word_count: (data.transcript || updated?.transcript || "").split(/\s+/).length,
        source: data.source || "subtitles",
        title: updated?.title || "YouTube Transcript",
        duration_seconds: data.duration_seconds || updated?.duration_seconds || null,
      });

      setStage("ready");
      setEpisodeCount((prev) => (prev ?? 0) + 1);
      refetchBalance();

      toast.success(
        isFree ? "🎁 Prima transcriere gratuită!" : "Transcriere completă!",
        { duration: 4000 }
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Eroare necunoscută";
      setError(msg);
      setStage("error");
      toast.error(msg);

      // Refund if charged
      if (!isFree) {
        try {
          await supabase.rpc("add_credits", {
            _user_id: user.id,
            _amount: TRANSCRIPT_COST,
            _description: "Refund — transcript download failed",
            _type: "refund",
          });
          toast.info("Creditele au fost returnate automat.");
        } catch { /* silent */ }
        refetchBalance();
      }
    }
  };

  const reset = () => {
    setUrl("");
    setStage("idle");
    setTranscript(null);
    setError("");
    setProgress(0);
    setShowTopUp(false);
  };

  // ── Export helpers ──
  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const slug = (transcript?.title || "transcript")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);

  const exportTXT = () => {
    if (!transcript) return;
    downloadFile(`${slug}.txt`, transcript.text, "text/plain;charset=utf-8");
    toast.success("Descărcat ca TXT");
  };

  const exportSRT = () => {
    if (!transcript?.segments.length) {
      // Generate from text if no segments
      if (transcript) {
        const sentences = transcript.text.split(/(?<=[.!?])\s+/).filter(Boolean);
        let srt = "";
        let time = 0;
        sentences.forEach((s, i) => {
          const dur = Math.max(2, Math.ceil(s.split(/\s+/).length / 3));
          srt += `${i + 1}\n${fmtSrt(time)} --> ${fmtSrt(time + dur)}\n${s}\n\n`;
          time += dur;
        });
        downloadFile(`${slug}.srt`, srt, "text/plain;charset=utf-8");
        toast.success("Descărcat ca SRT");
      }
      return;
    }
    const srt = transcript.segments
      .map((s, i) => `${i + 1}\n${fmtSrt(s.start)} --> ${fmtSrt(s.end)}\n${s.text}\n`)
      .join("\n");
    downloadFile(`${slug}.srt`, srt, "text/plain;charset=utf-8");
    toast.success("Descărcat ca SRT");
  };

  const exportVTT = () => {
    if (!transcript) return;
    let vtt = "WEBVTT\n\n";
    if (transcript.segments.length) {
      vtt += transcript.segments
        .map((s) => `${fmtVtt(s.start)} --> ${fmtVtt(s.end)}\n${s.text}\n`)
        .join("\n");
    } else {
      const sentences = transcript.text.split(/(?<=[.!?])\s+/).filter(Boolean);
      let time = 0;
      sentences.forEach((s) => {
        const dur = Math.max(2, Math.ceil(s.split(/\s+/).length / 3));
        vtt += `${fmtVtt(time)} --> ${fmtVtt(time + dur)}\n${s}\n\n`;
        time += dur;
      });
    }
    downloadFile(`${slug}.vtt`, vtt, "text/vtt;charset=utf-8");
    toast.success("Descărcat ca VTT");
  };

  const copyToClipboard = async () => {
    if (!transcript) return;
    await navigator.clipboard.writeText(transcript.text);
    toast.success("Copiat în clipboard!");
  };

  const exportPDF = () => {
    if (!transcript) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${transcript.title}</title>
<style>
  @page { margin: 2cm; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; line-height: 1.8; color: #1a1a1a; max-width: 100%; }
  h1 { font-size: 20pt; margin-bottom: 4pt; color: #111; }
  .meta { font-size: 9pt; color: #666; margin-bottom: 24pt; border-bottom: 1px solid #ddd; padding-bottom: 12pt; }
  .meta span { margin-right: 16pt; }
  p { text-align: justify; margin-bottom: 12pt; }
  .footer { margin-top: 32pt; padding-top: 12pt; border-top: 1px solid #ddd; font-size: 8pt; color: #999; text-align: center; }
</style></head><body>
<h1>${transcript.title}</h1>
<div class="meta">
  <span>${transcript.word_count.toLocaleString()} cuvinte</span>
  <span>Limbă: ${transcript.language.toUpperCase()}</span>
  ${transcript.duration_seconds ? `<span>Durată: ${Math.floor(transcript.duration_seconds / 60)} min</span>` : ""}
  <span>Generat de AI-IDEI</span>
</div>
${transcript.text.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("")}
<div class="footer">Transcript generat de AI-IDEI · ai-idei.com · ${new Date().toLocaleDateString("ro-RO")}</div>
</body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => { w.print(); }, 400);
    }
    toast.success("Se deschide PDF-ul pentru descărcare");
  };

  const isRunning = ["detecting", "fetching", "processing"].includes(stage);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {stage === "ready" && transcript ? (
          /* ════════ RESULTS VIEW ════════ */
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="rounded-2xl border-2 border-primary/30 bg-card overflow-hidden"
          >
            {/* Success header */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                  className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center"
                >
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold truncate">{transcript.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{transcript.word_count.toLocaleString()} cuvinte</span>
                    <span>·</span>
                    <span className="uppercase">{transcript.language}</span>
                    {transcript.duration_seconds && (
                      <>
                        <span>·</span>
                        <span>{Math.floor(transcript.duration_seconds / 60)} min</span>
                      </>
                    )}
                    {transcript.source === "subtitles" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        ⚡ Fast Path
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Transcript preview */}
            <div className="p-5">
              <div className="bg-muted/50 rounded-xl p-4 max-h-48 overflow-y-auto text-sm leading-relaxed text-foreground/80 font-mono text-[13px]">
                {transcript.text.slice(0, 1500)}
                {transcript.text.length > 1500 && (
                  <span className="text-muted-foreground"> …({transcript.word_count - 250}+ cuvinte rămase)</span>
                )}
              </div>
            </div>

            {/* Download buttons */}
            <div className="px-5 pb-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Descarcă transcript
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  { label: "TXT", icon: FileText, onClick: exportTXT, desc: "Text simplu" },
                  { label: "SRT", icon: Subtitles, onClick: exportSRT, desc: "Subtitrări" },
                  { label: "VTT", icon: FileType, onClick: exportVTT, desc: "Web Video" },
                  { label: "PDF", icon: FileDown, onClick: exportPDF, desc: "Profesional" },
                  { label: "Copiază", icon: Copy, onClick: copyToClipboard, desc: "Clipboard" },
                ].map((fmt) => (
                  <motion.button
                    key={fmt.label}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={fmt.onClick}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-background hover:border-primary/30 hover:bg-primary/5 transition-all group"
                  >
                    <fmt.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs font-semibold group-hover:text-primary transition-colors">{fmt.label}</span>
                    <span className="text-[9px] text-muted-foreground/60">{fmt.desc}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* CTA: Extract neurons */}
            <div className="px-5 pb-5">
              <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/10">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Vrei mai mult?</p>
                    <p className="text-xs text-muted-foreground">Extrage neuroni, framework-uri și insight-uri din acest transcript.</p>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={() => { window.location.href = "/extractor"; }}
                  >
                    Extrage <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Reset */}
            <div className="px-5 pb-5 flex justify-center">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={reset}>
                Transcriere nouă
              </Button>
            </div>
          </motion.div>
        ) : (
          /* ════════ INPUT / PROGRESS VIEW ════════ */
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "rounded-2xl border-2 transition-all duration-300 overflow-hidden",
              isRunning
                ? "border-primary/40 bg-primary/5"
                : stage === "error"
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-border bg-card hover:border-primary/20"
            )}
          >
            <div className="p-4 sm:p-6">
              {/* Title */}
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Youtube className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">YouTube → Transcript</h2>
                  <p className="text-xs text-muted-foreground">Lipește un link YouTube. Obții transcrierea instant.</p>
                </div>
              </div>

              {/* Input */}
              {!isRunning && (
                <>
                  <div className="flex gap-2">
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="flex-1 bg-muted/50 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors placeholder:text-muted-foreground/40 font-mono"
                      onKeyDown={(e) => { if (e.key === "Enter" && validUrl) handleTranscribe(); }}
                      disabled={isRunning}
                    />
                    <Button
                      size="lg"
                      className="h-[46px] gap-2 rounded-xl px-6 font-semibold shrink-0"
                      onClick={handleTranscribe}
                      disabled={!validUrl || isRunning || !user}
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Transcrie</span>
                    </Button>
                  </div>

                  {/* Cost indicator */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                      {episodeCount !== null && isFree ? (
                        <span className="flex items-center gap-1 text-primary font-semibold">
                          <Gift className="h-3 w-3" />
                          Prima transcriere GRATUITĂ!
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-mono">
                          <Coins className="h-2.5 w-2.5" />
                          {TRANSCRIPT_COST} NEURONS / transcriere
                        </span>
                      )}
                      {!balanceLoading && user && !isFree && (
                        <span className={cn(
                          "font-mono",
                          balance < TRANSCRIPT_COST ? "text-destructive/70" : ""
                        )}>
                          Sold: {balance}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground/40 flex items-center gap-1">
                      <Subtitles className="h-2.5 w-2.5" /> Auto-detectare limbă
                    </span>
                  </div>

                  {/* Top-up inline */}
                  <AnimatePresence>
                    {showTopUp && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-border">
                          <InlineTopUp
                            needed={TRANSCRIPT_COST}
                            balance={balance}
                            onDismiss={() => setShowTopUp(false)}
                            compact
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error */}
                  {stage === "error" && error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-destructive mt-3"
                    >
                      {error}
                    </motion.p>
                  )}
                </>
              )}

              {/* Progress */}
              {isRunning && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm font-medium">
                      {stage === "detecting" && "Se detectează sursa…"}
                      {stage === "fetching" && "Se descarcă subtitrarile…"}
                      {stage === "processing" && "Se procesează transcrierea…"}
                    </span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                  <div className="flex justify-between mt-2">
                    {["Detectare", "Descărcare", "Procesare"].map((label, i) => {
                      const stageProgress = [10, 50, 80];
                      const active = progress >= stageProgress[i];
                      return (
                        <span key={label} className={cn(
                          "text-[9px] font-medium transition-colors",
                          active ? "text-primary" : "text-muted-foreground/40"
                        )}>
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Time format helpers ──
function fmtSrt(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function fmtVtt(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}
