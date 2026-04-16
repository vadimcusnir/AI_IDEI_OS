/**
 * useEpisodeActions — Extracts all episode action handlers from Extractor page.
 */
import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { useTranslation } from "react-i18next";
import { sanitizeSubtitleToText } from "@/lib/vtt-security";

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

function parseSrtToText(srt: string): string {
  return sanitizeSubtitleToText(srt);
}

function formatSrtTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},000`;
}

function textToSrt(text: string): string {
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
}

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

export function useEpisodeActions(fetchEpisodes: () => Promise<void>) {
  const { user } = useAuth();
  const { t } = useTranslation(["common", "errors"]);

  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [extractionProgress, setExtractionProgress] = useState<{ chunks: number; neurons: number } | null>(null);
  const [chunkPreview, setChunkPreview] = useState<{ episodeId: string; chunks: any[] } | null>(null);
  const [chunkingId, setChunkingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [editingTranscriptId, setEditingTranscriptId] = useState<string | null>(null);
  const [editTranscriptText, setEditTranscriptText] = useState("");
  const [savingTranscript, setSavingTranscript] = useState(false);
  const [deepExtractingId, setDeepExtractingId] = useState<string | null>(null);
  const [detectingGuests, setDetectingGuests] = useState<string | null>(null);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  const triggerTranscription = async (episodeId: string, filePath: string) => {
    setTranscribingId(episodeId);
    try {
      const token = await getToken();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

  const handleDeleteEpisode = async (id: string, episodes: Episode[], expandedId: string | null, setExpandedId: (id: string | null) => void, setEpisodes: React.Dispatch<React.SetStateAction<Episode[]>>) => {
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

  const handleSaveTranscript = async (episodeId: string) => {
    if (!editTranscriptText.trim()) { toast.error(t("common:transcript_empty")); return; }
    setSavingTranscript(true);
    const { error } = await supabase.from("episodes").update({
      transcript: editTranscriptText.trim(),
      status: "transcribed",
    } as { transcript: string; status: string }).eq("id", episodeId);
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

  const exportTranscript = (ep: Episode, format: "txt" | "srt") => {
    if (!ep.transcript) return;
    let content = ep.transcript;
    let filename = `${ep.title.replace(/[^a-zA-Z0-9]/g, "_")}`;
    if (format === "srt") { content = textToSrt(ep.transcript); filename += ".srt"; }
    else { filename += ".txt"; }
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(t("common:exported_as", { format: format.toUpperCase() }));
  };

  const handleChunkPreview = async (episode: Episode) => {
    if (!user || !episode.transcript?.trim()) return;
    setChunkingId(episode.id);
    try {
      const token = await getToken();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chunk-transcript`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ episode_id: episode.id }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);
      setChunkPreview({ episodeId: episode.id, chunks: data.chunks });
      toast.success(t("common:segments_generated", { chunks: data.total_chunks, tokens: data.total_tokens }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("errors:generic"));
    } finally {
      setChunkingId(null);
    }
  };

  const handleExtractNeurons = async (episode: Episode) => {
    if (!user || !episode.transcript?.trim()) { toast.error(t("common:no_transcript")); return; }
    setExtractingId(episode.id);
    setExtractionProgress({ chunks: 0, neurons: 0 });
    toast.info(t("common:extracting_neurons"));
    try {
      const token = await getToken();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-neurons`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ episode_id: episode.id }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);
      setExtractionProgress({ chunks: data.chunks_processed || 0, neurons: data.neurons_created });
      toast.success(t("common:neurons_extracted_result", { neurons: data.neurons_created, chunks: data.chunks_processed || 1, credits: data.credits_spent }), { duration: 8000 });
      trackEvent({ name: "neurons_extracted", params: { episode_id: episode.id, neurons_count: data.neurons_created, credits_spent: data.credits_spent } });
      setChunkPreview(null);
      fetchEpisodes();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("errors:generic"));
    } finally {
      setTimeout(() => { setExtractingId(null); setExtractionProgress(null); }, 2000);
    }
  };

  const handleDeepExtract = async (episode: Episode) => {
    if (!user || !episode.transcript?.trim()) { toast.error(t("common:no_transcript")); return; }
    setDeepExtractingId(episode.id);
    toast.info(t("common:deep_extract_running"));
    try {
      const token = await getToken();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deep-extract`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ episode_id: episode.id }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);
      toast.success(t("common:deep_extract_result", { neurons: data.total_neurons, levels: data.levels_processed, credits: data.credits_spent }), { duration: 10000 });
      trackEvent({ name: "neurons_extracted", params: { episode_id: episode.id, neurons_count: data.total_neurons, credits_spent: data.credits_spent } });
      fetchEpisodes();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("errors:generic"));
    } finally {
      setDeepExtractingId(null);
    }
  };

  const handleDetectGuests = async (episode: Episode) => {
    if (!user || !episode.transcript?.trim()) { toast.error(t("common:no_transcript")); return; }
    setDetectingGuests(episode.id);
    try {
      const token = await getToken();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-guests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ episode_id: episode.id }),
        }
      );
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || "Failed");
      toast.success(t("common:guests_detected", { count: result.guests_processed }), { duration: 8000 });
    } catch (e: any) {
      toast.error(e.message || t("errors:generic"));
    }
    setDetectingGuests(null);
  };

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
    toast.success(t("common:copied"));
  };

  const retryTranscription = async (episode: Episode) => {
    setTranscribingId(episode.id);
    try {
      const token = await getToken();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-source`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ episode_id: episode.id, url: episode.source_url }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);
      toast.success(t("common:transcription_complete", { count: data.word_count || 0 }));
      fetchEpisodes();
    } catch (err: any) {
      toast.error(err.message || t("errors:generic"));
    }
    setTranscribingId(null);
  };

  const handleUploadAudio = async (file: File, episodeId: string) => {
    if (!user) return;
    setTranscribingId(episodeId);
    try {
      const ext = file.name.split(".").pop() || "mp3";
      const storagePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("episode-files").upload(storagePath, file);
      if (uploadErr) throw new Error(uploadErr.message);
      await supabase.from("episodes").update({ file_path: storagePath } as { file_path: string }).eq("id", episodeId);
      await triggerTranscription(episodeId, storagePath);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
      setTranscribingId(null);
    }
  };

  return {
    // State
    extractingId, extractionProgress,
    chunkPreview, setChunkPreview,
    chunkingId, deletingId,
    transcribingId,
    editingTranscriptId, setEditingTranscriptId,
    editTranscriptText, setEditTranscriptText,
    savingTranscript,
    deepExtractingId, detectingGuests,
    // Actions
    triggerTranscription,
    handleDeleteEpisode,
    handleSaveTranscript, startEditTranscript,
    exportTranscript, copyTranscript,
    handleChunkPreview, handleExtractNeurons,
    handleDeepExtract, handleDetectGuests,
    handleTranscriptFileImport,
    retryTranscription, handleUploadAudio,
    parseSrtToText,
  };
}
