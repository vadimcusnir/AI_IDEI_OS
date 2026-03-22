import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Tag, ChevronRight, ArrowRight, Brain, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Topic {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  entity_count: number;
}

interface TopicEntity {
  id: string;
  entity_type: string;
  slug: string;
  title: string;
  summary: string | null;
}

const TYPE_PATH: Record<string, string> = {
  insight: "insights",
  pattern: "patterns",
  formula: "formulas",
  application: "applications",
  contradiction: "contradictions",
  profile: "profiles",
};

export default function TopicDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation("pages");
  const [topic, setTopic] = useState<Topic | null>(null);
  const [entities, setEntities] = useState<TopicEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    (async () => {
      const { data: topicData } = await supabase
        .from("topics")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!topicData) { setTopic(null); setLoading(false); return; }
      setTopic(topicData as Topic);

      const { data: junctions } = await supabase
        .from("entity_topics")
        .select("entity_id")
        .eq("topic_id", topicData.id);

      const entityIds = (junctions || []).map((j: any) => j.entity_id);
      if (entityIds.length > 0) {
        const { data: ents } = await supabase
          .from("entities")
          .select("id, entity_type, slug, title, summary")
          .in("id", entityIds)
          .eq("is_published", true)
          .order("importance_score", { ascending: false })
          .limit(100);
        setEntities((ents as TopicEntity[]) || []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-background text-center py-20">
        <Tag className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
        <h1 className="text-2xl font-serif font-bold">{t("topic_detail.not_found_title")}</h1>
        <Link to="/topics" className="text-sm text-primary hover:underline mt-4 inline-block">← {t("topic_detail.back_to_topics")}</Link>
      </div>
    );
  }

  // Group by type
  const byType = entities.reduce<Record<string, TopicEntity[]>>((acc, e) => {
    if (!acc[e.entity_type]) acc[e.entity_type] = [];
    acc[e.entity_type].push(e);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Tag className="h-3.5 w-3.5" />
            <Link to="/topics" className="hover:text-foreground transition-colors">{t("topic_listing.title")}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{topic.title}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold mb-3">{topic.title}</h1>
          {topic.description && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[60ch]">{topic.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-3">{t("topic_detail.entities_count", { count: entities.length })}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {Object.entries(byType).map(([type, ents]) => (
          <section key={type}>
            <h2 className="text-lg font-serif font-semibold mb-3 capitalize">{type}s</h2>
            <div className="space-y-2">
              {ents.map((e) => (
                <Link
                  key={e.id}
                  to={`/${TYPE_PATH[e.entity_type] || "insights"}/${e.slug}`}
                  className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{e.title}</p>
                    {e.summary && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{e.summary}</p>}
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        ))}

        {entities.length === 0 && (
          <div className="text-center py-16">
            <Brain className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t("topic_detail.no_entities")}</p>
          </div>
        )}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${topic.title} — AI-IDEI`,
            description: topic.description || `Intelligence entities related to ${topic.title}`,
            publisher: { "@type": "Organization", name: "AI-IDEI" },
          }),
        }}
      />
    </div>
  );
}
