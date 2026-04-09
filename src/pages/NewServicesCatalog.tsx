import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Zap, Layers, Server, Loader2 } from "lucide-react";
import { useServiceCatalog } from "@/hooks/useServiceCatalog";
import { ServiceLevelCard } from "@/components/services/ServiceLevelCard";
import type { ServiceAny, ServiceLevel } from "@/types/services";

const LEVEL_TABS: { value: string; label: string; icon: React.ElementType }[] = [
  { value: "ALL", label: "Toate", icon: Search },
  { value: "L3", label: "Quick Services", icon: Zap },
  { value: "L2", label: "Service Packs", icon: Layers },
  { value: "L1", label: "Master Systems", icon: Server },
];

export default function NewServicesCatalog() {
  const { data, isLoading } = useServiceCatalog();
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("ALL");
  const navigate = useNavigate();

  const allServices = useMemo(() => {
    if (!data) return [];
    return [...data.l3, ...data.l2, ...data.l1];
  }, [data]);

  const filtered = useMemo(() => {
    return allServices.filter(s => {
      if (level !== "ALL" && s.level !== level) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.service_name.toLowerCase().includes(q) &&
            !s.category.toLowerCase().includes(q) &&
            !s.description_public.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allServices, level, search]);

  const stats = useMemo(() => ({
    total: allServices.length,
    l3: data?.l3.length || 0,
    l2: data?.l2.length || 0,
    l1: data?.l1.length || 0,
  }), [allServices, data]);

  const handleClick = useCallback((s: ServiceAny) => {
    navigate(`/services/${s.service_slug}`);
  }, [navigate]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, ServiceAny[]> = {};
    filtered.forEach(s => {
      const cat = s.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">Service Catalog</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats.total} servicii • {stats.l3} Quick • {stats.l2} Packs • {stats.l1} Master
                {filtered.length !== stats.total && ` • ${filtered.length} afișate`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Caută servicii..."
                className="pl-8 h-8 text-xs"
              />
            </div>

            <Tabs value={level} onValueChange={setLevel}>
              <TabsList className="h-8">
                {LEVEL_TABS.map(t => (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs h-6 px-2 gap-1">
                    <t.icon className="h-3 w-3" />
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">
            Niciun serviciu găsit
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(([category, services]) => (
              <section key={category}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {category}
                  <span className="ml-2 text-xs font-normal">({services.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {services.map((s, i) => (
                    <ServiceLevelCard
                      key={s.id}
                      service={s}
                      index={i}
                      onClick={handleClick}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
