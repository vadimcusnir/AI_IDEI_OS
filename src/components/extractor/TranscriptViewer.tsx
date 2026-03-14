import { useState, useMemo } from "react";
import { User, Clock, ChevronDown, ChevronUp, Search, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TranscriptSegment {
  speaker: string;
  text: string;
  startTime?: number; // seconds
  endTime?: number;
}

interface TranscriptViewerProps {
  transcript: string;
}

const SPEAKER_COLORS = [
  "border-primary/30 bg-primary/5",
  "border-accent/30 bg-accent/5",
  "border-destructive/20 bg-destructive/5",
  "border-chart-3/30 bg-chart-3/5",
  "border-chart-4/30 bg-chart-4/5",
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Parse transcript text into speaker segments.
 * Supports formats:
 * - "Speaker Name: text..."
 * - "[00:01:23] Speaker Name: text..."
 * - "Speaker Name (00:01:23): text..."
 * Falls back to paragraph-based view if no speakers detected.
 */
function parseTranscript(raw: string): TranscriptSegment[] {
  const lines = raw.split("\n").filter(l => l.trim());
  const segments: TranscriptSegment[] = [];

  // Try speaker-based parsing
  const speakerPattern = /^(?:\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*)?([A-ZĂÂÎȘȚa-zăâîșț][A-Za-zĂÂÎȘȚăâîșț\s.'-]{1,40}?)(?:\s*\((\d{1,2}:\d{2}(?::\d{2})?)\))?\s*:\s*(.+)/;

  let hasSpeakers = false;

  for (const line of lines) {
    const match = line.match(speakerPattern);
    if (match) {
      hasSpeakers = true;
      const timeStr = match[1] || match[3];
      let startTime: number | undefined;
      if (timeStr) {
        const parts = timeStr.split(":").map(Number);
        startTime = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
      }
      segments.push({ speaker: match[2].trim(), text: match[4].trim(), startTime });
    } else if (hasSpeakers && segments.length > 0) {
      // Continuation of previous speaker
      segments[segments.length - 1].text += " " + line.trim();
    } else {
      segments.push({ speaker: "", text: line.trim() });
    }
  }

  return segments;
}

export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);

  const segments = useMemo(() => parseTranscript(transcript), [transcript]);

  const speakers = useMemo(() => {
    const set = new Set<string>();
    segments.forEach(s => { if (s.speaker) set.add(s.speaker); });
    return Array.from(set);
  }, [segments]);

  const speakerColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    speakers.forEach((s, i) => { map[s] = SPEAKER_COLORS[i % SPEAKER_COLORS.length]; });
    return map;
  }, [speakers]);

  const filtered = useMemo(() => {
    let result = segments;
    if (activeSpeaker) result = result.filter(s => s.speaker === activeSpeaker);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => s.text.toLowerCase().includes(q) || s.speaker.toLowerCase().includes(q));
    }
    return result;
  }, [segments, activeSpeaker, search]);

  const hasSpeakers = speakers.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Transcript</span>
          <Badge variant="secondary" className="text-[9px]">{segments.length} segments</Badge>
          {hasSpeakers && <Badge variant="outline" className="text-[9px]">{speakers.length} speakers</Badge>}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors">
          {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Controls */}
          <div className="px-4 py-2 border-b border-border flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transcript..."
                className="h-7 text-xs pl-8" />
            </div>
            {hasSpeakers && (
              <div className="flex items-center gap-1 flex-wrap">
                <button onClick={() => setActiveSpeaker(null)}
                  className={cn("text-[10px] px-2.5 py-1 rounded-full border transition-colors",
                    !activeSpeaker ? "bg-primary/10 text-primary border-primary/20" : "border-border hover:bg-muted")}>
                  All
                </button>
                {speakers.map(s => (
                  <button key={s} onClick={() => setActiveSpeaker(activeSpeaker === s ? null : s)}
                    className={cn("text-[10px] px-2.5 py-1 rounded-full border transition-colors",
                      activeSpeaker === s ? "bg-primary/10 text-primary border-primary/20" : "border-border hover:bg-muted")}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="max-h-[500px] overflow-y-auto">
            <div className="px-4 py-3 space-y-2">
              {filtered.map((seg, i) => (
                <div key={i} className={cn("flex gap-3 group", hasSpeakers && "pl-1")}>
                  {/* Timeline dot */}
                  {hasSpeakers && (
                    <div className="flex flex-col items-center pt-1">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary/40 ring-2 ring-background shrink-0" />
                      {i < filtered.length - 1 && <div className="w-px flex-1 bg-border/50 mt-1" />}
                    </div>
                  )}

                  <div className={cn("flex-1 rounded-lg p-3 border transition-colors", seg.speaker ? speakerColorMap[seg.speaker] || "border-border" : "border-border")}>
                    {seg.speaker && (
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-[11px] font-semibold text-foreground">{seg.speaker}</span>
                        {seg.startTime !== undefined && (
                          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" /> {formatTime(seg.startTime)}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-foreground/80 leading-relaxed">{seg.text}</p>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">No matching segments found.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
