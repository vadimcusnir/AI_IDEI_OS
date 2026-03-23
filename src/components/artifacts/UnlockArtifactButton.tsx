/**
 * UnlockArtifactButton — Deduces NEURONS to unlock full artifact content.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, Coins } from "lucide-react";
import { toast } from "sonner";

const UNLOCK_COST = 50; // NEURONS per artifact unlock

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
      // Deduct NEURONS
      const { data: spent, error: spendErr } = await supabase.rpc("spend_credits", {
        _user_id: user.id,
        _amount: UNLOCK_COST,
        _description: `Artifact unlock: ${artifactId.slice(0, 8)}`,
      });

      if (spendErr || !spent) {
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

      await refetch();
      toast.success(`Conținut deblocat! -${UNLOCK_COST} NEURONS`);
      onUnlocked();
    } catch {
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
