import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RadarChart } from "@/components/intelligence/RadarChart";
import { PsychologicalProfileSection, type PsychologicalProfileData } from "@/components/profile/PsychologicalProfileSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Brain, Loader2, Sparkles, Lock, Eye, TrendingUp,
  MessageCircle, Target, Heart, Shield, Zap,
  BookOpen, Users, Lightbulb, BarChart3,
} from "lucide-react";

interface GuestProfileAdvancedProps {
  guestId: string;
  guestName: string;
  episodeIds: string[];
  isOwner: boolean;
}

interface ModuleData {
  cognitive_style?: any;
  emotional_drivers?: any;
  narrative_patterns?: any;
  value_system?: any;
  expertise_mapping?: any;
}

export function GuestProfileAdvanced({ guestId, guestName, episodeIds, isOwner }: GuestProfileAdvancedProps) {
  const { user } = useAuth();
  const [psychProfile, setPsychProfile] = useState<PsychologicalProfileData | null>(null);
  const [moduleData, setModuleData] = useState<ModuleData>({});
  const [profileTier, setProfileTier] = useState<"free" | "premium">("free");
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const { data: pp } = await supabase
      .from("psychological_profiles" as any)
      .select("*")
      .eq("guest_profile_id", guestId)
      .maybeSingle();
    
    if (pp) {
      setPsychProfile(pp as unknown as PsychologicalProfileData);
      const meta = (pp as any).analysis_metadata;
      setProfileTier(meta?.tier || "free");
      setModuleData({
        cognitive_style: meta?.cognitive_style,
        emotional_drivers: meta?.emotional_drivers,
        narrative_patterns: meta?.narrative_patterns,
        value_system: meta?.value_system,
        expertise_mapping: meta?.expertise_mapping,
      });
    }
    setLoading(false);
  }, [guestId]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const runAnalysis = async (tier: "free" | "premium") => {
    if (!user) return;
    setAnalyzing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-psychology`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.session?.access_token}`,
          },
          body: JSON.stringify({ guest_profile_id: guestId, tier }),
        }
      );
      const result = await resp.json();
      if (!resp.ok || result.error) throw new Error(result.error || "Analysis failed");
      
      toast.success(`${tier === "premium" ? "Deep" : "Basic"} analysis complete — ${result.modules_completed} modules processed`);
      await loadProfile();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Analysis Actions */}
      {isOwner && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold">Psychological Analysis</p>
              <p className="text-[10px] text-muted-foreground">
                {psychProfile
                  ? `Last analyzed: ${profileTier} tier`
                  : "No analysis yet — run to generate profile"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5"
                onClick={() => runAnalysis("free")}
                disabled={analyzing}
              >
                {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                Basic (4 modules)
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => runAnalysis("premium")}
                disabled={analyzing}
              >
                {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Deep (10 modules)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Profile */}
      {psychProfile && <PsychologicalProfileSection profile={psychProfile} />}

      {/* Premium Modules */}
      {moduleData.cognitive_style && (
        <ModuleCard
          icon={Brain}
          title="Cognitive Style"
          data={moduleData.cognitive_style}
          fields={["cognitive_complexity", "information_processing", "reasoning_patterns", "learning_style"]}
        />
      )}

      {moduleData.emotional_drivers && (
        <ModuleCard
          icon={Heart}
          title="Emotional Intelligence & Drivers"
          data={moduleData.emotional_drivers}
          fields={["emotional_intelligence", "primary_drivers", "emotional_vocabulary", "emotional_contagion"]}
        />
      )}

      {moduleData.narrative_patterns && (
        <ModuleCard
          icon={BookOpen}
          title="Narrative Patterns"
          data={moduleData.narrative_patterns}
          fields={["narrative_archetypes", "story_structure", "narrative_coherence", "metaphor_patterns", "rhetorical_devices"]}
        />
      )}

      {moduleData.value_system && (
        <ModuleCard
          icon={Shield}
          title="Values & Belief System"
          data={moduleData.value_system}
          fields={["core_values", "moral_foundations", "worldview_markers"]}
        />
      )}

      {moduleData.expertise_mapping && (
        <ModuleCard
          icon={Target}
          title="Expertise Mapping"
          data={moduleData.expertise_mapping}
          fields={["expertise_domains", "teaching_patterns", "authority_markers"]}
        />
      )}

      {/* Upgrade prompt for free tier */}
      {profileTier === "free" && psychProfile && isOwner && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
          <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
          <h3 className="text-sm font-semibold mb-1">Unlock Deep Analysis</h3>
          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto mb-3">
            Premium analysis includes 6 additional modules: Cognitive Style, Emotional Drivers,
            Narrative Patterns, Values System, and Expertise Mapping with detailed scoring.
          </p>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => runAnalysis("premium")} disabled={analyzing}>
            <Sparkles className="h-3 w-3" /> Run Deep Analysis (10 modules)
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Generic module card that renders any JSON analysis module ──
function ModuleCard({ icon: Icon, title, data, fields }: {
  icon: React.ElementType;
  title: string;
  data: any;
  fields: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (!data || typeof data !== "object") return null;

  // Extract displayable scores
  const scores: { label: string; value: number }[] = [];
  const insights: { label: string; value: string }[] = [];

  const extractFromObj = (obj: any, prefix = "") => {
    if (!obj || typeof obj !== "object") return;
    for (const [key, val] of Object.entries(obj)) {
      const label = (prefix ? `${prefix} › ` : "") + key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      if (typeof val === "number" && val >= 0 && val <= 100) {
        scores.push({ label, value: val });
      } else if (typeof val === "string" && val.length < 100) {
        insights.push({ label, value: val });
      } else if (typeof val === "object" && val !== null && !Array.isArray(val) && Object.keys(val).length <= 5) {
        extractFromObj(val, key.replace(/_/g, " "));
      }
    }
  };

  fields.forEach(f => {
    if (data[f]) extractFromObj(data[f], "");
  });

  // Fallback: extract from root
  if (scores.length === 0 && insights.length === 0) {
    extractFromObj(data);
  }

  const visibleScores = expanded ? scores : scores.slice(0, 5);
  const visibleInsights = expanded ? insights : insights.slice(0, 4);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
        {scores.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] ml-auto"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Less" : `+${scores.length - 5} more`}
          </Button>
        )}
      </div>

      {visibleScores.length > 0 && (
        <div className="space-y-2">
          {visibleScores.map((s, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-foreground">{s.label}</span>
                <span className="text-[10px] font-bold text-primary tabular-nums">{Math.round(s.value)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary/60" style={{ width: `${s.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {visibleInsights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {visibleInsights.map((ins, i) => (
            <div key={i} className="rounded-lg border border-border p-3">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">{ins.label}</p>
              <p className="text-xs font-medium">{ins.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
