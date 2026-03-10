import { useEffect, useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useParams, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Brain, ChevronRight, ArrowRight, ExternalLink, Loader2, Tag, Quote, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Entity {
  id: string;
  neuron_id: number | null;
  entity_type: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  confidence_score: number;
  importance_score: number;
  evidence_count: number;
  idea_rank: number;
  insight_family: string | null;
  reuse_count: number;
  citation_sources: any[];
  created_at: string;
}

interface RelatedEntity {
  id: string;
  entity_type: string;
  slug: string;
  title: string;
  summary: string | null;
  relation_type: string;
  weight: number;
  direction: "outgoing" | "incoming";
}

interface TopicRef {
  id: string;
  slug: string;
  title: string;
}

const TYPE_PATH: Record<string, string> = {
  insight: "insights",
  pattern: "patterns",
  formula: "formulas",
  application: "applications",
  contradiction: "contradictions",
  profile: "profiles",
  topic: "topics",
};

const TYPE_LABEL: Record<string, string> = {
  insight: "Insight",
  pattern: "Pattern",
  formula: "Formula",
  application: "Application",
  contradiction: "Contradiction",
  profile: "Profile",
  topic: "Topic",
};

const RELATION_LABEL: Record<string, string> = {
  DERIVED_FROM: "Derived from",
  RELATES_TO: "Related to",
  APPLIES_TO: "Applies to",
  CONTRADICTS: "Contradicts",
  MENTIONS: "Mentions",
  PART_OF: "Part of",
  INSPIRES: "Inspires",
  SUPPORTS: "Supports",
  EXTENDS: "Extends",
  REFERENCES: "References",
};

const FAMILY_LABEL: Record<string, string> = {
  decision: "Decision Intelligence",
  strategy: "Strategic Intelligence",
  economic: "Economic Intelligence",
  behavioral: "Behavioral Intelligence",
  cognitive: "Cognitive Intelligence",
  system: "Systems Intelligence",
  knowledge: "Knowledge Intelligence",
  communication: "Communication Intelligence",
  organization: "Organization Intelligence",
  innovation: "Innovation Intelligence",
  risk: "Risk Intelligence",
  meta: "Meta Intelligence",
};

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary/70 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function EntityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const entityType = location.pathname.split("/")[1];
  const singularType = entityType?.replace(/s$/, "") || "insight";

  const [entity, setEntity] = useState<Entity | null>(null);
  const [related, setRelated] = useState<RelatedEntity[]>([]);
  const [topics, setTopics] = useState<TopicRef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    (async () => {
      const { data: ent } = await supabase
        .from("entities")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (!ent) { setEntity(null); setLoading(false); return; }
      setEntity(ent as unknown as Entity);

      // Fetch outgoing + incoming relations and topics in parallel
      const [outRels, inRels, topicsRes] = await Promise.all([
        supabase
          .from("entity_relations")
          .select("id, relation_type, weight, target_entity_id")
          .eq("source_entity_id", ent.id)
          .order("weight", { ascending: false })
          .limit(30),
        supabase
          .from("entity_relations")
          .select("id, relation_type, weight, source_entity_id")
          .eq("target_entity_id", ent.id)
          .order("weight", { ascending: false })
          .limit(30),
        supabase
          .from("entity_topics")
          .select("topic_id")
          .eq("entity_id", ent.id),
      ]);

      const relEntityIds = [
        ...(outRels.data || []).map((r: any) => r.target_entity_id),
        ...(inRels.data || []).map((r: any) => r.source_entity_id),
      ].filter(Boolean);

      if (relEntityIds.length > 0) {
        const { data: relEntities } = await supabase
          .from("entities")
          .select("id, entity_type, slug, title, summary")
          .in("id", [...new Set(relEntityIds)])
          .eq("is_published", true);

        const entityMap = new Map((relEntities || []).map((e: any) => [e.id, e]));
        const mapped: RelatedEntity[] = [];

        for (const r of outRels.data || []) {
          const e = entityMap.get((r as any).target_entity_id);
          if (e) mapped.push({ ...e, relation_type: (r as any).relation_type, weight: (r as any).weight, direction: "outgoing" });
        }
        for (const r of inRels.data || []) {
          const e = entityMap.get((r as any).source_entity_id);
          if (e) mapped.push({ ...e, relation_type: (r as any).relation_type, weight: (r as any).weight, direction: "incoming" });
        }
        setRelated(mapped);
      }

      const topicIds = (topicsRes.data || []).map((t: any) => t.topic_id);
      if (topicIds.length > 0) {
        const { data: topicData } = await supabase
          .from("topics")
          .select("id, slug, title")
          .in("id", topicIds);
        setTopics((topicData as TopicRef[]) || []);
      }

      setLoading(false);
    })();
  }, [slug]);

  // Group related by entity_type
  const relatedByType = related.reduce<Record<string, RelatedEntity[]>>((acc, r) => {
    const key = r.entity_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <Brain className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold mb-2">Entity Not Found</h1>
          <p className="text-sm text-muted-foreground">
            This {singularType} doesn't exist or hasn't been published yet.
          </p>
          <Link to={`/${entityType}`} className="text-sm text-primary hover:underline mt-4 inline-block">
            ← Back to {entityType}
          </Link>
        </div>
      </div>
    );
  }

  const citations = Array.isArray(entity.citation_sources) ? entity.citation_sources : [];
  const graphDensity = related.length;

  // Use DB json_ld if available, otherwise build from scratch
  const dbJsonLd = (entity as any).json_ld;
  const jsonLd: any = dbJsonLd ? {
    "@context": "https://schema.org",
    ...dbJsonLd,
    url: `https://ai-idei.com/${entityType}/${entity.slug}`,
  } : {
    "@context": "https://schema.org",
    "@type": singularType === "profile" ? "Person" : "DefinedTerm",
    name: entity.title,
    description: entity.summary || entity.meta_description || "",
    url: `https://ai-idei.com/${entityType}/${entity.slug}`,
    identifier: entity.id,
  };

  if (singularType !== "profile") {
    jsonLd.inDefinedTermSet = {
      "@type": "DefinedTermSet",
      name: entity.insight_family
        ? FAMILY_LABEL[entity.insight_family] || entity.insight_family
        : `AI-IDEI ${entityType}`,
    };
  }

  if (citations.length > 0) {
    jsonLd.citation = citations.map((c: any) => ({
      "@type": "CreativeWork",
      name: c.title || "Source",
      ...(c.url && { url: c.url }),
      ...(c.speaker && { author: { "@type": "Person", name: c.speaker } }),
    }));
  }

  // Related entities as schema
  if (related.length > 0) {
    jsonLd.relatedLink = related.slice(0, 10).map((r) => ({
      "@type": "DefinedTerm",
      name: r.title,
      url: `${window.location.origin}/${TYPE_PATH[r.entity_type] || "insights"}/${r.slug}`,
    }));
  }

  jsonLd.publisher = { "@type": "Organization", name: "AI-IDEI" };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${entity.title} — AI-IDEI ${TYPE_LABEL[entity.entity_type] || "Entity"}`}
        description={entity.meta_description || entity.summary || undefined}
        canonical={entity.canonical_url ? `https://ai-idei-os.lovable.app${entity.canonical_url}` : undefined}
      />
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Brain className="h-3.5 w-3.5" />
            <Link to={`/${entityType}`} className="hover:text-foreground transition-colors">
              {entityType?.charAt(0).toUpperCase() + entityType?.slice(1)}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground truncate">{entity.title}</span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              {TYPE_LABEL[singularType] || singularType}
            </Badge>
            {entity.insight_family && (
              <Badge variant="secondary" className="text-[10px]">
                {FAMILY_LABEL[entity.insight_family] || entity.insight_family}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold mb-3 leading-tight">
            {entity.title}
          </h1>

          {entity.summary && (
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[60ch]">
              {entity.summary}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8">
          {/* Main content */}
          <div className="space-y-10">
            {/* Definition / Mechanism */}
            {entity.description && (
              <section>
                <h2 className="text-lg font-serif font-semibold mb-3">Mechanism</h2>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-card border border-border rounded-lg p-4">
                  {entity.description}
                </div>
              </section>
            )}

            {/* Evidence / Citations */}
            {citations.length > 0 && (
              <section>
                <h2 className="text-lg font-serif font-semibold mb-3">Evidence</h2>
                <div className="space-y-2">
                  {citations.map((c: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg">
                      <Quote className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{c.title || "Source"}</p>
                        {c.speaker && <p className="text-[10px] text-muted-foreground">Speaker: {c.speaker}</p>}
                        {c.timestamp && <p className="text-[10px] text-muted-foreground">Timestamp: {c.timestamp}</p>}
                        {c.quote && <p className="text-xs text-muted-foreground mt-1 italic">"{c.quote}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Topics */}
            {topics.length > 0 && (
              <section>
                <h2 className="text-lg font-serif font-semibold mb-3">Topics</h2>
                <div className="flex flex-wrap gap-2">
                  {topics.map((t) => (
                    <Link
                      key={t.id}
                      to={`/topics/${t.slug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <Tag className="h-3 w-3" />
                      {t.title}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Related entities grouped by type */}
            {Object.entries(relatedByType).map(([type, entities]) => (
              <section key={type}>
                <h2 className="text-lg font-serif font-semibold mb-3">
                  Related {TYPE_LABEL[type] || type}s
                </h2>
                <div className="space-y-2">
                  {entities.map((rel) => (
                    <Link
                      key={`${rel.id}-${rel.relation_type}-${rel.direction}`}
                      to={`/${TYPE_PATH[rel.entity_type] || "insights"}/${rel.slug}`}
                      className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {rel.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {rel.direction === "incoming" ? "← " : "→ "}
                            {RELATION_LABEL[rel.relation_type] || rel.relation_type}
                          </span>
                          {rel.weight > 0 && (
                            <span className="text-[10px] text-muted-foreground/50">w:{rel.weight.toFixed(1)}</span>
                          )}
                        </div>
                        {rel.summary && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{rel.summary}</p>
                        )}
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary shrink-0" />
                    </Link>
                  ))}
                </div>
              </section>
            ))}

            {/* Source neuron */}
            {entity.neuron_id && (
              <section>
                <h2 className="text-lg font-serif font-semibold mb-3">Source</h2>
                <Link
                  to={`/n/${entity.neuron_id}`}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View source neuron #{entity.neuron_id}
                </Link>
              </section>
            )}

            {related.length === 0 && topics.length === 0 && !entity.description && citations.length === 0 && (
              <div className="text-center py-12">
                <Brain className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  This entity is being enriched. Relations and context will appear as the knowledge graph grows.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar — scores */}
          <aside className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                IdeaRank Scores
              </div>
              <ScoreBar label="IdeaRank" value={entity.idea_rank * 1000} max={10} />
              <ScoreBar label="Importance" value={entity.importance_score} />
              <ScoreBar label="Confidence" value={entity.confidence_score * 100} />
              <div className="pt-2 border-t border-border space-y-1.5 text-[10px] text-muted-foreground">
                <div className="flex justify-between">
                  <span>Evidence count</span>
                  <span className="font-mono text-foreground">{entity.evidence_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reuse count</span>
                  <span className="font-mono text-foreground">{entity.reuse_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Graph density</span>
                  <span className="font-mono text-foreground">{graphDensity} links</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
