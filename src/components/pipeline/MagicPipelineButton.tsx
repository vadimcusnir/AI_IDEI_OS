/**
 * MagicPipelineButton — One-click Upload→Extract→Generate pipeline.
 * Accepts file or URL, runs full extraction pipeline with smart defaults.
 */
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useWalletAtomicity } from "@/hooks/useWalletAtomicity";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Zap, Loader2, CheckCircle2, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

type Stage = "idle" | "uploading" | "extracting" | "generating" | "complete" | "error";

const PIPELINE_COST = 500; // neurons for full pipeline

const STAGE_META: Record<Stage, { label: string; progress: number }> = {
  idle: { label: "Magic Pipeline", progress: 0 },
  uploading: { label: "Importing source…", progress: 15 },
  extracting: { label: "Extracting neurons…", progress: 50 },
  generating: { label: "Generating deliverables…", progress: 80 },
  complete: { label: "Pipeline complete!", progress: 100 },
  error: { label: "Pipeline failed", progress: 0 },
};

interface Props {
  className?: string;
  compact?: boolean;
}

export function MagicPipelineButton({ className, compact }: Props) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { balance } = useCreditBalance();
  const { reserve, settle, release } = useWalletAtomicity();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const canAfford = balance >= PIPELINE_COST;

  const runPipeline = async (file?: File, url?: string) => {
    if (!user) return;
    setErrorMsg("");

    // Reserve credits
    const reservation = await reserve(PIPELINE_COST, undefined, "Magic Pipeline: full extraction");
    if (!reservation.ok) {
      setStage("error");
      setErrorMsg(reservation.error || "Insufficient credits");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Stage 1: Upload/Import
      setStage("uploading");
      let sourceText = "";

      const isYouTube = url && /(?:youtube\.com|youtu\.be)/i.test(url);

      if (isYouTube) {
        // YouTube → create episode + transcribe-source
        const { data: ytEp, error: ytErr } = await supabase.from("episodes").insert({
          title: "YouTube — Pipeline Import",
          author_id: user.id,
          workspace_id: currentWorkspace?.id,
          source_type: "video",
          source_url: url.trim(),
          status: "uploaded",
          metadata: { platform: "youtube", pipeline: "magic" },
        } as any).select("id").single();

        if (ytErr || !ytEp) { console.error("Episode error:", ytErr); throw new Error("Failed to create episode"); }

        const transcribeResp = await supabase.functions.invoke("transcribe-source", {
          body: { episode_id: ytEp.id, url: url.trim() },
        });
        if (transcribeResp.error) throw new Error("YouTube transcription failed");
        sourceText = transcribeResp.data?.transcript || transcribeResp.data?.text || "";
        if (!sourceText || sourceText.length < 50) throw new Error("Transcription returned no content");

        await supabase.from("episodes").update({ transcript: sourceText.slice(0, 50000), status: "transcribed" } as any).eq("id", ytEp.id);

        // Go directly to extraction with existing episode
        setStage("extracting");
        const extractResp = await supabase.functions.invoke("extract-neurons", { body: { episode_id: ytEp.id } });
        if (extractResp.error) throw new Error("Extraction failed");
        const neuronCount = extractResp.data?.neurons_created || extractResp.data?.count || 0;

        setStage("generating");
        try {
          await supabase.functions.invoke("run-service", {
            body: { service_name: "decision-pack", input: { episode_id: ytEp.id, text: sourceText.slice(0, 10000), neurons: extractResp.data?.neurons?.slice(0, 20) || [], workspace_id: currentWorkspace?.id, auto_pipeline: true } },
          });
        } catch {}

        await settle(reservation.reserved, undefined, "Magic Pipeline: completed");
        setStage("complete");
        toast.success(`Pipeline complete — ${neuronCount} neurons extracted`);
        return;
      } else if (url) {
        const resp = await supabase.functions.invoke("scrape-url", {
          body: { url },
        });
        if (resp.error) throw new Error("Source import failed");
        sourceText = resp.data?.text || resp.data?.content || "";
      } else if (file) {
        // For audio/video files, transcribe first
        const isMedia = file.type.startsWith("audio/") || file.type.startsWith("video/");
        if (isMedia) {
          const formData = new FormData();
          formData.append("file", file);
          const resp = await supabase.functions.invoke("transcribe-audio", {
            body: formData,
          });
          if (resp.error) throw new Error("Transcription failed");
          sourceText = resp.data?.text || "";
        } else {
          sourceText = await file.text();
        }
      }

      if (!sourceText || sourceText.length < 50) {
        throw new Error("Source content too short for extraction");
      }

      // Stage 2: Create episode, then extract neurons
      setStage("extracting");
      const episodeTitle = url
        ? new URL(url).hostname + " — Import"
        : (file?.name || "Pipeline Import");

      const { data: newEpisode, error: epError } = await supabase
        .from("episodes")
        .insert({
          title: episodeTitle,
          transcript: sourceText.slice(0, 50000),
          author_id: user.id,
          workspace_id: currentWorkspace?.id,
          source_type: url ? "url" : "file",
          status: "transcribed",
        })
        .select("id")
        .single();

      if (epError || !newEpisode) throw new Error("Failed to create episode");

      const extractResp = await supabase.functions.invoke("extract-neurons", {
        body: { episode_id: newEpisode.id },
      });
      if (extractResp.error) throw new Error("Extraction failed");
      const neuronCount = extractResp.data?.neurons_created || extractResp.data?.count || 0;

      // Stage 3: Generate deliverables from extracted content
      setStage("generating");
      const genResp = await supabase.functions.invoke("content-generate", {
        body: {
          text: sourceText.slice(0, 10000),
          neurons: extractResp.data?.neurons?.slice(0, 20) || [],
          workspace_id: currentWorkspace?.id,
          auto_pipeline: true,
        },
      });
      if (genResp.error) throw new Error("Generation failed");

      // Settle credits
      await settle(reservation.reserved, undefined, "Magic Pipeline: completed");

      setStage("complete");
      toast.success(`Pipeline complete! ${neuronCount} neurons extracted`, {
        action: { label: "View Library", onClick: () => navigate("/library") },
      });

      // Auto-reset after 3s
      setTimeout(() => setStage("idle"), 3000);
    } catch (err) {
      // Release credits on failure
      await release(reservation.reserved, undefined, "Magic Pipeline: failed");
      setStage("error");
      setErrorMsg(err instanceof Error ? err.message : "Pipeline failed");
      toast.error("Pipeline failed", { description: err instanceof Error ? err.message : undefined });
      setTimeout(() => setStage("idle"), 5000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) runPipeline(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClick = () => {
    if (stage !== "idle") return;
    // For now, open file picker. URL input can be added via the extractor page.
    fileRef.current?.click();
  };

  const isRunning = stage !== "idle" && stage !== "complete" && stage !== "error";
  const meta = STAGE_META[stage];

  return (
    <div className={cn("space-y-1.5", className)}>
      <input
        ref={fileRef}
        type="file"
        accept=".txt,.md,.pdf,.srt,.vtt,.csv,audio/*,video/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <Button
        onClick={handleClick}
        disabled={isRunning || !canAfford}
        className={cn(
          "gap-2 transition-all",
          compact ? "h-8 text-xs px-3" : "h-10 px-5",
          stage === "complete" && "bg-primary/20 text-primary border border-primary/30",
          stage === "error" && "bg-destructive/10 text-destructive border border-destructive/30",
        )}
        variant={stage === "idle" ? "default" : "outline"}
      >
        {isRunning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : stage === "complete" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : stage === "error" ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        <span>{meta.label}</span>
        {stage === "idle" && (
          <span className="text-[10px] opacity-70">{PIPELINE_COST}N</span>
        )}
      </Button>
      {isRunning && (
        <Progress value={meta.progress} className="h-1" />
      )}
      {stage === "error" && errorMsg && (
        <p className="text-[10px] text-destructive">{errorMsg}</p>
      )}
    </div>
  );
}
