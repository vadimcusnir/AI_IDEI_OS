import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText, X, Clock, Trash2, Pencil,
  FileAudio, Film, Type, Globe, Loader2, Brain,
  ChevronDown, Copy, ExternalLink,
  Layers, Users, Save, Download, FileUp, Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { TranscriptViewer } from "@/components/extractor/TranscriptViewer";
import { InstantActionSurface } from "@/components/extractor/InstantActionSurface";
import { ControlledSection } from "@/components/ControlledSection";
import { useUserTier } from "@/hooks/useUserTier";
import { PremiumPaywall } from "@/components/premium/PremiumPaywall";

async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    pages.push(tc.items.map((it: any) => it.str).join(" "));
  }
  return pages.join("\n\n");
}

interface Episode {
  id: string;
  title: string;
  source_type: string;
  source_url: string | null;
  file_path: string | null;
  status: string;
  transcript: string | null;
  duration_seconds: number | null;
  language: string | null;
  created_at: string;
  metadata: any;
}

const SOURCE_ICONS: Record<string, React.ElementType> = {
  text: Type, audio: FileAudio, video: Film, url: Globe,
};

const STATUS_COLORS: Record<string, string> = {
  uploaded: "bg-muted text-muted-foreground",
  transcribing: "bg-primary/15 text-primary",
  transcribed: "bg-status-validated/15 text-status-validated",
  chunked: "bg-accent/15 text-accent-foreground",
  analyzing: "bg-ai-accent/15 text-ai-accent",
  analyzed: "bg-primary/15 text-primary",
  error: "bg-destructive/15 text-destructive",
};

const STATUS_LABELS: Record<string, string> = {
  uploaded: "Uploaded",
  transcribing: "Transcribing…",
  transcribed: "Transcribed",
  chunked: "Chunked",
  analyzing: "Analyzing…",
  analyzed: "Analyzed",
  error: "Error",
};

const ACCEPTED_FILE_TYPES: Record<string, string> = {
  audio: ".mp3,.wav,.m4a,.ogg,.webm,.flac,.mp4",
  video: ".mp4,.webm,.mov,.avi",
};

const ACCEPTED_TRANSCRIPT_FILES = ".txt,.srt,.vtt,.md,.pdf";

export default function Extractor() {
  const { t } = useTranslation("pages");
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const { tier } = useUserTier();
  const isPro = tier === "pro" || tier === "vip";
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [extractionProgress, setExtractionProgress] = useState<{ chunks: number; neurons: number } | null>(null);
  const [chunkPreview, setChunkPreview] = useState<{ episodeId: string; chunks: any[] } | null>(null);
  const [chunkingId, setChunkingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [editingTranscriptId, setEditingTranscriptId] = useState<string | null>(null);
  const [editTranscriptText, setEditTranscriptText] = useState("");
  const [savingTranscript, setSavingTranscript] = useState(false);
  const [deepExtractingId, setDeepExtractingId] = useState<string | null>(null);
  const [detectingGuests, setDetectingGuests] = useState<string | null>(null);
  const transcriptFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading || wsLoading) return;
    if (!user || !currentWorkspace) {
      setLoading(false);
      return;
    }
    fetchEpisodes();
  }, [user, authLoading, wsLoading, currentWorkspace]);

  const fetchEpisodes = async () => {
    const { data, error } = await supabase
      .from("episodes")
      .select("*")
      .eq("workspace_id", currentWorkspace!.id)
      .order("created_at", { ascending: false });
    if (data) setEpisodes(data as Episode[]);
    if (error) toast.error(t("errors:generic"));
    setLoading(false);
  };

  const parseSrtToText = (srt: string): string => {
    return srt
      .split(/\n\n+/)
      .map(block => {
        const lines = block.trim().split("\n");
        return lines.filter(line =>
          !line.match(/^\d+$/) &&
          !line.match(/^\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->/) &&
          !line.match(/^WEBVTT/)
        ).join(" ");
      })
      .filter(Boolean)
      .join("\n");
  };

  // === Trigger transcription via edge function ===
  const triggerTranscription = async (episodeId: string, filePath: string) => {
    setTranscribingId(episodeId);
    try {
      const session = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ episode_id: episodeId, file_path: filePath }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);
      toast.success(t("common:transcription_complete", { count: data.word_count }));
      fetchEpisodes();
    } catch (e: any) {
      toast.error(e.message || t("errors:generic"));
    }
    setTranscribingId(null);
  };

  // === Delete episode ===
  const handleDeleteEpisode = async (id: string) => {
    setDeletingId(id);
    const ep = episodes.find(e => e.id === id);
    if (ep?.file_path) {
      await supabase.storage.from("episode-files").remove([ep.file_path]);
    }
    const { error } = await supabase.from("episodes").delete().eq("id", id);
    if (error) {
      toast.error(t("common:failed_to_delete"));
    } else {
      toast.success(t("common:deleted"));
      setEpisodes(prev => prev.filter(e => e.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
    setDeletingId(null);
  };

  // === Save transcript ===
  const handleSaveTranscript = async (episodeId: string) => {
    if (!editTranscriptText.trim()) { toast.error(t("common:transcript_empty")); return; }
    setSavingTranscript(true);
    const { error } = await supabase.from("episodes").update({
      transcript: editTranscriptText.trim(),
      status: "transcribed",
    } as any).eq("id", episodeId);
    if (error) {
      toast.error(t("errors:save_failed", { message: error.message }));
    } else {
      toast.success(t("common:transcript_saved"));
      setEditingTranscriptId(null);
      setEditTranscriptText("");
      fetchEpisodes();
    }
    setSavingTranscript(false);
  };

  const startEditTranscript = (ep: Episode) => {
    setEditingTranscriptId(ep.id);
    setEditTranscriptText(ep.transcript || "");
  };

  // === Export transcript ===
  const exportTranscript = (ep: Episode, format: "txt" | "srt") => {
    if (!ep.transcript) return;
    let content = ep.transcript;
    let filename = `${ep.title.replace(/[^a-zA-Z0-9]/g, "_")}`;

    if (format === "srt") {
      content = textToSrt(ep.transcript);
      filename += ".srt";
    } else {
      filename += ".txt";
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  const textToSrt = (text: string): string => {
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    let srt = "";
    let time = 0;
    sentences.forEach((sentence, i) => {
      const duration = Math.max(2, Math.ceil(sentence.split(/\s+/).length / 3));
      const start = formatSrtTime(time);
      time += duration;
      const end = formatSrtTime(time);
      srt += `${i + 1}\n${start} --> ${end}\n${sentence}\n\n`;
    });
    return srt;
  };

  const formatSrtTime = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},000`;
  };

  // === Chunk preview ===
  const handleChunkPreview = async (episode: Episode) => {
    if (!user || !episode.transcript?.trim()) return;
    setChunkingId(episode.id);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chunk-transcript`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ episode_id: episode.id }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);
      setChunkPreview({ episodeId: episode.id, chunks: data.chunks });
      toast.success(`${data.total_chunks} segments generated (${data.total_tokens} tokens)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("errors:generic"));
    } finally {
      setChunkingId(null);
    }
  };

  // === Extract neurons ===
  const handleExtractNeurons = async (episode: Episode) => {
    if (!user || !episode.transcript?.trim()) {
      toast.error(t("common:no_transcript"));
      return;
    }
    setExtractingId(episode.id);
    setExtractionProgress({ chunks: 0, neurons: 0 });
    toast.info(t("common:extracting_neurons"));
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-neurons`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ episode_id: episode.id }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);
      setExtractionProgress({ chunks: data.chunks_processed || 0, neurons: data.neurons_created });
      toast.success(
        t("common:neurons_extracted_result", { neurons: data.neurons_created, chunks: data.chunks_processed || 1, credits: data.credits_spent }),
        { duration: 8000 }
      );
      trackEvent({ name: "neurons_extracted", params: { episode_id: episode.id, neurons_count: data.neurons_created, credits_spent: data.credits_spent } });
      setChunkPreview(null);
      fetchEpisodes();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("errors:generic"));
    } finally {
      setTimeout(() => { setExtractingId(null); setExtractionProgress(null); }, 2000);
    }
  };

  // === Deep Extract ===
  const handleDeepExtract = async (episode: Episode) => {
    if (!user || !episode.transcript?.trim()) {
      toast.error(t("common:no_transcript"));
      return;
    }
    setDeepExtractingId(episode.id);
    toast.info(t("common:deep_extract_running"));
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deep-extract`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ episode_id: episode.id }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);
      toast.success(
        t("common:deep_extract_result", { neurons: data.total_neurons, levels: data.levels_processed, credits: data.credits_spent }),
        { duration: 10000 }
      );
      trackEvent({ name: "neurons_extracted", params: { episode_id: episode.id, neurons_count: data.total_neurons, credits_spent: data.credits_spent } });
      fetchEpisodes();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("errors:generic"));
    } finally {
      setDeepExtractingId(null);
    }
  };

  // === Detect guests ===
  const handleDetectGuests = async (episode: Episode) => {
    if (!user || !episode.transcript?.trim()) { toast.error(t("common:no_transcript")); return; }
    setDetectingGuests(episode.id);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-guests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ episode_id: episode.id }),
        }
      );
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || "Failed");
      toast.success(
        t("common:guests_detected", { count: result.guests_processed }),
        { duration: 8000 }
      );
    } catch (e: any) {
      toast.error(e.message || t("errors:generic"));
    }
    setDetectingGuests(null);
  };

  // === Import transcript file into episode ===
  const handleTranscriptFileImport = async (e: React.ChangeEvent<HTMLInputElement>, episodeId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let transcript: string;
      if (file.name.endsWith(".pdf")) {
        transcript = await extractTextFromPDF(file);
      } else {
        const text = await file.text();
        transcript = text;
        if (file.name.endsWith(".srt") || file.name.endsWith(".vtt")) {
          transcript = parseSrtToText(text);
        }
      }
      setEditTranscriptText(transcript);
      setEditingTranscriptId(episodeId);
      toast.success(t("common:file_imported", { name: file.name }));
    } catch {
      toast.error(t("errors:generic"));
    }
    e.target.value = "";
  };

  const copyTranscript = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const stats = {
    total: episodes.length,
    transcribed: episodes.filter(e => e.status === "transcribed").length,
    analyzed: episodes.filter(e => e.status === "analyzed").length,
  };

  if (authLoading || wsLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
    <PageTransition>
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
        <SEOHead title="Extractor — AI-IDEI" description="Upload content, transcribe audio/video, and extract knowledge neurons using AI." />

        {/* Page header */}
        <div className="mb-5">
          <h1 className="text-lg font-semibold tracking-tight">{t("extractor.title")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("extractor.subtitle")}
          </p>
        </div>

        {/* Instant Action Surface — single trigger pipeline */}
        <div className="mb-6">
          <InstantActionSurface onComplete={fetchEpisodes} compact />
        </div>

        {/* Episode stats */}
        {episodes.length > 0 && (
          <p className="text-[10px] text-muted-foreground/60 mb-4">
            {stats.total} episodes · {stats.transcribed} transcribed · {stats.analyzed} analyzed
          </p>
        )}

        {/* Episodes list */}
        {episodes.length === 0 && (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl animate-fade-in">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-7 w-7 text-primary/40" />
            </div>
            <h3 className="text-base font-serif font-semibold mb-1.5">{t("extractor.no_episodes")}</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-1">
              {t("extractor.no_episodes_hint")}
            </p>
            <p className="text-xs text-muted-foreground/50">{t("extractor.supported_formats")}</p>
          </div>
        )}
        {episodes.length > 0 && (
          <div className="space-y-1.5">
            {episodes.map(ep => {
              const Icon = SOURCE_ICONS[ep.source_type] || FileText;
              const isExtracting = extractingId === ep.id;
              const isTranscribing = transcribingId === ep.id || ep.status === "transcribing";
              const hasTranscript = !!ep.transcript?.trim();
              const canExtract = (ep.status === "transcribed" || ep.status === "uploaded") && hasTranscript;
              const isAnalyzed = ep.status === "analyzed";
              const isExpanded = expandedId === ep.id;
              const isDeleting = deletingId === ep.id;
              const wordCount = hasTranscript ? ep.transcript!.split(/\s+/).length : 0;
              const needsTranscript = !hasTranscript && !isTranscribing;
              const isEditingTranscript = editingTranscriptId === ep.id;

              return (
                <div key={ep.id} className={cn(
                  "rounded-xl border bg-card transition-colors",
                  isExpanded ? "border-primary/30" : "border-border hover:border-primary/20"
                )}>
                  {/* Row header */}
                  <div
                    role="button"
                    tabIndex={0}
                    className="w-full flex items-center gap-4 px-4 py-3 text-left cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : ep.id)}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setExpandedId(isExpanded ? null : ep.id); }}
                  >
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ep.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(ep.created_at).toLocaleDateString("en-US")}
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
                            {wordCount.toLocaleString()} words
                          </span>
                        )}
                        {needsTranscript && (
                          <span className="text-[10px] text-amber-500 font-medium">
                            ⚠ no transcript
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      "text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                      STATUS_COLORS[ep.status] || STATUS_COLORS.uploaded
                    )}>
                      {STATUS_LABELS[ep.status] || ep.status}
                    </span>

                    {isTranscribing && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        <span className="text-[10px] text-primary font-medium">Transcribing…</span>
                      </div>
                    )}
                    {/* Quick action buttons in header */}
                    {hasTranscript && !isExtracting && !isTranscribing && (
                      <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                              onClick={() => startEditTranscript(ep)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit transcript</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                              onClick={() => copyTranscript(ep.transcript!)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy transcript</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                              onClick={() => exportTranscript(ep, "txt")}>
                              <Download className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download TXT</TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                    {canExtract && !isExtracting && !isTranscribing && !deepExtractingId && (
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                              onClick={() => handleExtractNeurons(ep)}>
                              <Brain className="h-3 w-3" /> Extract
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[220px] text-center">
                            Quick extraction — atomic neurons (100 credits)
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="default" size="sm" className="h-7 text-xs gap-1"
                              onClick={() => isPro ? handleDeepExtract(ep) : setPaywallOpen(true)}>
                              {!isPro && <Crown className="h-3 w-3" />}
                              <Layers className="h-3 w-3" /> Deep Extract
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[260px] text-center">
                            {isPro ? "Multi-level extraction: atomic, entities, frameworks, psychological, narrative, commercial, patterns, synthesis (~500 credits)" : "Pro feature — upgrade to unlock Deep Extract"}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                    {needsTranscript && !isExtracting && !isTranscribing && (
                      <Button variant="outline" size="sm"
                        className="h-7 text-xs gap-1 shrink-0 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                        onClick={e => { e.stopPropagation(); setExpandedId(ep.id); startEditTranscript(ep); }}>
                        <Pencil className="h-3 w-3" /> Add Transcript
                      </Button>
                    )}
                    {isExtracting && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-ai-accent" />
                        <span className="text-[10px] text-ai-accent font-medium">Extracting…</span>
                      </div>
                    )}
                    {deepExtractingId === ep.id && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        <span className="text-[10px] text-primary font-medium">Deep Extract (8 levels)…</span>
                      </div>
                    )}
                    {isAnalyzed && (
                      <span className="text-[10px] text-status-validated font-medium shrink-0">✓ Extracted</span>
                    )}
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 text-muted-foreground/40 shrink-0 transition-transform",
                      isExpanded && "rotate-180"
                    )} />
                  </div>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 py-4 space-y-3">
                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
                        <span>Type: <strong className="text-foreground">{ep.source_type}</strong></span>
                        {ep.source_url && (
                          <a href={ep.source_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-primary hover:underline">
                            <ExternalLink className="h-2.5 w-2.5" /> Source
                          </a>
                        )}
                        <span>Created: {new Date(ep.created_at).toLocaleString("en-US")}</span>
                        {ep.metadata?.deep_extract && (
                          <span className="text-primary font-medium">
                            🧠 Deep: {ep.metadata.deep_extract.total_neurons} neurons / {ep.metadata.deep_extract.levels_run?.length || 0} levels
                          </span>
                        )}
                        {ep.metadata?.neurons_extracted && !ep.metadata?.deep_extract && (
                          <span className="text-status-validated font-medium">
                            ⚡ {ep.metadata.neurons_extracted} neurons extracted
                          </span>
                        )}
                      </div>

                      {/* Deep Extract Results */}
                      {ep.metadata?.deep_extract?.results && (
                        <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
                          <p className="text-xs font-semibold flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-primary" />
                            Deep Extract Results
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {(ep.metadata.deep_extract.results as Array<{level: string; neurons_created: number; avg_score: number}>).map((r: any) => (
                              <div key={r.level} className="bg-background rounded-md px-2 py-1.5 border border-border">
                                <p className="text-[9px] font-mono text-muted-foreground uppercase">{r.level.replace("L", "L").replace("_", " ")}</p>
                                <p className="text-xs font-bold">{r.neurons_created} <span className="text-muted-foreground font-normal">neurons</span></p>
                                {r.avg_score > 0 && (
                                  <p className={cn("text-[9px] font-mono", r.avg_score > 70 ? "text-primary" : r.avg_score >= 40 ? "text-status-validated" : "text-muted-foreground")}>
                                    score: {r.avg_score}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upload audio for transcription (for episodes without transcript) */}
                      {needsTranscript && !isEditingTranscript && (
                        <div className="bg-muted/30 border border-border rounded-lg px-4 py-3 space-y-2">
                          <p className="text-xs font-medium">Transcribe from audio file</p>
                          <p className="text-[10px] text-muted-foreground">Upload an audio or video file and it will be transcribed automatically.</p>
                          <input
                            type="file"
                            accept={`${ACCEPTED_FILE_TYPES.audio},${ACCEPTED_FILE_TYPES.video}`}
                            className="hidden"
                            id={`upload-audio-${ep.id}`}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file || !user) return;
                              setTranscribingId(ep.id);
                              try {
                                const ext = file.name.split(".").pop() || "mp3";
                                const storagePath = `${user.id}/${Date.now()}.${ext}`;
                                const { error: uploadErr } = await supabase.storage.from("episode-files").upload(storagePath, file);
                                if (uploadErr) throw new Error(uploadErr.message);
                                await supabase.from("episodes").update({ file_path: storagePath } as any).eq("id", ep.id);
                                await triggerTranscription(ep.id, storagePath);
                              } catch (err: any) {
                                toast.error(err.message || "Upload failed");
                                setTranscribingId(null);
                              }
                              e.target.value = "";
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                              onClick={() => document.getElementById(`upload-audio-${ep.id}`)?.click()}
                              disabled={isTranscribing}>
                              {isTranscribing ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileAudio className="h-3 w-3" />}
                              Upload Audio/Video
                            </Button>
                            <span className="text-[10px] text-muted-foreground">or</span>
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                              onClick={() => startEditTranscript(ep)}>
                              <Pencil className="h-3 w-3" /> Paste Transcript
                            </Button>
                            <input
                              type="file"
                              accept={ACCEPTED_TRANSCRIPT_FILES}
                              className="hidden"
                              ref={transcriptFileRef}
                              onChange={e => handleTranscriptFileImport(e, ep.id)}
                            />
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                              onClick={() => transcriptFileRef.current?.click()}>
                              <FileUp className="h-3 w-3" /> Import File
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Transcript editing */}
                      {isEditingTranscript ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {hasTranscript ? "Edit Transcript" : "Add Transcript"}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <label className="cursor-pointer">
                                <input type="file" accept={ACCEPTED_TRANSCRIPT_FILES} className="hidden"
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) file.text().then(text => {
                                      let parsed = text;
                                      if (file.name.endsWith(".srt") || file.name.endsWith(".vtt")) parsed = parseSrtToText(text);
                                      setEditTranscriptText(parsed);
                                    });
                                    e.target.value = "";
                                  }}
                                />
                                <span className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline cursor-pointer">
                                  <FileUp className="h-2.5 w-2.5" /> Import
                                </span>
                              </label>
                              <Button variant="ghost" size="sm" className="h-6 text-[10px]"
                                onClick={() => { setEditingTranscriptId(null); setEditTranscriptText(""); }}>
                                Cancel
                              </Button>
                              <Button size="sm" className="h-6 text-[10px] gap-1"
                                onClick={() => handleSaveTranscript(ep.id)}
                                disabled={savingTranscript || !editTranscriptText.trim()}>
                                {savingTranscript ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Save className="h-2.5 w-2.5" />}
                                Save
                              </Button>
                            </div>
                          </div>
                          <textarea
                            value={editTranscriptText}
                            onChange={e => setEditTranscriptText(e.target.value)}
                            placeholder="Paste your transcript here…"
                            rows={8}
                            className="w-full bg-muted/50 rounded-lg px-3 py-2.5 text-xs outline-none border border-border focus:border-primary transition-colors resize-none font-mono leading-relaxed"
                            autoFocus
                          />
                          {editTranscriptText.trim() && (
                            <p className="text-[10px] text-muted-foreground/50">
                              {editTranscriptText.length.toLocaleString()} chars · ~{Math.ceil(editTranscriptText.split(/\s+/).length)} words
                            </p>
                          )}
                        </div>
                      ) : hasTranscript ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1 justify-end">
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => startEditTranscript(ep)}>
                              <Pencil className="h-2.5 w-2.5" /> Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => copyTranscript(ep.transcript!)}>
                              <Copy className="h-2.5 w-2.5" /> Copy
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => exportTranscript(ep, "txt")}>
                              <Download className="h-2.5 w-2.5" /> TXT
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => exportTranscript(ep, "srt")}>
                              <Download className="h-2.5 w-2.5" /> SRT
                            </Button>
                          </div>
                          <TranscriptViewer transcript={ep.transcript!} />
                        </div>
                      ) : null}

                      {/* Chunk Preview */}
                      {chunkPreview?.episodeId === ep.id && chunkPreview.chunks.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                              <Layers className="h-2.5 w-2.5" /> {chunkPreview.chunks.length} Segments
                            </span>
                            <Button variant="ghost" size="sm" className="h-5 text-[9px]" onClick={() => setChunkPreview(null)}>Hide</Button>
                          </div>
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {chunkPreview.chunks.map((chunk: any) => (
                              <div key={chunk.index} className="bg-muted/30 rounded-lg px-3 py-2 border border-border/50">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-mono text-muted-foreground">Segment {chunk.index + 1}</span>
                                  <span className="text-[9px] text-muted-foreground/50">~{chunk.token_estimate} tokens</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground line-clamp-2">{chunk.content.slice(0, 200)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Extraction Progress */}
                      {isExtracting && extractionProgress && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            <span className="text-xs font-medium text-primary">Extraction in progress…</span>
                          </div>
                          <Progress value={extractionProgress.neurons > 0 ? 100 : 50} className="h-1.5" />
                          <p className="text-[10px] text-muted-foreground mt-1.5">
                            {extractionProgress.neurons > 0
                              ? `${extractionProgress.neurons} neurons extracted from ${extractionProgress.chunks} segments`
                              : "Chunking and AI analysis…"
                            }
                          </p>
                        </div>
                      )}

                      {/* Actions row */}
                      <div className="flex items-center justify-between pt-1">
                        <Button variant="ghost" size="sm"
                          className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteEpisode(ep.id)} disabled={isDeleting}>
                          {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          Delete
                        </Button>
                        <div className="flex items-center gap-1.5">
                          {hasTranscript && !isExtracting && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                                  onClick={() => handleChunkPreview(ep)} disabled={chunkingId === ep.id}>
                                  {chunkingId === ep.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Layers className="h-3 w-3" />}
                                  Preview Segments
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[220px] text-center">
                                Preview how the transcript will be segmented before extraction (200-800 tokens/segment)
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {canExtract && !isExtracting && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleExtractNeurons(ep)}>
                                  <Brain className="h-3 w-3" /> Extract Neurons
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[220px] text-center">
                                Extract knowledge neurons — frameworks, insights, quotes (100 credits)
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {canExtract && !isExtracting && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                                  disabled={detectingGuests === ep.id} onClick={() => isPro ? handleDetectGuests(ep) : setPaywallOpen(true)}>
                                  {detectingGuests === ep.id ? <Loader2 className="h-3 w-3 animate-spin" /> : isPro ? <Users className="h-3 w-3" /> : <Crown className="h-3 w-3 text-primary" />}
                                  Guests
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[220px] text-center">
                                {isPro ? "Detect and create profiles for people mentioned in the transcript" : "Pro feature — upgrade to unlock Guest Detection"}
                              </TooltipContent>
                            </Tooltip>
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
    </PageTransition>
    <PremiumPaywall open={paywallOpen} onOpenChange={setPaywallOpen} requiredTier="pro" serviceName="Deep Extract & Guest Detection" />
    </TooltipProvider>
  );
}
