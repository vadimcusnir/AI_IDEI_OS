import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader2, ToggleRight, ToggleLeft, Save } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  rollout_percentage: number;
  allowed_roles: string[];
}

export function FeatureFlagsTab() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("feature_flags").select("*").order("key");
    if (data) setFlags(data as FeatureFlag[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleFlag = async (key: string, enabled: boolean) => {
    setSaving(key);
    const { error } = await supabase
      .from("feature_flags")
      .update({ enabled, updated_by: user?.id, updated_at: new Date().toISOString() })
      .eq("key", key);
    
    if (error) {
      toast.error(t("flag_update_failed"));
    } else {
      toast.success(t("flag_toggled", { key, state: enabled ? t("enabled") : t("disabled") }));
      setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled } : f));
    }
    setSaving(null);
  };

  const updateRollout = async (key: string, percentage: number) => {
    setSaving(key);
    const { error } = await supabase
      .from("feature_flags")
      .update({ rollout_percentage: percentage, updated_by: user?.id, updated_at: new Date().toISOString() })
      .eq("key", key);

    if (error) {
      toast.error(t("rollout_update_failed"));
    } else {
      toast.success(t("rollout_updated", { key, percentage }));
      setFlags(prev => prev.map(f => f.key === key ? { ...f, rollout_percentage: percentage } : f));
    }
    setSaving(null);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-2">
      {flags.map(flag => (
        <div key={flag.key} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            {flag.enabled ? (
              <ToggleRight className="h-4 w-4 text-status-validated shrink-0" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono font-medium">{flag.key}</p>
              <p className="text-micro text-muted-foreground">{flag.description}</p>
            </div>
            <Switch
              checked={flag.enabled}
              onCheckedChange={(v) => toggleFlag(flag.key, v)}
              disabled={saving === flag.key}
            />
          </div>

          {flag.enabled && (
            <div className="flex items-center gap-2 ml-7">
              <span className="text-micro text-muted-foreground">Rollout:</span>
              <div className="flex gap-1">
                {[0, 25, 50, 75, 100].map(pct => (
                  <button
                    key={pct}
                    onClick={() => updateRollout(flag.key, pct)}
                    disabled={saving === flag.key}
                    className={cn(
                      "px-2 py-0.5 rounded text-micro font-mono transition-colors",
                      flag.rollout_percentage === pct
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
