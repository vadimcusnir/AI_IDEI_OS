import { useState } from "react";
import { useMemoryEngine } from "@/hooks/useMemoryEngine";
import { useAdaptationEngine } from "@/hooks/useAdaptationEngine";
import { usePersonalizationEngine } from "@/hooks/usePersonalizationEngine";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, Brain, Database, Settings, Zap, Trash2, Plus, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function AugmentationDashboard() {
  const { user } = useAuth();
  const { memories, loading: memLoading, capture, forget, stats } = useMemoryEngine();
  const { adaptations, loading: adaptLoading, applyAdaptation, pendingCount } = useAdaptationEngine();
  const { prefs, prefsMap, loading: prefLoading, setPref, getPref } = usePersonalizationEngine();

  const [newMemTitle, setNewMemTitle] = useState("");
  const [newMemContent, setNewMemContent] = useState("");

  if (!user) return <Navigate to="/auth" replace />;

  const loading = memLoading || adaptLoading || prefLoading;

  const handleAddMemory = async () => {
    if (!newMemTitle.trim()) return;
    await capture({
      memory_type: "context",
      category: "general",
      title: newMemTitle.trim(),
      content: newMemContent.trim(),
    });
    setNewMemTitle("");
    setNewMemContent("");
    toast.success("Memory captured");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-h2 font-bold text-foreground flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          Augmentation Engine
        </h1>
        <p className="text-caption text-muted-foreground mt-1">
          Memory, adaptation, and personalization — your system learns and evolves.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Database className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Memories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Brain className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{adaptations.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Adaptations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Settings className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{prefs.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Preferences</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Zap className="h-4 w-4 text-amber-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{pendingCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="memory" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="adaptation">Adaptation</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Memory Tab */}
        <TabsContent value="memory" className="space-y-4">
          {/* Add Memory */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" /> Capture Memory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="Title (e.g. 'Preferred tone: professional')"
                value={newMemTitle}
                onChange={(e) => setNewMemTitle(e.target.value)}
              />
              <Input
                placeholder="Content (optional details)"
                value={newMemContent}
                onChange={(e) => setNewMemContent(e.target.value)}
              />
              <Button size="sm" onClick={handleAddMemory} disabled={!newMemTitle.trim()}>
                Save Memory
              </Button>
            </CardContent>
          </Card>

          {/* Memory List */}
          <div className="space-y-2">
            {memories.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No memories captured yet. Add preferences, goals, or context.
                </CardContent>
              </Card>
            ) : (
              memories.map((m) => (
                <Card key={m.id} className="group">
                  <CardContent className="py-3 px-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-foreground">{m.title}</span>
                        <Badge variant="outline" className="text-[9px]">{m.memory_type}</Badge>
                        <Badge variant="secondary" className="text-[9px]">{m.category}</Badge>
                      </div>
                      {m.content && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{m.content}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => forget(m.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Adaptation Tab */}
        <TabsContent value="adaptation" className="space-y-2">
          {adaptations.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No adaptations detected yet. The system learns from your usage patterns.
              </CardContent>
            </Card>
          ) : (
            adaptations.map((a) => (
              <Card key={a.id}>
                <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-foreground">{a.adaptation_type}</span>
                      <Badge variant={a.applied ? "default" : "secondary"} className="text-[9px]">
                        {a.applied ? "Applied" : "Pending"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {Math.round(a.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {JSON.stringify(a.old_value)} → {JSON.stringify(a.new_value)}
                    </p>
                  </div>
                  {!a.applied && (
                    <Button size="sm" variant="outline" onClick={() => applyAdaptation(a.id)}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Apply
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">System Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Auto-extract on upload</p>
                  <p className="text-xs text-muted-foreground">Automatically extract neurons when content is uploaded</p>
                </div>
                <Switch
                  checked={getPref("auto_extract_on_upload", true)}
                  onCheckedChange={(v) => setPref("auto_extract_on_upload", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Show cost before execution</p>
                  <p className="text-xs text-muted-foreground">Display credit cost confirmation before running services</p>
                </div>
                <Switch
                  checked={getPref("show_cost_before_execute", true)}
                  onCheckedChange={(v) => setPref("show_cost_before_execute", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Compact dashboard</p>
                  <p className="text-xs text-muted-foreground">Use compact layout for dashboard widgets</p>
                </div>
                <Switch
                  checked={getPref("dashboard_layout", "compact") === "compact"}
                  onCheckedChange={(v) => setPref("dashboard_layout", v ? "compact" : "expanded")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Custom Preferences */}
          {prefs.filter(p => !["auto_extract_on_upload", "show_cost_before_execute", "dashboard_layout"].includes(p.pref_key)).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Custom Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {prefs
                  .filter(p => !["auto_extract_on_upload", "show_cost_before_execute", "dashboard_layout"].includes(p.pref_key))
                  .map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-1">
                      <div>
                        <span className="text-sm text-foreground">{p.pref_key}</span>
                        <Badge variant="outline" className="text-[9px] ml-2">{p.source}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{JSON.stringify(p.pref_value)}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
