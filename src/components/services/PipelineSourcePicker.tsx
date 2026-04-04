import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { truncateForService, formatTruncationMessage } from "@/lib/contentTruncation";
import { toast } from "sonner";
import {
  Mic, Brain, Search, Check, Loader2, ChevronDown, ChevronUp, Clock, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SourceItem {
  id: string;
  type: "episode" | "neuron";
  title: string;
  preview: string;
  fullContent: string;
  date: string;
  category?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
}

export function PipelineSourcePicker({ value, onChange, placeholder, minRows = 4 }: Props) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [tab, setTab] = useState<"episode" | "neuron">("episode");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open && sources.length === 0) loadSources();
  }, [open]);

  const loadSources = async () => {
    if (!user || !currentWorkspace) return;
    setLoading(true);
    const [epRes, nRes] = await Promise.all([
      supabase.from("episodes")
        .select("id, title, transcript, status, created_at, source_url")
        .eq("workspace_id", currentWorkspace.id)
        .not("transcript", "is", null)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("neurons")
        .select("id, title, content_category, created_at, neuron_blocks(content, position)")
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const items: SourceItem[] = [];
    if (epRes.data) {
      for (const ep of epRes.data) {
        const text = ep.transcript as string;
        if (!text || text.length < 20) continue;
        items.push({
          id: ep.id, type: "episode",
          title: ep.title || ep.source_url || "Episode",
          preview: text.slice(0, 100),
          fullContent: text,
          date: ep.created_at,
        });
      }
    }
    if (nRes.data) {
      for (const n of nRes.data) {
        const blocks = Array.isArray(n.neuron_blocks) ? n.neuron_blocks : [];
        const text = blocks
          .sort((a: any, b: any) => a.position - b.position)
          .map((b: any) => b.content).filter(Boolean).join("\n\n");
        if (text.length < 10) continue;
        items.push({
          id: String(n.id), type: "neuron",
          title: n.title || "Neuron",
          preview: text.slice(0, 100),
          fullContent: text,
          date: n.created_at,
          category: n.content_category ?? undefined,
        });
      }
    }
    setSources(items);
    setLoading(false);
  };

  const episodes = sources.filter(s => s.type === "episode");
  const neurons = sources.filter(s => s.type === "neuron");
  const activeList = tab === "episode" ? episodes : neurons;

  const filtered = useMemo(() => {
    if (!search.trim()) return activeList;
    const q = search.toLowerCase();
    return activeList.filter(s => s.title.toLowerCase().includes(q) || s.preview.toLowerCase().includes(q));
  }, [activeList, search]);

  const handleSelect = (src: SourceItem) => {
    setSelectedId(src.id);
    const result = truncateForService(src.fullContent);
    onChange(result.content);
    if (result.wasTruncated) {
      toast.info(formatTruncationMessage(result), { duration: 6000 });
    }
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {/* Source selector button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={selectedId ? "default" : "outline"}
          size="sm"
          onClick={() => setOpen(!open)}
          className="gap-1.5 text-xs"
        >
          {selectedId ? <Check className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
          {selectedId ? "Sursă selectată" : "Alege din episoade / neuroni"}
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
        {selectedId && (
          <span className="text-micro text-muted-foreground">
            Conținut completat automat · poți edita mai jos
          </span>
        )}
      </div>

      {/* Dropdown picker */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border border-border bg-card overflow-hidden"
          >
            {/* Search */}
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Caută..." className="h-7 text-xs pl-7"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              {[
                { key: "episode" as const, label: "Episoade", icon: Mic, count: episodes.length },
                { key: "neuron" as const, label: "Neuroni", icon: Brain, count: neurons.length },
              ].map(t => (
                <button key={t.key}
                  onClick={() => { setTab(t.key); setSearch(""); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-2 text-dense font-medium transition-colors",
                    tab === t.key ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <t.icon className="h-3 w-3" />
                  {t.label} ({t.count})
                </button>
              ))}
            </div>

            {/* List */}
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {sources.length === 0 ? "Niciun conținut disponibil" : `Niciun rezultat pentru „${search}"`}
              </div>
            ) : (
              <ScrollArea className="max-h-[280px]">
                <div className="p-1.5 space-y-0.5">
                  {filtered.map(src => (
                    <button key={src.id}
                      onClick={() => handleSelect(src)}
                      className={cn(
                        "w-full text-left rounded-md p-2.5 transition-colors group",
                        selectedId === src.id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/50 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn("h-6 w-6 rounded flex items-center justify-center shrink-0",
                          src.type === "episode" ? "bg-primary/10" : "bg-accent/30"
                        )}>
                          {src.type === "episode"
                            ? <Mic className="h-3 w-3 text-primary" />
                            : <Brain className="h-3 w-3 text-accent-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-dense font-medium truncate">{src.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-nano text-muted-foreground/60 flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {new Date(src.date).toLocaleDateString("ro-RO")}
                            </span>
                            {src.category && (
                              <Badge variant="outline" className="text-nano h-3.5 px-1">{src.category}</Badge>
                            )}
                            <span className="text-nano text-muted-foreground/60">
                              {(src.fullContent.length / 1000).toFixed(1)}k
                            </span>
                          </div>
                        </div>
                        {selectedId === src.id && <Check className="h-3 w-3 text-primary shrink-0" />}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content preview / edit - read-only feel but editable */}
      {value && (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={minRows}
          placeholder={placeholder}
          className="w-full bg-muted/30 rounded-lg px-3 py-2.5 text-xs outline-none border border-border/50 focus:border-primary/30 transition-all resize-none text-muted-foreground"
        />
      )}
    </div>
  );
}
