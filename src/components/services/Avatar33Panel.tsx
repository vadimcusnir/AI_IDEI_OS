import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { truncateForService, formatTruncationMessage } from "@/lib/contentTruncation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PipelineSourcePicker } from "@/components/services/PipelineSourcePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Play, Coins, Users, Target, FileText,
  Lightbulb, CheckCircle2, Brain, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PHASES = [
  { id: "discovery", name: "Descoperire", icon: Brain, color: "text-semantic-purple", count: 8 },
  { id: "commercial", name: "Comercial", icon: Target, color: "text-semantic-amber", count: 8 },
  { id: "content", name: "Conținut", icon: FileText, color: "text-semantic-emerald", count: 8 },
  { id: "synthesis", name: "Sinteză", icon: Lightbulb, color: "text-semantic-blue", count: 9 },
];

interface Avatar33PanelProps {
  content?: string;
  onComplete?: (results: Record<string, unknown>) => void;
}

export function Avatar33Panel({ content: initialContent, onComplete }: Avatar33PanelProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { balance } = useCreditBalance();
  const [content, setContent] = useState(initialContent || "");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState("");
  const [results, setResults] = useState<Record<string, { name: string; phase: string; content: string }> | null>(null);
  const [activeTab, setActiveTab] = useState("discovery");

  const totalModules = 33;
  const costPerModule = 50;
  const totalCost = totalModules * costPerModule;

  // Progress simulation during execution
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 2, 92));
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  const handleRun = async () => {
    if (!user || !content.trim()) return;
    if (balance < totalCost) {
      toast.error(`Credite insuficiente: ai ${balance} NEURONS, necesari ${totalCost}`);
      return;
    }

    const truncated = truncateForService(content);
    if (truncated.wasTruncated) {
      toast.info(formatTruncationMessage(truncated), { duration: 6000 });
    }

    setLoading(true);
    setProgress(0);
    setResults(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) { toast.error(t("errors:not_authenticated")); return; }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/avatar33-pipeline`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: truncated.content }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || "Eroare la generare");
        return;
      }

      const data = await resp.json();
      setResults(data.results);
      setProgress(100);
      toast.success(`Avatar33 complet — ${data.modules_completed} module, ${data.credits_spent} NEURONS`);
      onComplete?.(data.results);
    } catch (e) {
      toast.error("Eroare de rețea");
    } finally {
      setLoading(false);
    }
  };

  const phaseResults = (phase: string) =>
    results ? Object.entries(results).filter(([_, r]) => r.phase === phase) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Avatar33 — Client Profile Engine
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            33 de prompturi comerciale executate în ordine strictă pentru a construi un profil complet al clientului ideal.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Phase overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PHASES.map((p) => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <p.icon className={cn("h-4 w-4", p.color)} />
                <div>
                  <p className="text-xs font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.count} module</p>
                </div>
              </div>
            ))}
          </div>

          {!results && (
            <>
              <PipelineSourcePicker
                value={content}
                onChange={setContent}
                placeholder="Conținut pentru profilul clientului ideal..."
                minRows={5}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Coins className="h-4 w-4" />
                  <span>Cost estimat: <strong className="text-foreground">{totalCost} NEURONS</strong></span>
                </div>
                <Button onClick={handleRun} disabled={loading || content.length < 50}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {loading ? "Se generează..." : "Lansează Avatar33"}
                </Button>
              </div>
            </>
          )}

          {loading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {currentPhase || "Se procesează modulele..."}
              </p>
            </div>
          )}

          {results && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full">
                {PHASES.map((p) => (
                  <TabsTrigger key={p.id} value={p.id} className="text-xs">
                    {p.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {PHASES.map((p) => (
                <TabsContent key={p.id} value={p.id} className="space-y-3 mt-3">
                  {phaseResults(p.id).map(([id, r]) => (
                    <Card key={id} className="border-border/50">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span className="font-medium text-sm">{r.name}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {r.content.slice(0, 1000)}
                          {r.content.length > 1000 && "..."}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
