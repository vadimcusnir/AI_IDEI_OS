import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { truncateForService, formatTruncationMessage } from "@/lib/contentTruncation";
import { trackInternalEvent, AnalyticsEvents } from "@/lib/internalAnalytics";
import { ServiceJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Loader2, Play, CheckCircle2,
  Clock, AlertCircle, Coins, Lock, Shield,
  Sparkles, ChevronRight, FileText, BarChart3, Brain,
  Target, Layers, Zap, Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentSourcePicker } from "@/components/services/ContentSourcePicker";
import { InlineTopUp } from "@/components/credits/InlineTopUp";
import { ROICalculator } from "@/components/credits/ROICalculator";
import { useUserTier } from "@/hooks/useUserTier";
import { PremiumPaywall, TierBadge, tierSatisfied } from "@/components/premium/PremiumPaywall";
import { PostExecutionRecommendations } from "@/components/services/PostExecutionRecommendations";
import { NeuronBundleUpsell } from "@/components/credits/NeuronBundleUpsell";
import { ShareableOutput } from "@/components/distribution/ShareableOutput";
import { DistributionPanel } from "@/components/distribution/DistributionPanel";
import { PostExecutionPsychology } from "@/components/behavior/BehaviorOverlay";

interface Service {
  id: string;
  service_key: string;
  name: string;
  description: string;
  service_class: string;
  category: string;
  credits_cost: number;
  input_schema: any[];
  deliverables_schema: any[];
  access_tier: string;
}


type JobStatus = "idle" | "creating" | "running" | "completed" | "failed";

interface AccessVerdict {
  verdict: "ALLOW" | "PAYWALL" | "DENY";
  reason: string;
  credits_cost?: number;
  balance?: number;
  deficit?: number;
}

const CATEGORY_ICON: Record<string, React.ElementType> = {
  extraction: Brain,
  analysis: BarChart3,
  content: FileText,
  strategy: Target,
  production: Layers,
  orchestration: Zap,
  document: FileText,
};

export default function RunService() {
  const { serviceKey } = useParams<{ serviceKey: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefillState = (location.state as { prefillInput?: string; prefillGoal?: string } | null);
  const { tier: userTier } = useUserTier();
  const { t } = useTranslation("pages");
  const { balance: creditBalance, loading: creditsLoading } = useCreditBalance();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState<Record<string, string>>(
    prefillState?.prefillInput ? { content: prefillState.prefillInput } : {}
  );
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [jobResult, setJobResult] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [accessVerdict, setAccessVerdict] = useState<AccessVerdict | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | undefined>();

  const PIPELINE_STEPS = [
    { label: t("run_service.step_creating"), key: "creating" },
    { label: t("run_service.step_reserving"), key: "reserving" },
    { label: t("run_service.step_running"), key: "running" },
    { label: t("run_service.step_auditing"), key: "auditing" },
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    loadData();
  }, [user, authLoading, serviceKey]);

  const loadData = async () => {
    const serviceRes = await supabase.from("service_catalog").select("*").eq("service_key", serviceKey!).single();

    if (serviceRes.data) setService(serviceRes.data as Service);
    else { toast.error(t("run_service.service_not_found")); navigate("/services"); return; }

    // Use logged access check for audit trail + abuse detection
    const { data: accessData } = await supabase.rpc("check_access_logged", {
      _user_id: user!.id,
      _service_key: serviceKey!,
    });
    if (accessData) setAccessVerdict(accessData as unknown as AccessVerdict);

    setLoading(false);
  };

  const handleRun = async () => {
    if (!service || !user) return;

    // P1: Pre-flight credit & access verification before execution
    const { data: preCheck } = await supabase.rpc("check_access_logged", {
      _user_id: user.id,
      _service_key: service.service_key,
    });
    const verdict = preCheck as unknown as AccessVerdict;
    if (verdict?.verdict === "PAYWALL") {
      setAccessVerdict(verdict);
      toast.error(t("run_service.insufficient_error", { need: service.credits_cost, have: verdict.balance || 0 }));
      return;
    }
    if (verdict?.verdict === "DENY") {
      toast.error("Access denied: " + (verdict.reason || "Service unavailable"));
      return;
    }

    if (creditBalance < service.credits_cost) {
      toast.error(t("run_service.insufficient_error", { need: service.credits_cost, have: creditBalance }));
      return;
    }

    // Truncate oversized content and notify user
    const truncatedInputs = { ...inputs };
    let wasAnyTruncated = false;
    for (const key of Object.keys(truncatedInputs)) {
      if (typeof truncatedInputs[key] === "string" && truncatedInputs[key].length > 500) {
        const result = truncateForService(truncatedInputs[key]);
        if (result.wasTruncated) {
          truncatedInputs[key] = result.content;
          wasAnyTruncated = true;
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
          title: `${service.name} — ${new Date().toLocaleDateString()}`,
          status: "draft",
          lifecycle: "ingested",
        } as any)
        .select("id")
        .single();

      if (neuronErr || !neuron) throw new Error("Failed to create result neuron");

      const { data: job, error: jobErr } = await supabase
        .from("neuron_jobs")
        .insert({
          neuron_id: neuron.id,
          author_id: user.id,
          worker_type: service.service_key,
          status: "pending",
          input: truncatedInputs,
        } as any)
        .select("id")
        .single();

      if (jobErr || !job) throw new Error("Failed to create job");
      setJobId(job.id);
      setJobStatus("running");

      const { data: { session } } = await supabase.auth.getSession();

      // Route orchestrated pipelines to dedicated edge functions
      const PIPELINE_ROUTES: Record<string, string> = {
        "market-research-full": "market-research-engine",
        "extraction-pipeline": "extraction-pipeline",
      };
      const edgeFunction = PIPELINE_ROUTES[service.service_key] || "run-service";

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
            service_key: service.service_key,
            neuron_id: neuron.id,
            inputs: truncatedInputs,
            // Pass pipeline-specific params
            ...(service.service_key === "market-research-full" ? {
              industry: inputs.industry || "",
              country: inputs.country || "",
              market_phase: inputs.market_phase || "Growth",
              context: inputs.context || "",
            } : {}),
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

      // Balance updates reactively via useCreditBalance realtime subscription

      setJobStatus("completed");
      toast.success(t("run_service.job_completed"));
      trackEvent({ name: "service_executed", params: { service_key: service.service_key, job_id: jobId || undefined, credits_cost: service.credits_cost } });
      trackInternalEvent({ event: AnalyticsEvents.SERVICE_COMPLETED, params: { service_key: service.service_key, job_id: jobId, credits_cost: service.credits_cost } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error(msg);
      setJobStatus("failed");

      // Balance updates reactively via useCreditBalance realtime subscription
    }
  };

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!service) return null;

  const inputFields = Array.isArray(service.input_schema) ? service.input_schema : [];
  const deliverables = Array.isArray(service.deliverables_schema) ? service.deliverables_schema : [];
  const canRun = jobStatus === "idle" || jobStatus === "failed";
  const hasEnoughCredits = creditBalance >= service.credits_cost;
  const hasTierAccess = tierSatisfied(userTier, service.access_tier || "free");
  const CatIcon = CATEGORY_ICON[service.category] || Sparkles;

  return (
    <div className="flex-1 overflow-y-auto">
      <SEOHead title={`${service.name} — AI-IDEI`} description={service.description || "Run AI-powered knowledge service."} />
      <ServiceJsonLd service={service} />
      <BreadcrumbJsonLd items={[
        { name: "Services", url: "https://ai-idei.com/services" },
        { name: service.name, url: `https://ai-idei.com/services/${service.service_key}` },
      ]} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/services")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          {t("run_service.all_services")}
        </motion.button>

        {/* Service header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <CatIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl sm:text-2xl font-medium">{service.name}</h1>
                <Badge variant="secondary" className="text-nano font-mono uppercase">
                  {service.category}
                </Badge>
                <TierBadge tier={service.access_tier} />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-ai-accent" />
              <span className="font-bold font-mono">{service.credits_cost}</span>
              <span className="text-xs text-muted-foreground">NEURONS</span>
            </div>
            {deliverables.length > 0 && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-status-validated" />
                <span className="text-xs text-muted-foreground">{t("run_service.deliverables_count", { count: deliverables.length })}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground">{t("run_service.duration_estimate")}</span>
            </div>
          </div>
        </motion.div>

        {/* Input form */}
        <AnimatePresence mode="wait">
          {canRun && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ delay: 0.1 }}
            >
              {/* Content Source Picker */}
              <div className="mb-6">
                <ContentSourcePicker
                  selectedId={selectedSourceId}
                  onSelect={(content, source) => {
                    setSelectedSourceId(source.id);
                    // Auto-fill the first textarea/context field
                    if (inputFields.length > 0) {
                      const firstTextarea = inputFields.find((f: any) => f.type === "textarea");
                      const targetField = firstTextarea || inputFields[0];
                      const key = targetField.name || "field_0";
                      setInputs(prev => ({ ...prev, [key]: content }));
                    } else {
                      setInputs({ context: content });
                    }
                  }}
                />
              </div>

              {/* Input fields */}
              <div className="mb-6">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <FileText className="h-3 w-3" /> {t("run_service.define_context")}
                </h2>
                <div className="space-y-3">
                  {inputFields.length > 0 ? inputFields.map((field: any, i: number) => (
                    <div key={i} className="group">
                      <label className="text-dense font-semibold text-muted-foreground mb-1.5 block">
                        {field.label || field.name || `Field ${i + 1}`}
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          value={inputs[field.name || `field_${i}`] || ""}
                          onChange={e => setInputs(prev => ({ ...prev, [field.name || `field_${i}`]: e.target.value }))}
                          placeholder={field.placeholder || ""}
                          rows={4}
                          className="w-full bg-card rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                        />
                      ) : (
                        <input
                          value={inputs[field.name || `field_${i}`] || ""}
                          onChange={e => setInputs(prev => ({ ...prev, [field.name || `field_${i}`]: e.target.value }))}
                          placeholder={field.placeholder || ""}
                          className="w-full bg-card rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      )}
                      {field.description && (
                        <p className="text-micro text-muted-foreground/60 mt-1.5 pl-1">{field.description}</p>
                      )}
                    </div>
                  )) : (
                    <textarea
                      value={inputs.context || ""}
                      onChange={e => setInputs({ context: e.target.value })}
                      placeholder={t("run_service.context_placeholder")}
                      rows={5}
                      className="w-full bg-card rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                    />
                  )}
                </div>
              </div>

              {/* Deliverables preview */}
              {deliverables.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" /> {t("run_service.deliverables_title")}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {deliverables.map((d: any, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-card border border-border">
                        <CheckCircle2 className="h-3.5 w-3.5 text-status-validated shrink-0" />
                        <span className="text-xs">{d.name || d.label || d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost + Access panel */}
              <div className="mb-6 rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                    <Coins className="h-3 w-3" /> {t("run_service.cost_preview")}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-micro text-muted-foreground mb-0.5">{t("run_service.service_cost")}</p>
                      <p className="text-2xl font-bold font-mono">{service.credits_cost}</p>
                      <p className="text-nano text-muted-foreground">NEURONS</p>
                    </div>
                    <div>
                      <p className="text-micro text-muted-foreground mb-0.5">{t("run_service.your_balance")}</p>
                      <p className="text-2xl font-bold font-mono">{creditBalance}</p>
                      <p className="text-nano text-muted-foreground">NEURONS</p>
                    </div>
                    <div>
                      <p className="text-micro text-muted-foreground mb-0.5">{t("run_service.after_run")}</p>
                      <p className={cn("text-2xl font-bold font-mono", hasEnoughCredits ? "text-status-validated" : "text-destructive")}>
                        {creditBalance - service.credits_cost}
                      </p>
                      <p className="text-nano text-muted-foreground">NEURONS</p>
                    </div>
                  </div>
                </div>

                {accessVerdict?.verdict === "PAYWALL" && (
                  <div className="p-4 bg-destructive/5 border-t border-destructive/10">
                    <InlineTopUp
                      needed={service.credits_cost}
                      balance={creditBalance}
                      compact
                    />
                  </div>
                )}
                {accessVerdict?.verdict === "ALLOW" && (
                  <div className="flex items-center gap-3 p-4 bg-status-validated/5 border-t border-status-validated/10">
                    <Shield className="h-5 w-5 text-status-validated shrink-0" />
                    <p className="text-xs text-status-validated font-medium">{t("run_service.access_verified")}</p>
                  </div>
                )}
              </div>

              {/* ROI Calculator */}
              {deliverables.length > 0 && (
                <div className="mb-6">
                  <ROICalculator
                    creditsCost={service.credits_cost}
                    deliverablesCount={deliverables.length}
                    serviceName={service.name}
                  />
                </div>
              )}

              {/* Tier gate */}
              {!hasTierAccess && (
                <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
                  <Crown className="h-5 w-5 text-amber-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t("run_service.subscription_required")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("run_service.subscription_desc", { tier: service.access_tier === "vip" ? "VIP" : "Pro" })}
                    </p>
                  </div>
                  <Button size="sm" className="text-xs gap-1 shrink-0" onClick={() => setPaywallOpen(true)}>
                    <Zap className="h-3 w-3" /> {t("run_service.upgrade")}
                  </Button>
                </div>
              )}

              {/* Run button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  onClick={hasTierAccess ? handleRun : () => setPaywallOpen(true)}
                  disabled={hasTierAccess && (!hasEnoughCredits || accessVerdict?.verdict === "DENY")}
                  className={cn(
                    "gap-2 h-12 text-sm font-semibold rounded-xl shadow-lg transition-shadow",
                    hasTierAccess ? "shadow-primary/20 hover:shadow-primary/30" : "shadow-amber-500/20"
                  )}
                  variant={hasTierAccess ? "default" : "secondary"}
                  size="lg"
                >
                  {hasTierAccess
                    ? (hasEnoughCredits ? <Play className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />)
                    : <Lock className="h-4 w-4" />}
                  {hasTierAccess
                    ? (hasEnoughCredits
                        ? t("run_service.run_button", { cost: service.credits_cost })
                        : "NEURONS Insuficienți")
                    : t("run_service.unlock_pro")}
                </Button>
                {hasTierAccess && !hasEnoughCredits && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 flex items-center gap-2 text-xs">
                    <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    <span>
                      Ai nevoie de <span className="font-mono font-bold">{service.credits_cost}</span> NEURONS.
                      Sold actual: <span className="font-mono font-bold">{creditBalance}</span>.
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 text-micro ml-auto shrink-0"
                      onClick={() => navigate("/credits")}
                    >
                      Cumpără NEURONS
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Execution pipeline */}
        <AnimatePresence>
          {(jobStatus === "creating" || jobStatus === "running") && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">{t("run_service.execution_pipeline")}</h2>
              <div className="space-y-1">
                {PIPELINE_STEPS.map((step, i) => {
                  const isDone = (i === 0 && jobStatus !== "creating") ||
                                 (i === 1 && jobStatus === "running") ||
                                 false;
                  const isActive = (i === 0 && jobStatus === "creating") ||
                                   (i === 2 && jobStatus === "running") ||
                                   false;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg transition-colors",
                        isActive && "bg-primary/5 border border-primary/10",
                        isDone && "opacity-60"
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5 text-status-validated shrink-0" />
                      ) : isActive ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-border shrink-0" />
                      )}
                      <span className={cn(
                        "text-sm",
                        isDone && "line-through text-muted-foreground",
                        isActive && "text-primary font-medium",
                        !isDone && !isActive && "text-muted-foreground"
                      )}>
                        {step.label}
                      </span>
                      {isActive && (
                        <span className="ml-auto text-micro text-primary/60 animate-pulse">{t("run_service.processing")}</span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {jobResult && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  {jobStatus === "completed" ? t("run_service.results_audited") : t("run_service.generating")}
                </h2>
                {jobStatus === "running" && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-micro text-primary">{t("run_service.live")}</span>
                  </div>
                )}
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 max-h-[500px] overflow-y-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground/90">{jobResult}</pre>
              </div>

              {jobStatus === "completed" && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap items-center gap-2 mt-4"
                  >
                    <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-lg" onClick={() => navigate("/jobs")}>
                      {t("run_service.view_all_jobs")}
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-lg" onClick={() => navigate("/credits")}>
                      <Coins className="h-3 w-3" /> {t("run_service.view_credits")}
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-lg" onClick={() => navigate("/library")}>
                      <FileText className="h-3 w-3" /> {t("run_service.view_in_library")}
                    </Button>
                    <Button variant="default" size="sm" className="text-xs gap-1.5 rounded-lg" onClick={() => {
                      setJobStatus("idle");
                      setJobResult("");
                      setJobId(null);
                      loadData();
                    }}>
                      <Play className="h-3 w-3" /> {t("run_service.run_again")}
                    </Button>
                  </motion.div>

                  {/* Post-execution loop — recommendations + distribution + psychology */}
                  {service && (
                    <>
                      {/* Full distribution panel — variants, platform sharing, tracking */}
                      {jobResult && (
                        <DistributionPanel
                          content={jobResult}
                          serviceKey={service.service_key}
                          serviceName={service.name}
                        />
                      )}

                      {/* Psychological overlay — savings, social proof */}
                      <PostExecutionPsychology
                        neuronsSpent={service.credits_cost}
                        serviceKey={service.service_key}
                      />

                      {/* Next actions — eliminates dead-ends */}
                      <PostExecutionRecommendations
                        serviceKey={service.service_key}
                        serviceCategory={service.category}
                        lastOutput={jobResult}
                        lastGoal={inputs["content"] || inputs["text"] || ""}
                        onChainService={(chainKey, prefill) => {
                          navigate(`/run/${chainKey}`, { state: { prefillInput: prefill.input, prefillGoal: prefill.goal } });
                        }}
                      />

                      {/* Upsell — monetization loop */}
                      <NeuronBundleUpsell
                        neuronsSpent={service.credits_cost}
                        currentBalance={creditBalance}
                      />
                    </>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Failed state */}
        {jobStatus === "failed" && !jobResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 flex items-center gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10"
          >
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">{t("run_service.job_failed")}</p>
              <p className="text-xs text-muted-foreground">{t("run_service.job_failed_desc")}</p>
            </div>
          </motion.div>
        )}
      </div>

      <PremiumPaywall
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        requiredTier={service?.access_tier}
        serviceName={service?.name}
      />
    </div>
  );
}
