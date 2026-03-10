import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Loader2, Sparkles, BarChart3, Filter, Megaphone,
  Brain, Layers, HelpCircle, Quote, MessageSquare,
  FileText, GraduationCap, Zap, Search, X, Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  service_key: string;
  name: string;
  description: string;
  service_class: string;
  category: string;
  credits_cost: number;
  icon: string;
  is_active: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  brain: Brain, layers: Layers, "help-circle": HelpCircle,
  quote: Quote, "message-square": MessageSquare, "bar-chart-3": BarChart3,
  "file-text": FileText, "graduation-cap": GraduationCap,
  filter: Filter, megaphone: Megaphone, sparkles: Sparkles,
};

const CLASS_CONFIG: Record<string, { label: string; description: string; color: string }> = {
  A: { label: "Analiză & Decizie", description: "Extrage insight-uri și produce framework-uri decizionale", color: "text-ai-accent" },
  B: { label: "Producție Active", description: "Generează deliverables concrete și conținut", color: "text-status-validated" },
  C: { label: "Orchestrare & Sistem", description: "Coordonează execuția între servicii", color: "text-primary" },
};

const CATEGORY_LABELS: Record<string, string> = {
  extraction: "Extracție",
  analysis: "Analiză",
  production: "Producție",
  orchestration: "Orchestrare",
};

export default function Services() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from("service_catalog")
        .select("*")
        .order("credits_cost", { ascending: true });
      if (data) setServices(data as Service[]);
      if (error) toast.error("Failed to load services");
      setLoading(false);
    };
    fetch();
  }, [user, authLoading]);

  const filtered = useMemo(() => {
    let list = services;
    if (filterClass) list = list.filter(s => s.service_class === filterClass);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }
    return list;
  }, [services, filterClass, search]);

  const grouped = useMemo(() => {
    return filtered.reduce((acc, s) => {
      const key = s.service_class;
      if (!acc[key]) acc[key] = [];
      acc[key].push(s);
      return acc;
    }, {} as Record<string, Service[]>);
  }, [filtered]);

  // Stats
  const totalCredits = services.reduce((sum, s) => sum + s.credits_cost, 0);
  const avgCost = services.length ? Math.round(totalCredits / services.length) : 0;
  const categories = new Set(services.map(s => s.category));

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">Servicii AI</h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">
              {services.length} servicii
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total servicii</p>
            <span className="text-2xl font-bold font-mono">{services.length}</span>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Clase</p>
            <span className="text-2xl font-bold font-mono">{Object.keys(CLASS_CONFIG).filter(k => services.some(s => s.service_class === k)).length}</span>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Cost mediu</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono">{avgCost}</span>
              <span className="text-[10px] text-muted-foreground">NEURONS</span>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Categorii</p>
            <span className="text-2xl font-bold font-mono">{categories.size}</span>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-6">
          <div className="flex items-center gap-0.5 flex-wrap">
            <button
              onClick={() => setFilterClass(null)}
              className={cn(
                "px-2.5 py-1 rounded text-[10px] font-medium transition-colors",
                !filterClass ? "bg-primary/10 text-primary" : "text-muted-foreground/60 hover:text-foreground"
              )}
            >
              Toate
            </button>
            {Object.entries(CLASS_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setFilterClass(filterClass === key ? null : key)}
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] font-medium transition-colors",
                  filterClass === key ? "bg-primary/10 text-primary" : "text-muted-foreground/60 hover:text-foreground"
                )}
              >
                Clasă {key}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5 flex-1 sm:max-w-[200px]">
            <Search className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Caută serviciu..."
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Services grouped by class */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="h-8 w-8 opacity-20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">Niciun serviciu găsit</p>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => { setFilterClass(null); setSearch(""); }}>
              Șterge filtrele
            </Button>
          </div>
        ) : (
          Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([classKey, classServices]) => {
            const cfg = CLASS_CONFIG[classKey] || CLASS_CONFIG.A;
            return (
              <div key={classKey} className="mb-6">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", cfg.color)}>Clasă {classKey}</span>
                  <span className="text-[10px] text-muted-foreground">— {cfg.label}</span>
                  <span className="text-[10px] text-muted-foreground/40 ml-auto">{classServices.length} servicii</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {classServices.map(service => {
                    const Icon = ICON_MAP[service.icon] || Sparkles;
                    return (
                      <div
                        key={service.id}
                        onClick={() => navigate(`/run/${service.service_key}`)}
                        className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all group cursor-pointer"
                      >
                        <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                          <Icon className={cn("h-4 w-4", cfg.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{service.name}</span>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{service.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[9px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Coins className="h-2.5 w-2.5" />
                              {service.credits_cost} NEURONS
                            </span>
                            <span className="text-[9px] text-muted-foreground/50 uppercase">
                              {CATEGORY_LABELS[service.category] || service.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
