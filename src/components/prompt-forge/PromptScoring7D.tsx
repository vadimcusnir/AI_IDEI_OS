/**
 * 7D Prompt Scoring Engine
 * Evaluates generated prompts across 7 quality dimensions
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Target, Lightbulb, Megaphone, Layers, CheckCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Dimension {
  key: string;
  label: string;
  icon: React.ReactNode;
  score: number;
  feedback: string;
}

interface Props {
  promptText: string;
  goal: string;
}

const DIMENSION_ICONS: Record<string, React.ReactNode> = {
  clarity: <Target className="h-3.5 w-3.5" />,
  specificity: <Zap className="h-3.5 w-3.5" />,
  creativity: <Lightbulb className="h-3.5 w-3.5" />,
  actionability: <CheckCircle className="h-3.5 w-3.5" />,
  tone: <Megaphone className="h-3.5 w-3.5" />,
  structure: <Layers className="h-3.5 w-3.5" />,
  completeness: <Sparkles className="h-3.5 w-3.5" />,
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-destructive";
}

function getScoreBadge(score: number) {
  if (score >= 85) return { label: "Excelent", variant: "default" as const };
  if (score >= 70) return { label: "Bun", variant: "secondary" as const };
  if (score >= 50) return { label: "Mediu", variant: "outline" as const };
  return { label: "Slab", variant: "destructive" as const };
}

export function PromptScoring7D({ promptText, goal }: Props) {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [overall, setOverall] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");

  const runScoring = async () => {
    if (!promptText.trim()) {
      toast.error("Generează un prompt mai întâi.");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-service`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            service_key: "prompt-scoring-7d",
            inputs: {
              context: promptText,
              goal: "score-7d",
              details: `Evaluează acest prompt generat pentru scopul "${goal}" pe 7 dimensiuni.
              
Returnează STRICT un JSON valid cu formatul:
{
  "dimensions": [
    {"key": "clarity", "label": "Claritate", "score": 85, "feedback": "..."},
    {"key": "specificity", "label": "Specificitate", "score": 70, "feedback": "..."},
    {"key": "creativity", "label": "Creativitate", "score": 90, "feedback": "..."},
    {"key": "actionability", "label": "Acționabilitate", "score": 75, "feedback": "..."},
    {"key": "tone", "label": "Ton", "score": 80, "feedback": "..."},
    {"key": "structure", "label": "Structură", "score": 85, "feedback": "..."},
    {"key": "completeness", "label": "Completitudine", "score": 70, "feedback": "..."}
  ],
  "overall": 79,
  "summary": "Rezumat general..."
}

Score-urile sunt 0-100. Feedback-ul e concis (max 20 cuvinte).`
            },
          }),
        }
      );

      if (!resp.ok) throw new Error("Scoring failed");

      const text = await resp.text();
      // Parse from streamed SSE
      const lines = text.split("\n").filter(l => l.startsWith("data: "));
      let fullContent = "";
      for (const line of lines) {
        const json = line.slice(6).trim();
        if (json === "[DONE]") continue;
        try {
          const parsed = JSON.parse(json);
          const c = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content;
          if (c) fullContent += c;
        } catch {}
      }

      // Extract JSON from response
      const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        const dims = (result.dimensions || []).map((d: any) => ({
          ...d,
          icon: DIMENSION_ICONS[d.key] || <Sparkles className="h-3.5 w-3.5" />,
        }));
        setDimensions(dims);
        setOverall(result.overall || 0);
        setSummary(result.summary || "");
      } else {
        throw new Error("Could not parse scoring result");
      }
    } catch (e: any) {
      toast.error(e.message || "Scoring failed");
    }
    setLoading(false);
  };

  if (dimensions.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={runScoring}
        disabled={loading || !promptText.trim()}
        className="gap-1.5 text-xs"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
        Scor 7D
      </Button>
    );
  }

  const badge = getScoreBadge(overall);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Scor Global</span>
          <span className={`text-lg font-bold ${getScoreColor(overall)}`}>{overall}/100</span>
          <Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={runScoring} disabled={loading} className="text-xs gap-1">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
          Re-scor
        </Button>
      </div>

      <div className="grid gap-2">
        {dimensions.map((dim) => (
          <div key={dim.key} className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 w-28 shrink-0">
              {DIMENSION_ICONS[dim.key]}
              <span className="text-xs text-muted-foreground">{dim.label}</span>
            </div>
            <Progress value={dim.score} className="h-1.5 flex-1" />
            <span className={`text-xs font-mono w-8 text-right ${getScoreColor(dim.score)}`}>{dim.score}</span>
          </div>
        ))}
      </div>

      {summary && (
        <p className="text-xs text-muted-foreground border-t pt-2">{summary}</p>
      )}
    </div>
  );
}
