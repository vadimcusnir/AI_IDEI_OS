import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  alert?: boolean;
  highlight?: boolean;
}

export function StatCard({ icon: Icon, label, value, sub, accent, alert, highlight }: StatCardProps) {
  return (
    <div className={cn(
      "rounded-xl border border-border bg-card p-3 space-y-1",
      alert && "border-destructive/40 bg-destructive/5",
      highlight && "border-primary/40 bg-primary/5",
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4 text-muted-foreground", accent)} />
        <span className="text-[11px] text-muted-foreground truncate">{label}</span>
      </div>
      <p className={cn("text-lg font-semibold", accent)}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
