import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { truncateForService, formatTruncationMessage } from "@/lib/contentTruncation";
import { trackInternalEvent, AnalyticsEvents } from "@/lib/internalAnalytics";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useUserTier } from "@/hooks/useUserTier";
import { tierSatisfied } from "@/components/premium/PremiumPaywall";
import { useTranslation } from "react-i18next";

export interface Service {
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

export type JobStatus = "idle" | "creating" | "running" | "completed" | "failed";

export interface AccessVerdict {
  verdict: "ALLOW" | "PAYWALL" | "DENY";
  reason: string;
  credits_cost?: number;
  balance?: number;
  deficit?: number;
}

const PIPELINE_ROUTES: Record<string, string> = {
  "market-research-full": "market-research-engine",
  "extraction-pipeline": "extraction-pipeline",
};

export function useRunService() {
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

  const inputFields = Array.isArray(service?.input_schema) ? service.input_schema : [];
  const deliverables = Array.isArray(service?.deliverables_schema) ? service.deliverables_schema : [];
  const canRun = jobStatus === "idle" || jobStatus === "failed";
  const hasEnoughCredits = creditBalance >= (service?.credits_cost ?? 0);
  const hasTierAccess = tierSatisfied(userTier, service?.access_tier || "free");

  const loadData = async () => {
    const serviceRes = await supabase.from("service_catalog").select("*").eq("service_key", serviceKey!).single();
    if (serviceRes.data) setService(serviceRes.data as Service);
    else { toast.error(t("run_service.service_not_found")); navigate("/services"); return; }

    const { data: accessData } = await supabase.rpc("check_access_logged", {
      _user_id: user!.id,
      _service_key: serviceKey!,
    });
    if (accessData) setAccessVerdict(accessData as unknown as AccessVerdict);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    loadData();
  }, [user, authLoading, serviceKey]);

  const handleRun = async () => {
    if (!service || !user) return;

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

      setJobStatus("completed");
      toast.success(t("run_service.job_completed"));
      trackEvent({ name: "service_executed", params: { service_key: service.service_key, job_id: jobId || undefined, credits_cost: service.credits_cost } });
      trackInternalEvent({ event: AnalyticsEvents.SERVICE_COMPLETED, params: { service_key: service.service_key, job_id: jobId, credits_cost: service.credits_cost } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error(msg);
      setJobStatus("failed");
    }
  };

  const resetJob = () => {
    setJobStatus("idle");
    setJobResult("");
    setJobId(null);
    loadData();
  };

  return {
    service, loading, authLoading, inputs, setInputs,
    jobStatus, jobResult, jobId, accessVerdict,
    paywallOpen, setPaywallOpen,
    selectedSourceId, setSelectedSourceId,
    inputFields, deliverables, canRun, hasEnoughCredits, hasTierAccess,
    creditBalance, userTier,
    handleRun, resetJob, navigate, t,
  };
}
