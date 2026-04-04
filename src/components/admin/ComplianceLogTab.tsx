import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, ScrollText, ShieldCheck, AlertTriangle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ComplianceEntry {
  id: string;
  actor_id: string;
  action_type: string;
  target_type: string;
  target_id: string | null;
  description: string;
  severity: string;
  created_at: string;
}

export function ComplianceLogTab() {
  const { t } = useTranslation("common");
  const [entries, setEntries] = useState<ComplianceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("compliance_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setEntries(data as ComplianceEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const SEVERITY_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
    info: { icon: Info, color: "text-muted-foreground" },
    warning: { icon: AlertTriangle, color: "text-primary" },
    critical: { icon: AlertTriangle, color: "text-destructive" },
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <ShieldCheck className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{t("admin.no_compliance_events")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map(entry => {
        const cfg = SEVERITY_CONFIG[entry.severity] || SEVERITY_CONFIG.info;
        const Icon = cfg.icon;
        return (
          <div key={entry.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-card transition-colors">
            <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg.color)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium">{entry.action_type}</span>
                <Badge variant="outline" className="text-nano px-1.5 py-0 h-4">{entry.target_type}</Badge>
              </div>
              <p className="text-micro text-muted-foreground truncate">
                {entry.description || entry.target_id || "—"}
              </p>
            </div>
            <span className="text-micro text-muted-foreground/60 font-mono shrink-0">
              {new Date(entry.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
