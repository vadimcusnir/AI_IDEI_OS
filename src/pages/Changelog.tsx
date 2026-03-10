import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Sparkles, Wrench, Bug, Palette, Zap, Plug, BookOpen, Calendar, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  new_feature: { label: "New Feature", icon: Sparkles, color: "bg-primary/10 text-primary" },
  improvement: { label: "Improvement", icon: Wrench, color: "bg-status-validated/15 text-status-validated" },
  bug_fix: { label: "Bug Fix", icon: Bug, color: "bg-destructive/10 text-destructive" },
  ui_ux: { label: "UI/UX Update", icon: Palette, color: "bg-ai-accent/15 text-ai-accent" },
  performance: { label: "Performance", icon: Zap, color: "bg-orange-500/10 text-orange-600" },
  integration: { label: "Integration", icon: Plug, color: "bg-primary/10 text-primary" },
  documentation: { label: "Documentation", icon: BookOpen, color: "bg-muted text-muted-foreground" },
};

export default function Changelog() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("changelog_entries")
        .select("id, version, category, title, description, example, user_benefit, release_date, position")
        .eq("status", "published")
        .order("release_date", { ascending: false })
        .order("position", { ascending: true });
      setEntries((data as ChangelogEntry[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = entries;
    if (activeFilter) result = result.filter(e => e.category === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.version?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, search, activeFilter]);

  // Group by version
  const grouped = filtered.reduce<Record<string, { date: string; items: ChangelogEntry[] }>>((acc, e) => {
    const key = e.version || "Unreleased";
    if (!acc[key]) acc[key] = { date: e.release_date, items: [] };
    acc[key].items.push(e);
    return acc;
  }, {});

  const filterCategories = Object.entries(CATEGORY_META);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Changelog</h1>
          <p className="text-sm text-muted-foreground">
            Ce s-a schimbat pentru tine — funcționalități noi, îmbunătățiri și fix-uri.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="mb-8 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută în changelog..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={activeFilter === null ? "default" : "outline"}
              className="h-7 text-[10px] px-2.5"
              onClick={() => setActiveFilter(null)}
            >
              <Filter className="h-3 w-3 mr-1" /> Toate
            </Button>
            {filterCategories.map(([key, meta]) => {
              const Icon = meta.icon;
              return (
                <Button
                  key={key}
                  size="sm"
                  variant={activeFilter === key ? "default" : "outline"}
                  className="h-7 text-[10px] px-2.5"
                  onClick={() => setActiveFilter(activeFilter === key ? null : key)}
                >
                  <Icon className="h-3 w-3 mr-1" /> {meta.label}
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
              {search || activeFilter ? "Niciun rezultat pentru filtrele selectate." : "Nicio actualizare publicată încă."}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(grouped).map(([version, { date, items }]) => (
              <section key={version}>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-lg font-bold font-mono">{version}</h2>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(date).toLocaleDateString("ro-RO", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                  <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                    {items.length} {items.length === 1 ? "schimbare" : "schimbări"}
                  </span>
                </div>

                <div className="space-y-4 border-l-2 border-border pl-5 ml-1">
                  {items.map(entry => {
                    const meta = CATEGORY_META[entry.category] || CATEGORY_META.improvement;
                    const Icon = meta.icon;
                    return (
                      <div key={entry.id} className="relative">
                        <div className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-border ring-2 ring-background" />
                        <div className="bg-card border border-border rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn("flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", meta.color)}>
                              <Icon className="h-3 w-3" />
                              {meta.label}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold mb-1">{entry.title}</h3>
                          {entry.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed mb-2">{entry.description}</p>
                          )}
                          {entry.example && (
                            <div className="bg-muted/50 rounded-lg px-3 py-2 mb-2">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Exemplu</p>
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
        )}
      </div>
    </div>
  );
}
