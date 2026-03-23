import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { truncateForService, formatTruncationMessage } from "@/lib/contentTruncation";
import { Button } from "@/components/ui/button";
import { PipelineSourcePicker } from "@/components/services/PipelineSourcePicker";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, Play, Coins, Presentation, CheckCircle2,
  Clock, FileText, Video, Mail,
} from "lucide-react";

const STAGES = [
  { id: "planning", name: "Planning", icon: Clock },
  { id: "content", name: "Content", icon: FileText },
  { id: "production", name: "Production", icon: Video },
  { id: "conversion", name: "Conversion", icon: Presentation },
  { id: "support", name: "Support", icon: Mail },
  { id: "validation", name: "QC Gate", icon: CheckCircle2 },
];

export function WebinarGeneratorPanel() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { balance } = useCreditBalance();
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("60");
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Record<string, { name: string; stage: string; outputs: Record<string, string> }> | null>(null);
  const [activeTab, setActiveTab] = useState("planning");

  const totalPrompts = 48;
  const costPerPrompt = 40;
  const totalCost = totalPrompts * costPerPrompt;

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 1.5, 92));
    }, 2000);
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webinar-generate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            webinar_config: { topic, duration: Number(duration), audience },
          }),
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
      toast.success(`Webinar generat — ${data.prompts_completed} prompturi, ${data.credits_spent} NEURONS`);
    } catch (e) {
      toast.error("Eroare de rețea");
    } finally {
      setLoading(false);
    }
  };

  const stageResults = (stage: string) =>
    results ? Object.entries(results).filter(([_, r]) => r.stage === stage) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Presentation className="h-5 w-5 text-primary" />
            Webinar Generation System
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            12 module × 4 prompturi = 48 prompturi. Structură, slide-uri, script, emailuri, QC.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!results && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="Subiect webinar" value={topic} onChange={(e) => setTopic(e.target.value)} />
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger><SelectValue placeholder="Durată" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="45">45 minute</SelectItem>
                    <SelectItem value="60">60 minute</SelectItem>
                    <SelectItem value="90">90 minute</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Audiență țintă" value={audience} onChange={(e) => setAudience(e.target.value)} />
              </div>

              <PipelineSourcePicker
                value={content}
                onChange={setContent}
                placeholder="Conținut sursă pentru webinar..."
                minRows={5}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Coins className="h-4 w-4" />
                  <span>Cost: <strong className="text-foreground">{totalCost} NEURONS</strong> ({totalPrompts} prompturi)</span>
                </div>
                <Button onClick={handleRun} disabled={loading || content.length < 50}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {loading ? "Se generează..." : "Generează Webinar"}
                </Button>
              </div>
            </>
          )}

          {loading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">Se procesează {totalPrompts} prompturi...</p>
            </div>
          )}

          {results && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex flex-wrap gap-1 h-auto p-1">
                {STAGES.map((s) => (
                  <TabsTrigger key={s.id} value={s.id} className="text-xs">
                    <s.icon className="h-3 w-3 mr-1" />
                    {s.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {STAGES.map((s) => (
                <TabsContent key={s.id} value={s.id} className="space-y-3 mt-3">
                  {stageResults(s.id).map(([id, r]) => (
                    <Card key={id} className="border-border/50">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <span className="font-medium text-sm">{r.name}</span>
                      </CardHeader>
                      <CardContent className="px-4 pb-3 space-y-3">
                        {Object.entries(r.outputs).map(([role, output]) => (
                          <div key={role}>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{role}</p>
                            <div className="text-sm whitespace-pre-wrap max-h-40 overflow-y-auto bg-muted/30 rounded p-2">
                              {output.slice(0, 800)}
                              {output.length > 800 && "..."}
                            </div>
                          </div>
                        ))}
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
