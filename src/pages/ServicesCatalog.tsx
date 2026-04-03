import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Zap, Layers, Server, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DomainGroup } from "@/components/services/DomainGroup";
import { type RegistryServiceItem } from "@/components/services/RegistryCard";
import { ServiceDetailDrawer } from "@/components/services/ServiceDetailDrawer";
import { VirtualServiceList } from "@/components/services/VirtualServiceList";
import { AdvancedFilters, EMPTY_FILTERS, type AdvancedFilterState } from "@/components/services/AdvancedFilters";
import { ExecuteServiceDialog } from "@/components/services/ExecuteServiceDialog";

export default function ServicesCatalog() {
  const [services, setServices] = useState<RegistryServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("ALL");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedService, setSelectedService] = useState<RegistryServiceItem | null>(null);
  const [executeService, setExecuteService] = useState<RegistryServiceItem | null>(null);
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");
  const [advFilters, setAdvFilters] = useState<AdvancedFilterState>(EMPTY_FILTERS);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("service_registry")
        .select("id,name,service_level,category,intent,neurons_cost_min,neurons_cost_max,score_tier,complexity,output_type,domain,is_active")
        .eq("is_active", true)
        .order("position", { ascending: true });
      if (data) setServices(data as RegistryServiceItem[]);
      setLoading(false);
    })();
  }, []);

  const domains = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach(s => { if (s.domain) counts[s.domain] = (counts[s.domain] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [services]);

  const { availableComplexities, availableOutputTypes } = useMemo(() => {
    const complexities = new Set<string>();
    const outputs = new Set<string>();
    services.forEach(s => {
      if (s.complexity) complexities.add(s.complexity);
      if (s.output_type) outputs.add(s.output_type);
    });
    return {
      availableComplexities: [...complexities].sort(),
      availableOutputTypes: [...outputs].sort(),
    };
  }, [services]);

  const filtered = useMemo(() => {
    return services.filter(s => {
      if (level !== "ALL" && s.service_level !== level) return false;
      if (selectedDomain && s.domain !== selectedDomain) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q)) return false;
      }
      // Advanced filters
      if (s.neurons_cost_min < advFilters.costMin || s.neurons_cost_max > advFilters.costMax) return false;
      if (advFilters.scoreTier.length > 0 && !advFilters.scoreTier.includes(s.score_tier)) return false;
      if (advFilters.complexity.length > 0 && !advFilters.complexity.includes(s.complexity)) return false;
      if (advFilters.outputType.length > 0 && !advFilters.outputType.includes(s.output_type)) return false;
      return true;
    });
  }, [services, level, selectedDomain, search, advFilters]);

  const stats = useMemo(() => ({
    total: services.length,
    otos: services.filter(s => s.service_level === "OTOS").length,
    mms: services.filter(s => s.service_level === "MMS").length,
    lcss: services.filter(s => s.service_level === "LCSS").length,
  }), [services]);

  const groupedByDomain = useMemo(() => {
    const groups: Record<string, RegistryServiceItem[]> = {};
    filtered.forEach(s => {
      const d = s.domain || "other";
      if (!groups[d]) groups[d] = [];
      groups[d].push(s);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const handleServiceClick = useCallback((s: RegistryServiceItem) => setSelectedService(s), []);
  const handleExecuteFromDrawer = useCallback((s: RegistryServiceItem) => {
    setSelectedService(null);
    setExecuteService(s);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">Service Registry</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats.total} services • {stats.otos} Actions • {stats.mms} Systems • {stats.lcss} Programs
                {filtered.length !== stats.total && ` • ${filtered.length} shown`}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant={viewMode === "grouped" ? "default" : "ghost"}
                size="sm" className="text-xs h-7"
                onClick={() => setViewMode("grouped")}
              >Grouped</Button>
              <Button
                variant={viewMode === "flat" ? "default" : "ghost"}
                size="sm" className="text-xs h-7"
                onClick={() => setViewMode("flat")}
              >Flat</Button>
            </div>
          </div>

          {/* Filters row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search services..."
                className="pl-8 h-8 text-xs"
              />
            </div>

            <Tabs value={level} onValueChange={setLevel}>
              <TabsList className="h-8">
                <TabsTrigger value="ALL" className="text-xs h-6 px-2">All</TabsTrigger>
                <TabsTrigger value="OTOS" className="text-xs h-6 px-2 gap-1">
                  <Zap className="h-3 w-3" />Actions
                </TabsTrigger>
                <TabsTrigger value="MMS" className="text-xs h-6 px-2 gap-1">
                  <Layers className="h-3 w-3" />Systems
                </TabsTrigger>
                <TabsTrigger value="LCSS" className="text-xs h-6 px-2 gap-1">
                  <Server className="h-3 w-3" />Programs
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <AdvancedFilters
              filters={advFilters}
              onChange={setAdvFilters}
              availableComplexities={availableComplexities}
              availableOutputTypes={availableOutputTypes}
            />

            {selectedDomain && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setSelectedDomain("")}>
                <X className="h-3 w-3" />{selectedDomain}
              </Button>
            )}
          </div>

          {/* Domain chips */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {domains.map(([d, count]) => (
              <button
                key={d}
                onClick={() => setSelectedDomain(selectedDomain === d ? "" : d)}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border transition-all",
                  selectedDomain === d
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                )}
              >
                {d} ({count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">Loading services...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">No services found</div>
        ) : viewMode === "grouped" ? (
          <div className="space-y-3">
            {groupedByDomain.map(([domain, svcs]) => (
              <DomainGroup
                key={domain}
                domain={domain}
                services={svcs}
                defaultOpen={groupedByDomain.length === 1}
                onServiceClick={handleServiceClick}
              />
            ))}
          </div>
        ) : (
          <VirtualServiceList services={filtered} onServiceClick={handleServiceClick} />
        )}
      </div>

      {/* Detail drawer */}
      <ServiceDetailDrawer
        service={selectedService}
        open={!!selectedService}
        onClose={() => setSelectedService(null)}
        onExecute={handleExecuteFromDrawer}
      />

      {/* Execute dialog */}
      <ExecuteServiceDialog
        service={executeService}
        open={!!executeService}
        onClose={() => setExecuteService(null)}
      />
    </div>
  );
}
