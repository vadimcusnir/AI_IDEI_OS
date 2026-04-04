/**
 * UnlockArtifactButton — Atomic Reserve→Settle pattern for artifact unlock.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, Coins } from "lucide-react";
import { toast } from "sonner";

const UNLOCK_COST = 50;

interface Props {
  artifactId: string;
  onUnlocked: () => void;
}

export function UnlockArtifactButton({ artifactId, onUnlocked }: Props) {
  const { user } = useAuth();
  const { balance, refetch } = useCreditBalance();
  const [unlocking, setUnlocking] = useState(false);

  const canAfford = balance >= UNLOCK_COST;

  const handleUnlock = async () => {
    if (!user || !canAfford) return;
    setUnlocking(true);

    try {
      // RESERVE neurons
      const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_neurons", {
        _user_id: user.id,
        _amount: UNLOCK_COST,
        _description: `RESERVE: Artifact unlock: ${artifactId.slice(0, 8)}`,
      });

      if (reserveErr || !reserved) {
        toast.error("NEURONS insuficienți pentru deblocare");
        setUnlocking(false);
        return;
      }

      // Log transaction
      await supabase.from("credit_transactions").insert({
        user_id: user.id,
        amount: -UNLOCK_COST,
        type: "unlock",
        description: `Artifact unlock: ${artifactId.slice(0, 8)}`,
      });

      // SETTLE neurons (unlock successful)
      await supabase.rpc("settle_neurons", {
        _user_id: user.id,
        _amount: UNLOCK_COST,
        _description: `SETTLE: Artifact unlock: ${artifactId.slice(0, 8)}`,
      });

      await refetch();
      toast.success(`Conținut deblocat! -${UNLOCK_COST} NEURONS`);
      onUnlocked();
    } catch {
      // RELEASE neurons on failure
      if (user) {
        try {
          await supabase.rpc("release_neurons", {
            _user_id: user.id,
            _amount: UNLOCK_COST,
            _description: `RELEASE: Artifact unlock failed`,
          });
        } catch (_) { /* best-effort release */ }
      }
      toast.error("Eroare la deblocare");
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <Button
      size="sm"
      className="gap-1.5"
      onClick={handleUnlock}
      disabled={unlocking || !canAfford}
    >
      {unlocking ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Eye className="h-3.5 w-3.5" />
      )}
      {canAfford ? (
        <>Deblochează · {UNLOCK_COST} <Coins className="h-3 w-3" /></>
      ) : (
        "NEURONS insuficienți"
      )}
    </Button>
  );
}
