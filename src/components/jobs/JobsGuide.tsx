/**
 * JobsGuide — Collapsible educational guide for the Jobs page.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  HelpCircle, ChevronUp, ChevronDown, FileAudio, Brain,
  Zap, Sparkles, ArrowRight, Clock, Play, CheckCircle2, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

const STATUS_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  pending: { icon: Clock, color: "text-muted-foreground" },
  running: { icon: Play, color: "text-primary" },
  completed: { icon: CheckCircle2, color: "text-status-validated" },
  failed: { icon: XCircle, color: "text-destructive" },
};

export function JobsGuide() {
  const { t } = useTranslation("pages");
  const [open, setOpen] = useState(() => {
    return localStorage.getItem("jobs_guide_dismissed") !== "true";
  });

  const dismiss = () => {
    setOpen(false);
    localStorage.setItem("jobs_guide_dismissed", "true");
  };

  const statusKeys = ["pending", "running", "completed", "failed"] as const;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-primary/15 bg-primary/5 mb-6 overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/10 transition-colors">
            <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <HelpCircle className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{t("jobs.guide_title")}</p>
              <p className="text-micro text-muted-foreground">{t("jobs.guide_subtitle")}</p>
            </div>
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("jobs.guide_desc")}
            </p>

            {/* Pipeline visualization */}
            <div className="flex items-center gap-1 overflow-x-auto py-2">
              {[
                { icon: FileAudio, label: t("jobs.step_upload"), desc: t("jobs.step_upload_desc") },
                { icon: Brain, label: t("jobs.step_extract"), desc: t("jobs.step_extract_desc") },
                { icon: Zap, label: t("jobs.step_process"), desc: t("jobs.step_process_desc") },
                { icon: Sparkles, label: t("jobs.step_deliver"), desc: t("jobs.step_deliver_desc") },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-1 shrink-0">
                  {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground/30 mx-0.5" />}
                  <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5">
                    <step.icon className="h-3 w-3 text-primary/60" />
                    <div>
                      <p className="text-nano font-semibold">{step.label}</p>
                      <p className="text-nano text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Status legend */}
            <div className="grid grid-cols-2 gap-2">
              {statusKeys.map(key => {
                const si = STATUS_ICONS[key] || STATUS_ICONS.pending;
                const Icon = si.icon;
                return (
                  <div key={key} className="flex items-start gap-2 bg-card border border-border rounded-lg p-2.5">
                    <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", si.color)} />
                    <div>
                      <p className="text-micro font-semibold">{t(`jobs.status_${key}`)}</p>
                      <p className="text-nano text-muted-foreground leading-relaxed">{t(`jobs.status_${key}_desc`)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" className="text-micro h-6" onClick={dismiss}>
                {t("jobs.guide_dismiss")}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
