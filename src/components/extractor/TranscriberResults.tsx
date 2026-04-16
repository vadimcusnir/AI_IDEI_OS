import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, FileText, Subtitles, FileType, Copy, Sparkles,
  ArrowRight, FileDown,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

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

interface Props {
  transcript: TranscriptData;
  lastEpisodeId: string | null;
  onReset: () => void;
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

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

export function TranscriberResults({ transcript, lastEpisodeId, onReset }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const slug = (transcript.title || "transcript")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);

  const exportTXT = () => {
    downloadFile(`${slug}.txt`, transcript.text, "text/plain;charset=utf-8");
    toast.success(t("toast_downloaded_txt"));
  };

  const exportSRT = () => {
    if (!transcript.segments.length) {
      const sentences = transcript.text.split(/(?<=[.!?])\s+/).filter(Boolean);
      let srt = "";
      let time = 0;
      sentences.forEach((s, i) => {
        const dur = Math.max(2, Math.ceil(s.split(/\s+/).length / 3));
        srt += `${i + 1}\n${fmtSrt(time)} --> ${fmtSrt(time + dur)}\n${s}\n\n`;
        time += dur;
      });
      downloadFile(`${slug}.srt`, srt, "text/plain;charset=utf-8");
      toast.success(t("toast_downloaded_srt"));
      return;
    }
    const srt = transcript.segments
      .map((s, i) => `${i + 1}\n${fmtSrt(s.start)} --> ${fmtSrt(s.end)}\n${s.text}\n`)
      .join("\n");
    downloadFile(`${slug}.srt`, srt, "text/plain;charset=utf-8");
    toast.success(t("toast_downloaded_srt"));
  };

  const exportVTT = () => {
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
    toast.success(t("toast_downloaded_vtt"));
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(transcript.text);
    toast.success(t("toast_copied"));
  };

  const exportPDF = async () => {
    const { escapeHtml, textToSafeHtml } = await import("@/lib/html-sanitize");
    const safeTitle = escapeHtml(transcript.title);
    const safeBody = textToSafeHtml(transcript.text);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeTitle}</title>
<style>
  @page { margin: 2cm; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; line-height: 1.8; color: #1a1a1a; max-width: 100%; }
  h1 { font-size: 20pt; margin-bottom: 4pt; color: #111; }
  .meta { font-size: 9pt; color: #666; margin-bottom: 24pt; border-bottom: 1px solid #ddd; padding-bottom: 12pt; }
  .meta span { margin-right: 16pt; }
  p { text-align: justify; margin-bottom: 12pt; }
  .footer { margin-top: 32pt; padding-top: 12pt; border-top: 1px solid #ddd; font-size: 8pt; color: #999; text-align: center; }
</style></head><body>
<h1>${safeTitle}</h1>
<div class="meta">
  <span>${transcript.word_count.toLocaleString()} cuvinte</span>
  <span>Limbă: ${escapeHtml(transcript.language.toUpperCase())}</span>
  ${transcript.duration_seconds ? `<span>Durată: ${Math.floor(transcript.duration_seconds / 60)} min</span>` : ""}
  <span>Generat de AI-IDEI</span>
</div>
${safeBody}
<div class="footer">Transcript generat de AI-IDEI · ai-idei.com · ${new Date().toLocaleDateString("ro-RO")}</div>
</body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => { w.print(); }, 400);
    }
    toast.success(t("toast_pdf_opening"));
  };

  const formats = [
    { label: "TXT", icon: FileText, onClick: exportTXT, desc: "Text simplu" },
    { label: "SRT", icon: Subtitles, onClick: exportSRT, desc: "Subtitrări" },
    { label: "VTT", icon: FileType, onClick: exportVTT, desc: "Web Video" },
    { label: "PDF", icon: FileDown, onClick: exportPDF, desc: "Profesional" },
    { label: "Copiază", icon: Copy, onClick: copyToClipboard, desc: "Clipboard" },
  ];

  return (
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
                <span className="text-nano px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">⚡ Fast Path</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transcript preview */}
      <div className="p-5">
        <div className="bg-muted/50 rounded-xl p-4 max-h-48 overflow-y-auto text-sm leading-relaxed text-foreground/80 font-mono text-compact">
          {transcript.text.slice(0, 1500)}
          {transcript.text.length > 1500 && (
            <span className="text-muted-foreground"> …({transcript.word_count - 250}+ cuvinte rămase)</span>
          )}
        </div>
      </div>

      {/* Download buttons */}
      <div className="px-5 pb-5">
        <p className="text-micro font-semibold uppercase tracking-widest text-muted-foreground mb-3">Descarcă transcript</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {formats.map((fmt) => (
            <motion.button
              key={fmt.label}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={fmt.onClick}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-background hover:border-primary/30 hover:bg-primary/5 transition-all group"
            >
              <fmt.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-xs font-semibold group-hover:text-primary transition-colors">{fmt.label}</span>
              <span className="text-nano text-muted-foreground/60">{fmt.desc}</span>
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
              onClick={() => navigate(`/extractor${lastEpisodeId ? `?episode=${lastEpisodeId}` : ""}`)}
            >
              Extrage <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="px-5 pb-5 flex justify-center">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={onReset}>
          Transcriere nouă
        </Button>
      </div>
    </motion.div>
  );
}
