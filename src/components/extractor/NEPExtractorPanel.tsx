import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain, Loader2, ChevronDown, ChevronUp, Check, Zap,
  Scale, Target, DollarSign, Heart, BookOpen, Cog,
  Palette, Users, RefreshCw, Shield, Clock, Search
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Extractor {
  id: string;
  purpose: string;
  cost_multiplier: number;
  level: string;
}

interface NEPFamily {
  key: string;
  label: string;
  icon: string;
  extractors: Extractor[];
  count: number;
}

interface ExtractionResult {
  extractor_id: string;
  family: string;
  neurons_created: number;
  avg_score: number;
}

const FAMILY_ICONS: Record<string, React.ReactNode> = {
  decision: <Scale className="h-3.5 w-3.5" />,
  strategy: <Target className="h-3.5 w-3.5" />,
  economic: <DollarSign className="h-3.5 w-3.5" />,
  behavioral: <Heart className="h-3.5 w-3.5" />,
  narrative: <BookOpen className="h-3.5 w-3.5" />,
  technical: <Cog className="h-3.5 w-3.5" />,
  creative: <Palette className="h-3.5 w-3.5" />,
  relational: <Users className="h-3.5 w-3.5" />,
  systemic: <RefreshCw className="h-3.5 w-3.5" />,
  ethical: <Shield className="h-3.5 w-3.5" />,
  temporal: <Clock className="h-3.5 w-3.5" />,
  meta_cognitive: <Search className="h-3.5 w-3.5" />,
};

interface Props {
  episodeId: string;
  onComplete?: (results: ExtractionResult[]) => void;
}

export function NEPExtractorPanel({ episodeId, onComplete }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [families, setFamilies] = useState<NEPFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFamilies, setSelectedFamilies] = useState<Set<string>>(new Set());
  const [selectedExtractors, setSelectedExtractors] = useState<Set<string>>(new Set());
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ExtractionResult[] | null>(null);

  // Load available extractors
  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deep-extract`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );
        if (!resp.ok) throw new Error("Failed to load extractors");
        const data = await resp.json();
        setFamilies(data.families || []);
      } catch (e) {
        console.error("Load extractors error:", e);
        toast.error(t("errors:load_failed"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleFamily = useCallback((familyKey: string) => {
    setSelectedFamilies(prev => {
      const next = new Set(prev);
      if (next.has(familyKey)) {
        next.delete(familyKey);
        // Also remove individual extractors from this family
        const family = families.find(f => f.key === familyKey);
        if (family) {
          setSelectedExtractors(prevExt => {
            const nextExt = new Set(prevExt);
            family.extractors.forEach(e => nextExt.delete(e.id));
            return nextExt;
          });
        }
      } else {
        next.add(familyKey);
      }
      return next;
    });
  }, [families]);

  const toggleExtractor = useCallback((extractorId: string) => {
    setSelectedExtractors(prev => {
      const next = new Set(prev);
      if (next.has(extractorId)) next.delete(extractorId);
      else next.add(extractorId);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedFamilies(new Set(families.map(f => f.key)));
  }, [families]);

  const selectNone = useCallback(() => {
    setSelectedFamilies(new Set());
    setSelectedExtractors(new Set());
  }, []);

  // Compute cost estimate
  const selectedCount = (() => {
    let count = 0;
    let cost = 0;
    for (const f of families) {
      if (selectedFamilies.has(f.key)) {
        count += f.extractors.length;
        cost += f.extractors.reduce((s, e) => s + 50 * e.cost_multiplier, 0);
      }
    }
    // Add individually selected extractors not in selected families
    for (const extId of selectedExtractors) {
      const ext = families.flatMap(f => f.extractors).find(e => e.id === extId);
      const family = families.find(f => f.extractors.some(e => e.id === extId));
      if (ext && family && !selectedFamilies.has(family.key)) {
        count++;
        cost += 50 * ext.cost_multiplier;
      }
    }
    return { count, cost: Math.round(cost) };
  })();

  const handleExtract = useCallback(async () => {
    if (!user) return;
    setExtracting(true);
    setProgress(0);
    setResults(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Build extractor_ids list
      const extractorIds: string[] = [];
      for (const f of families) {
        if (selectedFamilies.has(f.key)) {
          extractorIds.push(...f.extractors.map(e => e.id));
        }
      }
      for (const extId of selectedExtractors) {
        if (!extractorIds.includes(extId)) {
          extractorIds.push(extId);
        }
      }

      // Progress simulation
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 2, 90));
      }, 1000);

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deep-extract`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            episode_id: episodeId,
            extractor_ids: extractorIds,
          }),
        }
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      const data = await resp.json();
      setResults(data.results || []);
      toast.success(`${data.total_neurons} neuroni extrași cu ${data.extractors_used} extractori`);
      onComplete?.(data.results);
    } catch (e: any) {
      toast.error(e.message || "Extraction failed");
    } finally {
      setExtracting(false);
    }
  }, [user, episodeId, families, selectedFamilies, selectedExtractors, onComplete]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            NEP-120 Extraction Engine
          </h3>
          <p className="text-micro text-muted-foreground mt-0.5">
            {families.reduce((s, f) => s + f.count, 0)} extractori specializați în 12 familii
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" className="h-6 text-micro" onClick={selectAll}>
            Selectează tot
          </Button>
          <Button variant="ghost" size="sm" className="h-6 text-micro" onClick={selectNone}>
            Deselectează
          </Button>
        </div>
      </div>

      {/* Family grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {families.map(family => {
          const isSelected = selectedFamilies.has(family.key);
          const isExpanded = expandedFamily === family.key;
          const hasIndividual = family.extractors.some(e => selectedExtractors.has(e.id));

          return (
            <div key={family.key} className="space-y-1">
              <button
                onClick={() => toggleFamily(family.key)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all text-xs",
                  isSelected
                    ? "border-primary bg-primary/5 text-primary"
                    : hasIndividual
                    ? "border-primary/30 bg-primary/3"
                    : "border-border hover:border-primary/30"
                )}
              >
                <span className="shrink-0">{FAMILY_ICONS[family.key] || <Zap className="h-3.5 w-3.5" />}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{family.label}</div>
                  <div className="text-nano text-muted-foreground">{family.count} extractori</div>
                </div>
                {isSelected && <Check className="h-3 w-3 shrink-0 text-primary" />}
              </button>
              <button
                onClick={() => setExpandedFamily(isExpanded ? null : family.key)}
                className="w-full text-nano text-muted-foreground hover:text-foreground text-center py-0.5"
              >
                {isExpanded ? <ChevronUp className="h-3 w-3 mx-auto" /> : <ChevronDown className="h-3 w-3 mx-auto" />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Expanded family detail */}
      {expandedFamily && (() => {
        const family = families.find(f => f.key === expandedFamily);
        if (!family) return null;
        return (
          <div className="border border-border rounded-lg p-3 space-y-2 bg-card">
            <div className="flex items-center gap-2 mb-2">
              {FAMILY_ICONS[family.key]}
              <span className="text-xs font-semibold">{family.label}</span>
              <Badge variant="secondary" className="text-nano">{family.count} extractori</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {family.extractors.map(ext => {
                const familySelected = selectedFamilies.has(family.key);
                const isSelected = familySelected || selectedExtractors.has(ext.id);
                return (
                  <button
                    key={ext.id}
                    onClick={() => !familySelected && toggleExtractor(ext.id)}
                    disabled={familySelected}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded border text-left text-micro transition-all",
                      isSelected
                        ? "border-primary/50 bg-primary/5 text-primary"
                        : "border-border/50 hover:border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "h-3 w-3 rounded-sm border shrink-0 flex items-center justify-center",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                    )}>
                      {isSelected && <Check className="h-2 w-2 text-primary-foreground" />}
                    </div>
                    <span className="flex-1 min-w-0 truncate">{ext.purpose}</span>
                    <span className="shrink-0 text-nano text-muted-foreground">
                      {Math.round(50 * ext.cost_multiplier)}c
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Cost summary + extract button */}
      {selectedCount.count > 0 && (
        <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
          <div>
            <div className="text-xs font-medium">
              {selectedCount.count} extractori selectați
            </div>
            <div className="text-micro text-muted-foreground">
              ~{selectedCount.cost} NEURONS
            </div>
          </div>
          <Button
            onClick={handleExtract}
            disabled={extracting}
            size="sm"
            className="gap-2"
          >
            {extracting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Extracție...
              </>
            ) : (
              <>
                <Brain className="h-3.5 w-3.5" />
                Extrage Neuroni
              </>
            )}
          </Button>
        </div>
      )}

      {/* Progress */}
      {extracting && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-micro text-muted-foreground text-center">
            Se procesează {selectedCount.count} extractori... {progress}%
          </p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="border border-border rounded-lg p-3 space-y-2">
          <h4 className="text-xs font-semibold">Rezultate extracție</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {results.filter(r => r.neurons_created > 0).map(r => (
              <div key={r.extractor_id} className="bg-muted/30 rounded p-2 text-micro">
                <div className="font-medium truncate">{r.extractor_id.replace("nep_", "").replace(/_/g, " ")}</div>
                <div className="flex items-center justify-between mt-1 text-muted-foreground">
                  <span>{r.neurons_created} neuroni</span>
                  <span>scor: {r.avg_score}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-micro text-muted-foreground text-center mt-2">
            Total: {results.reduce((s, r) => s + r.neurons_created, 0)} neuroni extrași
          </p>
        </div>
      )}
    </div>
  );
}
