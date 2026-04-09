/**
 * WorkspaceHub — Unified private workspace showing all user assets.
 * Default = private. User sees neurons, artifacts, drafts, identity dimensions.
 * Phase 9.1
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Brain, FileText, ShoppingBag, Lock, Eye, EyeOff,
  Loader2, RefreshCw, Layers, Sparkles, Shield,
} from "lucide-react";
import { VisibilityControls } from "@/components/workspace/VisibilityControls";

interface WorkspaceStats {
  totalNeurons: number;
  totalArtifacts: number;
  privateArtifacts: number;
  publicArtifacts: number;
  totalAssets: number;
  publishedAssets: number;
}

interface ArtifactRow {
  id: string;
  title: string;
  artifact_type: string;
  status: string;
  visibility: string;
  created_at: string;
}

export default function WorkspaceHub() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [artifacts, setArtifacts] = useState<ArtifactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const [neuronsRes, artifactsRes, assetsRes, pubAssetsRes] = await Promise.all([
      supabase.from("neurons").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("artifacts").select("id, title, artifact_type, status, visibility, created_at")
        .eq("author_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("knowledge_assets").select("id", { count: "exact", head: true }).eq("author_id", user.id),
      supabase.from("knowledge_assets").select("id", { count: "exact", head: true }).eq("author_id", user.id).eq("is_published", true),
    ]);

    const arts = (artifactsRes.data || []) as ArtifactRow[];
    setArtifacts(arts);
    setStats({
      totalNeurons: neuronsRes.count || 0,
      totalArtifacts: arts.length,
      privateArtifacts: arts.filter(a => a.visibility === "private").length,
      publicArtifacts: arts.filter(a => a.visibility === "public").length,
      totalAssets: assetsRes.count || 0,
      publishedAssets: pubAssetsRes.count || 0,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead title="Workspace — AI-IDEI" description="Your private workspace" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Private Workspace</h1>
                <p className="text-micro text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Everything here is private by default
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={load}>
              <RefreshCw className="h-3 w-3" /> Refresh
            </Button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard icon={Brain} label="Neurons" value={stats.totalNeurons} />
              <StatCard icon={FileText} label="Artifacts" value={stats.totalArtifacts} sub={`${stats.privateArtifacts} private`} />
              <StatCard icon={ShoppingBag} label="Assets" value={stats.totalAssets} sub={`${stats.publishedAssets} published`} />
              <StatCard icon={Eye} label="Public" value={stats.publicArtifacts} accent="text-status-validated" />
            </div>
          )}

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-8 mb-4">
              <TabsTrigger value="overview" className="text-xs gap-1 h-7">
                <Layers className="h-3.5 w-3.5" /> All Artifacts
              </TabsTrigger>
              <TabsTrigger value="publish" className="text-xs gap-1 h-7">
                <Sparkles className="h-3.5 w-3.5" /> Publish Controls
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-1">
                {artifacts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-12">
                    No artifacts yet. Use the Command Center to generate your first deliverable.
                  </p>
                ) : (
                  artifacts.map(a => (
                    <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card transition-colors">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{a.title || "Untitled"}</p>
                        <p className="text-micro text-muted-foreground">
                          {a.artifact_type} · {new Date(a.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={a.visibility === "public" ? "default" : "secondary"} className="text-nano shrink-0">
                        {a.visibility === "public" ? (
                          <><Eye className="h-2.5 w-2.5 mr-1" /> Public</>
                        ) : (
                          <><Lock className="h-2.5 w-2.5 mr-1" /> Private</>
                        )}
                      </Badge>
                      <Badge variant="outline" className="text-nano shrink-0">{a.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="publish">
              <VisibilityControls artifacts={artifacts} onUpdate={load} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: number; sub?: string; accent?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={cn("h-3.5 w-3.5", accent || "text-muted-foreground")} />
        <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-xl font-bold font-mono", accent)}>{value}</p>
      {sub && <p className="text-micro text-muted-foreground">{sub}</p>}
    </div>
  );
}
