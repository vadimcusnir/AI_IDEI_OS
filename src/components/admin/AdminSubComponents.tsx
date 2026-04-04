import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// ─── Animated KPI Card ────────────────────────────────
export function KPI({ label, value, icon: Icon, color, index = 0 }: {
  label: string; value: number | string; icon: React.ElementType; color?: string; index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-card border border-border rounded-xl p-3 hover-lift"
    >
      <div className="flex items-center gap-1 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-nano font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-lg font-bold font-mono", color)}>{value}</p>
    </motion.div>
  );
}

// ─── Status Badge ─────────────────────────────────────
const statusColors: Record<string, string> = {
  published: "bg-primary/10 text-primary",
  public: "bg-primary/10 text-primary",
  completed: "bg-primary/10 text-primary",
  active: "bg-primary/10 text-primary",
  draft: "bg-muted text-muted-foreground",
  private: "bg-muted text-muted-foreground",
  pending: "bg-warning/10 text-warning",
  processing: "bg-warning/10 text-warning",
  running: "bg-warning/10 text-warning",
  failed: "bg-destructive/15 text-destructive",
  archived: "bg-muted text-muted-foreground/60",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "text-nano font-mono uppercase px-1.5 py-0.5 rounded",
      statusColors[status] || "bg-muted text-muted-foreground"
    )}>
      {status}
    </span>
  );
}

// ─── Log Level Badge ──────────────────────────────────
export function LogLevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    error: "bg-destructive/15 text-destructive",
    warn: "bg-warning/10 text-warning",
    info: "bg-primary/10 text-primary",
  };
  return (
    <span className={cn(
      "text-nano font-mono uppercase px-1.5 py-0.5 rounded shrink-0 w-10 text-center",
      colors[level] || "bg-muted text-muted-foreground"
    )}>
      {level}
    </span>
  );
}

// ─── Health Row ───────────────────────────────────────
export function HealthRow({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-xs font-mono font-bold", good ? "text-primary" : "text-destructive")}>{value}</span>
    </div>
  );
}

// ─── Econ Row ─────────────────────────────────────────
export function EconRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-mono font-bold">{value}</span>
    </div>
  );
}
