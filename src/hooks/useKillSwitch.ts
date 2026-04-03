/**
 * useKillSwitch — Admin control for platform-wide execution halt.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface KillSwitchState {
  active: boolean;
  reason: string | null;
  activatedAt: string | null;
  loading: boolean;
}

export function useKillSwitch() {
  const { user } = useAuth();
  const [state, setState] = useState<KillSwitchState>({
    active: false,
    reason: null,
    activatedAt: null,
    loading: true,
  });

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("capacity_state")
      .select("kill_switch, kill_switch_reason, kill_switch_activated_at")
      .limit(1)
      .single();

    if (data) {
      setState({
        active: !!data.kill_switch,
        reason: data.kill_switch_reason,
        activatedAt: data.kill_switch_activated_at,
        loading: false,
      });
    } else {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const activate = useCallback(async (reason: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("capacity_state")
      .update({
        kill_switch: true,
        kill_switch_reason: reason,
        kill_switch_activated_by: user.id,
        kill_switch_activated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) {
      toast.error("Failed to activate kill switch");
      return;
    }

    await supabase.from("kill_switch_log").insert({
      activated_by: user.id,
      action: "activate",
      reason,
    });

    toast.error("⚠️ KILL SWITCH ACTIVATED — All executions halted");
    fetch();
  }, [user, fetch]);

  const deactivate = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase
      .from("capacity_state")
      .update({
        kill_switch: false,
        kill_switch_reason: null,
        kill_switch_activated_by: null,
        kill_switch_activated_at: null,
      })
      .eq("id", 1);

    if (error) {
      toast.error("Failed to deactivate kill switch");
      return;
    }

    await supabase.from("kill_switch_log").insert({
      activated_by: user.id,
      action: "deactivate",
      reason: "Manual deactivation",
    });

    toast.success("Kill switch deactivated — Executions resumed");
    fetch();
  }, [user, fetch]);

  return { ...state, activate, deactivate, refetch: fetch };
}
