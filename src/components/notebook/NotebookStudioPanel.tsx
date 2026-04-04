import { useState } from "react";
import {
  FileText, Video, Presentation, BarChart3, Table2, Map, Mic, TestTube2, Wand2, RotateCcw, Copy, Check, Save, RefreshCw, Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { NotebookArtifact, NotebookSource } from "@/hooks/useNotebook";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useQueryClient } from "@tanstack/react-query";

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
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [viewingArtifactId, setViewingArtifactId] = useState<string | null>(null);
  const qc = useQueryClient();

  const selectedSources = sources.filter((s) => s.is_selected);

  const handleAction = async (key: string, prompt: string) => {
    if (selectedSources.length === 0) {
      toast.error("Select at least one source first");
      return;
    }
    if (generating) return;

    setGenerating(key);
    setExpandedKey(key);
    // Reset saved state for regeneration
    setSavedKeys((prev) => { const n = new Set(prev); n.delete(key); return n; });
    let content = "";

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notebook-chat`;
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) { toast.error("Not authenticated"); setGenerating(null); return; }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

  const saveArtifact = async (key: string, label: string) => {
    if (!notebookId || !generatedContent[key]) return;
    try {
      const { error } = await supabase.from("notebook_artifacts").insert({
        notebook_id: notebookId,
        artifact_type: key,
        title: label,
        content: generatedContent[key],
      });
      if (error) throw error;
      setSavedKeys((prev) => new Set(prev).add(key));
      qc.invalidateQueries({ queryKey: ["notebook-artifacts", notebookId] });
      toast.success(`${label} saved`);
    } catch {
      toast.error("Save failed");
    }
  };

  const copyContent = (content: string, key?: string) => {
    navigator.clipboard.writeText(content);
    if (key) setCopiedKey(key);
    toast.success("Copied");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Wand2 className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Studio</h3>
        </div>
        <p className="text-micro text-muted-foreground mt-1.5">
          {selectedSources.length === 0
            ? "Select sources to start generating"
            : `${selectedSources.length} source${selectedSources.length !== 1 ? "s" : ""} selected — ready to generate`
          }
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 py-3 space-y-1.5">
          {STUDIO_ACTIONS.map(({ key, icon: Icon, label, desc, prompt }, idx) => {
            const isActive = generating === key;
            const hasContent = !!generatedContent[key];
            const isSaved = savedKeys.has(key);
            const isExpanded = expandedKey === key;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <button
                  onClick={() => hasContent ? setExpandedKey(isExpanded ? null : key) : handleAction(key, prompt)}
                  disabled={!!generating && !isActive}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-border bg-background hover:bg-accent/5 hover:border-primary/20 transition-all text-left group",
                    isActive && "border-primary/40 bg-primary/5",
                    hasContent && "border-primary/20",
                    !!generating && !isActive && "opacity-50"
                  )}
                >
                  <div className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    hasContent ? "bg-primary/10" : "bg-primary/5 group-hover:bg-primary/10"
                  )}>
                    {isActive ? (
                      <RotateCcw className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      {label}
                      {hasContent && <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                    <div className="text-micro text-muted-foreground truncate">{desc}</div>
                  </div>
                  {hasContent && (
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAction(key, prompt); }}
                        className="text-muted-foreground hover:text-primary transition-colors p-1"
                        title="Regenerate"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      {!isSaved && (
                        <button
                          onClick={(e) => { e.stopPropagation(); saveArtifact(key, label); }}
                          className="text-muted-foreground hover:text-primary transition-colors p-1"
                          title="Save"
                        >
                          <Save className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); copyContent(generatedContent[key], key); }}
                        className="text-muted-foreground hover:text-primary transition-colors p-1"
                        title="Copy"
                      >
                        {copiedKey === key ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {(isExpanded || isActive) && hasContent && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 mx-1 p-3 rounded-md bg-background border border-border text-xs max-h-60 overflow-y-auto">
                        <div className="prose prose-xs dark:prose-invert max-w-none">
                          <ReactMarkdown>{generatedContent[key]}</ReactMarkdown>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Saved artifacts */}
        {artifacts.length > 0 && (
          <div className="px-3 pb-3">
            <div className="text-micro font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
              Saved ({artifacts.length})
            </div>
            <div className="space-y-1">
              {artifacts.map((art, idx) => {
                const isViewing = viewingArtifactId === art.id;
                return (
                  <motion.div
                    key={art.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/5 cursor-pointer transition-colors group"
                      onClick={() => setViewingArtifactId(isViewing ? null : art.id)}
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-foreground truncate flex-1">{art.title}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); copyContent(art.content || ""); }}
                          className="text-muted-foreground hover:text-primary p-0.5"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <Eye className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                    <AnimatePresence>
                      {isViewing && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mx-2 mb-1 p-2 rounded bg-muted/30 text-micro max-h-48 overflow-y-auto">
                            <div className="prose prose-xs dark:prose-invert max-w-none">
                              <ReactMarkdown>{art.content || ""}</ReactMarkdown>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
