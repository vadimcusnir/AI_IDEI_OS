import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Mic, FileText, Video, Globe, User, ArrowRight, ArrowLeft, Sparkles, X,
} from "lucide-react";

interface WizardStep {
  key: string;
  label: string;
  icon: React.ElementType;
  description: string;
  /** Filter value to apply to the service list */
  filterValue: string;
}

const CONTENT_TYPES: WizardStep[] = [
  { key: "podcast", label: "Podcast / Audio", icon: Mic, description: "Transcrieri, interviuri, episoade audio", filterValue: "podcast" },
  { key: "text", label: "Text / Articol", icon: FileText, description: "Blog posts, articole, documente scrise", filterValue: "text" },
  { key: "video", label: "Video / YouTube", icon: Video, description: "Video-uri, prezentări, webinare", filterValue: "video" },
  { key: "url", label: "Website / URL", icon: Globe, description: "Pagini web, landing pages, profile online", filterValue: "url" },
  { key: "profile", label: "Profil Expert", icon: User, description: "Analiza și capitalizarea expertizei unei persoane", filterValue: "profile" },
];

const GOALS: WizardStep[] = [
  { key: "extract", label: "Extrage cunoștințe", icon: Sparkles, description: "Neuroni, framework-uri, pattern-uri", filterValue: "extract" },
  { key: "generate", label: "Generează conținut", icon: FileText, description: "Articole, social media, email-uri", filterValue: "generate" },
  { key: "analyze", label: "Analizează", icon: Sparkles, description: "Psihologie, tendințe, insight-uri", filterValue: "analyze" },
];

interface ServiceWizardProps {
  onComplete: (contentType: string, goal: string) => void;
  onDismiss: () => void;
}

export function ServiceWizard({ onComplete, onDismiss }: ServiceWizardProps) {
  const [step, setStep] = useState(0);
  const [contentType, setContentType] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);

  const handleNext = () => {
    if (step === 0 && contentType) {
      setStep(1);
    } else if (step === 1 && goal) {
      onComplete(contentType!, goal!);
    }
  };

  const items = step === 0 ? CONTENT_TYPES : GOALS;
  const selected = step === 0 ? contentType : goal;
  const setSelected = step === 0 ? setContentType : setGoal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="relative rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-sm p-5 shadow-lg"
    >
      <button onClick={onDismiss} className="absolute top-3 right-3 text-muted-foreground/50 hover:text-foreground">
        <X className="h-4 w-4" />
      </button>

      <div className="mb-4">
        <p className="text-micro font-semibold uppercase tracking-[0.15em] text-primary mb-1">
          Pas {step + 1} / 2
        </p>
        <h3 className="text-sm font-bold">
          {step === 0 ? "Ce tip de conținut ai?" : "Ce vrei să obții?"}
        </h3>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isSelected = selected === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setSelected(item.key)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all",
                  isSelected
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/20"
                )}
              >
                <Icon className={cn("h-4 w-4 mb-1.5", isSelected ? "text-primary" : "text-muted-foreground")} />
                <p className="text-xs font-semibold">{item.label}</p>
                <p className="text-micro text-muted-foreground leading-snug mt-0.5">{item.description}</p>
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between">
        {step > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setStep(0)} className="gap-1 text-xs h-7">
            <ArrowLeft className="h-3 w-3" /> Înapoi
          </Button>
        ) : <div />}
        <Button
          size="sm"
          disabled={!selected}
          onClick={handleNext}
          className="gap-1 text-xs h-7"
        >
          {step === 1 ? "Arată servicii" : "Continuă"} <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
}
