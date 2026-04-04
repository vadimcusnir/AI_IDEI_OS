import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TooltipStep {
  target: string; // CSS selector
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface GuidedTooltipProps {
  tourId: string;
  steps: TooltipStep[];
  /** Delay before showing first tooltip (ms) */
  delay?: number;
}

export function GuidedTooltip({ tourId, steps, delay = 1500 }: GuidedTooltipProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const storageKey = user ? `tour_${tourId}_${user.id}` : null;

  useEffect(() => {
    if (!storageKey) return;
    const done = localStorage.getItem(storageKey);
    if (done === "true") return;

    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [storageKey, delay]);

  useEffect(() => {
    if (!visible || currentStep >= steps.length) return;

    const step = steps[currentStep];
    const el = document.querySelector(step.target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const pos = step.position || "bottom";

    let top = 0, left = 0;
    switch (pos) {
      case "bottom":
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2;
        break;
      case "top":
        top = rect.top - 8;
        left = rect.left + rect.width / 2;
        break;
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + 8;
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - 8;
        break;
    }

    setPosition({ top, left });

    // Highlight element
    el.classList.add("ring-2", "ring-primary", "ring-offset-2", "z-50", "relative");
    return () => {
      el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "z-50", "relative");
    };
  }, [visible, currentStep, steps]);

  const dismiss = () => {
    if (storageKey) localStorage.setItem(storageKey, "true");
    setVisible(false);
  };

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      dismiss();
    }
  };

  if (!visible || currentStep >= steps.length) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        ref={tooltipRef}
        initial={{ opacity: 0, scale: 0.9, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed z-[9999] max-w-[260px]"
        style={{
          top: position.top,
          left: position.left,
          transform: "translateX(-50%)",
        }}
      >
        <div className="bg-popover border border-border rounded-xl shadow-lg p-3">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-dense font-semibold">{step.title}</span>
            </div>
            <button onClick={dismiss} className="text-muted-foreground/50 hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="text-micro text-muted-foreground leading-relaxed mb-2.5">
            {step.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-nano text-muted-foreground/50">
              {currentStep + 1}/{steps.length}
            </span>
            <Button size="sm" variant="ghost" onClick={next} className="h-6 px-2 text-micro gap-1">
              {currentStep < steps.length - 1 ? (
                <>Next <ArrowRight className="h-2.5 w-2.5" /></>
              ) : (
                "Got it!"
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
