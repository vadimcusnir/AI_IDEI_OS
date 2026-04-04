import { Shield, CheckCircle2, XCircle, EyeOff, AlertTriangle, Scan } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface GuardrailCheck {
  gate: string;
  status: "PASS" | "FAIL" | "SKIP";
  reason?: string;
}

interface GuardrailResultsPanelProps {
  checks: GuardrailCheck[];
  allPass: boolean;
  onRerun?: () => void;
  running?: boolean;
}

const GATE_META: Record<string, { icon: typeof Shield; label: string }> = {
  consent: { icon: Shield, label: "Consent Gate" },
  pii_check: { icon: Scan, label: "PII Scrub" },
  risk_check: { icon: AlertTriangle, label: "Risk Assessment" },
  completeness: { icon: CheckCircle2, label: "Data Completeness" },
  quality: { icon: CheckCircle2, label: "Quality Gate" },
};

export function GuardrailResultsPanel({ checks, allPass, onRerun, running }: GuardrailResultsPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold flex items-center gap-1.5">
          <Shield className="h-3 w-3 text-primary" /> Publishing Guardrails
        </h4>
        {onRerun && (
          <Button size="sm" variant="ghost" onClick={onRerun} disabled={running} className="h-6 text-micro">
            <Scan className="h-3 w-3 mr-1" /> Re-run
          </Button>
        )}
      </div>

      <div className="space-y-1.5">
        {checks.map((check, i) => {
          const meta = GATE_META[check.gate] || { icon: Shield, label: check.gate };
          const Icon = check.status === "PASS" ? CheckCircle2 
                     : check.status === "FAIL" ? XCircle 
                     : EyeOff;
          const color = check.status === "PASS" ? "text-status-validated"
                      : check.status === "FAIL" ? "text-destructive"
                      : "text-muted-foreground";

          return (
            <div key={i} className="flex items-start gap-2 text-xs bg-muted/20 rounded-lg p-2">
              <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", color)} />
              <div className="flex-1 min-w-0">
                <span className="font-medium">{meta.label}</span>
                {check.reason && (
                  <p className="text-micro text-muted-foreground mt-0.5">{check.reason}</p>
                )}
              </div>
              <span className={cn(
                "text-micro px-1.5 py-0.5 rounded font-mono shrink-0",
                check.status === "PASS" ? "bg-status-validated/10 text-status-validated" :
                check.status === "FAIL" ? "bg-destructive/10 text-destructive" :
                "bg-muted text-muted-foreground"
              )}>
                {check.status}
              </span>
            </div>
          );
        })}
      </div>

      <div className={cn(
        "text-xs font-medium px-3 py-2 rounded-lg text-center",
        allPass ? "bg-status-validated/10 text-status-validated" : "bg-destructive/10 text-destructive"
      )}>
        {allPass ? "✅ All guardrails passed — ready to publish" : "⛔ Guardrails failed — cannot publish"}
      </div>
    </div>
  );
}
