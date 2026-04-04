import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText, Brain, ChevronDown, ChevronUp, Check, Loader2,
  Mic, Clock, Sparkles, ArrowRight, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ContentSource {
  id: string;
  type: "episode" | "neuron";
  title: string;
  preview: string;
  fullContent: string;
  date: string;
  status?: string;
  category?: string;
}

interface Props {
  onSelect: (content: string, source: ContentSource) => void;
  selectedId?: string;
}

export function ContentSourcePicker({ onSelect, selectedId }: Props) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [activeTab, setActiveTab] = useState<"episode" | "neuron">("episode");
  const [search, setSearch] = useState("");

  // Reload sources every time the picker opens
  useEffect(() => {
    if (open) loadSources();
  }, [open]);

  const loadSources = async () => {
    if (!user || !currentWorkspace) return;
    setLoading(true);

    const [episodesRes, neuronsRes] = await Promise.all([
      supabase
        .from("episodes")
        .select("id, title, transcript, status, created_at, source_url")
        .eq("workspace_id", currentWorkspace.id)
        .not("transcript", "is", null)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("neurons")
        .select("id, title, status, content_category, created_at, neuron_blocks(content, position)")
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const items: ContentSource[] = [];

    if (episodesRes.data) {
      for (const ep of episodesRes.data) {
        if (!ep.transcript || (ep.transcript as string).length < 20) continue;
        const text = ep.transcript as string;
        items.push({
          id: ep.id,
          type: "episode",
          title: ep.title || ep.source_url || "Episode",
          preview: text.slice(0, 120) + (text.length > 120 ? "..." : ""),
          fullContent: text,
          date: ep.created_at,
          status: ep.status,
        });
      }
    }

    if (neuronsRes.data) {
      for (const n of neuronsRes.data) {
        const blocks = Array.isArray(n.neuron_blocks) ? n.neuron_blocks : [];
        const text = blocks
          .sort((a: any, b: any) => a.position - b.position)
          .map((b: any) => b.content)
          .filter(Boolean)
          .join("\n\n");
        if (text.length < 10) continue;
        items.push({
          id: String(n.id),
          type: "neuron",
          title: n.title || "Neuron",
          preview: text.slice(0, 120) + (text.length > 120 ? "..." : ""),
          fullContent: text,
          date: n.created_at,
          status: n.status,
          category: n.content_category ?? undefined,
        });
      }
    }

    setSources(items);
    setLoading(false);
  };

  const episodes = sources.filter(s => s.type === "episode");
  const neurons = sources.filter(s => s.type === "neuron");
  const activeList = activeTab === "episode" ? episodes : neurons;

  const filteredList = useMemo(() => {
    if (!search.trim()) return activeList;
    const q = search.toLowerCase();
    return activeList.filter(s =>
      s.title.toLowerCase().includes(q) || s.preview.toLowerCase().includes(q)
    );
  }, [activeList, search]);

  const hasContent = episodes.length > 0 || neurons.length > 0;

  if (!open) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-primary/20 bg-primary/5 p-4"
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium mb-0.5">Selectează sursa de conținut</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Alege un episod transcris sau un neuron extras pentru a completa automat câmpurile serviciului. 
              Nu mai trebuie să copiezi manual — sistemul preia tot conținutul.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setOpen(true)}
            className="gap-1.5 text-xs shrink-0"
          >
            <FileText className="h-3.5 w-3.5" />
            Alege sursa
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>

        {selectedId && (
          <div className="mt-3 flex items-center gap-2 text-xs text-primary">
            <Check className="h-3.5 w-3.5" />
            <span className="font-medium">Sursă selectată — conținutul a fost completat automat</span>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Selectează sursa</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Caută episoade sau neuroni..."
            className="h-8 text-xs pl-8"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => { setActiveTab("episode"); setSearch(""); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
            activeTab === "episode"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Mic className="h-3.5 w-3.5" />
          Episoade ({episodes.length})
        </button>
        <button
          onClick={() => { setActiveTab("neuron"); setSearch(""); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
            activeTab === "neuron"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Brain className="h-3.5 w-3.5" />
          Neuroni ({neurons.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !hasContent ? (
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Niciun conținut disponibil</p>
          <p className="text-xs text-muted-foreground/70">
            Încarcă un episod în Extractor sau creează neuroni mai întâi.
          </p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Niciun rezultat pentru „{search}"</p>
        </div>
      ) : (
        <>
          <ScrollArea className="max-h-[420px]">
            <div className="p-2 space-y-1">
              <AnimatePresence mode="popLayout">
                {filteredList.map((source) => {
                  const isSelected = selectedId === source.id;
                  return (
                    <motion.button
                      key={source.id}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onClick={() => {
                        onSelect(source.fullContent, source);
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full text-left rounded-lg p-3 transition-colors group",
                        isSelected
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/50 border border-transparent"
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={cn(
                          "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                          source.type === "episode" ? "bg-primary/10" : "bg-accent/30"
                        )}>
                          {source.type === "episode"
                            ? <Mic className="h-3.5 w-3.5 text-primary" />
                            : <Brain className="h-3.5 w-3.5 text-accent-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium truncate">{source.title}</span>
                            {source.category && (
                              <Badge variant="outline" className="text-nano shrink-0">{source.category}</Badge>
                            )}
                          </div>
                          <p className="text-dense text-muted-foreground line-clamp-2 leading-relaxed">
                            {source.preview}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-micro text-muted-foreground/60 flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {new Date(source.date).toLocaleDateString("ro-RO")}
                            </span>
                            <span className="text-micro text-muted-foreground/60">
                              {(source.fullContent.length / 1000).toFixed(1)}k caractere
                            </span>
                          </div>
                        </div>
                        <ArrowRight className={cn(
                          "h-3.5 w-3.5 mt-1 shrink-0 transition-all",
                          isSelected ? "text-primary" : "text-muted-foreground/30 group-hover:text-muted-foreground"
                        )} />
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>
          {filteredList.length > 5 && (
            <div className="px-3 py-2 border-t border-border text-center">
              <span className="text-micro text-muted-foreground">
                {filteredList.length} {activeTab === "episode" ? "episoade" : "neuroni"} disponibile — scroll pentru mai multe
              </span>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
