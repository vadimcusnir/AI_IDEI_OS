import { useState, useEffect } from "react";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/motion/PageTransition";
import {
  Brain, Loader2, Search, CheckCircle2, AlertCircle,
  Sparkles, Filter, ChevronRight, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

interface CognitiveUnit {
  id: string;
  title: string;
  content: string;
  unit_type: string;
  category_id: string;
  confidence: number;
  quality_score: number;
  is_validated: boolean;
  llm_ready: boolean;
  tags: string[] | null;
  neuron_id: number | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export default function CognitiveUnits() {
  const { user } = useAuth();
  const { t } = useTranslation("pages");
  const [units, setUnits] = useState<CognitiveUnit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [filterValidated, setFilterValidated] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [unitsRes, catsRes] = await Promise.all([
        supabase
          .from("cognitive_units")
          .select("*")
          .eq("author_id", user.id)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("cognitive_categories")
          .select("id, name, slug, icon, description")
          .eq("is_active", true)
          .order("position"),
      ]);
      setUnits((unitsRes.data as CognitiveUnit[]) || []);
      setCategories((catsRes.data as Category[]) || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = units.filter(u => {
    if (search && !u.title.toLowerCase().includes(search.toLowerCase()) && !u.content.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeCategory && u.category_id !== activeCategory) return false;
    if (filterValidated === true && !u.is_validated) return false;
    if (filterValidated === false && u.is_validated) return false;
    return true;
  });

  const catMap = new Map(categories.map(c => [c.id, c]));

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PremiumGate requiredTier="pro" featureName="Cognitive Units" fallback="overlay">
    <PageTransition>
      <div className="flex-1 overflow-auto">
        <SEOHead title="Cognitive Units — AI-IDEI" description="Browse and manage extracted cognitive units from your knowledge base." />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Cognitive Units
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Atomic knowledge units extracted from your content. Each unit represents a validated insight, pattern, or concept.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search units..."
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant={filterValidated === null ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setFilterValidated(null)}
              >
                All
              </Button>
              <Button
                variant={filterValidated === true ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => setFilterValidated(filterValidated === true ? null : true)}
              >
                <CheckCircle2 className="h-3 w-3" /> Validated
              </Button>
              <Button
                variant={filterValidated === false ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => setFilterValidated(filterValidated === false ? null : false)}
              >
                <AlertCircle className="h-3 w-3" /> Pending
              </Button>
            </div>
          </div>

          {/* Category pills */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeCategory === null ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveCategory(null)}
              >
                All Categories
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                >
                  <span>{cat.icon}</span> {cat.name}
                </Button>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold font-mono">{units.length}</p>
              <p className="text-micro text-muted-foreground uppercase tracking-wider">Total Units</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold font-mono text-primary">{units.filter(u => u.is_validated).length}</p>
              <p className="text-micro text-muted-foreground uppercase tracking-wider">Validated</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold font-mono">{units.filter(u => u.llm_ready).length}</p>
              <p className="text-micro text-muted-foreground uppercase tracking-wider">LLM Ready</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold font-mono">
                {units.length > 0 ? (units.reduce((s, u) => s + u.quality_score, 0) / units.length).toFixed(0) : 0}%
              </p>
              <p className="text-micro text-muted-foreground uppercase tracking-wider">Avg Quality</p>
            </div>
          </div>

          {/* Units list */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Brain className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {units.length === 0 ? "No cognitive units yet. Extract content to generate units." : "No units match your filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(unit => {
                const cat = catMap.get(unit.category_id);
                return (
                  <div
                    key={unit.id}
                    className="group rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-sm",
                        unit.is_validated ? "bg-primary/10" : "bg-muted"
                      )}>
                        {cat?.icon || "🧠"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-semibold truncate">{unit.title}</h3>
                          <Badge variant="outline" className="text-nano uppercase">{unit.unit_type}</Badge>
                          {unit.is_validated && (
                            <Badge className="bg-primary/10 text-primary text-nano gap-0.5">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Validated
                            </Badge>
                          )}
                          {unit.llm_ready && (
                            <Badge className="bg-accent/10 text-accent-foreground text-nano gap-0.5">
                              <Sparkles className="h-2.5 w-2.5" /> LLM Ready
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{unit.content}</p>
                        <div className="flex items-center gap-3 mt-2 text-micro text-muted-foreground">
                          {cat && <span>{cat.name}</span>}
                          <span>Quality: {(unit.quality_score * 100).toFixed(0)}%</span>
                          <span>Confidence: {(unit.confidence * 100).toFixed(0)}%</span>
                          {unit.neuron_id && (
                            <Link to={`/n/${unit.neuron_id}`} className="text-primary hover:underline flex items-center gap-0.5">
                              Neuron #{unit.neuron_id} <ArrowRight className="h-2.5 w-2.5" />
                            </Link>
                          )}
                        </div>
                        {unit.tags && unit.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {unit.tags.map(tag => (
                              <span key={tag} className="text-nano px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
    </PremiumGate>
  );
}
