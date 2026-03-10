import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Brain, ChevronRight, ArrowRight, ExternalLink, Loader2, Tag } from "lucide-react";
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
  confidence_score: number;
  importance_score: number;
  evidence_count: number;
  created_at: string;
}

interface RelatedEntity {
  id: string;
  entity_type: string;
  slug: string;
  title: string;
  relation_type: string;
  weight: number;
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
};

export default function EntityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const entityType = location.pathname.split("/")[1]; // insights → insight
  const singularType = entityType?.replace(/s$/, "") || "insight";

  const [entity, setEntity] = useState<Entity | null>(null);
  const [related, setRelated] = useState<RelatedEntity[]>([]);
  const [topics, setTopics] = useState<TopicRef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    (async () => {
      // Fetch entity
      const { data: ent } = await supabase
        .from("entities")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (!ent) {
        setEntity(null);
        setLoading(false);
        return;
      }
      setEntity(ent as Entity);

      // Fetch relations and topics in parallel
      const [outRels, inRels, topicsRes] = await Promise.all([
        supabase
          .from("entity_relations")
          .select("id, relation_type, weight, target_entity_id")
          .eq("source_entity_id", ent.id)
          .order("weight", { ascending: false })
          .limit(20),
        supabase
          .from("entity_relations")
          .select("id, relation_type, weight, source_entity_id")
          .eq("target_entity_id", ent.id)
          .order("weight", { ascending: false })
          .limit(20),
        supabase
          .from("entity_topics")
          .select("topic_id")
          .eq("entity_id", ent.id),
      ]);

      // Resolve related entity details
      const relEntityIds = [
        ...(outRels.data || []).map((r: any) => r.target_entity_id),
        ...(inRels.data || []).map((r: any) => r.source_entity_id),
      ].filter(Boolean);

      if (relEntityIds.length > 0) {
        const { data: relEntities } = await supabase
          .from("entities")
          .select("id, entity_type, slug, title")
          .in("id", relEntityIds)
          .eq("is_published", true);

        const entityMap = new Map((relEntities || []).map((e: any) => [e.id, e]));
        const mapped: RelatedEntity[] = [];

        for (const r of outRels.data || []) {
          const e = entityMap.get((r as any).target_entity_id);
          if (e) mapped.push({ ...e, relation_type: (r as any).relation_type, weight: (r as any).weight });
        }
        for (const r of inRels.data || []) {
          const e = entityMap.get((r as any).source_entity_id);
          if (e) mapped.push({ ...e, relation_type: (r as any).relation_type, weight: (r as any).weight });
        }
        setRelated(mapped);
      }

      // Resolve topics
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

  // Group related by type
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

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
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

          <Badge variant="outline" className="text-[10px] uppercase tracking-wider mb-3">
            {TYPE_LABEL[singularType] || singularType}
          </Badge>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold mb-3 leading-tight">
            {entity.title}
          </h1>

          {entity.summary && (
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[60ch]">
              {entity.summary}
            </p>
          )}

          {/* Confidence & Evidence */}
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            {entity.confidence_score > 0 && (
              <span>Confidence: <strong className="text-foreground">{Math.round(entity.confidence_score * 100)}%</strong></span>
            )}
            {entity.importance_score > 0 && (
              <span>Importance: <strong className="text-foreground">{entity.importance_score.toFixed(1)}</strong></span>
            )}
            {entity.evidence_count > 0 && (
              <span>{entity.evidence_count} evidence{entity.evidence_count > 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Description */}
        {entity.description && (
          <section>
            <h2 className="text-lg font-serif font-semibold mb-3">Mechanism</h2>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {entity.description}
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

        {/* Related entities by type */}
        {Object.entries(relatedByType).map(([type, entities]) => (
          <section key={type}>
            <h2 className="text-lg font-serif font-semibold mb-3">
              Related {TYPE_LABEL[type] || type}s
            </h2>
            <div className="space-y-2">
              {entities.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/${TYPE_PATH[rel.entity_type] || "insights"}/${rel.slug}`}
                  className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {rel.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {RELATION_LABEL[rel.relation_type] || rel.relation_type}
                      {rel.weight > 0 && ` · weight ${rel.weight.toFixed(1)}`}
                    </p>
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

        {/* No relations message */}
        {related.length === 0 && topics.length === 0 && !entity.description && (
          <div className="text-center py-12">
            <Brain className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              This entity is being enriched. Relations and context will appear as the knowledge graph grows.
            </p>
          </div>
        )}
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            entity.neuron_id
              ? {
                  "@context": "https://schema.org",
                  "@type": singularType === "profile" ? "Person" : "DefinedTerm",
                  name: entity.title,
                  description: entity.summary || entity.meta_description || "",
                  url: `${window.location.origin}/${entityType}/${entity.slug}`,
                  ...(singularType !== "profile" && {
                    inDefinedTermSet: {
                      "@type": "DefinedTermSet",
                      name: `AI-IDEI ${entityType}`,
                    },
                  }),
                  publisher: { "@type": "Organization", name: "AI-IDEI" },
                }
              : {
                  "@context": "https://schema.org",
                  "@type": "DefinedTerm",
                  name: entity.title,
                  description: entity.summary || "",
                  publisher: { "@type": "Organization", name: "AI-IDEI" },
                }
          ),
        }}
      />
    </div>
  );
}
