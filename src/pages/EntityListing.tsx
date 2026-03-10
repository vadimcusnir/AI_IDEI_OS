import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Brain, ChevronRight, Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EntityItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  entity_type: string;
  confidence_score: number;
  importance_score: number;
  evidence_count: number;
}

const ENTITY_META: Record<string, { title: string; singular: string; description: string; types: string[] }> = {
  insights: {
    title: "Insights",
    singular: "Insight",
    description: "Non-obvious mechanisms affecting decisions — extracted from real transcripts, not generated.",
    types: ["insight"],
  },
  patterns: {
    title: "Patterns",
    singular: "Pattern",
    description: "Recurring cognitive structures detected across multiple sources — stable regularities in thinking and strategy.",
    types: ["pattern"],
  },
  formulas: {
    title: "Formulas",
    singular: "Formula",
    description: "Operational rules extracted from patterns — directly applicable to new contexts.",
    types: ["formula"],
  },
  contradictions: {
    title: "Contradictions",
    singular: "Contradiction",
    description: "Conflicts between statements or behaviors — boundary conditions where patterns break.",
    types: ["contradiction"],
  },
  applications: {
    title: "Applications",
    singular: "Application",
    description: "Contexts where formulas and patterns can be applied — from strategy to copywriting.",
    types: ["application"],
  },
  profiles: {
    title: "Profiles",
    singular: "Profile",
    description: "Intelligence profiles derived from transcript analysis — cognitive patterns, decision styles, and strategic behavior.",
    types: ["profile"],
  },
};

export default function EntityListing() {
  const location = useLocation();
  const entityType = location.pathname.replace(/^\//, "");
  const meta = ENTITY_META[entityType] || ENTITY_META.insights;
  const [entities, setEntities] = useState<EntityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("entities")
        .select("id, slug, title, summary, entity_type, confidence_score, importance_score, evidence_count")
        .eq("is_published", true)
        .in("entity_type", meta.types)
        .order("importance_score", { ascending: false })
        .limit(200);
      setEntities((data as EntityItem[]) || []);
      setLoading(false);
    })();
  }, [entityType]);

  const filtered = search.trim()
    ? entities.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
    : entities;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Brain className="h-3.5 w-3.5" />
            <span>Intelligence Assets</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{meta.title}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">
            {meta.title}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-[65ch] leading-relaxed">
            {meta.description}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${meta.title.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Brain className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "No results match your search." : `No public ${meta.title.toLowerCase()} available yet.`}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              {meta.title} are extracted from transcripts through the intelligence pipeline.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entity) => (
              <Link
                key={entity.id}
                to={`/${entityType}/${entity.slug}`}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                    {entity.title}
                  </h3>
                  {entity.summary && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{entity.summary}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {entity.confidence_score > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {Math.round(entity.confidence_score * 100)}% confidence
                      </span>
                    )}
                    {entity.evidence_count > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {entity.evidence_count} evidence{entity.evidence_count > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? meta.singular.toLowerCase() : meta.title.toLowerCase()} in the knowledge graph
            </p>
          </div>
        )}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${meta.title} — AI-IDEI Intelligence Assets`,
            description: meta.description,
            publisher: { "@type": "Organization", name: "AI-IDEI" },
          }),
        }}
      />
    </div>
  );
}
