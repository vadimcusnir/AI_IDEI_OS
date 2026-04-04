/**
 * ServiceDrawer — Side panel for configuring and launching a service.
 * Opens instead of navigating to /run/:serviceKey.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { truncateForService, formatTruncationMessage } from "@/lib/contentTruncation";
import { trackEvent } from "@/lib/analytics";
import { trackInternalEvent, AnalyticsEvents } from "@/lib/internalAnalytics";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useUserTier } from "@/hooks/useUserTier";
import { tierSatisfied } from "@/components/premium/PremiumPaywall";
import { InlineTopUp } from "@/components/credits/InlineTopUp";
import { PipelineSourcePicker } from "@/components/services/PipelineSourcePicker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2, Play, Coins, X, Sparkles, CheckCircle2,
  AlertCircle, Brain, BarChart3, FileText, Target, Layers, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface Service {
  id: string;
  service_key: string;
  name: string;
  description: string;
  service_class: string;
  category: string;
  credits_cost: number;
  icon: string;
  is_active: boolean;
  access_tier: string;
}

interface ServiceFull extends Service {
  input_schema: any[];
  deliverables_schema: any[];
}

type JobStatus = "idle" | "creating" | "running" | "completed" | "failed";

const CATEGORY_ICON: Record<string, React.ElementType> = {
  extraction: Brain,
  analysis: BarChart3,
  content: FileText,
  strategy: Target,
  production: Layers,
  orchestration: Zap,
  document: FileText,
};

interface ServiceDrawerProps {
  service: Service | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceDrawer({ service, open, onOpenChange }: ServiceDrawerProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { balance } = useCreditBalance();
  const { tier: userTier } = useUserTier();

  const [serviceFull, setServiceFull] = useState<ServiceFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [jobResult, setJobResult] = useState("");

  // Load full service details when opened
  useEffect(() => {
    if (!service || !open) return;
    setJobStatus("idle");
    setJobResult("");
    setInputs({});
    setLoading(true);

    (async () => {
      const { data } = await supabase
        .from("service_catalog")
        .select("*")
        .eq("service_key", service.service_key)
        .single();
      if (data) setServiceFull(data as ServiceFull);
      setLoading(false);
    })();
  }, [service?.service_key, open]);

  const inputFields = serviceFull?.input_schema && Array.isArray(serviceFull.input_schema)
    ? serviceFull.input_schema
    : [];

  const handleRun = useCallback(async () => {
    if (!serviceFull || !user) return;

    if (balance < serviceFull.credits_cost) {
      toast.error(`Credite insuficiente: ai ${balance}, trebuie ${serviceFull.credits_cost}`);
      return;
    }

    // Truncate oversized content
    const truncatedInputs = { ...inputs };
    for (const key of Object.keys(truncatedInputs)) {
      if (typeof truncatedInputs[key] === "string" && truncatedInputs[key].length > 500) {
        const result = truncateForService(truncatedInputs[key]);
        if (result.wasTruncated) {
          truncatedInputs[key] = result.content;
          toast.info(formatTruncationMessage(result), { duration: 6000 });
        }
      }
    }

    setJobStatus("creating");

    try {
      const { data: neuron, error: neuronErr } = await supabase
        .from("neurons")
        .insert({
          author_id: user.id,
          title: `${serviceFull.name} — ${new Date().toLocaleDateString()}`,
          status: "draft",
          lifecycle: "ingested",
        } as any)
        .select("id")
        .single();

      if (neuronErr || !neuron) throw new Error("Failed to create neuron");

      const { data: job, error: jobErr } = await supabase
        .from("neuron_jobs")
        .insert({
          neuron_id: neuron.id,
          author_id: user.id,
          worker_type: serviceFull.service_key,
          status: "pending",
          input: truncatedInputs,
        } as any)
        .select("id")
        .single();

      if (jobErr || !job) throw new Error("Failed to create job");
      setJobStatus("running");

      const { data: { session } } = await supabase.auth.getSession();

      const PIPELINE_ROUTES: Record<string, string> = {
        "market-research-full": "market-research-engine",
        "extraction-pipeline": "extraction-pipeline",
      };
      const edgeFunction = PIPELINE_ROUTES[serviceFull.service_key] || "run-service";

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${edgeFunction}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            job_id: job.id,
            service_key: serviceFull.service_key,
            neuron_id: neuron.id,
            inputs: truncatedInputs,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Service error" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response stream");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResult = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nlIndex: number;
        while ((nlIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nlIndex);
          buffer = buffer.slice(nlIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResult += content;
              setJobResult(fullResult);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      setJobStatus("completed");
      toast.success("✅ Producție finalizată!");
      trackEvent({ name: "service_executed", params: { service_key: serviceFull.service_key, credits_cost: serviceFull.credits_cost } });
      trackInternalEvent({ event: AnalyticsEvents.SERVICE_COMPLETED, params: { service_key: serviceFull.service_key, credits_cost: serviceFull.credits_cost } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error(msg);
      setJobStatus("failed");
    }
  }, [serviceFull, user, inputs, balance]);

  const CatIcon = CATEGORY_ICON[service?.category || ""] || Sparkles;
  const canRun = jobStatus === "idle" || jobStatus === "failed";
  const hasEnoughCredits = balance >= (serviceFull?.credits_cost || 0);
  const isRunning = jobStatus === "creating" || jobStatus === "running";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col" side="right">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <CatIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-semibold leading-tight">
                {service?.name}
              </SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {service?.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 text-xs">
              <Coins className="h-3 w-3 text-ai-accent" />
              <span className="font-mono font-bold">{serviceFull?.credits_cost || service?.credits_cost}</span>
              <span className="text-muted-foreground">NEURONS</span>
            </div>
            <span className="text-nano text-muted-foreground">|</span>
            <div className="text-xs text-muted-foreground">
              Sold: <span className="font-mono font-bold text-foreground">{balance}</span>
            </div>
          </div>
        </SheetHeader>

        {/* Body */}
        <ScrollArea className="flex-1">
          <div className="px-5 py-5 space-y-5">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Input fields */}
                <AnimatePresence mode="wait">
                  {canRun && (
                    <motion.div
                      key="inputs"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {inputFields.length > 0 ? (
                        inputFields.map((field: any) => (
                          <div key={field.key}>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                              {field.label || field.key}
                              {field.required && <span className="text-destructive ml-0.5">*</span>}
                            </label>
                            {field.type === "source" ? (
                              <PipelineSourcePicker
                                value={inputs[field.key] || ""}
                                onChange={(val) => setInputs(prev => ({ ...prev, [field.key]: val }))}
                                placeholder={field.placeholder || `Enter ${field.label || field.key}...`}
                              />
                            ) : (
                              <Textarea
                                value={inputs[field.key] || ""}
                                onChange={e => setInputs(prev => ({ ...prev, [field.key]: e.target.value }))}
                                placeholder={field.placeholder || `Enter ${field.label || field.key}...`}
                                rows={field.rows || 4}
                                className="text-sm"
                              />
                            )}
                            {field.description && (
                              <p className="text-micro text-muted-foreground/60 mt-1">{field.description}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                            Context / Material sursă
                          </label>
                          <PipelineSourcePicker
                            value={inputs.context || ""}
                            onChange={(val) => setInputs(prev => ({ ...prev, context: val }))}
                            placeholder="Lipește text, link YouTube sau selectează un episod..."
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Running state */}
                {isRunning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 space-y-3"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-sm font-medium">Se procesează...</p>
                    <p className="text-xs text-muted-foreground">
                      {jobStatus === "creating" ? "Se pregătește job-ul..." : "AI-ul lucrează..."}
                    </p>
                  </motion.div>
                )}

                {/* Streaming result */}
                {jobResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {jobStatus === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-status-validated" />
                      ) : jobStatus === "failed" ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      )}
                      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {jobStatus === "completed" ? "Rezultat" : jobStatus === "failed" ? "Eroare" : "Se generează..."}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none dark:prose-invert text-sm">
                      <ReactMarkdown>{jobResult}</ReactMarkdown>
                    </div>
                  </motion.div>
                )}

                {/* Completed CTA */}
                {jobStatus === "completed" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <Button
                      variant="outline"
                      className="w-full gap-2 text-sm"
                      onClick={() => {
                        onOpenChange(false);
                        navigate("/jobs");
                      }}
                    >
                      Vezi toate job-urile
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-xs text-muted-foreground"
                      onClick={() => {
                        setJobStatus("idle");
                        setJobResult("");
                        setInputs({});
                      }}
                    >
                      Rulează din nou
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer — Start Production */}
        {canRun && !loading && (
          <div className="px-5 py-4 border-t border-border shrink-0 space-y-3 bg-background">
            {!hasEnoughCredits && (
              <InlineTopUp needed={serviceFull?.credits_cost || 0} balance={balance} compact />
            )}
            <Button
              onClick={handleRun}
              disabled={!hasEnoughCredits || isRunning}
              className="w-full gap-2 h-11 text-sm font-semibold"
            >
              {hasEnoughCredits ? <Play className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {hasEnoughCredits
                ? <>Start Production <span className="text-xs opacity-70 ml-1">({serviceFull?.credits_cost || service?.credits_cost} N)</span></>
                : "NEURONS Insuficienți"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
