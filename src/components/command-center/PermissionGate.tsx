/**
 * PermissionGate — Enforces tier-based access within the Command Center.
 * Shows inline permission denial messages with upgrade CTA.
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Shield, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { UserTier } from "@/hooks/useUserTier";
import type { IntentCategory } from "./CommandRouter";
import { getIntentLabel } from "./CommandRouter";

interface PermissionGateProps {
  intent: IntentCategory;
  requiredTier: UserTier;
  currentTier: UserTier;
  onDismiss: () => void;
}

const TIER_LABELS: Record<UserTier, string> = {
  free: "Free",
  authenticated: "Registered",
  pro: "Pro",
  vip: "VIP",
};

export function PermissionGate({ intent, requiredTier, currentTier, onDismiss }: PermissionGateProps) {
  const navigate = useNavigate();
  const label = getIntentLabel(intent);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mx-4 my-2 border border-border rounded-xl bg-card overflow-hidden"
    >
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold mb-0.5">Access Restricted</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <strong>{label}</strong> requires{" "}
            <Badge variant="outline" className="text-[8px] h-4 px-1.5 mx-0.5">
              {TIER_LABELS[requiredTier]}
            </Badge>{" "}
            access. Your current tier:{" "}
            <Badge variant="secondary" className="text-[8px] h-4 px-1.5 mx-0.5">
              {TIER_LABELS[currentTier]}
            </Badge>
          </p>

          <div className="flex items-center gap-2 mt-2.5">
            <Button
              size="sm"
              className="h-7 text-[10px] gap-1"
              onClick={() => navigate("/pricing")}
            >
              <Crown className="h-3 w-3" />
              Upgrade to {TIER_LABELS[requiredTier]}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px]"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>

      {/* Blurred preview of what they'd get */}
      <div className="px-4 py-2 border-t border-border bg-muted/30">
        <div className="flex items-center gap-1.5">
          <Shield className="h-3 w-3 text-muted-foreground/50" />
          <span className="text-[9px] text-muted-foreground/70">
            Upgrade unlocks: advanced orchestration, priority execution, premium agents
          </span>
        </div>
      </div>
    </motion.div>
  );
}
