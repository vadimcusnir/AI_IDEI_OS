import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tag, Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

interface Topic {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  entity_count: number;
}

export default function TopicListing() {
  const { t } = useTranslation("pages");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("topics")
        .select("*")
        .order("entity_count", { ascending: false })
        .limit(500);
      setTopics((data as Topic[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = search.trim()
    ? topics.filter((tp) => tp.title.toLowerCase().includes(search.toLowerCase()))
    : topics;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Tag className="h-3.5 w-3.5" />
            <span>{t("topic_listing.breadcrumb")}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">{t("topic_listing.title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-[65ch] leading-relaxed">
            {t("topic_listing.desc")}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("topic_listing.search_placeholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 text-sm" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Tag className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? t("topic_listing.no_match") : t("topic_listing.no_topics")}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((topic) => (
              <Link
                key={topic.id}
                to={`/topics/${topic.slug}`}
                className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors group"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Tag className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{topic.title}</h3>
                  {topic.description && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{topic.description}</p>
                  )}
                  <span className="text-[10px] text-muted-foreground">{t("topic_listing.entities_count", { count: topic.entity_count })}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Topics — AI-IDEI Intelligence Graph",
            description: "Knowledge domains connecting intelligence entities.",
            publisher: { "@type": "Organization", name: "AI-IDEI" },
          }),
        }}
      />
    </div>
  );
}
