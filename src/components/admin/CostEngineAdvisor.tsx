import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Props {
  snapshot: {
    breakEven: any;
    liability: any;
    unitEcon: any[];
    totalLedger30d: number;
  };
}

export function CostEngineAdvisor({ snapshot }: Props) {
  const [analysis, setAnalysis] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async (q?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cost-engine-advisor", {
        body: { snapshot, question: q || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (e: any) {
      toast.error("Advisor failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> CFO Advisor
            </CardTitle>
            <CardDescription>Interpretare AI a snapshot-urilor + recomandări acționabile</CardDescription>
          </div>
          <Button size="sm" onClick={() => ask()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Analizează situația
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {analysis && (
          <div className="prose prose-sm dark:prose-invert max-w-none bg-background/60 rounded-lg p-4 border">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <MessageSquare className="h-3 w-3" /> Întrebare specifică
          </label>
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex: De ce Margin of Safety e -98%? Ce preț ar trebui să cer? Cum reduc liability-ul?"
            rows={2}
            className="resize-none"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => ask(question)}
            disabled={loading || !question.trim()}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}
            Întreabă
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
