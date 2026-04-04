/**
 * ExtractStage — Shows extraction progress and results summary
 */
import { motion } from "framer-motion";
import { Brain, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  result: {
    neurons: number;
    episode_id: string;
    type_distribution?: Record<string, number>;
    frameworks?: number;
    raw_extracted?: number;
    after_dedup?: number;
    meta?: { major_insights?: string[]; emerging_themes?: string[]; unexpected_ideas?: string[] };
  } | null;
  isProcessing: boolean;
  onNext: () => void;
}

export function ExtractStage({ result, isProcessing, onNext }: Props) {
  if (isProcessing) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Brain className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <h3 className="text-[length:var(--h3-size)] font-semibold text-foreground mb-2">
          Extracting Knowledge...
        </h3>
        <p className="text-[length:var(--body-dense-size)] text-muted-foreground">
          AI is analyzing your content and identifying key concepts.
        </p>
        <div className="mt-6 h-1.5 w-48 mx-auto bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: ["0%", "60%", "80%", "95%"] }}
            transition={{ duration: 15, ease: "easeOut" }}
          />
        </div>
      </div>
    );
  }

  if (!result) return null;

  const topTypes = result.type_distribution
    ? Object.entries(result.type_distribution).sort((a, b) => b[1] - a[1]).slice(0, 4)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto"
    >
      <div className="text-center mb-6">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-[length:var(--h3-size)] font-bold text-foreground">
          {result.neurons} Neurons Extracted
        </h3>
        {result.frameworks && (
          <p className="text-[length:var(--body-dense-size)] text-muted-foreground mt-1">
            {result.frameworks} frameworks identified
          </p>
        )}
      </div>

      {topTypes.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-6">
          {topTypes.map(([type, count]) => (
            <div key={type} className="bg-muted/50 rounded-lg px-3 py-2 text-center">
              <span className="text-xs font-medium text-muted-foreground capitalize">{type}</span>
              <p className="text-sm font-bold text-foreground">{count}</p>
            </div>
          ))}
        </div>
      )}

      {result.meta?.major_insights && result.meta.major_insights.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Insights</p>
          <ul className="space-y-1">
            {result.meta.major_insights.slice(0, 3).map((insight, i) => (
              <li key={i} className="text-sm text-foreground">• {insight}</li>
            ))}
          </ul>
        </div>
      )}

      <Button onClick={onNext} className="w-full" size="lg">
        Structure Knowledge <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </motion.div>
  );
}
