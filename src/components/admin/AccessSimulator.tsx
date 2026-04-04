import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Play, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface SimulationResult {
  verdict: string;
  reason: string;
  credits_cost?: number;
  balance?: number;
  deficit?: number;
}

export function AccessSimulator() {
  const { t } = useTranslation("common");
  const [userId, setUserId] = useState("");
  const [serviceKey, setServiceKey] = useState("");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ userId: string; serviceKey: string; result: SimulationResult; ts: Date }>>([]);

  const runSimulation = async () => {
    if (!userId.trim() || !serviceKey.trim()) {
      toast.error(t("user_id_service_key_required"));
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("check_access", {
        _user_id: userId.trim(),
        _service_key: serviceKey.trim(),
      });
      if (error) throw error;
      const res = data as unknown as SimulationResult;
      setResult(res);
      setHistory(prev => [{ userId: userId.trim(), serviceKey: serviceKey.trim(), result: res, ts: new Date() }, ...prev.slice(0, 19)]);
    } catch (e: any) {
      toast.error(e.message || t("simulation_failed"));
    } finally {
      setLoading(false);
    }
  };

  const verdictIcon = (v: string) => {
    if (v === "ALLOW") return <CheckCircle2 className="h-4 w-4 text-status-validated" />;
    if (v === "PAYWALL") return <AlertTriangle className="h-4 w-4 text-accent-foreground" />;
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{t("admin.access_simulator")}</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Input
          placeholder={t("admin.user_id_placeholder")}
          value={userId}
          onChange={e => setUserId(e.target.value)}
          className="text-xs h-8"
        />
        <Input
          placeholder={t("admin.service_key_placeholder")}
          value={serviceKey}
          onChange={e => setServiceKey(e.target.value)}
          className="text-xs h-8"
        />
        <Button size="sm" className="h-8" onClick={runSimulation} disabled={loading}>
          <Play className="h-3 w-3 mr-1" />
          {t("simulate")}
        </Button>
      </div>

      {result && (
        <div className={cn(
          "border rounded-xl p-4 space-y-2",
          result.verdict === "ALLOW" ? "border-status-validated/30 bg-status-validated/5" :
          result.verdict === "PAYWALL" ? "border-accent/30 bg-accent/5" :
          "border-destructive/30 bg-destructive/5"
        )}>
          <div className="flex items-center gap-2">
            {verdictIcon(result.verdict)}
            <span className="text-sm font-bold">{result.verdict}</span>
            <span className="text-xs text-muted-foreground">— {result.reason}</span>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            {result.credits_cost !== undefined && <span>{t("cost_label")}: <strong>{result.credits_cost}</strong> NEURONS</span>}
            {result.balance !== undefined && <span>{t("balance_label")}: <strong>{result.balance}</strong></span>}
            {result.deficit !== undefined && result.deficit > 0 && <span className="text-destructive">{t("deficit_label")}: <strong>{result.deficit}</strong></span>}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-1">
          <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{t("simulation_history")}</p>
          {history.map((h, i) => (
            <div key={i} className="flex items-center gap-2 text-micro py-1 border-b border-border/50 last:border-0">
              {verdictIcon(h.result.verdict)}
              <span className="font-mono text-muted-foreground truncate max-w-[120px]">{h.userId.slice(0, 8)}…</span>
              <span className="font-medium">{h.serviceKey}</span>
              <span className="text-muted-foreground ml-auto">{h.ts.toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
