import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Coins, Play, Loader2, CheckCircle, Copy, RotateCcw, Zap, AlertTriangle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type RegistryServiceItem, LEVEL_META, TIER_COLORS } from "./RegistryCard";
import { useWalletAtomicity } from "@/hooks/useWalletAtomicity";
import { useAbandonmentDetector } from "@/hooks/useAbandonmentDetector";

interface ExecuteServiceDialogProps {
  service: RegistryServiceItem | null;
  open: boolean;
  onClose: () => void;
  initialInput?: string;
  initialGoal?: string;
}

type ExecState = "configure" | "executing" | "done" | "error";

/** service_registry.id IS the service_key (slug format) */

export function ExecuteServiceDialog({ service, open, onClose, initialInput, initialGoal }: ExecuteServiceDialogProps) {
  const [input, setInput] = useState(initialInput || "");
  const [goal, setGoal] = useState(initialGoal || "");
  const [state, setState] = useState<ExecState>("configure");
  const [output, setOutput] = useState("");
  const [costCharged, setCostCharged] = useState(0);
  const { reserve, settle, release } = useWalletAtomicity();
  const reservedRef = useRef<{ amount: number; jobId?: string } | null>(null);
  const { markStarted, markCompleted } = useAbandonmentDetector({
    serviceName: service?.name,
    timeoutSeconds: 45,
  });

  useEffect(() => {
    if (service) {
      setState("configure");
      setInput(initialInput || "");
      setGoal(initialGoal || "");
      setOutput("");
      setCostCharged(0);
    }
  }, [service?.id, initialInput, initialGoal]);

  const estimatedCost = service
    ? Math.round((service.neurons_cost_min + service.neurons_cost_max) / 2)
    : 0;

  const handleExecute = useCallback(async () => {
    if (!service || !input.trim()) {
      toast.error("Adaugă conținut pentru execuție");
      return;
    }

    setState("executing");
    markCompleted();
    setOutput("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Autentifică-te pentru a executa servicii");
        setState("configure");
        return;
      }

      const serviceKey = service.id;
      const inputText = goal ? `Goal: ${goal}\n\nContent:\n${input}` : input.trim();

      // 1. Look up service in service_catalog
      const { data: catalogService } = await supabase
        .from("service_catalog")
        .select("service_key, credits_cost")
        .eq("service_key", serviceKey)
        .maybeSingle();

      const finalServiceKey = catalogService?.service_key || "insight-extractor";
      const cost = catalogService?.credits_cost || estimatedCost;

      // 2. ATOMIC: Reserve neurons BEFORE creating job
      const reservation = await reserve(cost, undefined, `Service: ${service.name}`);
      if (!reservation.ok) {
        setState("configure");
        return; // toast already shown by hook
      }

      // 3. Create job
      const { data: job, error: jobError } = await supabase
        .from("neuron_jobs")
        .insert({
          author_id: session.user.id,
          neuron_id: 1,
          worker_type: "service",
          status: "pending",
          input: { text: inputText, service_name: service.name, service_level: service.service_level },
          max_retries: 2,
          priority: service.service_level === "LCSS" ? 3 : service.service_level === "MMS" ? 2 : 1,
        })
        .select("id")
        .single();

      if (jobError || !job) {
        // RELEASE reserved credits on job creation failure
        await release(reservation.reserved, undefined, "Job creation failed");
        toast.error("Nu s-a putut crea jobul");
        setState("configure");
        return;
      }

      reservedRef.current = { amount: reservation.reserved, jobId: job.id };

      // 3. Call run-service edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-service`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            job_id: job.id,
            service_key: finalServiceKey,
            inputs: { content: inputText },
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        // RELEASE reserved credits on execution failure
        if (reservedRef.current) {
          await release(reservedRef.current.amount, reservedRef.current.jobId, "Execution failed");
          reservedRef.current = null;
        }
        if (response.status === 402) {
          toast.error(errData.error || "NEURONS insuficienți. Reîncarcă portofelul.");
        } else if (response.status === 429) {
          toast.error(errData.error || "Prea multe cereri. Încearcă mai târziu.");
        } else if (response.status === 403) {
          toast.error(errData.error || "Serviciul este blocat de regimul curent.");
        } else {
          toast.error(errData.error || "Execuție eșuată");
        }
        setState("configure");
        return;
      }

      // Check if response is SSE stream or JSON
      const contentType = response.headers.get("Content-Type") || "";

      if (contentType.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No stream");

        const decoder = new TextDecoder();
        let buffer = "";
        let fullOutput = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          let idx: number;

          while ((idx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullOutput += content;
                setOutput(fullOutput);
              }
            } catch {
              // partial
            }
          }
        }

        // SETTLE: confirm reserved credits as spent
        if (reservedRef.current) {
          await settle(reservedRef.current.amount, reservedRef.current.jobId, `Completed: ${service.name}`);
          setCostCharged(reservedRef.current.amount);
          reservedRef.current = null;
        }
        setState("done");
        toast.success("Serviciu executat cu succes!");
      } else {
        const data = await response.json();
        if (data.dry_run) {
          // RELEASE on dry-run
          if (reservedRef.current) {
            await release(reservedRef.current.amount, reservedRef.current.jobId, "Dry-run simulation");
            reservedRef.current = null;
          }
          setOutput("🔬 Simulation mode — no AI call was made. Credits have been refunded.");
          setState("done");
        } else {
          // SETTLE on success
          if (reservedRef.current) {
            await settle(reservedRef.current.amount, reservedRef.current.jobId, `Completed: ${service.name}`);
            setCostCharged(reservedRef.current.amount);
            reservedRef.current = null;
          }
          setOutput(JSON.stringify(data, null, 2));
          setState("done");
        }
      }
    } catch (err) {
      console.error("Execute error:", err);
      // RELEASE reserved credits on unexpected failure
      if (reservedRef.current) {
        await release(reservedRef.current.amount, reservedRef.current.jobId, "Unexpected error");
        reservedRef.current = null;
      }
      setState("error");
      toast.error("Execuție eșuată. Creditele au fost returnate.");
    }
  }, [service, input, goal, estimatedCost]);

  const handleClose = useCallback(() => {
    setState("configure");
    setInput("");
    setGoal("");
    setOutput("");
    onClose();
  }, [onClose]);

  if (!service) return null;

  const meta = LEVEL_META[service.service_level as keyof typeof LEVEL_META];
  const Icon = meta?.icon || Zap;

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-muted">
              <Icon className={cn("h-5 w-5", meta?.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base">{service.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-nano px-1.5 border", TIER_COLORS[service.score_tier] || TIER_COLORS.C)}>
                  Tier {service.score_tier}
                </Badge>
                <Badge variant="outline" className="text-nano px-1.5">{service.service_level}</Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Cost preview */}
          <div className={cn(
            "rounded-lg p-3 flex items-center justify-between",
            state === "executing" ? "bg-primary/5 border border-primary/20" : "bg-muted/50"
          )}>
            <div className="flex items-center gap-2">
              {state === "executing" ? (
                <Lock className="h-4 w-4 text-primary" />
              ) : (
                <Coins className="h-4 w-4 text-primary" />
              )}
              <span className="text-sm font-medium">
                {state === "executing" ? "Rezervat" : state === "done" ? "Facturat" : "Cost estimat"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono">{costCharged || estimatedCost}</span>
              <span className="text-xs text-muted-foreground ml-1">NEURONS</span>
              <p className="text-nano text-muted-foreground">
                {state === "executing" ? "🔒 blocat până la finalizare" : `≈ $${((costCharged || estimatedCost) * 0.002).toFixed(2)} USD`}
              </p>
            </div>
          </div>

          {/* Input */}
          {state === "configure" && (
            <>
              <div>
                <label className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Obiectiv (opțional)
                </label>
                <Input
                  placeholder="Ex: Generează hook-uri pentru audiența B2B..."
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Conținut / Context
                </label>
                <Textarea
                  placeholder="Lipește conținutul, contextul sau datele aici..."
                  value={input}
                  onChange={e => { setInput(e.target.value); markStarted(e.target.value.length); }}
                  className="min-h-[140px] text-sm"
                />
                {service.intent && (
                  <p className="text-nano text-muted-foreground mt-1">Intent: {service.intent}</p>
                )}
              </div>

              <Button className="w-full gap-2" size="lg" onClick={handleExecute} disabled={!input.trim()} data-execute-btn>
                <Play className="h-4 w-4" />
                Execută — ~{estimatedCost} NEURONS
              </Button>
            </>
          )}

          {/* Executing */}
          {state === "executing" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Generez output-ul...</span>
              </div>
              {output && (
                <div className="bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-[350px] overflow-y-auto border border-border/50 font-mono text-xs leading-relaxed">
                  {output}
                  <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5" />
                </div>
              )}
            </div>
          )}

          {/* Done/Error */}
          {(state === "done" || state === "error") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  {state === "done" ? (
                    <><CheckCircle className="h-4 w-4 text-primary" /> Output ready</>
                  ) : (
                    <><AlertTriangle className="h-4 w-4 text-destructive" /> Eroare</>
                  )}
                </div>
                {costCharged > 0 && (
                  <Badge variant="outline" className="text-nano">
                    <Coins className="h-3 w-3 mr-1" />{costCharged} NEURONS
                  </Badge>
                )}
              </div>

              {output && (
                <div className="bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto border">
                  {output}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5"
                  onClick={() => { navigator.clipboard.writeText(output); toast.success("Copiat!"); }}>
                  <Copy className="h-3.5 w-3.5" /> Copiază
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5"
                  onClick={() => { setState("configure"); setOutput(""); }}>
                  <RotateCcw className="h-3.5 w-3.5" /> Rulează din nou
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
