import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Sparkles, Wrench, Bug, Palette, Zap, Plug, BookOpen, Calendar, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface ChangelogEntry {
  id: string;
  version: string;
  category: string;
  title: string;
  description: string;
  example: string;
  user_benefit: string;
  release_date: string;
  position: number;
}

const CATEGORY_KEYS: Record<string, { key: string; icon: React.ElementType; color: string }> = {
  new_feature: { key: "changelog.cat_new_feature", icon: Sparkles, color: "bg-primary/10 text-primary" },
  improvement: { key: "changelog.cat_improvement", icon: Wrench, color: "bg-status-validated/15 text-status-validated" },
  bug_fix: { key: "changelog.cat_bug_fix", icon: Bug, color: "bg-destructive/10 text-destructive" },
  ui_ux: { key: "changelog.cat_ui_ux", icon: Palette, color: "bg-ai-accent/15 text-ai-accent" },
  performance: { key: "changelog.cat_performance", icon: Zap, color: "bg-semantic-amber/10 text-semantic-amber" },
  integration: { key: "changelog.cat_integration", icon: Plug, color: "bg-primary/10 text-primary" },
  documentation: { key: "changelog.cat_documentation", icon: BookOpen, color: "bg-muted text-muted-foreground" },
};

const PAGE_SIZE = 15;

export default function Changelog() {
  const { t } = useTranslation("pages");
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [search, activeFilter]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase
        .from("changelog_entries")
        .select("id, version, category, title, description, example, user_benefit, release_date, position", { count: "exact" })
        .eq("status", "published")
        .order("release_date", { ascending: false })
        .order("position", { ascending: true });

      if (activeFilter) {
        query = query.eq("category", activeFilter);
      }
      if (search.trim()) {
        query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,version.ilike.%${search.trim()}%`);
      }

      query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      const { data, count } = await query;
      setEntries((data as ChangelogEntry[]) || []);
      setTotalCount(count ?? 0);
      setLoading(false);
    })();
  }, [page, search, activeFilter]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const grouped = entries.reduce<Record<string, { date: string; items: ChangelogEntry[] }>>((acc, e) => {
    const key = e.version || "Unreleased";
    if (!acc[key]) acc[key] = { date: e.release_date, items: [] };
    acc[key].items.push(e);
    return acc;
  }, {});

  const filterCategories = Object.entries(CATEGORY_KEYS);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <SEOHead title="Changelog — AI-IDEI" description="Latest updates, features and improvements to the AI-IDEI platform." />
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("changelog.title")}</h1>
        <p className="text-sm text-muted-foreground max-w-[65ch]">
          {t("changelog.subtitle")}
        </p>
        {totalCount > 0 && (
          <p className="text-micro text-muted-foreground mt-1">
            {t("changelog.updates_count", { count: totalCount })}
          </p>
        )}
      </div>

      {/* Search + Filters */}
      <div className="mb-8 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("changelog.search_placeholder")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant={activeFilter === null ? "default" : "outline"}
            className="h-7 text-micro px-2.5"
            onClick={() => setActiveFilter(null)}
          >
            <Filter className="h-3 w-3 mr-1" /> {t("changelog.filter_all")}
          </Button>
          {filterCategories.map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <Button
                key={key}
                size="sm"
                variant={activeFilter === key ? "default" : "outline"}
                className="h-7 text-micro px-2.5"
                onClick={() => setActiveFilter(activeFilter === key ? null : key)}
              >
                <Icon className="h-3 w-3 mr-1" /> {t(meta.key)}
              </Button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20">
          <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search || activeFilter ? t("changelog.no_filter_results") : t("changelog.no_entries")}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-12">
            {Object.entries(grouped).map(([version, { date, items }]) => (
              <section key={version}>
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                  <h2 className="text-lg font-bold font-mono">{version}</h2>
                  <span className="flex items-center gap-1 text-micro text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                  <span className="text-nano bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                    {t("changelog.changes_count", { count: items.length })}
                  </span>
                </div>

                <div className="space-y-4 border-l-2 border-border pl-4 sm:pl-5 ml-1">
                  {items.map(entry => {
                    const meta = CATEGORY_KEYS[entry.category] || CATEGORY_KEYS.improvement;
                    const Icon = meta.icon;
                    return (
                      <div key={entry.id} className="relative">
                        <div className="absolute -left-[21px] sm:-left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-border ring-2 ring-background" />
                        <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn("flex items-center gap-1 text-nano font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", meta.color)}>
                              <Icon className="h-3 w-3" />
                              {t(meta.key)}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold mb-1">{entry.title}</h3>
                          {entry.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed mb-2 max-w-[65ch]">{entry.description}</p>
                          )}
                          {entry.example && (
                            <div className="bg-muted/50 rounded-lg px-3 py-2 mb-2">
                              <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("changelog.example_label")}</p>
                              <p className="text-xs">{entry.example}</p>
                            </div>
                          )}
                          {entry.user_benefit && (
                            <p className="text-xs text-primary/80 italic">✦ {entry.user_benefit}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10 pt-6 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" /> {t("changelog.previous")}
              </Button>
              <span className="text-xs text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                {t("changelog.next")} <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
