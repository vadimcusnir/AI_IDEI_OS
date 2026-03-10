import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.gif";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Loader2, Sparkles, BarChart3, Filter, Megaphone,
  Brain, Layers, HelpCircle, Quote, MessageSquare,
  FileText, GraduationCap, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  brain: Brain,
  layers: Layers,
  "help-circle": HelpCircle,
  quote: Quote,
  "message-square": MessageSquare,
  "bar-chart-3": BarChart3,
  "file-text": FileText,
  "graduation-cap": GraduationCap,
  filter: Filter,
  megaphone: Megaphone,
  sparkles: Sparkles,
};

const CLASS_CONFIG: Record<string, { label: string; description: string; color: string }> = {
  A: { label: "Analysis & Decision", description: "Extract insights and produce decision frameworks", color: "text-ai-accent" },
  B: { label: "Asset Production", description: "Generate concrete deliverables and content", color: "text-status-validated" },
  C: { label: "Orchestration & System", description: "Coordinate execution across services", color: "text-primary" },
};

const CATEGORY_LABELS: Record<string, string> = {
  extraction: "Extraction",
  analysis: "Analysis",
  production: "Production",
  orchestration: "Orchestration",
};

export default function Services() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }

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

  const filtered = filterClass
    ? services.filter(s => s.service_class === filterClass)
    : services;

  const grouped = filtered.reduce((acc, s) => {
    const key = s.service_class;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {} as Record<string, Service[]>);

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <img src={logo} alt="ai-idei.com" className="h-5 w-5" />
          <span className="text-sm font-serif">Service Catalog</span>
          <span className="text-[9px] uppercase tracking-wider bg-ai-accent/10 text-ai-accent px-1.5 py-0.5 rounded font-semibold">
            Execution Layer
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-xl font-serif mb-2">AI Services</h1>
        <p className="text-xs text-muted-foreground mb-6">
          Deterministic services that transform your knowledge into operational results. Each service has a fixed cost, defined deliverables, and auditable execution.
        </p>

        {/* Class filter */}
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => setFilterClass(null)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              !filterClass ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            All Classes
          </button>
          {Object.entries(CLASS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilterClass(filterClass === key ? null : key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filterClass === key ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Class {key}
            </button>
          ))}
        </div>

        {/* Services grouped by class */}
        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([classKey, classServices]) => {
          const cfg = CLASS_CONFIG[classKey] || CLASS_CONFIG.A;
          return (
            <div key={classKey} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className={cn("text-xs font-bold", cfg.color)}>Class {classKey}</span>
                <span className="text-[10px] text-muted-foreground">— {cfg.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mb-3">{cfg.description}</p>

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
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{service.name}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{service.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[9px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                            {service.credits_cost} credits
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
        })}
      </div>
    </div>
  );
}
