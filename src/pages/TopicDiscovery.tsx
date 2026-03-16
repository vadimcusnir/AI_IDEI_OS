import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, TrendingUp, Search, Tag, Layers, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface TopicCluster {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  entity_count: number;
}

interface EmergingEntity {
  id: string;
  slug: string;
  title: string;
  entity_type: string;
  idea_rank: number;
  importance_score: number;
}

export default function TopicDiscovery() {
  const { t } = useTranslation("pages");
  const [topics, setTopics] = useState<TopicCluster[]>([]);
  const [emerging, setEmerging] = useState<EmergingEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const [topicsRes, emergingRes] = await Promise.all([
        supabase
          .from("topics")
          .select("*")
          .order("entity_count", { ascending: false })
          .limit(100),
        supabase
          .from("entities")
          .select("id, slug, title, entity_type, idea_rank, importance_score")
          .eq("is_published", true)
          .order("importance_score", { ascending: false })
          .limit(20),
      ]);

      setTopics((topicsRes.data as TopicCluster[]) || []);
      setEmerging((emergingRes.data as EmergingEntity[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = search.trim()
    ? topics.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    : topics;

  const large = filtered.filter(t => t.entity_count >= 10);
  const medium = filtered.filter(t => t.entity_count >= 3 && t.entity_count < 10);
  const small = filtered.filter(t => t.entity_count < 3);

  const typeColors: Record<string, string> = {
    insight: "bg-primary/10 text-primary",
    pattern: "bg-orange-500/10 text-orange-600",
    formula: "bg-violet-500/10 text-violet-600",
    contradiction: "bg-destructive/10 text-destructive",
    application: "bg-emerald-500/10 text-emerald-600",
    profile: "bg-blue-500/10 text-blue-600",
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Discovery — AI-IDEI Knowledge Graph"
        description="Explore emerging ideas, trending topics, and knowledge clusters in the AI-IDEI intelligence graph."
      />

      {/* Hero */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t("topic_discovery.breadcrumb")}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">{t("topic_discovery.title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-[65ch] leading-relaxed">
            {t("topic_discovery.desc")}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {emerging.length > 0 && (
              <section>
                <h2 className="text-lg font-serif font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {t("topic_discovery.emerging_ideas")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {emerging.slice(0, 8).map((e, i) => (
                    <Link
                      key={e.id}
                      to={`/${e.entity_type}s/${e.slug}`}
                      className={cn(
                        "p-4 rounded-xl border transition-colors hover:border-primary/30 group",
                        i < 2 ? "bg-primary/5 border-primary/20" : "bg-card border-border"
                      )}
                    >
                      <Badge variant="outline" className={cn("text-[9px] mb-2", typeColors[e.entity_type] || "")}>
                        {e.entity_type}
                      </Badge>
                      <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-2">
                        {e.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {t("topic_discovery.score", { score: (e.importance_score || 0).toFixed(1) })}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-serif font-bold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  {t("topic_discovery.topic_clusters")}
                </h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t("topic_discovery.filter_placeholder")}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-8 text-xs"
                  />
                </div>
              </div>

              {large.length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    {t("topic_discovery.major_clusters", { count: large.length })}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {large.map(tc => (
                      <TopicCard key={tc.id} topic={tc} size="large" entitiesLabel={t("topic_discovery.entities", { count: tc.entity_count })} />
                    ))}
                  </div>
                </div>
              )}

              {medium.length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    {t("topic_discovery.growing_clusters", { count: medium.length })}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {medium.map(tc => (
                      <TopicCard key={tc.id} topic={tc} size="medium" entitiesLabel={t("topic_discovery.entities", { count: tc.entity_count })} />
                    ))}
                  </div>
                </div>
              )}

              {small.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    {t("topic_discovery.emerging_topics", { count: small.length })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {small.map(tc => (
                      <Link
                        key={tc.id}
                        to={`/topics/${tc.slug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 border border-border rounded-full text-xs hover:border-primary/30 hover:text-primary transition-colors"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {tc.title}
                        <span className="text-muted-foreground">({tc.entity_count})</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <Layers className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {search ? t("topic_discovery.no_topics_search") : t("topic_discovery.no_topics")}
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function TopicCard({ topic, size, entitiesLabel }: { topic: TopicCluster; size: "large" | "medium"; entitiesLabel: string }) {
  return (
    <Link
      to={`/topics/${topic.slug}`}
      className={cn(
        "flex items-center gap-3 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors group",
        size === "large" ? "p-4" : "p-3"
      )}
    >
      <div className={cn(
        "rounded-lg bg-primary/10 flex items-center justify-center shrink-0",
        size === "large" ? "h-10 w-10" : "h-8 w-8"
      )}>
        <Tag className={cn("text-primary", size === "large" ? "h-4 w-4" : "h-3 w-3")} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          "font-semibold truncate group-hover:text-primary transition-colors",
          size === "large" ? "text-sm" : "text-xs"
        )}>
          {topic.title}
        </h3>
        {size === "large" && topic.description && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{topic.description}</p>
        )}
        <span className="text-[9px] text-muted-foreground">{entitiesLabel}</span>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary shrink-0" />
    </Link>
  );
}
