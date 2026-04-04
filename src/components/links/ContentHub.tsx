import { useState, useEffect, useMemo } from "react";
import {
  Play, Podcast, Newspaper, Mail, Rss, ExternalLink,
  Clock, ChevronRight, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

/* ─── Types ─── */
interface ContentItem {
  id: string;
  title: string;
  description: string;
  url: string;
  channel: "youtube" | "podcast" | "blog" | "newsletter";
  date?: string;
  isNew?: boolean;
}

const CHANNEL_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  youtube:    { icon: Play,      color: "text-destructive",      label: "YouTube" },
  podcast:    { icon: Podcast,   color: "text-primary",          label: "Podcast" },
  blog:       { icon: Newspaper, color: "text-muted-foreground", label: "Blog" },
  newsletter: { icon: Mail,      color: "text-ai-accent",        label: "Newsletter" },
};

/* ─── Static seed content (replaced by DB/RSS in future) ─── */
const SEED_CONTENT: ContentItem[] = [
  { id: "yt-1", title: "Cum funcționează Knowledge Extraction cu AI", description: "Tutorial complet: de la text brut la neuroni structurați", url: "https://youtube.com/@ai-idei", channel: "youtube", isNew: true },
  { id: "yt-2", title: "Demo: Codul Cușnir în acțiune", description: "Aplicarea formulelor de copywriting cu AI-IDEI", url: "https://youtube.com/@ai-idei", channel: "youtube" },
  { id: "pod-1", title: "Episod #1: Ce este un Neuron?", description: "Conversație despre atomizarea cunoștințelor", url: "#", channel: "podcast", isNew: true },
  { id: "blog-1", title: "Ghid: Primii 10 Neuroni", description: "Cum să începi să îți structurezi cunoștințele", url: "#", channel: "blog" },
  { id: "nl-1", title: "Newsletter: Actualizări săptămânale", description: "Cele mai noi funcționalități și studii de caz", url: "#", channel: "newsletter" },
];

type ChannelFilter = "all" | "youtube" | "podcast" | "blog" | "newsletter";

export function ContentHub() {
  const [filter, setFilter] = useState<ChannelFilter>("all");
  const [content, setContent] = useState<ContentItem[]>(SEED_CONTENT);

  // In the future, this will fetch from a content_feed table or RSS
  // useEffect(() => { fetchContentFromDB(); }, []);

  const filtered = useMemo(() =>
    filter === "all" ? content : content.filter(c => c.channel === filter),
    [content, filter]
  );

  const channels: { key: ChannelFilter; label: string }[] = [
    { key: "all", label: "Toate" },
    { key: "youtube", label: "YouTube" },
    { key: "podcast", label: "Podcast" },
    { key: "blog", label: "Blog" },
    { key: "newsletter", label: "Newsletter" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-micro font-semibold uppercase tracking-widest text-muted-foreground">
          Hub de Conținut
        </h2>
        <Rss className="h-3 w-3 text-muted-foreground/40" />
      </div>

      {/* Channel filter tabs */}
      <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
        {channels.map(ch => {
          const meta = ch.key !== "all" ? CHANNEL_META[ch.key] : null;
          return (
            <button
              key={ch.key}
              onClick={() => setFilter(ch.key)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-micro font-medium transition-all whitespace-nowrap",
                filter === ch.key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {meta && <meta.icon className={cn("h-2.5 w-2.5", filter === ch.key ? "text-primary" : meta.color)} />}
              {ch.label}
            </button>
          );
        })}
      </div>

      {/* Content cards */}
      <div className="space-y-2">
        {filtered.map(item => {
          const meta = CHANNEL_META[item.channel];
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl border border-border bg-card
                hover:border-primary/25 hover:shadow-md hover:shadow-primary/5
                transition-all group"
            >
              <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-muted group-hover:bg-primary/10 transition-colors">
                <meta.icon className={cn("h-4 w-4 transition-colors", meta.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                    {item.title}
                  </span>
                  {item.isNew && (
                    <span className="text-nano font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-status-validated/15 text-status-validated shrink-0">
                      New
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 shrink-0" />
            </a>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-muted-foreground/50 text-center py-6">
          Nu există conținut pentru acest canal încă.
        </p>
      )}
    </div>
  );
}
