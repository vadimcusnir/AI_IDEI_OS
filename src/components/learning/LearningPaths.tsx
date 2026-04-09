/**
 * LearningPaths — Curated knowledge tracks with progress tracking.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Circle, Clock, ArrowRight, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PathStep {
  title: string;
  action: string;
  type: string;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_minutes: number;
  steps: PathStep[];
}

interface UserProgress {
  path_id: string;
  current_step: number;
  completed_steps: number[];
  completed_at: string | null;
}

export function LearningPaths() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [progress, setProgress] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [pathsRes, progressRes] = await Promise.all([
        supabase.from("learning_paths").select("id, title, description, difficulty, estimated_minutes, steps").eq("is_active", true),
        supabase.from("user_learning_progress").select("path_id, current_step, completed_steps, completed_at").eq("user_id", user.id),
      ]);
      setPaths((pathsRes.data as unknown as LearningPath[]) || []);
      const pMap: Record<string, UserProgress> = {};
      ((progressRes.data as unknown as UserProgress[]) || []).forEach(p => { pMap[p.path_id] = p; });
      setProgress(pMap);
      setLoading(false);
    };
    load();
  }, [user]);

  const startPath = async (pathId: string) => {
    if (!user) return;
    const { error } = await supabase.from("user_learning_progress").insert({
      user_id: user.id,
      path_id: pathId,
      current_step: 0,
      completed_steps: [],
    } as any);
    if (!error) {
      setProgress(prev => ({ ...prev, [pathId]: { path_id: pathId, current_step: 0, completed_steps: [], completed_at: null } }));
      setExpanded(pathId);
      toast.success("Parcursul a început!");
    }
  };

  const completeStep = async (pathId: string, stepIdx: number, action: string) => {
    if (!user) return;
    const p = progress[pathId];
    if (!p) return;
    const path = paths.find(x => x.id === pathId);
    if (!path) return;

    const newCompleted = [...(p.completed_steps || [])];
    if (!newCompleted.includes(stepIdx)) newCompleted.push(stepIdx);
    const nextStep = Math.min(stepIdx + 1, path.steps.length - 1);
    const isDone = newCompleted.length >= path.steps.length;

    await supabase.from("user_learning_progress")
      .update({
        current_step: nextStep,
        completed_steps: newCompleted,
        ...(isDone ? { completed_at: new Date().toISOString() } : {}),
      } as any)
      .eq("user_id", user.id)
      .eq("path_id", pathId);

    setProgress(prev => ({
      ...prev,
      [pathId]: { ...p, current_step: nextStep, completed_steps: newCompleted, completed_at: isDone ? new Date().toISOString() : null },
    }));

    navigate(action);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const difficultyColor = (d: string) => {
    if (d === "beginner") return "bg-primary/10 text-primary";
    if (d === "intermediate") return "bg-accent text-accent-foreground";
    return "bg-destructive/10 text-destructive";
  };

  return (
    <div className="space-y-3">
      {paths.map((path, i) => {
        const p = progress[path.id];
        const completedCount = p?.completed_steps?.length || 0;
        const totalSteps = path.steps.length;
        const pct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
        const isExpanded = expanded === path.id;
        const isDone = !!p?.completed_at;

        return (
          <motion.div
            key={path.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "bg-card border rounded-xl overflow-hidden transition-colors",
              isDone ? "border-primary/30" : "border-border"
            )}
          >
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : path.id)}
              className="w-full text-left px-4 py-3 flex items-center gap-3"
            >
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", isDone ? "bg-primary/20" : "bg-muted")}>
                {isDone ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <BookOpen className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{path.title}</p>
                  <Badge variant="outline" className={cn("text-nano h-4", difficultyColor(path.difficulty))}>{path.difficulty}</Badge>
                </div>
                <p className="text-nano text-muted-foreground truncate">{path.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-nano text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {path.estimated_minutes}m
                </span>
                {p && <Progress value={pct} className="h-1.5 w-16" />}
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-border pt-3">
                <div className="space-y-2">
                  {path.steps.map((step, si) => {
                    const isCompleted = p?.completed_steps?.includes(si);
                    const isCurrent = p && !isCompleted && si === (p.current_step || 0);
                    return (
                      <div key={si} className="flex items-center gap-3">
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <Circle className={cn("h-4 w-4 shrink-0", isCurrent ? "text-primary" : "text-muted-foreground/40")} />
                        )}
                        <span className={cn("text-sm flex-1", isCompleted ? "text-muted-foreground line-through" : "text-foreground")}>
                          {step.title}
                        </span>
                        {isCurrent && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => completeStep(path.id, si, step.action)}>
                            Start <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {!p && (
                  <Button size="sm" className="mt-3 gap-1.5" onClick={() => startPath(path.id)}>
                    <Play className="h-3 w-3" /> Începe parcursul
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
      {paths.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Niciun parcurs de învățare disponibil.</p>
      )}
    </div>
  );
}
