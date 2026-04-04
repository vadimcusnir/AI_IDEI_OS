import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { truncateForService, formatTruncationMessage } from "@/lib/contentTruncation";
import { Button } from "@/components/ui/button";
import { PipelineSourcePicker } from "@/components/services/PipelineSourcePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2, Play, Coins, Zap, CheckCircle2,
  Twitter, Linkedin, FileText, Video, Mail, CalendarDays, Sparkles, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const GENERATORS = [
  { key: "tweet-thread", name: "Tweet/X Thread", icon: Twitter, cost: 30, color: "text-sky-500" },
  { key: "linkedin-post", name: "LinkedIn Post", icon: Linkedin, cost: 30, color: "text-info" },
  { key: "blog-article", name: "Blog Article", icon: FileText, cost: 80, color: "text-emerald-500" },
  { key: "youtube-script", name: "YouTube Script", icon: Video, cost: 60, color: "text-destructive" },
  { key: "newsletter", name: "Newsletter", icon: Mail, cost: 40, color: "text-amber-500" },
  { key: "viral-hooks", name: "Viral Hooks Pack", icon: Sparkles, cost: 25, color: "text-purple-500" },
  { key: "content-calendar", name: "30-Day Calendar", icon: CalendarDays, cost: 50, color: "text-rose-500" },
  { key: "carousel", name: "Social Carousel", icon: Layers, cost: 35, color: "text-teal-500" },
];

export function ContentGeneratorPanel() {
  const { user } = useAuth();
  const { balance } = useCreditBalance();
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(GENERATORS.map(g => g.key)));
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Record<string, { name: string; content: string }> | null>(null);

  const totalCost = GENERATORS.filter(g => selected.has(g.key)).reduce((s, g) => s + g.cost, 0);

  const toggle = (key: string) => {
    const next = new Set(selected);
    next.has(key) ? next.delete(key) : next.add(key);
    setSelected(next);
  };

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 5, 92));
    }, 800);
    return () => clearInterval(interval);
  }, [loading]);

  const handleRun = async () => {
    if (!user || !content.trim() || selected.size === 0) return;
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
      if (!token) { toast.error("Nu ești autentificat"); return; }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/content-generate`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ content: truncated.content, generators: [...selected] }),
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
      toast.success(`${data.formats_completed} formate generate — ${data.credits_spent} NEURONS`);
    } catch (e) {
      toast.error("Eroare de rețea");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            Content Generation Engine
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generează conținut gata de publicat din neuroni sau transcrieri.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!results && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {GENERATORS.map((g) => (
                  <label
                    key={g.key}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all",
                      selected.has(g.key)
                        ? "border-primary bg-primary/5"
                        : "border-border/50 hover:border-border"
                    )}
                  >
                    <Checkbox
                      checked={selected.has(g.key)}
                      onCheckedChange={() => toggle(g.key)}
                    />
                    <g.icon className={cn("h-4 w-4 shrink-0", g.color)} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{g.name}</p>
                      <p className="text-micro text-muted-foreground">{g.cost} N</p>
                    </div>
                  </label>
                ))}
              </div>

              <PipelineSourcePicker
                value={content}
                onChange={setContent}
                placeholder="Conținut sursă pentru generare..."
                minRows={4}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Coins className="h-4 w-4" />
                  <span>Cost: <strong className="text-foreground">{totalCost} NEURONS</strong> ({selected.size} formate)</span>
                </div>
                <Button onClick={handleRun} disabled={loading || content.length < 30 || selected.size === 0}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {loading ? "Se generează..." : "Generează Content"}
                </Button>
              </div>
            </>
          )}

          {loading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">Se generează {selected.size} formate de conținut...</p>
            </div>
          )}

          {results && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {Object.keys(results).length} formate generate
                </Badge>
                <Button variant="outline" size="sm" onClick={() => setResults(null)}>
                  Generează din nou
                </Button>
              </div>
              {Object.entries(results).map(([key, r]) => {
                const gen = GENERATORS.find(g => g.key === key);
                return (
                  <Card key={key} className="border-border/50">
                    <CardHeader className="pb-2 pt-3 px-4">
                      <div className="flex items-center gap-2">
                        {gen && <gen.icon className={cn("h-4 w-4", gen.color)} />}
                        <span className="font-medium text-sm">{r.name}</span>
                        <Button
                          variant="ghost" size="sm"
                          className="ml-auto h-7 text-xs"
                          onClick={() => { navigator.clipboard.writeText(r.content); toast.success("Copiat!"); }}
                        >
                          Copiază
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <div className="text-sm whitespace-pre-wrap max-h-48 overflow-y-auto bg-muted/30 rounded p-3">
                        {r.content.slice(0, 1500)}
                        {r.content.length > 1500 && "..."}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
