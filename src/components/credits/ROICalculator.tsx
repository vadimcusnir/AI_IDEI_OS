import { useMemo, useState } from "react";
import { Calculator, TrendingUp, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { isRoot2 } from "@/lib/root2";

interface ROICalculatorProps {
  creditsCost: number;
  deliverablesCount: number;
  serviceName: string;
}

export function ROICalculator({ creditsCost, deliverablesCount, serviceName }: ROICalculatorProps) {
  const [expanded, setExpanded] = useState(false);

  const metrics = useMemo(() => {
    const costUSD = creditsCost * 0.01; // 1 credit = $0.01
    const deliverables = Math.max(deliverablesCount, 1);
    const costPerDeliverable = costUSD / deliverables;
    const marketValue = deliverables * 15; // avg $15/deliverable market rate
    const roi = marketValue > 0 ? ((marketValue - costUSD) / costUSD) * 100 : 0;
    const savingsVsFreelancer = deliverables * 50; // avg $50/piece freelancer cost

    return {
      costUSD,
      costPerDeliverable,
      marketValue,
      roi,
      savingsVsFreelancer,
      deliverables,
    };
  }, [creditsCost, deliverablesCount]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            ROI Calculator
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-status-validated">
            {metrics.roi.toFixed(0)}% ROI
          </span>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {/* Cost breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <MetricCard
              label="Service Cost"
              value={`$${metrics.costUSD.toFixed(2)}`}
              sublabel={`${creditsCost} NEURONS`}
            />
            <MetricCard
              label="Cost / Deliverable"
              value={`$${metrics.costPerDeliverable.toFixed(2)}`}
              sublabel={`${metrics.deliverables} outputs`}
              highlight
            />
            <MetricCard
              label="Market Value"
              value={`$${metrics.marketValue}`}
              sublabel="estimated"
              positive
            />
            <MetricCard
              label="vs Freelancer"
              value={`$${metrics.savingsVsFreelancer}`}
              sublabel="savings"
              positive
            />
          </div>

          {/* Root2 badge */}
          {isRoot2(creditsCost) && (
            <div className="flex items-center gap-1.5 text-micro text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>Root2 Certified Price — digital root = 2</span>
            </div>
          )}

          {/* Value proposition */}
          <div className="bg-status-validated/5 border border-status-validated/20 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-status-validated" />
              <span className="text-dense font-semibold text-status-validated">Value Multiplier</span>
            </div>
            <p className="text-dense text-muted-foreground">
              {metrics.deliverables} deliverables at ${metrics.costPerDeliverable.toFixed(2)} each.
              Equivalent freelancer cost: ${metrics.savingsVsFreelancer}.
              <span className="font-semibold text-foreground"> You save {((1 - metrics.costUSD / metrics.savingsVsFreelancer) * 100).toFixed(0)}%.</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, sublabel, highlight, positive }: {
  label: string;
  value: string;
  sublabel: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-lg px-3 py-2.5",
      highlight ? "bg-primary/5 border border-primary/20" :
      positive ? "bg-status-validated/5 border border-status-validated/20" :
      "bg-muted/30 border border-border"
    )}>
      <p className="text-nano uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p className={cn(
        "text-sm font-bold font-mono",
        positive ? "text-status-validated" : "text-foreground"
      )}>{value}</p>
      <p className="text-nano text-muted-foreground">{sublabel}</p>
    </div>
  );
}
