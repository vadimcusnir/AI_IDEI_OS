import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Coins, Play, Loader2, CheckCircle, Copy, RotateCcw, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type RegistryServiceItem, LEVEL_META, TIER_COLORS } from "./RegistryCard";

interface ExecuteServiceDialogProps {
  service: RegistryServiceItem | null;
  open: boolean;
  onClose: () => void;
}

type ExecState = "configure" | "executing" | "done" | "error";

/** service_registry.id IS the service_key (slug format) */

export function ExecuteServiceDialog({ service, open, onClose }: ExecuteServiceDialogProps) {
  const [input, setInput] = useState("");
  const [goal, setGoal] = useState("");
  const [state, setState] = useState<ExecState>("configure");
  const [output, setOutput] = useState("");
  const [costCharged, setCostCharged] = useState(0);

  useEffect(() => {
    if (service) {
      setState("configure");
      setInput("");
      setGoal("");
      setOutput("");
      setCostCharged(0);
    }
  }, [service?.id]);

  const estimatedCost = service
    ? Math.round((service.neurons_cost_min + service.neurons_cost_max) / 2)
    : 0;

  const handleExecute = useCallback(async () => {
    if (!service || !input.trim()) {
      toast.error("Adaugă conținut pentru execuție");
      return;
    }

    setState("executing");
    setOutput("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Autentifică-te pentru a executa servicii");
        setState("configure");
        return;
      }

      const serviceKey = toServiceKey(service.name);
      const inputText = goal ? `Goal: ${goal}\n\nContent:\n${input}` : input.trim();

      // 1. Look up service in service_catalog, or use fallback
      const { data: catalogService } = await supabase
        .from("service_catalog")
        .select("service_key, credits_cost")
        .eq("service_key", serviceKey)
        .maybeSingle();

      const finalServiceKey = catalogService?.service_key || "insight-extractor";

      // 2. Create a neuron_jobs entry
      const { data: job, error: jobError } = await supabase
        .from("neuron_jobs")
        .insert({
          author_id: session.user.id,
          neuron_id: 1, // placeholder
          worker_type: "service",
          status: "pending",
          input: { text: inputText, service_name: service.name, service_level: service.service_level },
          max_retries: 2,
          priority: service.service_level === "LCSS" ? 3 : service.service_level === "MMS" ? 2 : 1,
        })
        .select("id")
        .single();

      if (jobError || !job) {
        toast.error("Nu s-a putut crea jobul");
        setState("configure");
        return;
      }

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
        // Stream SSE
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

        setCostCharged(catalogService?.credits_cost || estimatedCost);
        setState("done");
        toast.success("Serviciu executat cu succes!");
      } else {
        // JSON response (dry-run or error)
        const data = await response.json();
        if (data.dry_run) {
          setOutput("🔬 Simulation mode — no AI call was made. Credits have been refunded.");
          setState("done");
        } else {
          setOutput(JSON.stringify(data, null, 2));
          setState("done");
        }
      }
    } catch (err) {
      console.error("Execute error:", err);
      setState("error");
      toast.error("Execuție eșuată. Încearcă din nou.");
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
                <Badge variant="outline" className={cn("text-[9px] px-1.5 border", TIER_COLORS[service.score_tier] || TIER_COLORS.C)}>
                  Tier {service.score_tier}
                </Badge>
                <Badge variant="outline" className="text-[9px] px-1.5">{service.service_level}</Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Cost preview */}
          <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Cost estimat</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono">{estimatedCost}</span>
              <span className="text-xs text-muted-foreground ml-1">NEURONS</span>
              <p className="text-[9px] text-muted-foreground">≈ ${(estimatedCost * 0.002).toFixed(2)} USD</p>
            </div>
          </div>

          {/* Input */}
          {state === "configure" && (
            <>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
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
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Conținut / Context
                </label>
                <Textarea
                  placeholder="Lipește conținutul, contextul sau datele aici..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  className="min-h-[140px] text-sm"
                />
                {service.intent && (
                  <p className="text-[9px] text-muted-foreground mt-1">Intent: {service.intent}</p>
                )}
              </div>

              <Button className="w-full gap-2" size="lg" onClick={handleExecute} disabled={!input.trim()}>
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
                  <Badge variant="outline" className="text-[9px]">
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
