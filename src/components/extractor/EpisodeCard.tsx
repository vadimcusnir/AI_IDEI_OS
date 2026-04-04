/**
 * EpisodeCard — Collapsible episode row with all actions for the Extractor page.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText, FileAudio, Film, Type, Globe, Loader2, Brain,
  ChevronDown, Copy, ExternalLink, Pencil, Download, FileUp,
  Layers, Users, Save, Trash2, X, Crown, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TranscriptViewer } from "@/components/extractor/TranscriptViewer";
import { NEPExtractorPanel } from "@/components/extractor/NEPExtractorPanel";

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

const ACCEPTED_FILE_TYPES = ".mp3,.wav,.m4a,.ogg,.webm,.flac,.mp4,.webm,.mov,.avi";
const ACCEPTED_TRANSCRIPT_FILES = ".txt,.srt,.vtt,.md,.pdf";

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

interface EpisodeCardProps {
  ep: Episode;
  isExpanded: boolean;
  isTargeted: boolean;
  isPro: boolean;
  onToggleExpand: () => void;
  onPaywall: () => void;
  actions: {
    extractingId: string | null;
    extractionProgress: { chunks: number; neurons: number } | null;
    chunkPreview: { episodeId: string; chunks: any[] } | null;
    setChunkPreview: (v: any) => void;
    chunkingId: string | null;
    deletingId: string | null;
    transcribingId: string | null;
    editingTranscriptId: string | null;
    setEditingTranscriptId: (v: string | null) => void;
    editTranscriptText: string;
    setEditTranscriptText: (v: string) => void;
    savingTranscript: boolean;
    deepExtractingId: string | null;
    detectingGuests: string | null;
    handleDeleteEpisode: (...args: any[]) => void;
    handleSaveTranscript: (id: string) => void;
    startEditTranscript: (ep: Episode) => void;
    exportTranscript: (ep: Episode, fmt: "txt" | "srt") => void;
    copyTranscript: (text: string) => void;
    handleChunkPreview: (ep: Episode) => void;
    handleExtractNeurons: (ep: Episode) => void;
    handleDeepExtract: (ep: Episode) => void;
    handleDetectGuests: (ep: Episode) => void;
    handleTranscriptFileImport: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
    retryTranscription: (ep: Episode) => void;
    handleUploadAudio: (file: File, id: string) => void;
    parseSrtToText: (text: string) => string;
  };
  episodes: Episode[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  setEpisodes: React.Dispatch<React.SetStateAction<Episode[]>>;
  fetchEpisodes: () => Promise<void>;
}

export function EpisodeCard({
  ep, isExpanded, isTargeted, isPro, onToggleExpand, onPaywall,
  actions, episodes, expandedId, setExpandedId, setEpisodes, fetchEpisodes,
}: EpisodeCardProps) {
  const Icon = SOURCE_ICONS[ep.source_type] || FileText;
  const isExtracting = actions.extractingId === ep.id;
  const isTranscribing = actions.transcribingId === ep.id || ep.status === "transcribing";
  const hasTranscript = !!ep.transcript?.trim();
  const canExtract = (ep.status === "transcribed" || ep.status === "uploaded") && hasTranscript;
  const isAnalyzed = ep.status === "analyzed";
  const isDeleting = actions.deletingId === ep.id;
  const wordCount = hasTranscript ? ep.transcript!.split(/\s+/).length : 0;
  const needsTranscript = !hasTranscript && !isTranscribing;
  const isEditingTranscript = actions.editingTranscriptId === ep.id;

  return (
    <div className={cn(
      "rounded-xl border bg-card transition-all duration-300",
      isTargeted && "ring-2 ring-primary/40 shadow-lg shadow-primary/5",
      isExpanded ? "border-primary/30" : "border-border hover:border-primary/20"
    )}>
      {/* Row header */}
      <div
        role="button"
        tabIndex={0}
        className="w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 text-left cursor-pointer"
        onClick={onToggleExpand}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onToggleExpand(); }}
      >
        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{ep.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-micro text-muted-foreground">{new Date(ep.created_at).toLocaleDateString("en-US")}</span>
            {ep.duration_seconds && (
              <span className="text-micro text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />{Math.round(ep.duration_seconds / 60)}min
              </span>
            )}
            {ep.language && <span className="text-micro text-muted-foreground/60 uppercase">{ep.language}</span>}
            {hasTranscript && <span className="hidden sm:inline text-micro text-muted-foreground/40">{wordCount.toLocaleString()} words</span>}
            {needsTranscript && <span className="text-micro text-amber-500 font-medium">⚠ no transcript</span>}
          </div>
        </div>
        <span className={cn("text-nano font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0", STATUS_COLORS[ep.status] || STATUS_COLORS.uploaded)}>
          {STATUS_LABELS[ep.status] || ep.status}
        </span>
        {isTranscribing && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span className="hidden sm:inline text-micro text-primary font-medium">Transcribing…</span>
          </div>
        )}
        {/* Desktop quick actions */}
        {hasTranscript && !isExtracting && !isTranscribing && (
          <div className="hidden sm:flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => actions.startEditTranscript(ep)}><Pencil className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Edit transcript</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => actions.copyTranscript(ep.transcript!)}><Copy className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Copy transcript</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => actions.exportTranscript(ep, "txt")}><Download className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Download TXT</TooltipContent></Tooltip>
          </div>
        )}
        {canExtract && !isExtracting && !isTranscribing && !actions.deepExtractingId && (
          <div className="hidden sm:flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => actions.handleExtractNeurons(ep)}><Brain className="h-3 w-3" /> Extract</Button></TooltipTrigger><TooltipContent className="max-w-[220px] text-center">Quick extraction — atomic neurons (100 credits)</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="default" size="sm" className="h-7 text-xs gap-1" onClick={() => isPro ? actions.handleDeepExtract(ep) : onPaywall()}>{!isPro && <Crown className="h-3 w-3" />}<Layers className="h-3 w-3" /> Deep Extract</Button></TooltipTrigger><TooltipContent className="max-w-[260px] text-center">{isPro ? "Multi-level extraction (~500 credits)" : "Pro feature — upgrade to unlock"}</TooltipContent></Tooltip>
          </div>
        )}
        {needsTranscript && !isExtracting && !isTranscribing && (
          <Button variant="outline" size="sm" className="hidden sm:inline-flex h-7 text-xs gap-1 shrink-0 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
            onClick={e => { e.stopPropagation(); setExpandedId(ep.id); actions.startEditTranscript(ep); }}>
            <Pencil className="h-3 w-3" /> Add Transcript
          </Button>
        )}
        {isExtracting && <div className="flex items-center gap-1.5 shrink-0"><Loader2 className="h-3.5 w-3.5 animate-spin text-ai-accent" /><span className="hidden sm:inline text-micro text-ai-accent font-medium">Extracting…</span></div>}
        {actions.deepExtractingId === ep.id && <div className="flex items-center gap-1.5 shrink-0"><Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /><span className="hidden sm:inline text-micro text-primary font-medium">Deep Extract…</span></div>}
        {isAnalyzed && <span className="text-micro text-status-validated font-medium shrink-0">✓</span>}
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground/40 shrink-0 transition-transform", isExpanded && "rotate-180")} />
      </div>

      {/* Mobile action bar */}
      {!isExpanded && (
        <div className="sm:hidden flex items-center gap-1.5 px-3 pb-2 -mt-1" onClick={e => e.stopPropagation()}>
          {hasTranscript && !isExtracting && !isTranscribing && (
            <>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => actions.startEditTranscript(ep)}><Pencil className="h-3 w-3" /></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => actions.copyTranscript(ep.transcript!)}><Copy className="h-3 w-3" /></Button>
            </>
          )}
          {canExtract && !isExtracting && !isTranscribing && !actions.deepExtractingId && (
            <>
              <Button variant="outline" size="sm" className="h-7 text-dense gap-1 flex-1" onClick={() => actions.handleExtractNeurons(ep)}><Brain className="h-3 w-3" /> Extract</Button>
              <Button variant="default" size="sm" className="h-7 text-dense gap-1 flex-1" onClick={() => isPro ? actions.handleDeepExtract(ep) : onPaywall()}>{!isPro && <Crown className="h-3 w-3" />}<Layers className="h-3 w-3" /> Deep</Button>
            </>
          )}
          {needsTranscript && !isExtracting && !isTranscribing && (
            <Button variant="outline" size="sm" className="h-7 text-dense gap-1 flex-1 border-amber-500/30 text-amber-600" onClick={() => { setExpandedId(ep.id); actions.startEditTranscript(ep); }}>
              <Pencil className="h-3 w-3" /> Add Transcript
            </Button>
          )}
        </div>
      )}

      {/* Expanded detail panel */}
      {isExpanded && (
        <div className="border-t border-border px-3 sm:px-4 py-3 sm:py-4 space-y-3">
          {/* Metadata */}
          <div className="flex items-center gap-2 sm:gap-4 text-micro text-muted-foreground flex-wrap">
            <span>Type: <strong className="text-foreground">{ep.source_type}</strong></span>
            {ep.source_url && (
              <a href={ep.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-primary hover:underline">
                <ExternalLink className="h-2.5 w-2.5" /> Source
              </a>
            )}
            <span>Created: {new Date(ep.created_at).toLocaleString("en-US")}</span>
            {ep.metadata?.deep_extract && (
              <span className="text-primary font-medium">🧠 Deep: {ep.metadata.deep_extract.total_neurons} neurons / {ep.metadata.deep_extract.levels_run?.length || 0} levels</span>
            )}
            {ep.metadata?.neurons_extracted && !ep.metadata?.deep_extract && (
              <span className="text-status-validated font-medium">⚡ {ep.metadata.neurons_extracted} neurons extracted</span>
            )}
          </div>

          {/* Deep Extract Results */}
          {ep.metadata?.deep_extract?.results && (
            <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-primary" /> Deep Extract Results</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(ep.metadata.deep_extract.results as Array<{level?: string; neurons_created?: number; avg_score?: number}>).filter((r: any) => r && r.level).map((r: any) => (
                  <div key={r.level} className="bg-background rounded-md px-2 py-1.5 border border-border">
                    <p className="text-nano font-mono text-muted-foreground uppercase">{(r.level || "").replace("_", " ")}</p>
                    <p className="text-xs font-bold">{r.neurons_created ?? 0} <span className="text-muted-foreground font-normal">neurons</span></p>
                    {(r.avg_score ?? 0) > 0 && <p className={cn("text-nano font-mono", r.avg_score > 70 ? "text-primary" : r.avg_score >= 40 ? "text-status-validated" : "text-muted-foreground")}>score: {r.avg_score}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error state */}
          {ep.status === "error" && (() => {
            const errorMeta = ep.metadata?.error_detail || {};
            const errorCode = errorMeta.code || "UNKNOWN";
            const errorStage = errorMeta.stage || (ep.metadata?.error?.includes("Transcription") ? "transcription" : "processing");
            const errorMsg = errorMeta.explanation || ep.metadata?.error || "An error occurred.";
            const retryable = errorMeta.retryable !== false && !!ep.source_url;
            const userAction = errorMeta.user_action || (retryable ? "Retry transcription or paste transcript manually." : "Paste the transcript manually.");
            
            return (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5"><X className="h-3.5 w-3.5 text-destructive" /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-destructive">Failed at: {errorStage}</p>
                      <span className="text-nano font-mono text-destructive/60 bg-destructive/10 px-1.5 py-0.5 rounded">{errorCode}</span>
                    </div>
                    <p className="text-micro text-muted-foreground mt-0.5">{errorMsg}</p>
                    <p className="text-micro text-foreground/70 mt-1 font-medium">{userAction}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {retryable && (
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => actions.retryTranscription(ep)} disabled={isTranscribing}>
                      {isTranscribing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />} Retry Transcription
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => actions.startEditTranscript(ep)}>
                    <Pencil className="h-3 w-3" /> Paste Transcript Manually
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* Upload audio */}
          {needsTranscript && ep.status !== "error" && !isEditingTranscript && (
            <div className="bg-muted/30 border border-border rounded-lg px-4 py-3 space-y-2">
              <p className="text-xs font-medium">Transcribe from audio file</p>
              <p className="text-micro text-muted-foreground">Upload an audio or video file and it will be transcribed automatically.</p>
              <input type="file" accept={ACCEPTED_FILE_TYPES} className="hidden" id={`upload-audio-${ep.id}`}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  actions.handleUploadAudio(file, ep.id);
                  e.target.value = "";
                }}
              />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => document.getElementById(`upload-audio-${ep.id}`)?.click()} disabled={isTranscribing}>
                  {isTranscribing ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileAudio className="h-3 w-3" />} Upload Audio/Video
                </Button>
                <span className="text-micro text-muted-foreground">or</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => actions.startEditTranscript(ep)}><Pencil className="h-3 w-3" /> Paste Transcript</Button>
                <input type="file" accept={ACCEPTED_TRANSCRIPT_FILES} className="hidden" id={`import-transcript-${ep.id}`} onChange={e => actions.handleTranscriptFileImport(e, ep.id)} />
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => document.getElementById(`import-transcript-${ep.id}`)?.click()}>
                  <FileUp className="h-3 w-3" /> Import File
                </Button>
              </div>
            </div>
          )}

          {/* Transcript editing */}
          {isEditingTranscript ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{hasTranscript ? "Edit Transcript" : "Add Transcript"}</span>
                <div className="flex items-center gap-1.5">
                  <label className="cursor-pointer">
                    <input type="file" accept={ACCEPTED_TRANSCRIPT_FILES} className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) file.text().then(text => {
                        let parsed = text;
                        if (file.name.endsWith(".srt") || file.name.endsWith(".vtt")) parsed = actions.parseSrtToText(text);
                        actions.setEditTranscriptText(parsed);
                      });
                      e.target.value = "";
                    }} />
                    <span className="inline-flex items-center gap-1 text-micro text-primary hover:underline cursor-pointer"><FileUp className="h-2.5 w-2.5" /> Import</span>
                  </label>
                  <Button variant="ghost" size="sm" className="h-6 text-micro" onClick={() => { actions.setEditingTranscriptId(null); actions.setEditTranscriptText(""); }}>Cancel</Button>
                  <Button size="sm" className="h-6 text-micro gap-1" onClick={() => actions.handleSaveTranscript(ep.id)} disabled={actions.savingTranscript || !actions.editTranscriptText.trim()}>
                    {actions.savingTranscript ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Save className="h-2.5 w-2.5" />} Save
                  </Button>
                </div>
              </div>
              <textarea value={actions.editTranscriptText} onChange={e => actions.setEditTranscriptText(e.target.value)} placeholder="Paste your transcript here…" rows={8}
                className="w-full bg-muted/50 rounded-lg px-3 py-2.5 text-xs outline-none border border-border focus:border-primary transition-colors resize-none font-mono leading-relaxed" autoFocus />
              {actions.editTranscriptText.trim() && (
                <p className="text-micro text-muted-foreground/50">{actions.editTranscriptText.length.toLocaleString()} chars · ~{Math.ceil(actions.editTranscriptText.split(/\s+/).length)} words</p>
              )}
            </div>
          ) : hasTranscript ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1 justify-end">
                <Button variant="ghost" size="sm" className="h-6 text-micro gap-1" onClick={() => actions.startEditTranscript(ep)}><Pencil className="h-2.5 w-2.5" /> Edit</Button>
                <Button variant="ghost" size="sm" className="h-6 text-micro gap-1" onClick={() => actions.copyTranscript(ep.transcript!)}><Copy className="h-2.5 w-2.5" /> Copy</Button>
                <Button variant="ghost" size="sm" className="h-6 text-micro gap-1" onClick={() => actions.exportTranscript(ep, "txt")}><Download className="h-2.5 w-2.5" /> TXT</Button>
                <Button variant="ghost" size="sm" className="h-6 text-micro gap-1" onClick={() => actions.exportTranscript(ep, "srt")}><Download className="h-2.5 w-2.5" /> SRT</Button>
              </div>
              <TranscriptViewer transcript={ep.transcript!} />
            </div>
          ) : null}

          {/* Chunk Preview */}
          {actions.chunkPreview?.episodeId === ep.id && actions.chunkPreview.chunks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Layers className="h-2.5 w-2.5" /> {actions.chunkPreview.chunks.length} Segments</span>
                <Button variant="ghost" size="sm" className="h-5 text-nano" onClick={() => actions.setChunkPreview(null)}>Hide</Button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {actions.chunkPreview.chunks.map((chunk: any) => (
                  <div key={chunk.index} className="bg-muted/30 rounded-lg px-3 py-2 border border-border/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-nano font-mono text-muted-foreground">Segment {chunk.index + 1}</span>
                      <span className="text-nano text-muted-foreground/50">~{chunk.token_estimate} tokens</span>
                    </div>
                    <p className="text-dense text-muted-foreground line-clamp-2">{chunk.content.slice(0, 200)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extraction Progress */}
          {isExtracting && actions.extractionProgress && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 mb-2"><Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /><span className="text-xs font-medium text-primary">Extraction in progress…</span></div>
              <Progress value={actions.extractionProgress.neurons > 0 ? 100 : 50} className="h-1.5" />
              <p className="text-micro text-muted-foreground mt-1.5">
                {actions.extractionProgress.neurons > 0 ? `${actions.extractionProgress.neurons} neurons extracted from ${actions.extractionProgress.chunks} segments` : "Chunking and AI analysis…"}
              </p>
            </div>
          )}

          {hasTranscript && !isExtracting && (
            <div className="border border-border rounded-lg p-4">
              <NEPExtractorPanel episodeId={ep.id} onComplete={() => fetchEpisodes()} />
            </div>
          )}

          {/* Bottom actions */}
          <div className="flex items-center justify-between pt-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => actions.handleDeleteEpisode(ep.id, episodes, expandedId, setExpandedId, setEpisodes)} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Delete
            </Button>
            <div className="flex items-center gap-1.5">
              {hasTranscript && !isExtracting && (
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => actions.handleChunkPreview(ep)} disabled={actions.chunkingId === ep.id}>
                  {actions.chunkingId === ep.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Layers className="h-3 w-3" />} Preview Segments
                </Button></TooltipTrigger><TooltipContent className="max-w-[220px] text-center">Preview how the transcript will be segmented</TooltipContent></Tooltip>
              )}
              {canExtract && !isExtracting && (
                <Tooltip><TooltipTrigger asChild><Button size="sm" className="h-7 text-xs gap-1" onClick={() => actions.handleExtractNeurons(ep)}>
                  <Brain className="h-3 w-3" /> Extract Neurons
                </Button></TooltipTrigger><TooltipContent className="max-w-[220px] text-center">Extract knowledge neurons (100 credits)</TooltipContent></Tooltip>
              )}
              {canExtract && !isExtracting && (
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 text-xs gap-1" disabled={actions.detectingGuests === ep.id}
                  onClick={() => isPro ? actions.handleDetectGuests(ep) : onPaywall()}>
                  {actions.detectingGuests === ep.id ? <Loader2 className="h-3 w-3 animate-spin" /> : isPro ? <Users className="h-3 w-3" /> : <Crown className="h-3 w-3 text-primary" />} Guests
                </Button></TooltipTrigger><TooltipContent className="max-w-[220px] text-center">{isPro ? "Detect guest profiles" : "Pro feature"}</TooltipContent></Tooltip>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
