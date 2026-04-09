/**
 * Prompt Test Arena — A/B compare two prompt outputs side by side
 */
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Swords, Trophy, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface ArenaResult {
  promptA: string;
  promptB: string;
  outputA: string;
  outputB: string;
  winner: "A" | "B" | null;
}

interface Props {
  context: string;
  goal: string;
}

export function PromptTestArena({ context, goal }: Props) {
  const { user } = useAuth();
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const [outputA, setOutputA] = useState("");
  const [outputB, setOutputB] = useState("");
  const [loading, setLoading] = useState(false);
  const [winner, setWinner] = useState<"A" | "B" | null>(null);

  const runBattle = useCallback(async () => {
    if (!user || !context.trim() || !goal) {
      toast.error("Completează context și scop.");
      return;
    }
    if (!promptA.trim() || !promptB.trim()) {
      toast.error("Completează ambele instrucțiuni.");
      return;
    }

    setLoading(true);
    setOutputA("");
    setOutputB("");
    setWinner(null);

    const { data: { session } } = await supabase.auth.getSession();

    const generate = async (details: string, setter: (v: string) => void) => {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-service`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            service_key: "prompt-forge",
            inputs: { context, goal, details },
          }),
        }
      );
      if (!resp.ok) throw new Error("Generation failed");

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nlIdx: number;
        while ((nlIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nlIdx);
          buffer = buffer.slice(nlIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) { full += c; setter(full); }
          } catch {}
        }
      }
      return full;
    };

    try {
      await Promise.all([
        generate(promptA, setOutputA),
        generate(promptB, setOutputB),
      ]);
      toast.success("Ambele variante generate!");
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  }, [user, context, goal, promptA, promptB]);

  const selectWinner = (w: "A" | "B") => {
    setWinner(w);
    toast.success(`Varianta ${w} selectată ca câștigătoare!`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Swords className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Test Arena — A/B Compare</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Instrucțiune A
          </label>
          <Textarea
            value={promptA}
            onChange={(e) => setPromptA(e.target.value)}
            placeholder="Scrie instrucțiunea concisă..."
            rows={3}
            className="text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Instrucțiune B
          </label>
          <Textarea
            value={promptB}
            onChange={(e) => setPromptB(e.target.value)}
            placeholder="Scrie instrucțiunea detaliată..."
            rows={3}
            className="text-sm"
          />
        </div>
      </div>

      <Button
        onClick={runBattle}
        disabled={loading || !promptA.trim() || !promptB.trim()}
        className="w-full gap-2"
        variant="outline"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Generare...</>
        ) : (
          <><Swords className="h-4 w-4" /> Rulează Battle</>
        )}
      </Button>

      {(outputA || outputB) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className={`transition-all ${winner === "A" ? "ring-2 ring-primary" : ""}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  Varianta A
                  {winner === "A" && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
                </span>
                {!winner && outputA && !loading && (
                  <Button size="sm" variant="ghost" onClick={() => selectWinner("A")} className="text-xs h-6">
                    <Trophy className="h-3 w-3 mr-1" /> Selectează
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs prose prose-sm max-w-none dark:prose-invert max-h-60 overflow-y-auto">
              <ReactMarkdown>{outputA || "Se generează..."}</ReactMarkdown>
            </CardContent>
          </Card>

          <Card className={`transition-all ${winner === "B" ? "ring-2 ring-primary" : ""}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  Varianta B
                  {winner === "B" && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
                </span>
                {!winner && outputB && !loading && (
                  <Button size="sm" variant="ghost" onClick={() => selectWinner("B")} className="text-xs h-6">
                    <Trophy className="h-3 w-3 mr-1" /> Selectează
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs prose prose-sm max-w-none dark:prose-invert max-h-60 overflow-y-auto">
              <ReactMarkdown>{outputB || "Se generează..."}</ReactMarkdown>
            </CardContent>
          </Card>
        </div>
      )}

      {winner && (
        <div className="text-center">
          <Badge variant="default" className="gap-1">
            <Trophy className="h-3 w-3" />
            Câștigător: Varianta {winner}
          </Badge>
          <p className="text-xs text-muted-foreground mt-1">
            Folosește instrucțiunea câștigătoare în tab-ul principal.
          </p>
        </div>
      )}
    </div>
  );
}
