import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import { TranscriberResults } from "./TranscriberResults";
import { TranscriberInput } from "./TranscriberInput";

type Stage = "idle" | "detecting" | "extracting_audio" | "downloading_audio" | "transcribing_audio" | "detecting_language" | "ready" | "error";

interface TranscriptData {
  text: string;
  language: string;
  segments: Array<{ start: number; end: number; text: string; speaker?: string }>;
  word_count: number;
  source: string;
  title: string;
  duration_seconds: number | null;
  speakers?: string[];
  has_diarization?: boolean;
  confidence?: number;
}

const TRANSCRIPT_COST = 50;

export function YouTubeTranscriber() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { balance, loading: balanceLoading, refetch: refetchBalance } = useCreditBalance();
  const [url, setUrl] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [error, setError] = useState("");
  const [lastEpisodeId, setLastEpisodeId] = useState<string | null>(null);
  const [episodeCount, setEpisodeCount] = useState<number | null>(null);
  const [showTopUp, setShowTopUp] = useState(false);

  const isFree = episodeCount === 0;

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

  const validUrl = url.trim() !== "" && isYouTubeUrl(url);

  const reset = () => {
    setUrl("");
    setStage("idle");
    setTranscript(null);
    setError("");
    setProgress(0);
    setShowTopUp(false);
  };

  const handleTranscribe = async () => {
    if (!user || !currentWorkspace || !validUrl) return;

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

      if (!isFree) {
        const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_neurons", {
          _user_id: user.id,
          _amount: TRANSCRIPT_COST,
          _description: "RESERVE: YouTube transcript",
        });
        if (reserveErr || !reserved) {
          setShowTopUp(true);
          setStage("idle");
          return;
        }
      }

      setStage("extracting_audio");
      setProgress(20);

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
      setLastEpisodeId(ep.id);

      setProgress(40);
      setStage("downloading_audio");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-source`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url: url.trim(), episode_id: ep.id }),
        }
      );

      setStage("transcribing_audio");
      setProgress(60);
      const data = await resp.json();
      if (!resp.ok) {
        const failureClass = data.failure_class || "unknown";
        const retryable = data.retryable || false;
        throw new Error(data.error || `Transcription failed (${failureClass})${retryable ? " — retryable" : ""}`);
      }

      setStage("detecting_language");
      setProgress(90);

      const { data: updated } = await supabase
        .from("episodes")
        .select("title, duration_seconds, language, transcript")
        .eq("id", ep.id)
        .single();

      setProgress(100);

      setTranscript({
        text: data.transcript || updated?.transcript || "",
        language: data.language || updated?.language || "unknown",
        segments: data.segments || [],
        word_count: (data.transcript || updated?.transcript || "").split(/\s+/).length,
        source: data.source || "audio_stt",
        title: updated?.title || "YouTube Transcript",
        duration_seconds: data.duration_seconds || updated?.duration_seconds || null,
        speakers: data.speakers || [],
        has_diarization: data.has_diarization || false,
        confidence: data.confidence,
      });

      setStage("ready");
      setEpisodeCount((prev) => (prev ?? 0) + 1);
      refetchBalance();
      toast.success(isFree ? "🎁 Prima transcriere gratuită!" : "Transcriere completă!", { duration: 4000 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Eroare necunoscută";
      setError(msg);
      setStage("error");
      toast.error(msg);

      if (!isFree) {
        try {
          // Server-side refund. Client cannot grant credits directly anymore (F-014 fix).
          await supabase.functions.invoke("transcript-refund", {
            body: { amount: TRANSCRIPT_COST, reason: "Refund — transcript download failed" },
          });
          toast.info(t("toast_credits_returned"));
        } catch { /* silent */ }
        refetchBalance();
      }
    }
  };

  const isRunning = ["detecting", "extracting_audio", "downloading_audio", "transcribing_audio", "detecting_language"].includes(stage);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {stage === "ready" && transcript ? (
          <TranscriberResults transcript={transcript} lastEpisodeId={lastEpisodeId} onReset={reset} />
        ) : (
          <TranscriberInput
            url={url}
            setUrl={setUrl}
            stage={stage}
            progress={progress}
            error={error}
            validUrl={validUrl}
            isRunning={isRunning}
            isFree={isFree}
            balance={balance}
            balanceLoading={balanceLoading}
            showTopUp={showTopUp}
            setShowTopUp={setShowTopUp}
            user={user}
            episodeCount={episodeCount}
            onTranscribe={handleTranscribe}
            transcriptCost={TRANSCRIPT_COST}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
