import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload, Brain, Sparkles, BarChart3,
  CheckCircle2, Circle, ChevronDown, ChevronUp, X, Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Step {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  route: string;
  checkFn: () => Promise<boolean>;
}

const STEPS: Step[] = [
  {
    id: "upload",
    icon: Upload,
    label: "Upload Content",
    description: "Add your first episode — audio, video, or text",
    route: "/extractor",
    checkFn: async () => {
      const { count } = await supabase.from("episodes").select("*", { count: "exact", head: true });
      return (count ?? 0) > 0;
    },
  },
  {
    id: "neuron",
    icon: Brain,
    label: "Create a Neuron",
    description: "Extract an atomic idea from your content",
    route: "/n/new",
    checkFn: async () => {
      const { count } = await supabase.from("neurons").select("*", { count: "exact", head: true });
      return (count ?? 0) > 0;
    },
  },
  {
    id: "service",
    icon: Sparkles,
    label: "Rulează un serviciu AI",
    description: "Folosește serviciile AI pentru rezultate operaționale",
    route: "/services",
    checkFn: async () => {
      const { count } = await supabase.from("neuron_jobs").select("*", { count: "exact", head: true });
      return (count ?? 0) > 0;
    },
  },
  {
    id: "dashboard",
    icon: BarChart3,
    label: "Verifică Dashboard-ul",
    description: "Vizualizează statisticile și activitatea ta",
    route: "/dashboard",
    checkFn: async () => {
      // This step is "done" once user has visited dashboard
      try {
        const stored = localStorage.getItem("onboarding_dashboard_visited");
        return stored === "true";
      } catch { return false; }
    },
  },
];

export function OnboardingChecklist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if user has dismissed the checklist
    const isDismissed = localStorage.getItem(`onboarding_dismissed_${user.id}`);
    if (isDismissed === "true") {
      setDismissed(true);
      setLoading(false);
      return;
    }

    const checkSteps = async () => {
      const completed = new Set<string>();
      for (const step of STEPS) {
        try {
          const done = await step.checkFn();
          if (done) completed.add(step.id);
        } catch {}
      }
      setCompletedSteps(completed);
      setLoading(false);
    };
    checkSteps();
  }, [user]);

  // Mark dashboard as visited
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname === "/dashboard") {
      localStorage.setItem("onboarding_dashboard_visited", "true");
    }
  }, []);

  const progress = completedSteps.size / STEPS.length;
  const allDone = completedSteps.size === STEPS.length;

  if (!user || loading || dismissed) return null;
  if (allDone) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Rocket className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Primii pași</h3>
            <p className="text-[10px] text-muted-foreground">
              {completedSteps.size}/{STEPS.length} completați
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Progress bar */}
          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              localStorage.setItem(`onboarding_dismissed_${user.id}`, "true");
              setDismissed(true);
            }}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
          {collapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-1">
          {STEPS.map((step) => {
            const done = completedSteps.has(step.id);
            return (
              <button
                key={step.id}
                onClick={() => navigate(step.route)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group",
                  done
                    ? "bg-status-validated/5 text-muted-foreground"
                    : "hover:bg-muted/50"
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-status-validated shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/50 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className={cn("text-xs font-medium", done && "line-through text-muted-foreground/60")}>
                    {step.label}
                  </span>
                  <p className="text-[10px] text-muted-foreground/60 truncate">{step.description}</p>
                </div>
                {!done && (
                  <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Start →
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
