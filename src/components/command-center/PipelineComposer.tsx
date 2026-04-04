import { useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus, X, Play, Save, GripVertical, Trash2,
  ArrowDown, Zap, Coins, AlertTriangle,
  Search, Brain, FileText, BarChart3, Users, GitCompare,
  Workflow, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IntentCategory } from "./CommandRouter";

/* ═══ Pipeline Step Definition ═══ */

export interface PipelineStep {
  id: string;
  intent: IntentCategory;
  label: string;
  description: string;
  credits: number;
  icon: typeof Search;
  color: string;
  config: Record<string, string>;
  dependsOn: string | null; // previous step output feeds into this
}

const AVAILABLE_INTENTS: Array<{
  intent: IntentCategory;
  label: string;
  description: string;
  credits: number;
  icon: typeof Search;
  color: string;
}> = [
  { intent: "extract", label: "Extract Knowledge", description: "Extract neurons, frameworks, patterns", credits: 350, icon: Brain, color: "text-violet-500 bg-violet-500/10" },
  { intent: "analyze", label: "Deep Analysis", description: "Analyze content for insights", credits: 200, icon: BarChart3, color: "text-blue-500 bg-blue-500/10" },
  { intent: "generate", label: "Generate Content", description: "Create articles, posts, scripts", credits: 150, icon: FileText, color: "text-emerald-500 bg-emerald-500/10" },
  { intent: "search", label: "Knowledge Search", description: "Search neurons and knowledge base", credits: 20, icon: Search, color: "text-amber-500 bg-amber-500/10" },
  { intent: "compare", label: "Compare & Diff", description: "Compare frameworks side-by-side", credits: 400, icon: GitCompare, color: "text-orange-500 bg-orange-500/10" },
  { intent: "profile", label: "Build Profile", description: "Psychological & expertise profiles", credits: 500, icon: Users, color: "text-pink-500 bg-pink-500/10" },
];

interface PipelineComposerProps {
  balance: number;
  onExecute: (steps: PipelineStep[]) => void;
  onSave: (steps: PipelineStep[], name: string) => void;
  onClose: () => void;
}

export function PipelineComposer({ balance, onExecute, onSave, onClose }: PipelineComposerProps) {
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pipelineName, setPipelineName] = useState("");
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const totalCredits = steps.reduce((sum, s) => sum + s.credits, 0);
  const canExecute = steps.length >= 2 && balance >= totalCredits;

  const addStep = useCallback((intentDef: typeof AVAILABLE_INTENTS[0]) => {
    const newStep: PipelineStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      intent: intentDef.intent,
      label: intentDef.label,
      description: intentDef.description,
      credits: intentDef.credits,
      icon: intentDef.icon,
      color: intentDef.color,
      config: {},
      dependsOn: steps.length > 0 ? steps[steps.length - 1].id : null,
    };
    setSteps(prev => [...prev, newStep]);
    setShowPicker(false);
  }, [steps]);

  const removeStep = useCallback((id: string) => {
    setSteps(prev => {
      const filtered = prev.filter(s => s.id !== id);
      // Fix dependency chain
      return filtered.map((s, i) => ({
        ...s,
        dependsOn: i > 0 ? filtered[i - 1].id : null,
      }));
    });
  }, []);

  const updateConfig = useCallback((id: string, key: string, value: string) => {
    setSteps(prev => prev.map(s =>
      s.id === id ? { ...s, config: { ...s.config, [key]: value } } : s
    ));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="border border-border rounded-xl bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold">Pipeline Composer</span>
          <Badge variant="outline" className="text-nano">{steps.length} steps</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-micro text-muted-foreground">
            <Coins className="h-3 w-3" />
            <span className={cn("font-mono font-bold", totalCredits > balance ? "text-destructive" : "text-primary")}>
              {totalCredits} N
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <CardContent className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {/* Pipeline Steps */}
        {steps.length === 0 ? (
          <div className="text-center py-8">
            <Workflow className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No steps yet. Add at least 2 steps to build a pipeline.</p>
          </div>
        ) : (
          <Reorder.Group axis="y" values={steps} onReorder={(newOrder) => {
            setSteps(newOrder.map((s, i) => ({
              ...s,
              dependsOn: i > 0 ? newOrder[i - 1].id : null,
            })));
          }}>
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isExpanded = expandedStep === step.id;
              return (
                <Reorder.Item key={step.id} value={step}>
                  <div className="mb-2">
                    {/* Connector line */}
                    {idx > 0 && (
                      <div className="flex justify-center py-1">
                        <ArrowDown className="h-3 w-3 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className={cn(
                      "border border-border rounded-lg p-3 bg-background",
                      "hover:border-primary/30 transition-colors group"
                    )}>
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-3 w-3 text-muted-foreground/30 cursor-grab active:cursor-grabbing" />
                        <Badge variant="outline" className="text-nano h-4 w-4 flex items-center justify-center p-0 font-mono">
                          {idx + 1}
                        </Badge>
                        <div className={cn("h-6 w-6 rounded-md flex items-center justify-center", step.color)}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-dense font-medium truncate">{step.label}</p>
                          <p className="text-nano text-muted-foreground truncate">{step.description}</p>
                        </div>
                        <span className="text-nano font-mono text-muted-foreground">{step.credits}N</span>
                        <button
                          onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                          className="p-0.5 text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                        <button
                          onClick={() => removeStep(step.id)}
                          className="p-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Step config (expanded) */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-border space-y-2">
                              <div>
                                <label className="text-nano text-muted-foreground font-medium">Custom instructions (optional)</label>
                                <textarea
                                  value={step.config.instructions || ""}
                                  onChange={(e) => updateConfig(step.id, "instructions", e.target.value)}
                                  placeholder={`Additional context for ${step.label}...`}
                                  className="w-full mt-1 rounded-md border border-border bg-muted/30 px-2 py-1.5 text-micro resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
                                  rows={2}
                                />
                              </div>
                              {idx > 0 && (
                                <div className="flex items-center gap-1.5 text-nano text-muted-foreground">
                                  <Zap className="h-2.5 w-2.5" />
                                  <span>Uses output from Step {idx} as input</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        )}

        {/* Add Step Button */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={cn(
            "w-full border border-dashed border-border rounded-lg p-3",
            "flex items-center justify-center gap-1.5 text-micro text-muted-foreground",
            "hover:border-primary/40 hover:text-primary transition-colors"
          )}
        >
          <Plus className="h-3 w-3" />
          Add Step
        </button>

        {/* Intent Picker */}
        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 pt-1">
                {AVAILABLE_INTENTS.map((intentDef) => {
                  const Icon = intentDef.icon;
                  return (
                    <button
                      key={intentDef.intent}
                      onClick={() => addStep(intentDef)}
                      className={cn(
                        "border border-border rounded-lg p-2.5 text-left",
                        "hover:border-primary/40 hover:bg-muted/30 transition-all group"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn("h-5 w-5 rounded flex items-center justify-center", intentDef.color)}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <span className="text-micro font-medium">{intentDef.label}</span>
                      </div>
                      <p className="text-nano text-muted-foreground line-clamp-1">{intentDef.description}</p>
                      <div className="text-nano font-mono text-muted-foreground mt-1">~{intentDef.credits}N</div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center gap-2">
        {totalCredits > balance && (
          <div className="flex items-center gap-1 text-nano text-destructive flex-1">
            <AlertTriangle className="h-3 w-3" />
            Insufficient balance ({balance}N available)
          </div>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <input
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            placeholder="Pipeline name..."
            className="h-7 rounded-md border border-border bg-background px-2 text-micro w-32 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <Button
            variant="outline" size="sm" className="h-7 text-micro gap-1"
            disabled={steps.length < 2 || !pipelineName.trim()}
            onClick={() => onSave(steps, pipelineName)}
          >
            <Save className="h-3 w-3" /> Save
          </Button>
          <Button
            size="sm" className="h-7 text-micro gap-1"
            disabled={!canExecute}
            onClick={() => onExecute(steps)}
          >
            <Play className="h-3 w-3" /> Execute ({totalCredits}N)
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
