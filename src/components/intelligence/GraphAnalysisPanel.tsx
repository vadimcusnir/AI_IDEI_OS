import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Lightbulb, Target, RefreshCw } from "lucide-react";

interface Contradiction {
  pair_index: number;
  is_contradiction: boolean;
  severity: string;
  description: string;
}

interface Gap {
  topic: string;
  description: string;
  gap_type: string;
  confidence: number;
  suggested_sources: string[];
}

interface Suggestion {
  suggestion: string;
  priority: string;
  effort: string;
  category: string;
}

export function GraphAnalysisPanel() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState("contradictions");
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const runAnalysis = useCallback(async (action: string) => {
    if (!user || !currentWorkspace) return;
    setLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke("graph-analysis", {
        body: { action, workspace_id: currentWorkspace.id },
      });
      if (error) throw error;
      if (action === "contradictions") setContradictions(data.contradictions || []);
      if (action === "gaps") setGaps(data.gaps || []);
      if (action === "suggestions") setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error(`Analysis error (${action}):`, err);
    }
    setLoading(null);
  }, [user, currentWorkspace]);

  const severityColor = (s: string) => {
    if (s === "high") return "destructive";
    if (s === "moderate") return "secondary";
    return "outline";
  };

  const priorityColor = (p: string) => {
    if (p === "high") return "destructive";
    if (p === "medium") return "secondary";
    return "outline";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Graph Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-8 w-full">
            <TabsTrigger value="contradictions" className="text-xs flex-1 gap-1">
              <AlertTriangle className="h-3 w-3" /> Contradictions
            </TabsTrigger>
            <TabsTrigger value="gaps" className="text-xs flex-1 gap-1">
              <Target className="h-3 w-3" /> Gaps
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-xs flex-1 gap-1">
              <Lightbulb className="h-3 w-3" /> Suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contradictions" className="mt-3 space-y-3">
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => runAnalysis("contradictions")} disabled={loading === "contradictions"}>
              {loading === "contradictions" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              Scan for Contradictions
            </Button>
            {contradictions.length === 0 && !loading && (
              <p className="text-xs text-muted-foreground text-center py-4">Run a scan to detect contradicting entities</p>
            )}
            {contradictions.filter(c => c.is_contradiction).map((c, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-muted/30 space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  <Badge variant={severityColor(c.severity)} className="text-nano">{c.severity}</Badge>
                </div>
                <p className="text-xs">{c.description}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="gaps" className="mt-3 space-y-3">
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => runAnalysis("gaps")} disabled={loading === "gaps"}>
              {loading === "gaps" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              Identify Knowledge Gaps
            </Button>
            {gaps.length === 0 && !loading && (
              <p className="text-xs text-muted-foreground text-center py-4">Run analysis to find gaps in your knowledge graph</p>
            )}
            {gaps.map((g, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-muted/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{g.topic}</span>
                  <Badge variant="outline" className="text-nano">{g.gap_type}</Badge>
                </div>
                <p className="text-dense text-muted-foreground">{g.description}</p>
                {g.suggested_sources?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {g.suggested_sources.map((s, j) => (
                      <Badge key={j} variant="secondary" className="text-nano">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="suggestions" className="mt-3 space-y-3">
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => runAnalysis("suggestions")} disabled={loading === "suggestions"}>
              {loading === "suggestions" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Lightbulb className="h-3 w-3 mr-1" />}
              Get AI Suggestions
            </Button>
            {suggestions.length === 0 && !loading && (
              <p className="text-xs text-muted-foreground text-center py-4">Get personalized recommendations for your graph</p>
            )}
            {suggestions.map((s, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-muted/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Badge variant={priorityColor(s.priority)} className="text-nano">{s.priority}</Badge>
                  <span className="text-nano text-muted-foreground">~{s.effort}</span>
                </div>
                <p className="text-xs">{s.suggestion}</p>
                <Badge variant="outline" className="text-nano">{s.category}</Badge>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
