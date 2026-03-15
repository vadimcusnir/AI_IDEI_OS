import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { PageTransition } from "@/components/motion/PageTransition";
import { trackInternalEvent, AnalyticsEvents } from "@/lib/internalAnalytics";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Upload, FileText, X, Clock, Trash2, Pencil,
  FileAudio, Film, Type, Globe, Loader2, Brain,
  ChevronDown, ChevronUp, Copy, ExternalLink,
  Layers, Zap, Users, Save, Download, FileUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SEOHead } from "@/components/SEOHead";
import { TranscriptViewer } from "@/components/extractor/TranscriptViewer";
import { InstantActionSurface } from "@/components/extractor/InstantActionSurface";

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
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [extractionProgress, setExtractionProgress] = useState<{ chunks: number; neurons: number } | null>(null);
  const [chunkPreview, setChunkPreview] = useState<{ episodeId: string; chunks: any[] } | null>(null);
  const [chunkingId, setChunkingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  // Form state — unified smart input
  const [showForm, setShowForm] = useState(true);
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<"text" | "audio" | "video" | "url">("url");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [autoTitleApplied, setAutoTitleApplied] = useState(false);

  // Auto-detect source type from input
  const autoDetectSourceType = useCallback((input: string): "url" | "text" => {
    const trimmed = input.trim();
    try {
      const url = new URL(trimmed);
      if (url.protocol === "http:" || url.protocol === "https:") return "url";
    } catch {}
    return "text";
  }, []);

  // Smart input handler — auto-detects URL vs text
  const handleSmartInput = useCallback(async (input: string) => {
    const detected = autoDetectSourceType(input);
    if (detected === "url" && sourceType !== "audio" && sourceType !== "video") {
      setSourceType("url");
      handleUrlChange(input);
    } else if (detected === "text" && sourceType !== "audio" && sourceType !== "video") {
      setSourceType("text");
      setContent(input);
      if (!title.trim() && input.length > 10) {
        const autoTitle = input.slice(0, 60).replace(/\n/g, " ").trim();
        setTitle(autoTitle + (input.length > 60 ? "…" : ""));
        setAutoTitleApplied(true);
      }
    }
  }, [sourceType, title, autoDetectSourceType]);
  const [fetchingTitle, setFetchingTitle] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  // Transcript editing
  const [editingTranscriptId, setEditingTranscriptId] = useState<string | null>(null);
  const [editTranscriptText, setEditTranscriptText] = useState("");
  const [savingTranscript, setSavingTranscript] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deepExtractingId, setDeepExtractingId] = useState<string | null>(null);
  const [deepExtractResult, setDeepExtractResult] = useState<any>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const transcriptFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading || wsLoading) return;
    if (!user || !currentWorkspace) {
      setLoading(false);
      return;
    }
    fetchEpisodes();
  }, [user, authLoading, wsLoading, currentWorkspace]);

  useEffect(() => {
    if (!loading && episodes.length === 0) setShowForm(true);
  }, [loading, episodes.length]);

  useEffect(() => {
    if (showForm && sourceType === "url") setTimeout(() => urlRef.current?.focus(), 100);
    else if (showForm) setTimeout(() => titleRef.current?.focus(), 100);
  }, [showForm, sourceType]);

  const fetchEpisodes = async () => {
    const { data, error } = await supabase
      .from("episodes")
      .select("*")
      .eq("workspace_id", currentWorkspace!.id)
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
    setSelectedFile(null);
  };

  // === YouTube title detection ===
  const fetchYouTubeTitle = async (url: string): Promise<string | null> => {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const resp = await fetch(oembedUrl);
      if (resp.ok) {
        const data = await resp.json();
        return data.title || null;
      }
    } catch { /* silent */ }
    return null;
  };

  const isYouTubeUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be");
    } catch { return false; }
  };

  const extractTitleFromUrl = (url: string): string => {
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        const last = decodeURIComponent(pathParts[pathParts.length - 1])
          .replace(/[-_]/g, " ").replace(/\.\w+$/, "").replace(/\b\w/g, c => c.toUpperCase());
        if (last.length > 2) return last;
      }
      return parsed.hostname.replace("www.", "");
    } catch { return ""; }
  };

  const handleUrlChange = async (url: string) => {
    setContent(url);
    if (!autoTitleApplied || !title.trim()) {
      if (isYouTubeUrl(url) && url.length > 20) {
        setFetchingTitle(true);
        const ytTitle = await fetchYouTubeTitle(url);
        setFetchingTitle(false);
        if (ytTitle) { setTitle(ytTitle); setAutoTitleApplied(true); return; }
      }
      const extracted = extractTitleFromUrl(url);
      if (extracted) { setTitle(extracted); setAutoTitleApplied(true); }
    }
  };

  // === File selection for audio/video ===
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.\w+$/, "").replace(/[-_]/g, " "));
      setAutoTitleApplied(true);
    }
  };

  // === Import transcript from file ===
  const handleTranscriptFileImport = async (e: React.ChangeEvent<HTMLInputElement>, episodeId?: string) => {
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

      if (episodeId) {
        setEditTranscriptText(transcript);
        setEditingTranscriptId(episodeId);
      } else {
        setContent(transcript);
        if (!title.trim()) {
          setTitle(file.name.replace(/\.\w+$/, "").replace(/[-_]/g, " "));
          setAutoTitleApplied(true);
        }
      }
      toast.success(`Imported ${file.name}`);
    } catch {
      toast.error("Failed to read file");
    }
    e.target.value = "";
  };

  const parseSrtToText = (srt: string): string => {
    return srt
      .split(/\n\n+/)
      .map(block => {
        const lines = block.trim().split("\n");
        // Remove index line and timestamp line
        return lines.filter(line =>
          !line.match(/^\d+$/) &&
          !line.match(/^\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->/)  &&
          !line.match(/^WEBVTT/)
        ).join(" ");
      })
      .filter(Boolean)
      .join("\n");
  };

  // === Create episode ===
  const handleCreate = async () => {
    if (!user) return;
    // Auto-generate title if empty
    let finalTitle = title.trim();
    if (!finalTitle) {
      if (sourceType === "url" && content.trim()) {
        finalTitle = extractTitleFromUrl(content.trim()) || `Episode ${new Date().toLocaleDateString()}`;
      } else if (sourceType === "text" && content.trim()) {
        finalTitle = content.slice(0, 60).replace(/\n/g, " ").trim() + (content.length > 60 ? "…" : "");
      } else if (selectedFile) {
        finalTitle = selectedFile.name.replace(/\.\w+$/, "").replace(/[-_]/g, " ");
      } else {
        finalTitle = `Episode ${new Date().toLocaleDateString()}`;
      }
    }
    setCreating(true);

    try {
      let filePath: string | null = null;
      let fileSize: number | null = null;

      // Upload file if audio/video
      if ((sourceType === "audio" || sourceType === "video") && selectedFile) {
        setUploading(true);
        const ext = selectedFile.name.split(".").pop() || "mp3";
        const storagePath = `${user.id}/${Date.now()}.${ext}`;
        
        const { error: uploadErr } = await supabase.storage
          .from("episode-files")
          .upload(storagePath, selectedFile);

        if (uploadErr) {
          toast.error(`Upload failed: ${uploadErr.message}`);
          setCreating(false);
          setUploading(false);
          return;
        }
        filePath = storagePath;
        fileSize = selectedFile.size;
        setUploading(false);
      }

      const { data: ep, error } = await supabase.from("episodes").insert({
        author_id: user.id,
        workspace_id: currentWorkspace!.id,
        title: finalTitle,
        source_type: sourceType,
        transcript: sourceType === "text" ? content : null,
        source_url: sourceType === "url" ? content : null,
        file_path: filePath,
        file_size: fileSize,
        status: sourceType === "text" && content.trim() ? "transcribed" : "uploaded",
      } as any).select("*").single();

      if (error || !ep) {
        toast.error("Failed to create episode");
      } else {
        // Auto-trigger transcription for audio/video uploads
        if ((sourceType === "audio" || sourceType === "video") && filePath) {
          toast.success("Episode created — starting transcription…");
          trackEvent({ name: "transcript_uploaded", params: { source_type: sourceType, episode_id: ep.id } });
          resetForm();
          if (episodes.length > 0) setShowForm(false);
          await fetchEpisodes();
          triggerTranscription(ep.id, filePath);
        } else if (sourceType === "url") {
          toast.success("Episode created. Add a transcript or upload an audio file to extract neurons.");
          trackEvent({ name: "transcript_uploaded", params: { source_type: sourceType, episode_id: ep.id } });
          resetForm();
          if (episodes.length > 0) setShowForm(false);
          fetchEpisodes();
        } else {
          toast.success("Episode created");
          trackEvent({ name: "transcript_uploaded", params: { source_type: sourceType, episode_id: ep.id } });
          resetForm();
          if (episodes.length > 0) setShowForm(false);
          fetchEpisodes();
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Creation failed");
    }
    setCreating(false);
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
          body: JSON.stringify({
            episode_id: episodeId,
            file_path: filePath,
          }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);
      toast.success(`Transcription complete — ${data.word_count} words`);
      fetchEpisodes();
    } catch (e: any) {
      toast.error(e.message || "Transcription failed");
    }
    setTranscribingId(null);
  };

  // === Delete episode ===
  const handleDeleteEpisode = async (id: string) => {
    setDeletingId(id);
    const ep = episodes.find(e => e.id === id);
    // Delete file from storage if exists
    if (ep?.file_path) {
      await supabase.storage.from("episode-files").remove([ep.file_path]);
    }
    const { error } = await supabase.from("episodes").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete episode");
    } else {
      toast.success("Episode deleted");
      setEpisodes(prev => prev.filter(e => e.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
    setDeletingId(null);
  };

  // === Save transcript ===
  const handleSaveTranscript = async (episodeId: string) => {
    if (!editTranscriptText.trim()) { toast.error("Transcript cannot be empty"); return; }
    setSavingTranscript(true);
    const { error } = await supabase.from("episodes").update({
      transcript: editTranscriptText.trim(),
      status: "transcribed",
    } as any).eq("id", episodeId);
    if (error) {
      toast.error("Failed to save transcript");
    } else {
      toast.success("Transcript saved — you can now extract neurons!");
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
    let mimeType = "text/plain";

    if (format === "srt") {
      content = textToSrt(ep.transcript);
      filename += ".srt";
    } else {
      filename += ".txt";
    }

    const blob = new Blob([content], { type: mimeType });
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
      toast.error(e instanceof Error ? e.message : "Chunking failed");
    } finally {
      setChunkingId(null);
    }
  };

  // === Extract neurons ===
  const handleExtractNeurons = async (episode: Episode) => {
    if (!user || !episode.transcript?.trim()) {
      toast.error("No transcript content. Add a transcript first.");
      return;
    }
    setExtractingId(episode.id);
    setExtractionProgress({ chunks: 0, neurons: 0 });
    toast.info("Extracting neurons… (100 credits)");
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
        `✅ S-au creat ${data.neurons_created} neuroni din ${data.chunks_processed || 1} segmente! (${data.credits_spent} credite consumate). Găsești neuronii noi în pagina Neurons.`,
        { duration: 8000 }
      );
      trackEvent({ name: "neurons_extracted", params: { episode_id: episode.id, neurons_count: data.neurons_created, credits_spent: data.credits_spent } });
      setChunkPreview(null);
      fetchEpisodes();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setTimeout(() => { setExtractingId(null); setExtractionProgress(null); }, 2000);
    }
  };

  // === Deep Extract (Phase 2 — Multi-Level) ===
  const handleDeepExtract = async (episode: Episode) => {
    if (!user || !episode.transcript?.trim()) {
      toast.error("No transcript content. Add a transcript first.");
      return;
    }
    setDeepExtractingId(episode.id);
    setDeepExtractResult(null);
    toast.info("Running Deep Extract — 8 levels of intelligence extraction…");
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
      setDeepExtractResult(data);
      toast.success(
        `✅ Deep Extract complete: ${data.total_neurons} neurons across ${data.levels_processed} levels (${data.credits_spent} credits)`,
        { duration: 10000 }
      );
      trackEvent({ name: "neurons_extracted", params: { episode_id: episode.id, neurons_count: data.total_neurons, credits_spent: data.credits_spent } });
      fetchEpisodes();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deep extraction failed");
    } finally {
      setDeepExtractingId(null);
    }
  };
  const [detectingGuests, setDetectingGuests] = useState<string | null>(null);
  const handleDetectGuests = async (episode: Episode) => {
    if (!user || !episode.transcript?.trim()) { toast.error("No transcript available."); return; }
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
        `✅ ${result.guests_processed} profiluri de invitați detectate! Le poți vedea și edita în pagina Guests.`,
        { duration: 8000 }
      );
    } catch (e: any) {
      toast.error(e.message || "Guest detection failed");
    }
    setDetectingGuests(null);
  };

  // === Copy transcript ===
  const copyTranscript = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const stats = {
    total: episodes.length,
    transcribed: episodes.filter(e => e.status === "transcribed").length,
    analyzed: episodes.filter(e => e.status === "analyzed").length,
    pending: episodes.filter(e => e.status === "uploaded").length,
  };

  // === Drag and drop handler ===
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const transcriptExts = ["txt", "srt", "vtt", "md"];
    const audioExts = ["mp3", "wav", "m4a", "ogg", "webm", "flac"];
    const videoExts = ["mp4", "webm", "mov", "avi"];

    if (transcriptExts.includes(ext)) {
      setSourceType("text");
      file.text().then(text => {
        let parsed = text;
        if (ext === "srt" || ext === "vtt") parsed = parseSrtToText(text);
        setContent(parsed);
        if (!title.trim()) {
          setTitle(file.name.replace(/\.\w+$/, "").replace(/[-_]/g, " "));
          setAutoTitleApplied(true);
        }
        toast.success(`Imported ${file.name} — ready to create episode`);
      });
    } else if (audioExts.includes(ext)) {
      setSourceType("audio");
      setSelectedFile(file);
      if (!title.trim()) {
        setTitle(file.name.replace(/\.\w+$/, "").replace(/[-_]/g, " "));
        setAutoTitleApplied(true);
      }
      toast.success(`${file.name} selected — will be transcribed after upload`);
    } else if (videoExts.includes(ext)) {
      setSourceType("video");
      setSelectedFile(file);
      if (!title.trim()) {
        setTitle(file.name.replace(/\.\w+$/, "").replace(/[-_]/g, " "));
        setAutoTitleApplied(true);
      }
      toast.success(`${file.name} selected — will be transcribed after upload`);
    } else {
      toast.error(`Unsupported file type: .${ext}`);
    }
  }, [title]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

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
        {/* SEO */}
        <SEOHead title="Extractor — AI-IDEI" description="Upload content, transcribe audio/video, and extract knowledge neurons using AI." />

        {/* Page header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">Extractor</h1>
            {episodes.length > 0 && (
              <div className="flex items-center gap-3 ml-1">
                {[
                  { label: "Total", value: stats.total },
                  { label: "Transcribed", value: stats.transcribed, color: "text-status-validated" },
                  { label: "Analyzed", value: stats.analyzed, color: "text-primary" },
                  { label: "Pending", value: stats.pending },
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
              {showForm ? "Hide" : "New Episode"}
            </Button>
          )}
        </div>

        {/* Instant Action Surface — single trigger pipeline */}
        <div className="mb-6">
          <InstantActionSurface onComplete={fetchEpisodes} compact />
        </div>

        {/* Legacy form toggle — for advanced users */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] text-muted-foreground/60">
            {episodes.length > 0 ? `${stats.total} episodes · ${stats.transcribed} transcribed · ${stats.analyzed} analyzed` : ""}
          </p>
          {episodes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-[10px] text-muted-foreground"
              onClick={() => setShowForm(f => !f)}
            >
              {showForm ? <ChevronUp className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
              {showForm ? "Hide advanced" : "Advanced input"}
            </Button>
          )}
        </div>

        {/* Legacy advanced form */}
        <div className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          showForm ? "max-h-[600px] opacity-100 mb-6" : "max-h-0 opacity-0 mb-0"
        )}>
          <div className={cn(
            "border rounded-xl bg-card p-5 space-y-4 transition-colors",
            isDragging ? "border-primary border-dashed bg-primary/5" : "border-border"
          )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {/* Smart input — URL or text, auto-detected */}
            {(sourceType === "url" || sourceType === "text") && sourceType !== "text" && (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Paste URL or text
                  {sourceType === "url" && content.trim() && (
                    <span className="text-primary/50 normal-case font-normal ml-1">· URL detected</span>
                  )}
                </label>
                <input
                  ref={urlRef}
                  value={content}
                  onChange={e => handleSmartInput(e.target.value)}
                  placeholder="Paste a YouTube URL, website link, or start typing text…"
                  className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors font-mono text-xs"
                  onKeyDown={e => { if (e.key === "Enter" && title.trim()) handleCreate(); }}
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Title {fetchingTitle && (
                    <span className="text-primary/50 normal-case font-normal ml-1 inline-flex items-center gap-1">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" /> detecting…
                    </span>
                  )}
                  {!fetchingTitle && title && autoTitleApplied && (
                    <span className="text-primary/50 normal-case font-normal ml-1">· auto-detected</span>
                  )}
                  {!title.trim() && (
                    <span className="text-muted-foreground/50 normal-case font-normal ml-1">· optional, auto-generated</span>
                  )}
                </label>
                <input
                  ref={titleRef}
                  value={title}
                  onChange={e => { setTitle(e.target.value); setAutoTitleApplied(false); }}
                  placeholder="Auto-generated from content…"
                  className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors"
                  onKeyDown={e => { if (e.key === "Enter" && sourceType !== "text") handleCreate(); }}
                />
              </div>
              <div className="shrink-0">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Source type</label>
                <div className="flex gap-1">
                  {([
                    { value: "url", label: "URL", icon: Globe },
                    { value: "text", label: "Text", icon: Type },
                    { value: "audio", label: "Audio", icon: FileAudio },
                    { value: "video", label: "Video", icon: Film },
                  ] as const).map(st => (
                    <button
                      key={st.value}
                      onClick={() => { setSourceType(st.value); setSelectedFile(null); }}
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

            {/* Text input with file import */}
            {sourceType === "text" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Content / Transcript</label>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept={ACCEPTED_TRANSCRIPT_FILES}
                      className="hidden"
                      onChange={e => handleTranscriptFileImport(e)}
                    />
                    <span className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                      <FileUp className="h-3 w-3" /> Import file (.txt, .srt, .vtt)
                    </span>
                  </label>
                </div>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Paste your transcript or text content here…"
                  rows={5}
                  className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors resize-none font-mono text-xs"
                />
              </div>
            )}

            {/* Audio/Video file upload */}
            {(sourceType === "audio" || sourceType === "video") && (
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES[sourceType]}
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {selectedFile ? (
                  <div className="border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {sourceType === "audio" ? <FileAudio className="h-5 w-5 text-primary" /> : <Film className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(1)} MB · Will be transcribed automatically after upload
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedFile(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className={cn(
                      "w-full border-2 border-dashed rounded-xl p-6 text-center transition-colors",
                      isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    )}
                  >
                    <Upload className="h-6 w-6 opacity-30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground font-medium">
                      {isDragging ? "Drop file here" : `Click or drag & drop ${sourceType} file`}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">
                      {sourceType === "audio" ? "MP3, WAV, M4A, OGG, FLAC · Max 50MB" : "MP4, WebM, MOV · Max 50MB"}
                    </p>
                  </button>
                )}
              </div>
            )}

            {/* URL info */}
            {sourceType === "url" && content.trim() && (
              <div className="bg-muted/30 border border-border rounded-lg px-3 py-2">
                <p className="text-[10px] text-muted-foreground">
                  💡 <strong>Next step:</strong> After creation, you can upload an audio file for automatic transcription, or paste the transcript manually.
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-muted-foreground/50">
                {sourceType === "url" && content.trim()
                  ? `URL detected · title: ${title || "—"}`
                  : sourceType === "text" && content.length > 0
                    ? `${content.length.toLocaleString()} chars · ~${Math.ceil(content.split(/\s+/).length)} words`
                  : (sourceType === "audio" || sourceType === "video") && selectedFile
                    ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB · auto-transcription`
                  : sourceType === "url" ? "Paste a URL to start" : "Fill in the fields and press Create"}
              </p>
              <div className="flex items-center gap-2">
                {episodes.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { resetForm(); setShowForm(false); }}>
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={handleCreate}
                  disabled={creating || uploading || ((sourceType === "audio" || sourceType === "video") && !selectedFile) || (sourceType === "url" && !content.trim()) || (sourceType === "text" && !content.trim())}
                >
                  {creating || uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  {uploading ? "Uploading…" : "Create Episode"}
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
                          <TooltipContent>Editează transcriptul</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                              onClick={() => copyTranscript(ep.transcript!)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copiază transcriptul</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                              onClick={() => exportTranscript(ep, "txt")}>
                              <Download className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Descarcă TXT</TooltipContent>
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
                              onClick={() => handleDeepExtract(ep)}>
                              <Layers className="h-3 w-3" /> Deep Extract
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[260px] text-center">
                            Multi-level extraction: atomic, entities, frameworks, psychological, narrative, commercial, patterns, synthesis (~500 credits)
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
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
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

                      {/* Upload audio for transcription (for URL episodes without transcript) */}
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
                                Vizualizează cum va fi segmentat transcriptul înainte de extracție (200-800 tokens/segment)
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
                                Extrage neuroni de cunoștințe din transcript — framework-uri, insight-uri, citate (100 credite)
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {canExtract && !isExtracting && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                                  disabled={detectingGuests === ep.id} onClick={() => handleDetectGuests(ep)}>
                                  {detectingGuests === ep.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Users className="h-3 w-3" />}
                                  Guests
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[220px] text-center">
                                Detectează și creează profiluri pentru persoanele menționate în transcript
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
    </TooltipProvider>
  );
}
