import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  ShieldAlert, ShieldOff, Power, PowerOff,
  AlertTriangle, Loader2, RefreshCw,
} from "lucide-react";

interface EmergencyControl {
  id: string;
  control_type: string;
  is_active: boolean;
  activated_by: string | null;
  activated_at: string | null;
  deactivated_at: string | null;
  reason: string;
  affected_scope: string;
}

export function EmergencyControlsTab() {
  const { user } = useAuth();
  const [controls, setControls] = useState<EmergencyControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("emergency_controls").select("*").order("control_type");
    if (data) setControls(data as EmergencyControl[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const { t } = useTranslation("common");

  const toggleControl = async (ctrl: EmergencyControl) => {
    setToggling(ctrl.id);
    try {
      if (ctrl.is_active) {
        const { data, error } = await supabase.rpc("deactivate_emergency", { _control_id: ctrl.id });
        if (error) throw error;
        toast.success(t("control_deactivated", { type: ctrl.control_type }));
      } else {
        const { data, error } = await supabase.rpc("activate_emergency", {
          _control_type: ctrl.control_type,
          _reason: `Manual activation by admin`,
          _scope: ctrl.affected_scope,
        });
        if (error) throw error;
        toast.warning(t("control_activated", { type: ctrl.control_type }));
      }
      await load();
    } catch (e: any) {
      toast.error(e.message || t("control_toggle_failed"));
    }
    setToggling(null);
  };

  const SCOPE_COLORS: Record<string, string> = {
    global: "text-destructive border-destructive/30",
    execution: "text-primary border-primary/30",
    auth: "text-primary border-primary/30",
    wallet: "text-primary border-primary/30",
    api: "text-muted-foreground border-border",
  };

  const LABELS: Record<string, string> = {
    maintenance_mode: "🔧 Maintenance Mode",
    job_freeze: "❄️ Job Freeze",
    registration_lock: "🔒 Registration Lock",
    credit_freeze: "💰 Credit Freeze",
    api_lockdown: "🔐 API Lockdown",
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  const activeCount = controls.filter(c => c.is_active).length;

  return (
    <div className="space-y-4">
      {activeCount > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="text-xs font-semibold text-destructive">{activeCount} Emergency Control{activeCount > 1 ? "s" : ""} Active</p>
            <p className="text-micro text-destructive/70">System is operating in restricted mode</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {controls.map(ctrl => (
          <div key={ctrl.id} className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors",
            ctrl.is_active ? "bg-destructive/5 border-destructive/20" : "bg-card border-border"
          )}>
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
              ctrl.is_active ? "bg-destructive/10" : "bg-muted"
            )}>
              {ctrl.is_active ? (
                <ShieldAlert className="h-4 w-4 text-destructive" />
              ) : (
                <ShieldOff className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">{LABELS[ctrl.control_type] || ctrl.control_type}</p>
              <p className="text-micro text-muted-foreground">{ctrl.reason}</p>
              {ctrl.is_active && ctrl.activated_at && (
                <p className="text-nano text-destructive/60 mt-0.5">
                  Active since {new Date(ctrl.activated_at).toLocaleString()}
                </p>
              )}
            </div>

            <Badge variant="outline" className={cn("text-nano shrink-0", SCOPE_COLORS[ctrl.affected_scope] || "")}>
              {ctrl.affected_scope}
            </Badge>

            <Button
              size="sm"
              variant={ctrl.is_active ? "destructive" : "outline"}
              className="text-xs gap-1 shrink-0"
              disabled={toggling === ctrl.id}
              onClick={() => toggleControl(ctrl)}
            >
              {toggling === ctrl.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : ctrl.is_active ? (
                <><PowerOff className="h-3 w-3" /> Deactivate</>
              ) : (
                <><Power className="h-3 w-3" /> Activate</>
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
