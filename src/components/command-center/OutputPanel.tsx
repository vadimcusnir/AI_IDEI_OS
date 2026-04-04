import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePublishAnalysis } from "@/hooks/usePublishAnalysis";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save, Download, RotateCcw, Copy, FileText, Brain,
  Lightbulb, Target, BookOpen, Sparkles, Check,
  ChevronRight, ExternalLink, X, Loader2, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import type { OutputItem } from "@/stores/executionStore";
export type { OutputItem };

const TYPE_CONFIG: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  transcript: { icon: FileText, label: "Transcript", color: "text-info" },
  summary: { icon: BookOpen, label: "Summary", color: "text-success" },
  insights: { icon: Lightbulb, label: "Insights", color: "text-warning" },
  frameworks: { icon: Brain, label: "Frameworks", color: "text-semantic-purple" },
  action_plan: { icon: Target, label: "Action Plan", color: "text-warning" },
  content: { icon: Sparkles, label: "Content", color: "text-semantic-rose" },
  raw: { icon: FileText, label: "Output", color: "text-muted-foreground" },
};

interface OutputPanelProps {
  outputs: OutputItem[];
  onRerun?: () => void;
  onClose: () => void;
  onSaveAll?: () => void;
  savingAll?: boolean;
  visible: boolean;
}

export function OutputPanel({ outputs, onRerun, onClose, onSaveAll, savingAll, visible }: OutputPanelProps) {
  const { user } = useAuth();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const { publish, publishing } = usePublishAnalysis();

  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  }, []);

  const handleSaveAsArtifact = useCallback(async (output: OutputItem) => {
    if (!user) return;
    setSavingId(output.id);
    try {
      const { error } = await supabase.from("artifacts").insert([{
        author_id: user.id,
        title: output.title,
        content: output.content,
        artifact_type: output.type === "raw" ? "document" : output.type,
        format: "markdown",
        status: "draft",
        tags: [output.type, "command-center"],
        metadata: (output.metadata || {}) as any,
      }]);
      if (error) throw error;
      setSavedIds(prev => new Set(prev).add(output.id));
      toast.success(`Saved "${output.title}" as artifact`);
    } catch (e) {
      toast.error("Failed to save artifact");
    } finally {
      setSavingId(null);
    }
  }, [user]);

  const handleExport = useCallback((output: OutputItem) => {
    const blob = new Blob([output.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${output.title.replace(/\s+/g, "_").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handlePublish = useCallback(async (output: OutputItem) => {
    const result = await publish({
      title: output.title,
      content: output.content,
      tags: [output.type],
    });
    if (result) {
      setPublishedIds(prev => new Set(prev).add(output.id));
    }
  }, [publish]);

  if (!visible || outputs.length === 0) return null;

  const activeTab = outputs[0]?.type || "raw";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="border border-border rounded-xl bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold">Execution Outputs</span>
          <Badge variant="secondary" className="text-nano h-4">{outputs.length}</Badge>
        </div>
        <div className="flex items-center gap-1">
          {outputs.length > 1 && onSaveAll && (
            <Button variant="default" size="sm" className="h-6 text-nano gap-1" onClick={onSaveAll} disabled={savingAll}>
              {savingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save All ({outputs.length})
            </Button>
          )}
          {onRerun && (
            <Button variant="ghost" size="sm" className="h-6 text-micro gap-1" onClick={onRerun}>
              <RotateCcw className="h-3 w-3" />
              Re-run
            </Button>
          )}
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      {outputs.length > 1 ? (
        <Tabs defaultValue={activeTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-8 px-2">
            {outputs.map(o => {
              const cfg = TYPE_CONFIG[o.type] || TYPE_CONFIG.raw;
              const Icon = cfg.icon;
              return (
                <TabsTrigger key={o.id} value={o.type} className="text-micro h-6 gap-1 data-[state=active]:shadow-none">
                  <Icon className={cn("h-3 w-3", cfg.color)} />
                  {cfg.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          {outputs.map(o => (
            <TabsContent key={o.id} value={o.type} className="m-0">
              <OutputCard
                output={o}
                onCopy={handleCopy}
                onSave={handleSaveAsArtifact}
                onExport={handleExport}
                onPublish={handlePublish}
                saving={savingId === o.id}
                saved={savedIds.has(o.id)}
                publishing={publishing}
                published={publishedIds.has(o.id)}
              />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <OutputCard
          output={outputs[0]}
          onCopy={handleCopy}
          onSave={handleSaveAsArtifact}
          onExport={handleExport}
          onPublish={handlePublish}
          saving={savingId === outputs[0].id}
          saved={savedIds.has(outputs[0].id)}
          publishing={publishing}
          published={publishedIds.has(outputs[0].id)}
        />
      )}
    </motion.div>
  );
}

function OutputCard({
  output,
  onCopy,
  onSave,
  onExport,
  onPublish,
  saving,
  saved,
  publishing,
  published,
}: {
  output: OutputItem;
  onCopy: (content: string) => void;
  onSave: (output: OutputItem) => void;
  onExport: (output: OutputItem) => void;
  onPublish: (output: OutputItem) => void;
  saving: boolean;
  saved: boolean;
  publishing: boolean;
  published: boolean;
}) {
  const cfg = TYPE_CONFIG[output.type] || TYPE_CONFIG.raw;

  return (
    <div className="max-h-[400px] overflow-y-auto">
      {/* Actions bar */}
      <div className="sticky top-0 px-4 py-2 bg-card/95 backdrop-blur-sm border-b border-border flex items-center justify-between z-10">
        <p className="text-dense font-medium">{output.title}</p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-6 text-nano gap-1" onClick={() => onCopy(output.content)}>
            <Copy className="h-3 w-3" />
            Copy
          </Button>
          <Button variant="ghost" size="sm" className="h-6 text-nano gap-1" onClick={() => onExport(output)}>
            <Download className="h-3 w-3" />
            Export
          </Button>
          <Button
            variant={saved ? "ghost" : "default"}
            size="sm"
            className="h-6 text-nano gap-1"
            onClick={() => onSave(output)}
            disabled={saving || saved}
          >
            {saved ? (
              <><Check className="h-3 w-3 text-success" /> Saved</>
            ) : (
              <><Save className="h-3 w-3" /> Save</>
            )}
          </Button>
          <Button
            variant={published ? "ghost" : "outline"}
            size="sm"
            className="h-6 text-nano gap-1"
            onClick={() => onPublish(output)}
            disabled={publishing || published}
          >
            {published ? (
              <><Check className="h-3 w-3 text-success" /> Published</>
            ) : publishing ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Publishing...</>
            ) : (
              <><Globe className="h-3 w-3" /> Publish</>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <div className="prose prose-xs dark:prose-invert max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_h2]:text-xs [&_h3]:text-xs [&_li]:text-xs [&_code]:text-micro">
          <ReactMarkdown>{output.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
