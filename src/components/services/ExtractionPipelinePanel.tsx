import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import { Slider } from "@/components/ui/slider";
import {
  Loader2, Play, Coins, Layers, CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LEVELS = [
  { level: 0, name: "Input Layer", color: "bg-muted-foreground" },
  { level: 1, name: "Segmentation", color: "bg-muted-foreground/70" },
  { level: 2, name: "Atomic Extraction", color: "bg-semantic-purple" },
  { level: 3, name: "Entity Extraction", color: "bg-semantic-blue" },
  { level: 4, name: "Structural", color: "bg-semantic-indigo" },
  { level: 5, name: "Psychological", color: "bg-semantic-rose" },
  { level: 6, name: "Narrative", color: "bg-semantic-amber" },
  { level: 7, name: "Commercial", color: "bg-semantic-emerald" },
  { level: 8, name: "Patterns", color: "bg-destructive" },
  { level: 9, name: "Synthesis", color: "bg-semantic-purple" },
  { level: 10, name: "Profile Gen", color: "bg-semantic-teal" },
  { level: 11, name: "Knowledge Graph", color: "bg-semantic-cyan" },
  { level: 12, name: "Content Production", color: "bg-semantic-rose" },
];

export function ExtractionPipelinePanel() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { balance } = useCreditBalance();
  const [content, setContent] = useState("");
  const [range, setRange] = useState([0, 12]);
  const [loading, setLoading] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [results, setResults] = useState<Record<string, { level: number; name: string; output: string }> | null>(null);

  const levelsCount = range[1] - range[0] + 1;
  const estimatedCost = Math.round(levelsCount * 55);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setCurrentLevel(prev => Math.min(prev + 1, range[1]));
    }, 2000);
    return () => clearInterval(interval);
  }, [loading, range]);

  const handleRun = async () => {
    if (!user || !content.trim()) return;
    if (balance < estimatedCost) {
      toast.error(`Credite insuficiente: ai ${balance} NEURONS, necesari ~${estimatedCost}`);
      return;
    }

    const truncated = truncateForService(content);
    if (truncated.wasTruncated) {
      toast.info(formatTruncationMessage(truncated), { duration: 6000 });
    }

    setLoading(true);
    setCurrentLevel(range[0]);
    setResults(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) { toast.error(t("errors:not_authenticated")); return; }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extraction-pipeline`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ content: truncated.content, start_level: range[0], end_level: range[1] }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || "Eroare la pipeline");
        return;
      }

      const data = await resp.json();
      setResults(data.results);
      setCurrentLevel(-1);
      toast.success(`Pipeline complet — ${data.levels_completed} niveluri, ${data.credits_spent} NEURONS`);
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
            <Layers className="h-5 w-5 text-primary" />
            Extraction Pipeline (12 Niveluri)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Pipeline multi-nivel de extracție: de la input brut la producție de conținut.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Level visualization */}
          <div className="flex items-center gap-0.5 overflow-x-auto pb-2">
            {LEVELS.map((l) => {
              const inRange = l.level >= range[0] && l.level <= range[1];
              const completed = results && Object.values(results).some(r => r.level === l.level);
              const isCurrent = loading && l.level === currentLevel;
              return (
                <div key={l.level} className="flex items-center">
                  <div
                    className={cn(
                      "flex flex-col items-center gap-0.5 px-1",
                      !inRange && "opacity-30"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-micro font-bold text-primary-foreground",
                      completed ? "bg-success" : isCurrent ? "bg-primary animate-pulse" : l.color
                    )}>
                      {completed ? "✓" : l.level}
                    </div>
                    <span className="text-nano text-muted-foreground text-center w-12 truncate">{l.name}</span>
                  </div>
                  {l.level < 12 && <ArrowRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />}
                </div>
              );
            })}
          </div>

          {!results && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Interval: L{range[0]} → L{range[1]} ({levelsCount} niveluri)
                </label>
                <Slider
                  min={0} max={12} step={1}
                  value={range}
                  onValueChange={setRange}
                  className="py-2"
                />
              </div>

              <PipelineSourcePicker
                value={content}
                onChange={setContent}
                placeholder="Conținut pentru extracție multi-nivel..."
                minRows={4}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Coins className="h-4 w-4" />
                  <span>Cost estimat: <strong className="text-foreground">~{estimatedCost} NEURONS</strong></span>
                </div>
                <Button onClick={handleRun} disabled={loading || content.length < 100}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {loading ? "Se extrage..." : "Lansează Pipeline"}
                </Button>
              </div>
            </>
          )}

          {loading && (
            <div className="space-y-2">
              <Progress value={((currentLevel - range[0]) / levelsCount) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Nivel {currentLevel}: {LEVELS[currentLevel]?.name || "..."}
              </p>
            </div>
          )}

          {results && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {Object.keys(results).length} niveluri completate
                </Badge>
                <Button variant="outline" size="sm" onClick={() => setResults(null)}>
                  Rulează din nou
                </Button>
              </div>
              {Object.entries(results)
                .sort(([, a], [, b]) => a.level - b.level)
                .map(([id, r]) => (
                  <Card key={id} className="border-border/50">
                    <CardHeader className="pb-2 pt-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-nano font-bold text-primary-foreground", LEVELS[r.level]?.color || "bg-primary")}>
                          {r.level}
                        </div>
                        <span className="font-medium text-sm">{r.name}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <div className="text-sm whitespace-pre-wrap max-h-48 overflow-y-auto bg-muted/30 rounded p-2">
                        {r.output.slice(0, 1200)}
                        {r.output.length > 1200 && "..."}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
