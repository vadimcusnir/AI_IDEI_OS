import { SEOHead } from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import {
  Globe, FileAudio, Scissors, Brain, Network,
  Sparkles, ArrowRight, ArrowDown, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { InstantActionSurface } from "@/components/extractor/InstantActionSurface";

interface PipelineStage {
  icon: React.ElementType;
  key: string;
  label: string;
  description: string;
  status: "active" | "coming";
  link?: string;
  outputs: string[];
}

const STAGES: PipelineStage[] = [
  {
    icon: Globe,
    key: "source",
    label: "SOURCE",
    description: "Ingest raw content: YouTube, audio, video, PDF, text, URLs. Automatic format detection and metadata extraction.",
    status: "active",
    link: "/extractor",
    outputs: ["Episode", "Metadata", "Raw file"],
  },
  {
    icon: FileAudio,
    key: "transcribe",
    label: "TRANSCRIBE",
    description: "AI transcription with speaker diarization and language detection. Supports 50+ languages.",
    status: "active",
    link: "/extractor",
    outputs: ["Transcript", "Speaker segments", "Timestamps"],
  },
  {
    icon: Scissors,
    key: "segment",
    label: "SEGMENT",
    description: "Semantic chunking into 300-800 token blocks with context overlap for precise extraction.",
    status: "active",
    outputs: ["Semantic chunks", "Context links"],
  },
  {
    icon: Brain,
    key: "extract",
    label: "EXTRACT NEURONS",
    description: "Multi-axis AI extraction: insights, frameworks, patterns, psychological signals, JTBD patterns across 9 specialized prompts.",
    status: "active",
    link: "/neurons",
    outputs: ["Neurons", "Entities", "Relations"],
  },
  {
    icon: Network,
    key: "link",
    label: "LINK KNOWLEDGE",
    description: "Build knowledge graph: connect neurons, compute IdeaRank scores, cluster topics, detect patterns.",
    status: "active",
    link: "/intelligence",
    outputs: ["Graph nodes", "Topic clusters", "IdeaRank"],
  },
  {
    icon: Sparkles,
    key: "generate",
    label: "GENERATE ASSETS",
    description: "Produce 50+ deliverable types: articles, courses, frameworks, scripts, social posts, reports.",
    status: "active",
    link: "/services",
    outputs: ["50+ deliverables", "Artifacts", "Exports"],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function PipelineOverview() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-auto">
      <SEOHead
        title="Pipeline — AI-IDEI"
        description="Complete knowledge extraction pipeline: from raw content to structured deliverables in 6 stages."
      />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mb-2">
            Knowledge Pipeline
          </h1>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            One upload → 6 stages → 50+ deliverables. The complete flow from raw content to structured knowledge assets.
          </p>
        </motion.div>

        {/* Instant Action Surface — the single primary action */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <InstantActionSurface />
        </motion.div>

        {/* Pipeline stages */}
        <div className="relative">
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const isLast = i === STAGES.length - 1;

            return (
              <motion.div
                key={stage.key}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                {/* Stage card */}
                <div
                  className={cn(
                    "group relative flex items-start gap-4 rounded-xl border p-4 transition-all",
                    "bg-card border-border hover:border-primary/25 hover:shadow-sm"
                  )}
                >
                  {/* Icon node */}
                  <div className="relative z-10 shrink-0">
                    <div className={cn(
                      "h-11 w-11 rounded-xl flex items-center justify-center border transition-all",
                      "bg-primary/10 border-primary/20 group-hover:border-primary/40 group-hover:shadow-sm"
                    )}>
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-mono text-muted-foreground/40">L{i}</span>
                      <h3 className="text-sm font-bold tracking-wide">{stage.label}</h3>
                      {stage.link && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[9px] gap-1 text-primary ml-auto px-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => navigate(stage.link!)}
                        >
                          Open <ArrowRight className="h-2.5 w-2.5" />
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                      {stage.description}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {stage.outputs.map((out, j) => (
                        <span key={j} className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5 text-primary/50" />
                          {out}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Connector arrow */}
                {!isLast && (
                  <div className="flex justify-center py-1.5">
                    <ArrowDown className="h-4 w-4 text-border" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 rounded-xl border border-primary/20 bg-primary/5 p-5 text-center"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Complete Pipeline</p>
          <p className="text-sm font-medium">
            1 upload → {STAGES.length} stages → 50+ deliverables
          </p>
        </motion.div>
      </div>
    </div>
  );
}
