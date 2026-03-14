import { SEOHead } from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import {
  Upload, FileAudio, Scissors, Brain, Users, Network,
  Sparkles, BarChart3, FileText, ArrowRight, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PipelineStage {
  icon: React.ElementType;
  label: string;
  description: string;
  status: "active" | "ready" | "coming";
  link?: string;
  outputs: string[];
}

const STAGES: PipelineStage[] = [
  {
    icon: Upload,
    label: "Input Layer",
    description: "Upload media: YouTube, MP3, MP4, text, PDF. Normalizare și validare format.",
    status: "active",
    link: "/extractor",
    outputs: ["Episode creat", "Fișier stocat"],
  },
  {
    icon: FileAudio,
    label: "Transcription",
    description: "Transcriere audio/video cu detectare limbă și speaker diarization.",
    status: "active",
    link: "/extractor",
    outputs: ["Transcript text", "Speaker segments"],
  },
  {
    icon: Scissors,
    label: "Segmentation",
    description: "Chunking semantic 300-800 tokens cu păstrare context și overlap.",
    status: "active",
    outputs: ["Segment blocks", "Overlap links"],
  },
  {
    icon: Brain,
    label: "Extraction Engine",
    description: "Extracție multi-nivel: insights, frameworks, patterns, quotes, prompts.",
    status: "active",
    link: "/neurons",
    outputs: ["Neurons", "Entities", "Relations"],
  },
  {
    icon: Users,
    label: "Profile Synthesis",
    description: "Generare profile pentru speakeri: competențe, trăsături psihologice, citate.",
    status: "active",
    link: "/guests",
    outputs: ["Guest profiles", "Expertise scores"],
  },
  {
    icon: Network,
    label: "Knowledge Graph",
    description: "Construcție graph: noduri (entități), edge-uri (relații), clustering tematic.",
    status: "active",
    link: "/intelligence",
    outputs: ["Entity nodes", "Topic clusters", "IdeaRank scores"],
  },
  {
    icon: Sparkles,
    label: "Service Execution",
    description: "Orchestrarea serviciilor AI: analiză, producție, transformare. Credit system.",
    status: "active",
    link: "/services",
    outputs: ["Jobs", "Artifacts", "Deliverables"],
  },
  {
    icon: BarChart3,
    label: "Scoring & Ranking",
    description: "Evaluare calitate: novelty × density × utility × demand. Praguri premium/standard.",
    status: "coming",
    outputs: ["Insight scores", "Premium flag"],
  },
  {
    icon: FileText,
    label: "Content Production",
    description: "Generare deliverables finale: articole, cursuri, scripturi, social posts, rapoarte.",
    status: "active",
    link: "/library",
    outputs: ["50+ deliverable types"],
  },
];

const STATUS_CONFIG = {
  active: { label: "Active", color: "bg-status-validated text-primary-foreground" },
  ready: { label: "Ready", color: "bg-primary/15 text-primary" },
  coming: { label: "In Development", color: "bg-muted text-muted-foreground" },
};

export default function PipelineOverview() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-auto">
      <SEOHead
        title="Pipeline Overview — AI-IDEI"
        description="Complete knowledge extraction pipeline: from media upload to structured deliverables."
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight mb-2">
            Pipeline de Extracție
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
            Procesul complet de transformare a conținutului brut în active de cunoaștere structurate.
            Fiecare etapă procesează, îmbogățește și conectează informația.
          </p>
        </div>

        {/* Pipeline flow */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[23px] top-4 bottom-4 w-px bg-border" />

          <div className="space-y-1">
            {STAGES.map((stage, i) => {
              const statusConf = STATUS_CONFIG[stage.status];
              const Icon = stage.icon;

              return (
                <div key={i} className="relative flex gap-4 group">
                  {/* Node */}
                  <div className="relative z-10 shrink-0">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center border transition-all",
                      stage.status === "active"
                        ? "bg-primary/10 border-primary/20 group-hover:border-primary/40 group-hover:shadow-sm"
                        : stage.status === "coming"
                          ? "bg-muted border-border"
                          : "bg-card border-border"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        stage.status === "active" ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className={cn(
                    "flex-1 rounded-xl border p-4 mb-2 transition-all",
                    stage.status === "active"
                      ? "bg-card border-border hover:border-primary/20 hover:shadow-sm"
                      : "bg-muted/30 border-border/50"
                  )}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[9px] font-mono text-muted-foreground/50">L{i}</span>
                      <h3 className="text-sm font-semibold">{stage.label}</h3>
                      <span className={cn("text-[8px] font-semibold uppercase px-1.5 py-0.5 rounded-full ml-auto", statusConf.color)}>
                        {statusConf.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                      {stage.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {stage.outputs.map((out, j) => (
                        <span key={j} className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5 text-status-validated" />
                          {out}
                        </span>
                      ))}
                      {stage.link && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[9px] gap-1 text-primary ml-auto px-1.5"
                          onClick={() => navigate(stage.link!)}
                        >
                          Deschide <ArrowRight className="h-2.5 w-2.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pipeline complet</p>
          <p className="text-sm font-medium">
            1 upload → {STAGES.length} etape → 50+ deliverables
          </p>
        </div>
      </div>
    </div>
  );
}
