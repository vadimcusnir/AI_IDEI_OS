import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { trackEvent } from "@/lib/analytics";
import { sanitizeSubtitleToText } from "@/lib/vtt-security";
import { detectSource, detectFileSource, type SourceDetectionResult } from "@/lib/sourceDetection";
import { useCreditBalance } from "@/hooks/useCreditBalance";

export type PipelineStage =
  | "idle"
  | "source"
  | "transcribe"
  | "segment"
  | "extract"
  | "link"
  | "generate"
  | "complete"
  | "error";

export interface PipelineResult {
  neurons: number;
  episode_id: string;
  type_distribution?: Record<string, number>;
  frameworks?: number;
  raw_extracted?: number;
  after_dedup?: number;
  meta?: { major_insights?: string[]; emerging_themes?: string[]; unexpected_ideas?: string[] };
}

interface UseInstantPipelineOpts {
  onComplete?: () => void;
  onPipelineStart?: () => void;
  onPipelineComplete?: (result: PipelineResult | null) => void;
}

export function useInstantPipeline(opts: UseInstantPipelineOpts = {}) {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { balance, loading: balanceLoading } = useCreditBalance();

  const [input, setInput] = useState("");
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [extractionDepth, setExtractionDepth] = useState<"quick" | "deep">("deep");
  const [insufficientCredits, setInsufficientCredits] = useState<{ needed: number } | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const estimatedCost = extractionDepth === "deep" ? 500 : 100;
  const hasEnoughCredits = balance >= estimatedCost;
  const isRunning = !["idle", "complete", "error"].includes(stage);

  const detectType = useCallback((val: string): "url" | "text" => {
    try {
      const u = new URL(val.trim());
      if (u.protocol === "http:" || u.protocol === "https:") return "url";
    } catch {}
    return "text";
  }, []);

  const detectedType = input.trim() ? detectType(input) : null;
  const sourceInfo: SourceDetectionResult | null =
    detectedType === "url" ? detectSource(input) : null;

  const fetchMetadata = async (url: string, platform: string, token: string) => {
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-metadata`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ url, platform }),
        }
      );
      if (resp.ok) return await resp.json();
    } catch {}
    return null;
  };

  const parseSrtToText = (srt: string): string => sanitizeSubtitleToText(srt);

  const runPipeline = async () => {
    if (!user || !currentWorkspace) return;
    if (!input.trim() && !selectedFile) {
      toast.error(t("paste_or_drop_hint"));
      return;
    }

    setResult(null);
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token || "";

    const type = selectedFile
      ? (selectedFile.type.startsWith("audio/") ? "audio" : selectedFile.type.startsWith("video/") ? "video" : "text")
      : detectType(input);

    const urlSource = !selectedFile && type === "url" ? detectSource(input) : null;
    const fileSource = selectedFile ? detectFileSource(selectedFile) : null;

    try {
      setStage("source");
      opts.onPipelineStart?.();
      let title = "";
      let transcript: string | null = null;
      let filePath: string | null = null;
      let fileSize: number | null = null;

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
        const metadata = await fetchMetadata(urlSource.canonical_url, urlSource.platform, accessToken);
        title = metadata?.title || new URL(urlSource.canonical_url).hostname.replace("www.", "");
      } else {
        transcript = input.trim();
        title = input.slice(0, 60).replace(/\n/g, " ").trim() + (input.length > 60 ? "…" : "");
      }

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

      trackEvent({ name: "transcript_uploaded", params: { source_type: sourceType, episode_id: ep.id } });

      // TRANSCRIBE
      if (!transcript && (urlSource || filePath)) {
        setStage("transcribe");
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-source`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ url: urlSource?.canonical_url || undefined, episode_id: ep.id, file_path: filePath || undefined }),
          }
        );
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Transcription failed");
        transcript = data.transcript || "done";

        if (data.source === "subtitles") {
          toast.info(t("using_captions", { language: data.language?.toUpperCase() || "", segments: data.segments?.length || 0 }));
        }
      }

      // SEGMENT + EXTRACT
      if (transcript || filePath) {
        setStage("segment");
        await new Promise(r => setTimeout(r, 600));

        setStage("extract");
        const extractEndpoint = extractionDepth === "deep" ? "deep-extract" : "extract-neurons";
        const extractSession = await supabase.auth.getSession();
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${extractEndpoint}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${extractSession.data.session?.access_token}` },
            body: JSON.stringify({ episode_id: ep.id }),
          }
        );
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Extraction failed");

        const neuronsCreated = data.total_neurons || data.neurons_created || 0;
        const creditsSpent = data.credits_spent || 0;

        // LINK
        setStage("link");
        try {
          const linkSession = await supabase.auth.getSession();
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/project-neurons`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${linkSession.data.session?.access_token}` },
            body: JSON.stringify({ episode_id: ep.id }),
          });
        } catch {}

        // GENERATE
        setStage("generate");
        try {
          const embedSession = await supabase.auth.getSession();
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/embed-neurons`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${embedSession.data.session?.access_token}` },
            body: JSON.stringify({ episode_id: ep.id }),
          });
        } catch {}

        // COMPLETE
        setStage("complete");
        const completedResult: PipelineResult = {
          neurons: neuronsCreated,
          episode_id: ep.id,
          type_distribution: data.type_distribution,
          frameworks: data.frameworks,
          raw_extracted: data.raw_extracted,
          after_dedup: data.after_dedup,
          meta: data.meta,
        };
        setResult(completedResult);
        opts.onPipelineComplete?.(completedResult);
        toast.success(t("neurons_extracted_instant", { neurons: neuronsCreated, credits: creditsSpent }), { duration: 8000 });
        trackEvent({ name: "neurons_extracted", params: { episode_id: ep.id, neurons_count: neuronsCreated, credits_spent: creditsSpent } });
      } else {
        setStage("complete");
        const simpleResult: PipelineResult = { neurons: 0, episode_id: ep.id };
        setResult(simpleResult);
        opts.onPipelineComplete?.(simpleResult);
        toast.success(t("episode_created_hint"));
      }

      opts.onComplete?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Pipeline failed";

      if (msg.includes("Insufficient credits") || msg.includes("RC.CREDITS.INSUFFICIENT")) {
        const neededMatch = msg.match(/(\d+)/);
        const needed = neededMatch ? parseInt(neededMatch[1]) : estimatedCost;
        setInsufficientCredits({ needed });
        setStage("idle");
        return;
      }

      const failedStage = stage !== "idle" ? stage : "source";
      toast.error(`${failedStage}: ${msg}`, { duration: 6000 });
      setStage("error");
      setTimeout(() => setStage("idle"), 4000);
    }
  };

  const reset = () => {
    setInput("");
    setSelectedFile(null);
    setStage("idle");
    setResult(null);
    setInsufficientCredits(null);
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

  return {
    // State
    input, setInput,
    stage,
    selectedFile, setSelectedFile,
    isDragging, setIsDragging,
    showSettings, setShowSettings,
    extractionDepth, setExtractionDepth,
    insufficientCredits, setInsufficientCredits,
    result,
    fileRef,
    // Computed
    estimatedCost,
    hasEnoughCredits,
    isRunning,
    detectedType,
    sourceInfo,
    balance,
    balanceLoading,
    // Actions
    runPipeline,
    reset,
    handleFileSelect,
    handleDrop,
  };
}
