import { useState, useMemo } from "react";
import { User, Clock, ChevronDown, ChevronUp, Search, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface TranscriptSegment {
  speaker: string;
  text: string;
  startTime?: number;
}

interface TranscriptViewerProps {
  transcript: string;
}

const SPEAKER_COLORS = [
  "border-primary/30 bg-primary/5",
  "border-accent/30 bg-accent/5",
  "border-destructive/20 bg-destructive/5",
  "border-chart-3/30 bg-chart-3/5",
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function parseTranscript(raw: string): TranscriptSegment[] {
  const lines = raw.split("\n").filter(l => l.trim());
  const segments: TranscriptSegment[] = [];
  const speakerRe = /^(?:\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*)?([A-Za-zĂÂÎȘȚăâîșț][A-Za-zĂÂÎȘȚăâîșț\s.'-]{1,40}?)(?:\s*\((\d{1,2}:\d{2}(?::\d{2})?)\))?\s*:\s*(.+)/;
  let hasSpeakers = false;

  for (const line of lines) {
    const m = line.match(speakerRe);
    if (m) {
      hasSpeakers = true;
      const ts = m[1] || m[3];
      let startTime: number | undefined;
      if (ts) {
        const p = ts.split(":").map(Number);
        startTime = p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
      }
      segments.push({ speaker: m[2].trim(), text: m[4].trim(), startTime });
    } else if (hasSpeakers && segments.length > 0) {
      segments[segments.length - 1].text += " " + line.trim();
    } else {
      segments.push({ speaker: "", text: line.trim() });
    }
  }
  return segments;
}

export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  const { t } = useTranslation("common");
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);

  const segments = useMemo(() => parseTranscript(transcript), [transcript]);
  const speakers = useMemo(() => {
    const s = new Set<string>();
    segments.forEach(seg => { if (seg.speaker) s.add(seg.speaker); });
    return Array.from(s);
  }, [segments]);

  const colorMap = useMemo(() => {
    const m: Record<string, string> = {};
    speakers.forEach((s, i) => { m[s] = SPEAKER_COLORS[i % SPEAKER_COLORS.length]; });
    return m;
  }, [speakers]);

  const filtered = useMemo(() => {
    let r = segments;
    if (activeSpeaker) r = r.filter(s => s.speaker === activeSpeaker);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(s => s.text.toLowerCase().includes(q) || s.speaker.toLowerCase().includes(q));
    }
    return r;
  }, [segments, activeSpeaker, search]);

  const hasSpeakers = speakers.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">{t("transcript.transcript")}</span>
          <Badge variant="secondary" className="text-nano">{t("transcript.segments", { count: segments.length })}</Badge>
          {hasSpeakers && <Badge variant="outline" className="text-nano">{t("transcript.speakers", { count: speakers.length })}</Badge>}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors">
          {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="px-4 py-2 border-b border-border flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("transcript.search_transcript")} className="h-7 text-xs pl-8" />
            </div>
            {hasSpeakers && (
              <div className="flex items-center gap-1 flex-wrap">
                <button onClick={() => setActiveSpeaker(null)}
                  className={cn("text-micro px-2.5 py-1 rounded-full border transition-colors",
                    !activeSpeaker ? "bg-primary/10 text-primary border-primary/20" : "border-border hover:bg-muted")}>{t("all")}</button>
                {speakers.map(s => (
                  <button key={s} onClick={() => setActiveSpeaker(activeSpeaker === s ? null : s)}
                    className={cn("text-micro px-2.5 py-1 rounded-full border transition-colors",
                      activeSpeaker === s ? "bg-primary/10 text-primary border-primary/20" : "border-border hover:bg-muted")}>{s}</button>
                ))}
              </div>
            )}
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            <div className="px-4 py-3 space-y-2">
              {filtered.map((seg, i) => (
                <div key={i} className={cn("flex gap-3", hasSpeakers && "pl-1")}>
                  {hasSpeakers && (
                    <div className="flex flex-col items-center pt-1">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary/40 ring-2 ring-background shrink-0" />
                      {i < filtered.length - 1 && <div className="w-px flex-1 bg-border/50 mt-1" />}
                    </div>
                  )}
                  <div className={cn("flex-1 rounded-lg p-3 border transition-colors", seg.speaker ? colorMap[seg.speaker] || "border-border" : "border-border")}>
                    {seg.speaker && (
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-dense font-semibold text-foreground">{seg.speaker}</span>
                        {seg.startTime !== undefined && (
                          <span className="text-nano text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" /> {formatTime(seg.startTime)}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-foreground/80 leading-relaxed">{seg.text}</p>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div className="text-center py-8 text-sm text-muted-foreground">{t("transcript.no_matching_segments")}</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
