import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Zap, Layers, Server, Coins, ChevronRight,
  Filter, X, Sparkles, Crown, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ServiceItem {
  id: string;
  name: string;
  service_level: string;
  category: string;
  intent: string;
  neurons_cost_min: number;
  neurons_cost_max: number;
  score_tier: string;
  complexity: string;
  output_type: string;
  domain: string;
  is_active: boolean;
}

const LEVEL_META = {
  OTOS: { label: "OTOS", desc: "Atomic Formulas", icon: Zap, color: "text-blue-500" },
  MMS: { label: "MMS", desc: "Multi-Module Systems", icon: Layers, color: "text-amber-500" },
  LCSS: { label: "LCSS", desc: "Long-Term OS", icon: Server, color: "text-purple-500" },
};

const TIER_COLORS: Record<string, string> = {
  S: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  A: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  B: "bg-muted text-muted-foreground border-border",
  C: "bg-muted/50 text-muted-foreground/70 border-border/50",
};

export default function ServicesCatalog() {
  const { t } = useTranslation();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<string>("ALL");
  const [selectedDomain, setSelectedDomain] = useState<string>("");

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const { data } = await supabase
      .from("service_registry")
      .select("id,name,service_level,category,intent,neurons_cost_min,neurons_cost_max,score_tier,complexity,output_type,domain,is_active")
      .eq("is_active", true)
      .order("position", { ascending: true });
    if (data) setServices(data as ServiceItem[]);
    setLoading(false);
  };

  const domains = useMemo(() => {
    const d = new Set(services.map(s => s.domain).filter(Boolean));
    return Array.from(d).sort();
  }, [services]);

  const filtered = useMemo(() => {
    return services.filter(s => {
      if (level !== "ALL" && s.service_level !== level) return false;
      if (selectedDomain && s.domain !== selectedDomain) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.intent.toLowerCase().includes(q);
      }
      return true;
    });
  }, [services, level, selectedDomain, search]);

  const stats = useMemo(() => ({
    total: services.length,
    otos: services.filter(s => s.service_level === "OTOS").length,
    mms: services.filter(s => s.service_level === "MMS").length,
    lcss: services.filter(s => s.service_level === "LCSS").length,
  }), [services]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">Service Registry</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats.total} services • {stats.otos} OTOS • {stats.mms} MMS • {stats.lcss} LCSS
              </p>
            </div>
          </div>

          {/* Filters */}
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
                  <Zap className="h-3 w-3" />OTOS
                </TabsTrigger>
                <TabsTrigger value="MMS" className="text-xs h-6 px-2 gap-1">
                  <Layers className="h-3 w-3" />MMS
                </TabsTrigger>
                <TabsTrigger value="LCSS" className="text-xs h-6 px-2 gap-1">
                  <Server className="h-3 w-3" />LCSS
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {selectedDomain && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setSelectedDomain("")}>
                <X className="h-3 w-3" />{selectedDomain}
              </Button>
            )}
          </div>

          {/* Domain chips */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {domains.map(d => (
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
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Service List */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">Loading services...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">No services found</div>
        ) : (
          <div className="grid gap-1.5">
            <AnimatePresence mode="popLayout">
              {filtered.map((s, i) => {
                const meta = LEVEL_META[s.service_level as keyof typeof LEVEL_META];
                const Icon = meta?.icon || Zap;
                return (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: Math.min(i * 0.01, 0.3) }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all cursor-pointer group",
                      "border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02]"
                    )}
                  >
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-muted")}>
                      <Icon className={cn("h-4 w-4", meta?.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{s.name}</span>
                        <Badge variant="outline" className={cn("text-[8px] h-4 px-1 shrink-0 border", TIER_COLORS[s.score_tier] || TIER_COLORS.C)}>
                          {s.score_tier}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {s.category && (
                          <span className="text-[9px] text-muted-foreground truncate max-w-[200px]">{s.category}</span>
                        )}
                        {s.intent && (
                          <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-primary/20 text-primary/70">
                            {s.intent}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Coins className="h-3 w-3" />
                          <span className="font-mono">{s.neurons_cost_min}–{s.neurons_cost_max}</span>
                        </div>
                        <span className="text-[8px] text-muted-foreground/60">{s.complexity}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
