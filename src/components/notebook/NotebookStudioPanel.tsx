import { useState } from "react";
import {
  FileText, Video, Presentation, BarChart3, Table2, Map, Mic, TestTube2, Wand2, RotateCcw, Copy, Check,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { NotebookArtifact, NotebookSource } from "@/hooks/useNotebook";
import { toast } from "sonner";

interface Props {
  artifacts: NotebookArtifact[];
  sources: NotebookSource[];
  notebookId?: string;
}

const STUDIO_ACTIONS = [
  { key: "summary", icon: FileText, label: "Summary", desc: "Generate a full summary", prompt: "Generate a comprehensive summary of all provided sources. Structure it with clear sections and key takeaways." },
  { key: "audio", icon: Mic, label: "Audio Script", desc: "Podcast-style script", prompt: "Create a podcast-style audio script that presents the key ideas from the sources in an engaging conversational format." },
  { key: "video", icon: Video, label: "Video Script", desc: "Script from key insights", prompt: "Create a video script with intro, body sections, and outro based on the key insights from the sources." },
  { key: "mindmap", icon: Map, label: "Mind Map", desc: "Visual concept outline", prompt: "Create a text-based mind map / concept outline showing all major ideas and their relationships from the sources. Use indentation to show hierarchy." },
  { key: "report", icon: BarChart3, label: "Report", desc: "Structured analysis", prompt: "Generate a structured analytical report from the sources with Executive Summary, Key Findings, Analysis, and Recommendations." },
  { key: "quiz", icon: TestTube2, label: "Quiz", desc: "Test comprehension", prompt: "Create 10 comprehension questions (mix of multiple choice and open-ended) based on the sources, with answer key." },
  { key: "presentation", icon: Presentation, label: "Presentation", desc: "Slide deck outline", prompt: "Create a presentation outline with 10-15 slides. For each slide provide: Title, Key Points (3-4 bullets), and Speaker Notes." },
  { key: "table", icon: Table2, label: "Data Table", desc: "Extract structured data", prompt: "Extract all structured data, frameworks, lists, and key facts from the sources and present them in organized markdown tables." },
];

export function NotebookStudioPanel({ artifacts, sources, notebookId }: Props) {
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const selectedSources = sources.filter((s) => s.is_selected);

  const handleAction = async (key: string, prompt: string) => {
    if (selectedSources.length === 0) {
      toast.error("Select at least one source first");
      return;
    }
    if (generating) return;

    setGenerating(key);
    let content = "";

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notebook-chat`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          sources: selectedSources.map((s) => ({ title: s.title, content: s.content })),
          mode: "studio",
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              content += delta;
              setGeneratedContent((prev) => ({ ...prev, [key]: content }));
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      toast.success(`${key} generated`);
    } catch (err: any) {
      console.error("Studio error:", err);
      toast.error(err.message || "Generation failed");
    } finally {
      setGenerating(null);
    }
  };

  const copyContent = (key: string) => {
    const content = generatedContent[key];
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Studio</h3>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {selectedSources.length} sources selected • Generate outputs
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 py-3 space-y-1.5">
          {STUDIO_ACTIONS.map(({ key, icon: Icon, label, desc, prompt }) => {
            const isActive = generating === key;
            const hasContent = !!generatedContent[key];

            return (
              <div key={key}>
                <button
                  onClick={() => handleAction(key, prompt)}
                  disabled={!!generating}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-border bg-background hover:bg-accent/5 hover:border-primary/20 transition-colors text-left group",
                    isActive && "border-primary/40 bg-primary/5",
                    !!generating && !isActive && "opacity-50"
                  )}
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    {isActive ? (
                      <RotateCcw className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{desc}</div>
                  </div>
                  {hasContent && (
                    <button
                      onClick={(e) => { e.stopPropagation(); copyContent(key); }}
                      className="text-muted-foreground hover:text-primary transition-colors p-1"
                    >
                      {copiedKey === key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </button>

                {/* Generated content preview */}
                {hasContent && (
                  <div className="mt-1 mx-1 p-3 rounded-md bg-background border border-border text-xs text-foreground max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {generatedContent[key]}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* DB artifacts */}
        {artifacts.length > 0 && (
          <div className="px-3 pb-3">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
              Saved ({artifacts.length})
            </div>
            <div className="space-y-1">
              {artifacts.map((art) => (
                <div
                  key={art.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/5 cursor-pointer transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-foreground truncate flex-1">{art.title}</span>
                  <span className="text-[9px] text-muted-foreground/50 font-mono">{art.artifact_type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
