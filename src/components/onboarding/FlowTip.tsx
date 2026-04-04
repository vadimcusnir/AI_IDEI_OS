import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Lightbulb, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FlowTipProps {
  /** Unique ID for persistence */
  tipId: string;
  /** Icon variant */
  variant?: "tip" | "next-step" | "info";
  /** Title */
  title: string;
  /** Description text */
  description: string;
  /** Optional CTA button */
  action?: {
    label: string;
    route?: string;
    onClick?: () => void;
  };
  /** Only show if condition is true */
  show?: boolean;
  className?: string;
}

const VARIANT_CONFIG = {
  tip: {
    icon: Lightbulb,
    border: "border-primary/20",
    bg: "bg-primary/5",
    iconColor: "text-primary",
    badge: "Tip",
    badgeBg: "bg-primary/10 text-primary",
  },
  "next-step": {
    icon: ArrowRight,
    border: "border-accent/30",
    bg: "bg-accent/5",
    iconColor: "text-accent-foreground",
    badge: "Next Step",
    badgeBg: "bg-accent/15 text-accent-foreground",
  },
  info: {
    icon: Sparkles,
    border: "border-muted-foreground/15",
    bg: "bg-muted/30",
    iconColor: "text-muted-foreground",
    badge: "How it works",
    badgeBg: "bg-muted text-muted-foreground",
  },
};

export function FlowTip({
  tipId,
  variant = "tip",
  title,
  description,
  action,
  show = true,
  className,
}: FlowTipProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(true);
  const [globallyDisabled, setGloballyDisabled] = useState(false);

  const storageKey = user ? `flow_tip_${tipId}_${user.id}` : null;

  useEffect(() => {
    if (!storageKey || !user) return;
    const wasDismissed = localStorage.getItem(storageKey);
    const globalOff = localStorage.getItem(`flow_tips_global_disabled_${user.id}`);
    setDismissed(wasDismissed === "true");
    setGloballyDisabled(globalOff === "true");
  }, [storageKey, user]);

  if (!show || dismissed || globallyDisabled || !user) return null;

  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  const handleDismiss = () => {
    if (storageKey) localStorage.setItem(storageKey, "true");
    setDismissed(true);
  };

  const handleAction = () => {
    if (action?.onClick) action.onClick();
    if (action?.route) navigate(action.route);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn("overflow-hidden", className)}
      >
        <div
          className={cn(
            "flex items-start gap-3 px-4 py-3 rounded-xl border",
            config.border,
            config.bg
          )}
        >
          <div
            className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
              config.badgeBg
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", config.iconColor)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={cn(
                  "text-nano font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                  config.badgeBg
                )}
              >
                {config.badge}
              </span>
            </div>
            <p className="text-xs font-semibold leading-snug">{title}</p>
            <p className="text-dense text-muted-foreground leading-relaxed mt-0.5">
              {description}
            </p>

            {action && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-micro gap-1 mt-1.5 text-primary hover:text-primary"
                onClick={handleAction}
              >
                {action.label}
                <ArrowRight className="h-2.5 w-2.5" />
              </Button>
            )}
          </div>

          <button
            onClick={handleDismiss}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground/40 hover:text-foreground transition-colors shrink-0"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * A sequence of FlowTips — shows only the first visible one.
 * Great for progressive disclosure based on user state.
 */
export function FlowTipSequence({
  tips,
  className,
}: {
  tips: FlowTipProps[];
  className?: string;
}) {
  const firstVisible = tips.find((t) => t.show !== false);
  if (!firstVisible) return null;
  return <FlowTip {...firstVisible} className={className} />;
}
