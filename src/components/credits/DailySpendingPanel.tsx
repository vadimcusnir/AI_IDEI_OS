/**
 * DailySpendingPanel — Shows daily spend vs cap with adjustment controls.
 * Reads daily_spent, daily_spend_cap, daily_spent_date from user_credits.
 */
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, AlertTriangle, TrendingDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface SpendingData {
  daily_spent: number;
  daily_spend_cap: number;
  daily_spent_date: string;
}

const CAP_PRESETS = [500, 1000, 2000, 5000];

export function DailySpendingPanel() {
  const { user } = useAuth();
  const [data, setData] = useState<SpendingData | null>(null);
  const [editing, setEditing] = useState(false);
  const [newCap, setNewCap] = useState(5000);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_credits")
      .select("daily_spent, daily_spend_cap, daily_spent_date")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data: d }) => {
        if (d) {
          setData(d as SpendingData);
          setNewCap((d as SpendingData).daily_spend_cap);
        }
      });
  }, [user]);

  if (!data) return null;

  const pct = data.daily_spend_cap > 0
    ? Math.min(100, Math.round((data.daily_spent / data.daily_spend_cap) * 100))
    : 0;
  const isToday = data.daily_spent_date === new Date().toISOString().slice(0, 10);
  const spent = isToday ? data.daily_spent : 0;
  const status = pct >= 90 ? "critical" : pct >= 70 ? "warning" : "safe";

  const saveCap = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("user_credits")
      .update({ daily_spend_cap: newCap } as any)
      .eq("user_id", user.id);
    if (error) {
      toast.error("Failed to update spending cap");
    } else {
      setData(prev => prev ? { ...prev, daily_spend_cap: newCap } : prev);
      toast.success(`Daily cap set to ${newCap} NEURONS`);
      setEditing(false);
    }
    setSaving(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Daily Spending Protection</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setEditing(!editing)}
        >
          {editing ? "Cancel" : "Adjust Cap"}
        </Button>
      </div>

      {/* Progress bar */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Today's spending
          </span>
          <span className={cn(
            "text-xs font-mono font-bold",
            status === "critical" ? "text-destructive" :
            status === "warning" ? "text-[hsl(var(--gold-oxide))]" :
            "text-foreground"
          )}>
            {spent.toLocaleString()} / {data.daily_spend_cap.toLocaleString()} N
          </span>
        </div>
        <Progress
          value={pct}
          className={cn(
            "h-2",
            status === "critical" && "[&>div]:bg-destructive",
            status === "warning" && "[&>div]:bg-[hsl(var(--gold-oxide))]",
          )}
        />
      </div>

      {/* Warnings */}
      {status === "critical" && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs mb-3">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>You've used {pct}% of your daily cap. New service runs may be blocked.</span>
        </div>
      )}
      {status === "warning" && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[hsl(var(--gold-oxide)/0.1)] text-[hsl(var(--gold-oxide))] text-xs mb-3">
          <TrendingDown className="h-3.5 w-3.5 shrink-0" />
          <span>Approaching daily limit — {(data.daily_spend_cap - spent).toLocaleString()} NEURONS remaining today.</span>
        </div>
      )}

      {/* Cap adjustment */}
      {editing && (
        <div className="space-y-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">New daily cap</span>
            <span className="text-sm font-mono font-bold">{newCap.toLocaleString()} N</span>
          </div>
          <Slider
            value={[newCap]}
            onValueChange={([v]) => setNewCap(v)}
            min={100}
            max={10000}
            step={100}
            className="w-full"
          />
          <div className="flex items-center gap-2">
            {CAP_PRESETS.map(p => (
              <Button
                key={p}
                variant={newCap === p ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => setNewCap(p)}
              >
                {p.toLocaleString()}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            className="w-full h-8 text-xs"
            onClick={saveCap}
            disabled={saving || newCap === data.daily_spend_cap}
          >
            {saving ? "Saving…" : "Save Cap"}
          </Button>
        </div>
      )}
    </div>
  );
}
