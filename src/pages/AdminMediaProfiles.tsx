import { useState, useEffect, useCallback } from "react";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Loader2, Shield, Eye, EyeOff, AlertTriangle, CheckCircle2,
  XCircle, ArrowRight, Plus, ChevronDown, ExternalLink, Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ProfileGeneratorPanel } from "@/components/intelligence/ProfileGeneratorPanel";
import { ConsentPanel } from "@/components/intelligence/ConsentPanel";
import { StateTransitionsTimeline } from "@/components/intelligence/StateTransitionsTimeline";
import { PublicIndicatorsEditor } from "@/components/intelligence/PublicIndicatorsEditor";
import { GuardrailResultsPanel } from "@/components/intelligence/GuardrailResultsPanel";

interface ProfileRow {
  id: string;
  person_name: string;
  profile_type: string;
  source_type: string;
  source_ref: string;
  public_slug: string;
  visibility_status: string;
  risk_flag: string;
  consent_required: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

interface GuardrailResult {
  gate: string;
  status: "PASS" | "FAIL" | "SKIP";
  reason?: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "bg-warning/10 text-warning",
  published: "bg-success/10 text-success",
  blocked: "bg-destructive/10 text-destructive",
};

const RISK_COLORS: Record<string, string> = {
  low: "text-success",
  medium: "text-warning",
  high: "text-destructive",
};

export default function AdminMediaProfiles() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { t } = useTranslation("pages");
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [guardrails, setGuardrails] = useState<{ all_pass: boolean; checks: GuardrailResult[] } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAIGenerate, setShowAIGenerate] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newType, setNewType] = useState("public_figure");
  const [newSourceType, setNewSourceType] = useState("podcast");
  const [newSourceRef, setNewSourceRef] = useState("");
  const [newSynthesis, setNewSynthesis] = useState("");
  const [creating, setCreating] = useState(false);

  const loadProfiles = useCallback(async () => {
    const { data } = await (supabase.from("intelligence_profiles") as any)
      .select("*")
      .order("updated_at", { ascending: false });
    setProfiles((data as ProfileRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (isAdmin) loadProfiles(); }, [isAdmin, loadProfiles]);

  const runGuardrails = useCallback(async (profileId: string) => {
    setSelectedId(profileId);
    const { data, error } = await supabase.rpc("validate_profile_guardrails", { _profile_id: profileId });
    if (error) { toast.error("Failed to validate"); return; }
    setGuardrails(data as any);
  }, []);

  const transitionStatus = useCallback(async (profileId: string, toStatus: "draft" | "review" | "published" | "blocked", reason?: string) => {
    const { data, error } = await supabase.rpc("transition_profile_status", {
      _profile_id: profileId,
      _to_status: toStatus,
      _reason_code: reason || null,
    });
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Transition failed");
      return;
    }
    toast.success(`Status: ${toStatus}`);
    loadProfiles();
    if (selectedId === profileId) runGuardrails(profileId);
  }, [loadProfiles, runGuardrails, selectedId]);

  const createProfile = useCallback(async () => {
    if (!newName.trim() || !newSlug.trim()) { toast.error("Name and slug required"); return; }
    setCreating(true);
    const slug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

    const { error } = await (supabase.from("intelligence_profiles") as any).insert({
      person_name: newName.trim(),
      public_slug: slug,
      profile_type: newType,
      source_type: newSourceType,
      source_ref: newSourceRef.trim() || "N/A",
      synthesis_text: newSynthesis.trim() || "",
      consent_required: newType === "anonymized_client",
      created_by: user?.id,
    });

    if (error) { toast.error(error.message); setCreating(false); return; }

    // Create public subset
    const { data: profile } = await (supabase.from("intelligence_profiles") as any)
      .select("id")
      .eq("public_slug", slug)
      .single();

    if (profile) {
      await (supabase.from("intelligence_profile_public") as any).insert({
        profile_id: profile.id,
        public_indicators: [],
        public_patterns: [],
        public_summary: newSynthesis.trim() || null,
        meta_title: `${newName.trim()} — Analysis from public material`,
        meta_description: `Observational analysis of ${newName.trim()}.`,
      });
    }

    toast.success("Profile created as draft");
    setShowCreate(false);
    setNewName(""); setNewSlug(""); setNewSourceRef(""); setNewSynthesis("");
    setCreating(false);
    loadProfiles();
  }, [newName, newSlug, newType, newSourceType, newSourceRef, newSynthesis, user, loadProfiles]);

  if (authLoading || adminLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!isAdmin) return <Navigate to="/home" replace />;

  const selectedProfile = profiles.find(p => p.id === selectedId);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Admin — Intelligence Profiles" description="Manage intelligence profile publication workflow." />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Intelligence Profiles</h1>
            <p className="text-sm text-muted-foreground">Review workflow: draft → review → published | blocked</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setShowAIGenerate(!showAIGenerate); setShowCreate(false); }}>
              <Brain className="h-4 w-4 mr-1" /> AI Generate
            </Button>
            <Button size="sm" onClick={() => { setShowCreate(!showCreate); setShowAIGenerate(false); }}>
              <Plus className="h-4 w-4 mr-1" /> Manual
            </Button>
          </div>
        </div>

        {/* AI Generate panel */}
        {showAIGenerate && (
          <div className="mb-6">
            <ProfileGeneratorPanel onComplete={() => { setShowAIGenerate(false); loadProfiles(); }} />
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <div className="bg-card border border-border rounded-lg p-5 mb-6 space-y-4">
            <h3 className="text-sm font-semibold">Create New Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input placeholder="Person name" value={newName} onChange={e => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")); }} />
              <Input placeholder="public-slug" value={newSlug} onChange={e => setNewSlug(e.target.value)} />
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public_figure">Public Figure</SelectItem>
                  <SelectItem value="local_figure">Local Figure</SelectItem>
                  <SelectItem value="anonymized_client">Anonymized Client</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newSourceType} onValueChange={setNewSourceType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="podcast">Podcast</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="conversation">Conversation</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Source URL" value={newSourceRef} onChange={e => setNewSourceRef(e.target.value)} className="sm:col-span-2" />
            </div>
            <Textarea placeholder="Synthesis text (neutral, observational)" value={newSynthesis} onChange={e => setNewSynthesis(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <Button size="sm" onClick={createProfile} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Create Draft
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* Profile list */}
          <div className="flex-1 space-y-2">
            {loading ? (
              <div className="text-center py-12"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">No profiles yet</div>
            ) : (
              profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => runGuardrails(p.id)}
                  className={cn(
                    "w-full text-left bg-card border rounded-lg p-4 hover:border-primary/30 transition-colors",
                    selectedId === p.id ? "border-primary" : "border-border"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{p.person_name || p.public_slug}</span>
                    <span className={cn("text-micro px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[p.visibility_status])}>
                      {p.visibility_status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-micro text-muted-foreground">
                    <span>{p.profile_type.replace("_", " ")}</span>
                    <span>•</span>
                    <span className={RISK_COLORS[p.risk_flag]}>risk: {p.risk_flag}</span>
                    <span>•</span>
                    <span>v{p.version}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Detail panel */}
          {selectedProfile && (
            <div className="w-80 shrink-0 bg-card border border-border rounded-lg p-5 sticky top-4 self-start space-y-4">
              <h3 className="text-sm font-semibold">{selectedProfile.person_name}</h3>
              <div className="text-xs space-y-1 text-muted-foreground">
                <div>Slug: <span className="text-foreground font-mono">{selectedProfile.public_slug}</span></div>
                <div>Type: <span className="text-foreground">{selectedProfile.profile_type}</span></div>
                <div>Source: <span className="text-foreground">{selectedProfile.source_type}</span></div>
                <div>Status: <span className={cn("font-medium", STATUS_COLORS[selectedProfile.visibility_status])}>{selectedProfile.visibility_status}</span></div>
                <div>Risk: <span className={cn("font-medium", RISK_COLORS[selectedProfile.risk_flag])}>{selectedProfile.risk_flag}</span></div>
                <div>Consent: {selectedProfile.consent_required ? "Required" : "N/A"}</div>
              </div>

              {/* Guardrails */}
              {guardrails && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Guardrail Checks
                  </h4>
                  {guardrails.checks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {check.status === "PASS" ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> :
                       check.status === "FAIL" ? <XCircle className="h-3.5 w-3.5 text-destructive" /> :
                       <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="capitalize">{check.gate.replace("_", " ")}</span>
                      {check.reason && <span className="text-muted-foreground">({check.reason})</span>}
                    </div>
                  ))}
                  <div className={cn("text-xs font-medium px-2 py-1 rounded", guardrails.all_pass ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                    {guardrails.all_pass ? "✅ Ready for publish" : "⛔ Cannot publish"}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-border">
                <h4 className="text-xs font-semibold">Actions</h4>
                {selectedProfile.visibility_status === "draft" && (
                  <Button size="sm" className="w-full" variant="outline" onClick={() => transitionStatus(selectedProfile.id, "review")}>
                    Submit for Review
                  </Button>
                )}
                {selectedProfile.visibility_status === "review" && guardrails?.all_pass && (
                  <Button size="sm" className="w-full" onClick={() => transitionStatus(selectedProfile.id, "published")}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Publish
                  </Button>
                )}
                {selectedProfile.visibility_status === "review" && (
                  <Button size="sm" className="w-full" variant="destructive" onClick={() => transitionStatus(selectedProfile.id, "blocked", "MANUAL_BLOCK")}>
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Block
                  </Button>
                )}
                {selectedProfile.visibility_status === "blocked" && (
                  <Button size="sm" className="w-full" variant="outline" onClick={() => transitionStatus(selectedProfile.id, "draft")}>
                    Return to Draft
                  </Button>
                )}
                {selectedProfile.visibility_status === "published" && (
                  <>
                    <a href={`/media/profiles/${selectedProfile.public_slug}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <Eye className="h-3 w-3" /> View public page
                    </a>
                    <Button size="sm" className="w-full" variant="destructive" onClick={() => transitionStatus(selectedProfile.id, "blocked", "POST_PUBLISH_BLOCK")}>
                      <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Block (410 Gone)
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
