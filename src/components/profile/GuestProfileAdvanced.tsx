import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RadarChart } from "@/components/intelligence/RadarChart";
import { PsychologicalProfileSection, type PsychologicalProfileData } from "@/components/profile/PsychologicalProfileSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Brain, Loader2, Sparkles, Lock, Eye, TrendingUp,
  MessageCircle, Target, Heart, Shield, Zap,
  BookOpen, Users, Lightbulb, BarChart3, GitMerge, Edit3,
  CheckCircle2, XCircle, Send,
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

interface DuplicateSuggestion {
  id: string;
  source_profile_id: string;
  target_profile_id: string;
  similarity_score: number;
  status: string;
  target_name?: string;
}

interface ProfileEdit {
  id: string;
  field_name: string;
  old_value: string | null;
  new_value: string;
  status: string;
  created_at: string;
}

export function GuestProfileAdvanced({ guestId, guestName, episodeIds, isOwner }: GuestProfileAdvancedProps) {
  const { user } = useAuth();
  const [psychProfile, setPsychProfile] = useState<PsychologicalProfileData | null>(null);
  const [moduleData, setModuleData] = useState<ModuleData>({});
  const [profileTier, setProfileTier] = useState<"free" | "premium">("free");
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  // Duplicate merge
  const [duplicates, setDuplicates] = useState<DuplicateSuggestion[]>([]);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeSearch, setMergeSearch] = useState("");
  const [mergeResults, setMergeResults] = useState<any[]>([]);
  const [searchingMerge, setSearchingMerge] = useState(false);
  // Collaborative edit
  const [pendingEdits, setPendingEdits] = useState<ProfileEdit[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editField, setEditField] = useState("");
  const [editValue, setEditValue] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

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

    // Load duplicate suggestions
    const { data: dupes } = await supabase
      .from("guest_profile_suggestions" as any)
      .select("*")
      .or(`source_profile_id.eq.${guestId},target_profile_id.eq.${guestId}`)
      .eq("status", "pending");
    setDuplicates((dupes as any[]) || []);

    // Load pending edits
    const { data: edits } = await supabase
      .from("guest_profile_edits" as any)
      .select("*")
      .eq("guest_profile_id", guestId)
      .order("created_at", { ascending: false })
      .limit(20);
    setPendingEdits((edits as unknown as ProfileEdit[]) || []);

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

  // Search for potential duplicates
  const searchDuplicates = async () => {
    if (!mergeSearch.trim()) return;
    setSearchingMerge(true);
    const { data } = await supabase
      .from("guest_profiles" as any)
      .select("id, full_name, role, slug")
      .neq("id", guestId)
      .ilike("full_name", `%${mergeSearch}%`)
      .limit(10);
    setMergeResults(data || []);
    setSearchingMerge(false);
  };

  const suggestMerge = async (targetId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("guest_profile_suggestions" as any)
      .insert({
        source_profile_id: guestId,
        target_profile_id: targetId,
        suggested_by: user.id,
        similarity_score: 0.8,
      } as any);
    if (error) { toast.error("Already suggested or error"); return; }
    toast.success("Merge suggestion submitted for admin review");
    setShowMergeDialog(false);
    loadProfile();
  };

  const submitEdit = async () => {
    if (!user || !editField || !editValue.trim()) return;
    setSubmittingEdit(true);
    const { error } = await supabase
      .from("guest_profile_edits" as any)
      .insert({
        guest_profile_id: guestId,
        editor_id: user.id,
        field_name: editField,
        new_value: editValue.trim(),
      } as any);
    setSubmittingEdit(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Edit submitted for review");
    setShowEditDialog(false);
    setEditField("");
    setEditValue("");
    loadProfile();
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
              <p className="text-micro text-muted-foreground">
                {psychProfile
                  ? `Last analyzed: ${profileTier} tier`
                  : "No analysis yet — run to generate profile"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5"
                onClick={() => runAnalysis("free")} disabled={analyzing}>
                {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                Basic (4 modules)
              </Button>
              <Button size="sm" className="h-8 text-xs gap-1.5"
                onClick={() => runAnalysis("premium")} disabled={analyzing}>
                {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Deep (10 modules)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Collaborative Actions — visible to all authenticated users */}
      {user && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5"
            onClick={() => setShowMergeDialog(true)}>
            <GitMerge className="h-3 w-3" /> Suggest Duplicate Merge
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5"
            onClick={() => setShowEditDialog(true)}>
            <Edit3 className="h-3 w-3" /> Suggest Edit
          </Button>
        </div>
      )}

      {/* Pending merge suggestions */}
      {duplicates.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <GitMerge className="h-3.5 w-3.5 text-amber-600" />
            {duplicates.length} duplicate merge suggestion{duplicates.length > 1 ? "s" : ""} pending
          </p>
          {duplicates.map(d => (
            <div key={d.id} className="flex items-center gap-2 text-micro text-muted-foreground">
              <span>Possible match: {d.target_profile_id === guestId ? d.source_profile_id : d.target_profile_id}</span>
              <Badge variant="outline" className="text-nano">{d.status}</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Pending edits */}
      {pendingEdits.filter(e => e.status === "pending").length > 0 && isOwner && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <Edit3 className="h-3.5 w-3.5 text-primary" />
            {pendingEdits.filter(e => e.status === "pending").length} edit suggestion{pendingEdits.filter(e => e.status === "pending").length > 1 ? "s" : ""} pending review
          </p>
          {pendingEdits.filter(e => e.status === "pending").slice(0, 3).map(edit => (
            <div key={edit.id} className="flex items-center justify-between text-micro p-2 rounded-lg bg-background border border-border">
              <div>
                <span className="font-medium">{edit.field_name}</span>: "{edit.new_value.slice(0, 60)}{edit.new_value.length > 60 ? "…" : ""}"
              </div>
              <Badge variant="outline" className="text-nano">{edit.status}</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Main Profile */}
      {psychProfile && <PsychologicalProfileSection profile={psychProfile} />}

      {/* Premium Modules */}
      {moduleData.cognitive_style && (
        <ModuleCard icon={Brain} title="Cognitive Style" data={moduleData.cognitive_style}
          fields={["cognitive_complexity", "information_processing", "reasoning_patterns", "learning_style"]} />
      )}
      {moduleData.emotional_drivers && (
        <ModuleCard icon={Heart} title="Emotional Intelligence & Drivers" data={moduleData.emotional_drivers}
          fields={["emotional_intelligence", "primary_drivers", "emotional_vocabulary", "emotional_contagion"]} />
      )}
      {moduleData.narrative_patterns && (
        <ModuleCard icon={BookOpen} title="Narrative Patterns" data={moduleData.narrative_patterns}
          fields={["narrative_archetypes", "story_structure", "narrative_coherence", "metaphor_patterns", "rhetorical_devices"]} />
      )}
      {moduleData.value_system && (
        <ModuleCard icon={Shield} title="Values & Belief System" data={moduleData.value_system}
          fields={["core_values", "moral_foundations", "worldview_markers"]} />
      )}
      {moduleData.expertise_mapping && (
        <ModuleCard icon={Target} title="Expertise Mapping" data={moduleData.expertise_mapping}
          fields={["expertise_domains", "teaching_patterns", "authority_markers"]} />
      )}

      {/* Upgrade prompt */}
      {profileTier === "free" && psychProfile && isOwner && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
          <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
          <h3 className="text-sm font-semibold mb-1">Unlock Deep Analysis</h3>
          <p className="text-dense text-muted-foreground max-w-sm mx-auto mb-3">
            Premium analysis includes 6 additional modules: Cognitive Style, Emotional Drivers,
            Narrative Patterns, Values System, and Expertise Mapping with detailed scoring.
          </p>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => runAnalysis("premium")} disabled={analyzing}>
            <Sparkles className="h-3 w-3" /> Run Deep Analysis (10 modules)
          </Button>
        </div>
      )}

      {/* Merge Dialog */}
      <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Suggest Profile Merge</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Search for a profile that might be the same person as <strong>{guestName}</strong>.
          </p>
          <div className="flex gap-2">
            <Input value={mergeSearch} onChange={e => setMergeSearch(e.target.value)}
              placeholder="Search by name..." className="text-xs h-9"
              onKeyDown={e => e.key === "Enter" && searchDuplicates()} />
            <Button size="sm" className="h-9 text-xs" onClick={searchDuplicates} disabled={searchingMerge}>
              {searchingMerge ? <Loader2 className="h-3 w-3 animate-spin" /> : "Search"}
            </Button>
          </div>
          {mergeResults.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {mergeResults.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border border-border text-xs">
                  <div>
                    <p className="font-medium">{r.full_name}</p>
                    <p className="text-micro text-muted-foreground">{r.role}</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-micro" onClick={() => suggestMerge(r.id)}>
                    <GitMerge className="h-3 w-3 mr-1" /> Suggest
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Suggest Profile Edit</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Suggest a correction or addition to <strong>{guestName}</strong>'s profile.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-micro font-medium text-muted-foreground">Field</label>
              <select value={editField} onChange={e => setEditField(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs mt-1">
                <option value="">Select field...</option>
                <option value="bio">Bio</option>
                <option value="expertise">Expertise areas</option>
                <option value="role">Role / Title</option>
                <option value="social_links">Social links</option>
                <option value="correction">Factual correction</option>
                <option value="additional_info">Additional information</option>
              </select>
            </div>
            <div>
              <label className="text-micro font-medium text-muted-foreground">Suggested value</label>
              <Textarea value={editValue} onChange={e => setEditValue(e.target.value)}
                placeholder="Enter the correct or additional information..."
                className="text-xs min-h-[80px] mt-1" />
            </div>
            <Button size="sm" className="w-full h-9 text-xs gap-1.5"
              onClick={submitEdit} disabled={submittingEdit || !editField || !editValue.trim()}>
              {submittingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Submit Edit for Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Generic module card ──
function ModuleCard({ icon: Icon, title, data, fields }: {
  icon: React.ElementType;
  title: string;
  data: any;
  fields: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (!data || typeof data !== "object") return null;

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

  fields.forEach(f => { if (data[f]) extractFromObj(data[f], ""); });
  if (scores.length === 0 && insights.length === 0) extractFromObj(data);

  const visibleScores = expanded ? scores : scores.slice(0, 5);
  const visibleInsights = expanded ? insights : insights.slice(0, 4);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
        {scores.length > 5 && (
          <Button variant="ghost" size="sm" className="h-6 text-micro ml-auto"
            onClick={() => setExpanded(!expanded)}>
            {expanded ? "Less" : `+${scores.length - 5} more`}
          </Button>
        )}
      </div>

      {visibleScores.length > 0 && (
        <div className="space-y-2">
          {visibleScores.map((s, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-dense text-foreground">{s.label}</span>
                <span className="text-micro font-bold text-primary tabular-nums">{Math.round(s.value)}</span>
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
              <p className="text-nano uppercase tracking-wider text-muted-foreground mb-0.5">{ins.label}</p>
              <p className="text-xs font-medium">{ins.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
