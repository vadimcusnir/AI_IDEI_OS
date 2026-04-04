/**
 * ResultsPanel — Shown after pipeline completes with extraction summary
 */
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight, RotateCcw, Layers, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ProfileGeneratorPanel } from "@/components/intelligence/ProfileGeneratorPanel";

interface ResultData {
  neurons: number;
  episode_id: string;
  type_distribution?: Record<string, number>;
  frameworks?: number;
  raw_extracted?: number;
  after_dedup?: number;
  meta?: { major_insights?: string[]; emerging_themes?: string[]; unexpected_ideas?: string[] };
}

interface Props {
  result: ResultData;
  onReset: () => void;
}

export function ResultsPanel({ result, onReset }: Props) {
  const navigate = useNavigate();
  const hasNeurons = result.neurons > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-lg mx-auto space-y-6"
    >
      {/* Hero stat */}
      <div className="text-center py-6">
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
        >
          <Sparkles className="h-8 w-8 text-primary" />
        </motion.div>
        <h2 className="text-h3 font-bold text-foreground mb-1">
          {hasNeurons ? `${result.neurons} Neurons Extracted` : "Episode Created"}
        </h2>
        <p className="text-caption text-muted-foreground">
          {hasNeurons
            ? "Materialul tău a fost analizat și structurat în cunoștințe acționabile."
            : "Episodul a fost creat. Adaugă audio pentru extracție automată."}
        </p>
      </div>

      {/* Distribution breakdown */}
      {result.type_distribution && Object.keys(result.type_distribution).length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(result.type_distribution).map(([type, count]) => (
            <div
              key={type}
              className="flex items-center justify-between px-3 py-2 rounded-xl border border-border bg-card"
            >
              <span className="text-xs text-muted-foreground capitalize">{type}</span>
              <span className="text-sm font-bold text-foreground">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Extraction stats */}
      {(result.frameworks || result.raw_extracted) && (
        <div className="flex items-center justify-center gap-6 text-center">
          {result.frameworks && (
            <div>
              <p className="text-lg font-bold text-foreground">{result.frameworks}</p>
              <p className="text-micro text-muted-foreground uppercase tracking-wider">Frameworks</p>
            </div>
          )}
          {result.raw_extracted && (
            <div>
              <p className="text-lg font-bold text-foreground">{result.raw_extracted}</p>
              <p className="text-micro text-muted-foreground uppercase tracking-wider">Raw</p>
            </div>
          )}
          {result.after_dedup && (
            <div>
              <p className="text-lg font-bold text-primary">{result.after_dedup}</p>
              <p className="text-micro text-muted-foreground uppercase tracking-wider">Deduplicate</p>
            </div>
          )}
        </div>
      )}

      {/* Themes */}
      {result.meta?.emerging_themes && result.meta.emerging_themes.length > 0 && (
        <div className="bg-muted/30 border border-border rounded-xl p-4">
          <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Teme emergente
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.meta.emerging_themes.map((theme, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium">
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Profile Generation CTA */}
      {hasNeurons && (
        <ProfileGeneratorPanel
          episodeId={result.episode_id}
          className="mt-2"
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="outline" className="flex-1 gap-2" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          New Analysis
        </Button>
        {hasNeurons && (
          <>
            <Button className="flex-1 gap-2" onClick={() => navigate("/neurons")}>
              <Brain className="h-4 w-4" />
              View Neurons
            </Button>
            <Button
              variant="secondary"
              className="flex-1 gap-2"
              onClick={() => navigate("/services")}
            >
              <ArrowRight className="h-4 w-4" />
              Services
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
