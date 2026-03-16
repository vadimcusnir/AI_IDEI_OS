import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { detectSource, detectFileSource, type SourceDetectionResult } from "@/lib/sourceDetection";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Zap, Globe, FileAudio, Film, Type,
  ChevronDown, CheckCircle2, Brain, Layers, FileUp,
  Sparkles, Network, Scissors, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type PipelineStage =
  | "idle"
  | "source"
  | "transcribe"
  | "segment"
  | "extract"
  | "link"
  | "generate"
  | "complete"
  | "error";

interface StageConf { label: string; icon: React.ElementType; progress: number }

const STAGE_CONFIG: Record<PipelineStage, StageConf> = {
  idle:       { label: "",                          icon: Zap,           progress: 0 },
  source:     { label: "Importing source…",         icon: Globe,         progress: 8 },
  transcribe: { label: "Transcribing audio…",       icon: FileAudio,     progress: 25 },
  segment:    { label: "Segmenting content…",       icon: Scissors,      progress: 40 },
  extract:    { label: "Extracting neurons…",       icon: Brain,         progress: 60 },
  link:       { label: "Linking knowledge graph…",  icon: Network,       progress: 80 },
  generate:   { label: "Generating assets…",        icon: Sparkles,      progress: 92 },
  complete:   { label: "Pipeline complete!",        icon: CheckCircle2,  progress: 100 },
  error:      { label: "Pipeline failed",           icon: Zap,           progress: 0 },
};

const PIPELINE_STEPS: PipelineStage[] = ["source", "transcribe", "segment", "extract", "link", "generate", "complete"];
const PIPELINE_LABELS: Record<string, string> = {
  source: "Source", transcribe: "Transcribe", segment: "Segment",
  extract: "Extract", link: "Link", generate: "Generate", complete: "Done",
};

const ACCEPTED_MEDIA = ".mp3,.wav,.m4a,.ogg,.webm,.flac,.mp4,.mov,.avi";
const ACCEPTED_TRANSCRIPTS = ".txt,.srt,.vtt,.md,.pdf";

interface InstantActionSurfaceProps {
  onComplete?: () => void;
  compact?: boolean;
}

export function InstantActionSurface({ onComplete, compact = false }: InstantActionSurfaceProps) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [extractionDepth, setExtractionDepth] = useState<"quick" | "deep">("deep");
  const [result, setResult] = useState<{ neurons: number; episode_id: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isRunning = !["idle", "complete", "error"].includes(stage);

  const detectType = useCallback((val: string): "url" | "text" => {
    try {
      const u = new URL(val.trim());
      if (u.protocol === "http:" || u.protocol === "https:") return "url";
    } catch {}
    return "text";
  }, []);

  const detectedType = input.trim() ? detectType(input) : null;

  // Source detection result for URLs
  const sourceInfo: SourceDetectionResult | null = 
    detectedType === "url" ? detectSource(input) : null;

  /** Fetch metadata via edge function */
  const fetchMetadata = async (url: string, platform: string, token: string) => {
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-metadata`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url, platform }),
        }
      );
      if (resp.ok) return await resp.json();
    } catch {}
    return null;
  };

  /** Fetch subtitles via edge function */
  const fetchSubtitles = async (url: string, episodeId: string, token: string) => {
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-subtitles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url, episode_id: episodeId }),
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data.subtitle_text) return data;
      }
    } catch {}
    return null;
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

  // Main pipeline execution
  const runPipeline = async () => {
    if (!user || !currentWorkspace) return;
    if (!input.trim() && !selectedFile) {
      toast.error("Paste a link, drop a file, or type content to analyze.");
      return;
    }

    setResult(null);
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token || "";

    // Detect source type
    const type = selectedFile
      ? (selectedFile.type.startsWith("audio/") ? "audio" : selectedFile.type.startsWith("video/") ? "video" : "text")
      : detectType(input);

    const urlSource = !selectedFile && type === "url" ? detectSource(input) : null;
    const fileSource = selectedFile ? detectFileSource(selectedFile) : null;

    try {
      // === SOURCE ===
      setStage("source");
      let title = "";
      let transcript: string | null = null;
      let filePath: string | null = null;
      let fileSize: number | null = null;
      let subtitlesUsed = false;

      if (selectedFile) {
        const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "";
        const transcriptExts = ["txt", "srt", "vtt", "md"];

        if (transcriptExts.includes(ext)) {
          let text = await selectedFile.text();
          if (ext === "srt" || ext === "vtt") text = parseSrtToText(text);
          transcript = text;
          title = selectedFile.name.replace(/\.\w+$/, "").replace(/[-_]/g, " ");
        } else if (ext === "pdf") {
          const pdfjsLib = await import("pdfjs-dist");
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
          const buf = await selectedFile.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
          const pages: string[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const tc = await page.getTextContent();
            pages.push(tc.items.map((it: any) => it.str).join(" "));
          }
          transcript = pages.join("\n\n");
          title = selectedFile.name.replace(/\.\w+$/, "").replace(/[-_]/g, " ");
        } else {
          title = selectedFile.name.replace(/\.\w+$/, "").replace(/[-_]/g, " ");
          const storagePath = `${user.id}/${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage.from("episode-files").upload(storagePath, selectedFile);
          if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);
          filePath = storagePath;
          fileSize = selectedFile.size;
        }
      } else if (urlSource) {
        // Fetch metadata for URL sources
        const metadata = await fetchMetadata(urlSource.canonical_url, urlSource.platform, accessToken);
        title = metadata?.title || new URL(urlSource.canonical_url).hostname;
      } else {
        transcript = input.trim();
        title = input.slice(0, 60).replace(/\n/g, " ").trim() + (input.length > 60 ? "…" : "");
      }

      // Create episode
      const sourceType = selectedFile
        ? (filePath ? (fileSource?.source_type || "audio") : "text")
        : (urlSource?.source_type || type);

      const { data: ep, error: epError } = await supabase.from("episodes").insert({
        author_id: user.id,
        workspace_id: currentWorkspace.id,
        title,
        source_type: sourceType,
        transcript: transcript || null,
        source_url: urlSource ? urlSource.canonical_url : (type === "url" ? input.trim() : null),
        file_path: filePath,
        file_size: fileSize,
        status: transcript ? "transcribed" : "uploaded",
        metadata: urlSource ? { platform: urlSource.platform, detected_source_type: urlSource.source_type } : null,
      } as any).select("*").single();

      if (epError || !ep) throw new Error("Failed to create episode");

      trackEvent({
        name: "transcript_uploaded",
        params: {
          source_type: sourceType,
          episode_id: ep.id,
        },
      });

      // === TRANSCRIBE ===
      if (!transcript && urlSource?.platform === "youtube") {
        // Try subtitles first for YouTube
        setStage("transcribe");
        const subs = await fetchSubtitles(urlSource.canonical_url, ep.id, accessToken);
        if (subs?.subtitle_text) {
          transcript = subs.subtitle_text;
          subtitlesUsed = true;
          toast.info(`📝 Using ${subs.subtitle_language?.toUpperCase()} captions (${subs.segment_count} segments)`);
        }
      }

      if (!transcript && !subtitlesUsed && (filePath || urlSource)) {
        setStage("transcribe");
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              episode_id: ep.id,
              file_path: filePath || undefined,
              source_url: urlSource?.canonical_url || undefined,
              language: undefined,
            }),
          }
        );
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Transcription failed");
        transcript = data.transcript || "done";
      }

      // === SEGMENT + EXTRACT ===
      if (transcript || filePath) {
        setStage("segment");
        await new Promise(r => setTimeout(r, 600));

        setStage("extract");
        const extractEndpoint = extractionDepth === "deep" ? "deep-extract" : "extract-neurons";
        const session = await supabase.auth.getSession();
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${extractEndpoint}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.data.session?.access_token}`,
            },
            body: JSON.stringify({ episode_id: ep.id }),
          }
        );
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Extraction failed");

        const neuronsCreated = data.total_neurons || data.neurons_created || 0;
        const creditsSpent = data.credits_spent || 0;

        // === LINK ===
        setStage("link");
        await new Promise(r => setTimeout(r, 700));

        // === GENERATE ===
        setStage("generate");
        await new Promise(r => setTimeout(r, 500));

        // === COMPLETE ===
        setStage("complete");
        setResult({ neurons: neuronsCreated, episode_id: ep.id });
        toast.success(`✅ ${neuronsCreated} neurons extracted! (${creditsSpent} credits)`, { duration: 8000 });
        trackEvent({
          name: "neurons_extracted",
          params: { episode_id: ep.id, neurons_count: neuronsCreated, credits_spent: creditsSpent },
        });
      } else {
        setStage("complete");
        setResult({ neurons: 0, episode_id: ep.id });
        toast.success("Episode created. Upload an audio file to extract neurons automatically.");
      }

      onComplete?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Pipeline failed";
      toast.error(msg);
      setStage("error");
      setTimeout(() => setStage("idle"), 3000);
    }
  };

  const reset = () => {
    setInput("");
    setSelectedFile(null);
    setStage("idle");
    setResult(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    e.target.value = "";
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  }, []);

  const currentStage = STAGE_CONFIG[stage];

  return (
    <div className={cn("w-full", compact ? "" : "max-w-2xl mx-auto")}>
      <motion.div
        layout
        className={cn(
          "relative rounded-2xl border-2 transition-all duration-300 overflow-hidden",
          isDragging
            ? "border-primary bg-primary/5 border-dashed"
            : isRunning
              ? "border-primary/40 bg-primary/5"
              : stage === "complete"
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-card hover:border-primary/20",
        )}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      >
        <AnimatePresence mode="wait">
          {stage === "idle" || stage === "error" ? (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 sm:p-5"
            >
              {/* Input row */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  {selectedFile ? (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5 border border-border">
                      {selectedFile.type.startsWith("audio/") ? (
                        <FileAudio className="h-4 w-4 text-primary shrink-0" />
                      ) : selectedFile.type.startsWith("video/") ? (
                        <Film className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Type className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <span className="text-sm truncate flex-1">{selectedFile.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-muted-foreground hover:text-foreground text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder={isDragging ? "Drop file here…" : "Paste link or type content…"}
                      className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                      onKeyDown={e => { if (e.key === "Enter" && (input.trim() || selectedFile)) runPipeline(); }}
                    />
                  )}
                  {detectedType && !selectedFile && input.trim() && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {detectedType === "url" ? (
                        <Globe className="h-3.5 w-3.5 text-primary/50" />
                      ) : (
                        <Type className="h-3.5 w-3.5 text-muted-foreground/50" />
                      )}
                    </div>
                  )}
                </div>

                <input ref={fileRef} type="file" accept={`${ACCEPTED_MEDIA},${ACCEPTED_TRANSCRIPTS}`} className="hidden" onChange={handleFileSelect} />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-xl"
                  onClick={() => fileRef.current?.click()}
                >
                  <FileUp className="h-4 w-4" />
                </Button>

                <Button
                  size="lg"
                  className="h-11 gap-2 rounded-xl px-5 font-semibold shrink-0"
                  onClick={runPipeline}
                  disabled={(!input.trim() && !selectedFile) || isRunning}
                >
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Analyze</span>
                </Button>
              </div>

              {/* Quick hints */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                  <span className="flex items-center gap-1"><Globe className="h-2.5 w-2.5" /> YouTube, URLs</span>
                  <span className="flex items-center gap-1"><FileAudio className="h-2.5 w-2.5" /> Audio/Video</span>
                  <span className="flex items-center gap-1"><Type className="h-2.5 w-2.5" /> Text, PDF</span>
                </div>
                <button
                  onClick={() => setShowSettings(s => !s)}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  Settings
                  <ChevronDown className={cn("h-2.5 w-2.5 transition-transform", showSettings && "rotate-180")} />
                </button>
              </div>

              {/* Progressive settings */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border mt-3 pt-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-24">Extraction</span>
                        <div className="flex gap-1">
                          {([
                            { value: "quick", label: "Quick · 100 cr", icon: Brain },
                            { value: "deep", label: "Deep · 500 cr", icon: Layers },
                          ] as const).map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setExtractionDepth(opt.value)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors",
                                extractionDepth === opt.value
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              )}
                            >
                              <opt.icon className="h-3 w-3" />
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* Pipeline progress */
            <motion.div
              key="pipeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-5 sm:p-6"
            >
              {/* Active stage */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center",
                  stage === "complete" ? "bg-primary/15" : "bg-primary/10"
                )}>
                  {stage === "complete" ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-semibold",
                    stage === "complete" ? "text-primary" : "text-foreground"
                  )}>
                    {currentStage.label}
                  </p>
                  {result && stage === "complete" && (
                    <p className="text-xs text-muted-foreground">
                      {result.neurons > 0
                        ? `${result.neurons} knowledge neurons extracted and indexed`
                        : "Episode created — add audio to extract neurons"
                      }
                    </p>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <Progress value={currentStage.progress} className="h-1.5 mb-4" />

              {/* 7-step pipeline visualization */}
              <div className="flex items-center justify-between">
                {PIPELINE_STEPS.map((s, i) => {
                  const isActive = stage === s;
                  const isPast = currentStage.progress > STAGE_CONFIG[s].progress;
                  const StageIcon = STAGE_CONFIG[s].icon;
                  return (
                    <div key={s} className="flex items-center gap-0.5">
                      <div className="flex flex-col items-center gap-1">
                        <div className={cn(
                          "h-7 w-7 rounded-full flex items-center justify-center transition-all duration-300",
                          isActive ? "bg-primary text-primary-foreground scale-110 shadow-sm" :
                          isPast ? "bg-primary/20 text-primary" :
                          "bg-muted text-muted-foreground/40"
                        )}>
                          <StageIcon className="h-3 w-3" />
                        </div>
                        <span className={cn(
                          "text-[8px] leading-none font-medium hidden sm:block",
                          isActive ? "text-primary" : isPast ? "text-primary/60" : "text-muted-foreground/40"
                        )}>
                          {PIPELINE_LABELS[s]}
                        </span>
                      </div>
                      {i < PIPELINE_STEPS.length - 1 && (
                        <div className={cn(
                          "h-0.5 w-2 sm:w-4 rounded-full transition-colors mx-0.5",
                          isPast ? "bg-primary/30" : "bg-border"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Complete actions */}
              {stage === "complete" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 mt-5 pt-3 border-t border-border"
                >
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={reset}>
                    New Analysis
                  </Button>
                  {result && result.neurons > 0 && (
                    <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => {
                      window.location.href = "/neurons";
                    }}>
                      <Brain className="h-3 w-3" />
                      View Neurons
                    </Button>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
