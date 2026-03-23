/**
 * useWalletAtomicity — Atomic wallet operations: reserve → settle/release
 * 
 * Usage:
 *   const { reserve, settle, release } = useWalletAtomicity();
 *   const reservation = await reserve(3500, jobId, "Marketing Strategy");
 *   if (!reservation.ok) return handleError(reservation.error);
 *   // ... execute job ...
 *   await settle(reservation.reserved, jobId);  // on success
 *   await release(reservation.reserved, jobId); // on failure
 */
import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReserveResult {
  ok: boolean;
  error?: string;
  reserved: number;
  originalCost: number;
  discountPct: number;
  newBalance: number;
}

interface SettleResult {
  ok: boolean;
  settled?: number;
  released?: number;
}

export function useWalletAtomicity() {
  const { user } = useAuth();

  const reserve = useCallback(async (
    amount: number,
    jobId?: string,
    description?: string
  ): Promise<ReserveResult> => {
    if (!user) return { ok: false, error: "NOT_AUTHENTICATED", reserved: 0, originalCost: amount, discountPct: 0, newBalance: 0 };

    const { data, error } = await supabase.rpc("reserve_neurons", {
      _user_id: user.id,
      _amount: amount,
      _job_id: jobId || null,
      _description: description || "Reserved for execution",
    });

    if (error) {
      toast.error("Eroare la rezervarea creditelor");
      return { ok: false, error: error.message, reserved: 0, originalCost: amount, discountPct: 0, newBalance: 0 };
    }

    const result = data as any;
    if (!result?.ok) {
      const errorMap: Record<string, string> = {
        NO_CREDITS_ROW: "Portofel inexistent",
        INSUFFICIENT_CREDITS: `Credite insuficiente (disponibil: ${result?.balance || 0}N)`,
        DAILY_CAP_EXCEEDED: `Limita zilnică atinsă (rămas: ${result?.remaining || 0}N)`,
      };
      toast.error(errorMap[result?.error] || "Rezervare eșuată");
      return { ok: false, error: result?.error, reserved: 0, originalCost: amount, discountPct: 0, newBalance: 0 };
    }

    return {
      ok: true,
      reserved: result.reserved,
      originalCost: result.original_cost,
      discountPct: result.discount_pct,
      newBalance: result.new_balance,
    };
  }, [user]);

  const settle = useCallback(async (
    amount: number,
    jobId?: string,
    description?: string
  ): Promise<SettleResult> => {
    if (!user) return { ok: false };

    const { data, error } = await supabase.rpc("settle_neurons", {
      _user_id: user.id,
      _amount: amount,
      _job_id: jobId || null,
      _description: description || "Job completed",
    });

    if (error) {
      console.error("[wallet] settle error:", error);
      return { ok: false };
    }

    return { ok: true, settled: amount };
  }, [user]);

  const release = useCallback(async (
    amount: number,
    jobId?: string,
    description?: string
  ): Promise<SettleResult> => {
    if (!user) return { ok: false };

    const { data, error } = await supabase.rpc("release_neurons", {
      _user_id: user.id,
      _amount: amount,
      _job_id: jobId || null,
      _description: description || "Execution failed - credits returned",
    });

    if (error) {
      console.error("[wallet] release error:", error);
      return { ok: false };
    }

    toast.success(`${amount}N returnați în portofel`);
    return { ok: true, released: amount };
  }, [user]);

  return { reserve, settle, release };
}
