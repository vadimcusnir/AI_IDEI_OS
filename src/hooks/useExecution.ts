/**
 * useExecution — Bridges input → intent → service execution → streaming output.
 * 
 * This is the REAL execution engine. When intent is actionable (not conversation),
 * it triggers actual service pipelines via run-service/run-pipeline edge functions
 * and streams results back to the global execution store.
 */
import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useUserTier } from "@/hooks/useUserTier";
import { executionActions, type OutputItem } from "@/stores/executionStore";
import {
  routeCommand, detectIntent, parseInput, getServicesForIntent,
  type IntentCategory, type RouteResult,
} from "@/components/command-center/CommandRouter";
import {
  logCommandSubmitted, logPlanConfirmed, logExecutionCompleted,
  logEconomicGate,
} from "@/components/command-center/AuditLogger";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-console`;
const RUN_SERVICE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-service`;
const RUN_PIPELINE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-pipeline`;

/** Intent categories that trigger real service execution (not just chat) */
const EXECUTABLE_INTENTS: IntentCategory[] = [
  "analyze", "extract", "generate", "compare", "profile", "pipeline",
];

interface ExecutionContext {
  neuronCount: number;
  episodeCount: number;
  workspaceId: string | null;
}

export function useExecution(context: ExecutionContext) {
  const { user } = useAuth();
  const { balance, refetch: refetchBalance } = useCreditBalance();
  const { tier } = useUserTier();
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);
  const activeJobIdRef = useRef<string | null>(null);
  const tierDiscount = tier === "pro" ? 25 : tier === "free" ? 0 : 10;

  /**
   * Route input through intent detection.
   * Returns null if blocked.
   */
  const routeInput = useCallback((raw: string, fileNames: string[] = []): RouteResult | null => {
    const route = routeCommand(raw, tier, balance, fileNames);
    
    if (!route.permitted) {
      return route; // caller handles permission UI
    }
    
    if (route.intent.blocked) {
      toast.error("Neurons insuficienți", {
        description: route.intent.blockReason || undefined,
        action: { label: "Top Up", onClick: () => navigate("/credits") },
      });
      return null;
    }

    return route;
  }, [tier, balance, navigate]);

  /**
   * Check if an intent should trigger real execution vs chat.
   */
  const isExecutableIntent = useCallback((category: IntentCategory): boolean => {
    return EXECUTABLE_INTENTS.includes(category);
  }, []);

  /**
   * Execute a service directly via run-service edge function.
   * Returns the job_id for tracking.
   */
  const executeService = useCallback(async (
    serviceKey: string,
    inputParams: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<string | null> => {
    if (!user) return null;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const wsId = context.workspaceId ?? null;

    // Create a placeholder neuron for the job
    let neuronId: number;
    try {
      const insertObj: Record<string, unknown> = {
        title: `Job: ${serviceKey}`,
        author_id: user.id,
      };
      if (wsId) insertObj.workspace_id = wsId;

      const { data: neuron, error: neuronErr } = await supabase
        .from("neurons")
        .insert(insertObj as any)
        .select("id")
        .single();

      if (neuronErr || !neuron) {
        throw new Error(neuronErr?.message || "Neuron creation failed");
      }
      neuronId = Number(neuron.id);
    } catch (err) {
      console.error("Failed to create neuron for job:", err);
      throw new Error(`Service unavailable: Could not initialize job. ${err instanceof Error ? err.message : ""}`);
    }

    // Create job linked to the neuron
    let jobId: string;
    try {
      const jobInsert: Record<string, unknown> = {
        neuron_id: neuronId,
        worker_type: serviceKey,
        status: "pending",
        input: inputParams,
        author_id: user.id,
      };
      if (wsId) jobInsert.workspace_id = wsId;

      const { data: job, error: jobErr } = await supabase
        .from("neuron_jobs")
        .insert(jobInsert as any)
        .select("id")
        .single();

      if (jobErr || !job) {
        throw new Error(jobErr?.message || "Job creation failed");
      }
      jobId = job.id;
    } catch (err) {
      console.error("Failed to create job:", err);
      throw new Error(`Failed to create job: ${err instanceof Error ? err.message : "Unknown error"}`);
    }

    // Track active job for server-side abort
    activeJobIdRef.current = jobId;

    const resp = await fetch(RUN_SERVICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        job_id: jobId,
        service_key: serviceKey,
        neuron_id: neuronId,
        inputs: inputParams,
      }),
      signal,
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        const retryAfter = resp.headers.get("Retry-After") || "60";
        throw new Error(`Rate limit exceeded. Try again in ${retryAfter}s.`);
      }
      if (resp.status === 402) {
        throw new Error(`Insufficient credits. ${err.needed ? `Need ${err.needed} NEURONS.` : ""}`);
      }
      if (resp.status === 404) {
        throw new Error(`Service "${serviceKey}" not available. Please try a different action.`);
      }
      throw new Error(err.error || `Service execution failed (${resp.status})`);
    }

    const data = await resp.json();
    return data.job_id || jobId;
  }, [user, context.workspaceId]);

  /**
   * Execute a pipeline (multi-service chain).
   */
  const executePipeline = useCallback(async (
    steps: Array<{ service_key: string; label: string; config?: Record<string, unknown> }>,
    inputText: string,
    signal?: AbortSignal,
  ): Promise<string | null> => {
    if (!user) return null;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const resp = await fetch(RUN_PIPELINE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        steps,
        input: { text: inputText },
        workspace_id: context.workspaceId,
      }),
      signal,
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `Pipeline execution failed (${resp.status})`);
    }

    const data = await resp.json();
    return data.pipeline_id || data.job_id || null;
  }, [user, context.workspaceId]);

  /**
   * Subscribe to job progress via realtime.
   */
  const subscribeToJob = useCallback((jobId: string, onComplete: () => void) => {
    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "neuron_jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (!row) return;

          // Update execution progress
          if (row.current_step) {
            executionActions.updateStep(row.current_step, { status: "running" });
          }

          if (row.status === "completed") {
            executionActions.completeExecution();
            refetchBalance();
            onComplete();
          } else if (row.status === "failed") {
            executionActions.failExecution(row.error_message || "Execution failed");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchBalance]);

  /**
   * Full execution flow:
   * Input → Route → Plan → Execute → Stream → Output
   * 
   * For executable intents: triggers real service execution
   * For conversation: falls through to agent-console chat
   */
  const execute = useCallback(async (
    rawInput: string,
    files: File[] = [],
    options?: { autoExecute?: boolean },
  ): Promise<{ route: RouteResult; isExecution: boolean }> => {
    if (!user) throw new Error("Not authenticated");

    const fileNames = files.map(f => f.name);
    const route = routeCommand(rawInput, tier, balance, fileNames);

    // Log
    logCommandSubmitted(user.id, route.intent.category, route.input.type, route.intent.estimatedCredits);

    // Permission check
    if (!route.permitted) {
      return { route, isExecution: false };
    }

    // Balance check
    if (balance < route.intent.estimatedCredits && route.intent.estimatedCredits > 0) {
      toast.error("Neurons insuficienți", {
        action: { label: "Top Up", onClick: () => navigate("/credits") },
      });
      return { route, isExecution: false };
    }

    const isExec = isExecutableIntent(route.intent.category);

    // Add user message to global store
    const userMsg = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: rawInput + (files.length > 0 ? `\n\n[${files.length} files attached]` : ""),
      timestamp: new Date(),
    };
    executionActions.addMessage(userMsg);

    if (isExec && (options?.autoExecute || route.intent.confidence >= 0.8)) {
      // ═══ REAL EXECUTION PATH ═══
      executionActions.setLoading(true);
      
      // Build execution plan
      const services = route.intent.suggestedServices;
      const steps = services.map((svc, i) => ({
        tool: svc,
        label: svc.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        credits: Math.round(route.intent.estimatedCredits / Math.max(services.length, 1)),
      }));

      executionActions.setPlan({
        actionId: crypto.randomUUID(),
        intent: route.intent.category,
        confidence: route.intent.confidence,
        planName: route.intent.label,
        totalCredits: route.intent.estimatedCredits,
        steps,
        objective: route.intent.description,
        outputPreview: [`Expected: ${services.length} service outputs`],
      });

      // Auto-confirm for high confidence or autoExecute
      if (options?.autoExecute || route.intent.confidence >= 0.9) {
        executionActions.confirmExecution();
        logPlanConfirmed(user.id, null, route.intent.category, route.intent.estimatedCredits, steps.length);
      }
      // else: UI shows PlanPreview for user to confirm

      return { route, isExecution: true };
    }

    // ═══ CHAT/CONVERSATION PATH — delegate to agent-console ═══
    return { route, isExecution: false };
  }, [user, tier, balance, navigate, isExecutableIntent]);

  /**
   * Confirm and run the current execution plan.
   * Called after user confirms PlanPreview.
   */
  const confirmAndRun = useCallback(async (
    rawInput: string,
    route: RouteResult,
  ) => {
    if (!user) return;

    const controller = new AbortController();
    abortRef.current = controller;

    executionActions.confirmExecution();
    executionActions.setLoading(true);
    executionActions.setStreaming(true);

    logPlanConfirmed(
      user.id, null, route.intent.category,
      route.intent.estimatedCredits, route.intent.suggestedServices.length,
    );

    try {
      const services = route.intent.suggestedServices;

      if (services.length > 1 && route.intent.category === "pipeline") {
        // Multi-service pipeline
        const pipelineSteps = services.map(svc => ({
          service_key: svc,
          label: svc.replace(/_/g, " "),
        }));
        
        const pipelineId = await executePipeline(pipelineSteps, rawInput, controller.signal);
        
        if (pipelineId) {
          // Subscribe to progress
          const unsub = subscribeToJob(pipelineId, () => {
            loadJobOutputs(pipelineId);
            unsub();
          });
        }
      } else if (services.length > 0) {
        // Single service execution
        const serviceKey = services[0];
        
        // Mark first step as running
        executionActions.updateStep(serviceKey, { status: "running" });
        
        const jobId = await executeService(serviceKey, { text: rawInput }, controller.signal);
        
        if (jobId) {
          executionActions.updateStep(serviceKey, { status: "running" });
          
          const unsub = subscribeToJob(jobId, () => {
            executionActions.updateStep(serviceKey, { status: "completed" });
            loadJobOutputs(jobId);
            unsub();
          });
        }
      }

      // Also stream agent analysis in parallel
      await streamAgentResponse(rawInput, route, controller.signal);

    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        executionActions.failExecution(e instanceof Error ? e.message : "Unknown error");
        toast.error(`Execution failed: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    } finally {
      abortRef.current = null;
    }
  }, [user, executeService, executePipeline, subscribeToJob]);

  /**
   * Stream agent-console response (works for both chat and execution commentary).
   */
  const streamAgentResponse = useCallback(async (
    userContent: string,
    route: RouteResult,
    signal: AbortSignal,
  ) => {
    if (!user) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const resp = await fetch(AGENT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: userContent }],
        context: {
          neuron_count: context.neuronCount,
          episode_count: context.episodeCount,
          credit_balance: balance,
          detected_intent: route.intent.category,
          intent_confidence: route.intent.confidence,
          suggested_services: route.intent.suggestedServices,
          input_type: route.input.type,
          user_tier: tier,
        },
      }),
      signal,
    });

    if (!resp.ok) {
      if (resp.status === 429) toast.error("Rate limit — încercați din nou");
      if (resp.status === 402) {
        toast.error("Credits epuizate", { action: { label: "Top Up", onClick: () => navigate("/credits") } });
      }
      return;
    }

    const assistantId = crypto.randomUUID();
    let fullContent = "";

    if (resp.body) {
      executionActions.setStreaming(true);
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nlIdx: number;
        while ((nlIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nlIdx);
          buffer = buffer.slice(nlIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const d = line.slice(6).trim();
          if (d === "[DONE]") continue;
          try {
            const parsed = JSON.parse(d);
            // Handle agent metadata (plan updates from server)
            if (parsed.agent_meta) {
              const meta = parsed.agent_meta;
              executionActions.setPlan({
                actionId: meta.action_id,
                intent: meta.intent,
                confidence: meta.confidence,
                planName: meta.plan_name,
                totalCredits: meta.total_credits,
                steps: meta.steps || [],
                objective: meta.objective,
                outputPreview: meta.output_preview,
              });
            }
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              fullContent += c;
              executionActions.upsertAssistantMessage(assistantId, fullContent);
            }
          } catch { /* partial JSON */ }
        }
      }
    }

    if (fullContent) {
      // Parse outputs from agent response
      const outputs = parseOutputs(fullContent);
      if (outputs.length > 0) {
        executionActions.transition("delivering");
        executionActions.setOutputs(outputs);
      }
    }

    executionActions.setStreaming(false);
    if (!fullContent) {
      executionActions.addMessage({
        id: assistantId,
        role: "assistant",
        content: "Nu am primit răspuns. Încearcă din nou.",
        timestamp: new Date(),
      });
    }
  }, [user, balance, tier, context, navigate]);

  /**
   * Load outputs from a completed job.
   */
  const loadJobOutputs = useCallback(async (jobId: string) => {
    const { data: artifacts } = await supabase
      .from("artifacts")
      .select("id, title, content, artifact_type")
      .eq("job_id", jobId);

    if (artifacts && artifacts.length > 0) {
      const outputs: OutputItem[] = artifacts.map((a, i) => ({
        id: a.id,
        type: mapArtifactType(a.artifact_type),
        title: a.title || `Output ${i + 1}`,
        content: a.content || "",
      }));
      executionActions.setOutputs(outputs);
      executionActions.completeExecution();

      // Add summary message
      executionActions.addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: `✅ **Execuție completă** — ${outputs.length} active generate.\n\n${outputs.map(o => `- **${o.title}**`).join("\n")}`,
        timestamp: new Date(),
      });
    }

    refetchBalance();
  }, [refetchBalance]);

  /** Stop current execution — also cancels server-side job */
  const stop = useCallback(async () => {
    abortRef.current?.abort();
    executionActions.setLoading(false);
    executionActions.setStreaming(false);
    executionActions.failExecution("Anulat de utilizator");

    // Server-side cancellation: release reserved credits
    const jobId = activeJobIdRef.current;
    if (jobId && user) {
      activeJobIdRef.current = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch(RUN_SERVICE_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: "cancel",
              job_id: jobId,
            }),
          });
        }
      } catch {
        // Best-effort cancellation — don't block UI
        console.warn("Server-side cancel failed for job:", jobId);
      }
    }
  }, [user]);

  return {
    routeInput,
    execute,
    confirmAndRun,
    streamAgentResponse,
    stop,
    isExecutableIntent,
    tierDiscount,
  };
}

// ═══ Helpers ═══

function parseOutputs(content: string): OutputItem[] {
  const items: OutputItem[] = [];
  const sections = content.split(/^## /m).filter(Boolean);
  if (sections.length > 1) {
    sections.forEach((section, i) => {
      const lines = section.split("\n");
      const title = lines[0]?.trim() || `Section ${i + 1}`;
      const body = lines.slice(1).join("\n").trim();
      if (body.length > 50) {
        let type: OutputItem["type"] = "raw";
        const lower = title.toLowerCase();
        if (lower.includes("transcript")) type = "transcript";
        else if (lower.includes("summary") || lower.includes("rezumat")) type = "summary";
        else if (lower.includes("insight") || lower.includes("key")) type = "insights";
        else if (lower.includes("framework") || lower.includes("pattern")) type = "frameworks";
        else if (lower.includes("action") || lower.includes("plan")) type = "action_plan";
        else if (lower.includes("article") || lower.includes("content")) type = "content";
        items.push({ id: `output-${i}`, type, title, content: body });
      }
    });
  }
  if (items.length === 0 && content.length > 100) {
    items.push({ id: "output-full", type: "raw", title: "Execution Output", content });
  }
  return items;
}

function mapArtifactType(type: string): OutputItem["type"] {
  const map: Record<string, OutputItem["type"]> = {
    transcript: "transcript",
    summary: "summary",
    insight: "insights",
    framework: "frameworks",
    action_plan: "action_plan",
    article: "content",
    content: "content",
  };
  return map[type] || "raw";
}
