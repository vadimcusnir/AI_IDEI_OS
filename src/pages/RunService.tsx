import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { trackInternalEvent, AnalyticsEvents } from "@/lib/internalAnalytics";
import { ServiceJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import logo from "@/assets/logo.gif";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Loader2, Sparkles, Play, CheckCircle2,
  Clock, AlertCircle, Coins, Lock, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
}

interface UserCredits {
  balance: number;
  total_spent: number;
}

type JobStatus = "idle" | "creating" | "running" | "completed" | "failed";

interface AccessVerdict {
  verdict: "ALLOW" | "PAYWALL" | "DENY";
  reason: string;
  credits_cost?: number;
  balance?: number;
  deficit?: number;
}

export default function RunService() {
  const { serviceKey } = useParams<{ serviceKey: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [jobResult, setJobResult] = useState<string>("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [accessVerdict, setAccessVerdict] = useState<AccessVerdict | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    loadData();
  }, [user, authLoading, serviceKey]);

  const loadData = async () => {
    const [serviceRes, creditsRes] = await Promise.all([
      supabase.from("service_catalog").select("*").eq("service_key", serviceKey!).single(),
      supabase.from("user_credits").select("balance, total_spent").eq("user_id", user!.id).maybeSingle(),
    ]);

    if (serviceRes.data) setService(serviceRes.data as Service);
    else { toast.error("Service not found"); navigate("/services"); return; }

    if (creditsRes.data) {
      setCredits(creditsRes.data as UserCredits);
    } else {
      await supabase.from("user_credits").insert({ user_id: user!.id, balance: 500, total_earned: 500, total_spent: 0 } as any);
      setCredits({ balance: 500, total_spent: 0 });
    }
    setLoading(false);
  };

  const handleRun = async () => {
    if (!service || !user || !credits) return;

    if (credits.balance < service.credits_cost) {
      toast.error(`Insufficient credits. Need ${service.credits_cost}, have ${credits.balance}.`);
      return;
    }

    setJobStatus("creating");

    try {
      // Create neuron for results
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

      // Create job
      const { data: job, error: jobErr } = await supabase
        .from("neuron_jobs")
        .insert({
          neuron_id: neuron.id,
          author_id: user.id,
          worker_type: service.service_key,
          status: "pending",
          input: inputs,
        } as any)
        .select("id")
        .single();

      if (jobErr || !job) throw new Error("Failed to create job");
      setJobId(job.id);
      setJobStatus("running");

      // Call server-side job runner (handles credit reservation + AI + auditing)
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-service`,
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
            inputs,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Service error" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      // Stream SSE response
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

      // Refresh credits (server already deducted)
      const { data: updatedCredits } = await supabase
        .from("user_credits")
        .select("balance, total_spent")
        .eq("user_id", user.id)
        .single();
      if (updatedCredits) setCredits(updatedCredits as UserCredits);

      setJobStatus("completed");
      toast.success("Job completed — results audited and saved");
      trackEvent({ name: "service_executed", params: { service_key: service.service_key, job_id: jobId || undefined, credits_cost: service.credits_cost } });
      trackInternalEvent({ event: AnalyticsEvents.SERVICE_COMPLETED, params: { service_key: service.service_key, job_id: jobId, credits_cost: service.credits_cost } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error(msg);
      setJobStatus("failed");

      // Refresh credits (may have been released server-side)
      const { data: updatedCredits } = await supabase
        .from("user_credits")
        .select("balance, total_spent")
        .eq("user_id", user.id)
        .single();
      if (updatedCredits) setCredits(updatedCredits as UserCredits);
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
  const hasEnoughCredits = credits && credits.balance >= service.credits_cost;

  return (
    <div className="flex-1">
      <SEOHead title={`${service?.name || "Service"} — AI-IDEI`} description={service?.description || "Run AI-powered knowledge service."} />
      {service && (
        <>
          <ServiceJsonLd service={service} />
          <BreadcrumbJsonLd items={[
            { name: "Services", url: "https://ai-idei.com/services" },
            { name: service.name, url: `https://ai-idei.com/services/${service.service_key}` },
          ]} />
        </>
      )}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Service header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl font-serif">{service.name}</h1>
            <span className="text-[9px] uppercase tracking-wider bg-ai-accent/10 text-ai-accent px-1.5 py-0.5 rounded font-semibold">
              Class {service.service_class}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{service.description}</p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-ai-accent" />
              <span className="text-sm font-bold">{service.credits_cost}</span>
              <span className="text-[10px] text-muted-foreground">credits</span>
            </div>
            {deliverables.length > 0 && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-status-validated" />
                <span className="text-[10px] text-muted-foreground">{deliverables.length} deliverables</span>
              </div>
            )}
          </div>
        </div>

        {/* Input form */}
        {inputFields.length > 0 && canRun && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Define Context</h2>
            <div className="space-y-3">
              {inputFields.map((field: any, i: number) => (
                <div key={i}>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    {field.label || field.name || `Field ${i + 1}`}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={inputs[field.name || `field_${i}`] || ""}
                      onChange={e => setInputs(prev => ({ ...prev, [field.name || `field_${i}`]: e.target.value }))}
                      placeholder={field.placeholder || ""}
                      rows={4}
                      className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors resize-none"
                    />
                  ) : (
                    <input
                      value={inputs[field.name || `field_${i}`] || ""}
                      onChange={e => setInputs(prev => ({ ...prev, [field.name || `field_${i}`]: e.target.value }))}
                      placeholder={field.placeholder || ""}
                      className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors"
                    />
                  )}
                  {field.description && (
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{field.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {inputFields.length === 0 && canRun && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Context</h2>
            <textarea
              value={inputs.context || ""}
              onChange={e => setInputs({ context: e.target.value })}
              placeholder="Describe what you want to analyze or produce..."
              rows={4}
              className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors resize-none"
            />
          </div>
        )}

        {deliverables.length > 0 && canRun && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">What You'll Receive</h2>
            <div className="space-y-1.5">
              {deliverables.map((d: any, i: number) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30">
                  <CheckCircle2 className="h-3.5 w-3.5 text-status-validated shrink-0" />
                  <span className="text-xs">{d.name || d.label || d}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {canRun && (
          <div className="flex items-center gap-3">
            <Button onClick={handleRun} disabled={!hasEnoughCredits} className="gap-2" size="lg">
              <Play className="h-4 w-4" />
              Run Job — {service.credits_cost} credits
            </Button>
            {!hasEnoughCredits && (
              <div className="flex items-center gap-1.5 text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="text-xs">Insufficient credits</span>
              </div>
            )}
          </div>
        )}

        {/* Execution timeline */}
        {(jobStatus === "creating" || jobStatus === "running") && (
          <div className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Execution Pipeline</h2>
            <div className="space-y-3">
              {[
                { label: "Creating job", done: jobStatus !== "creating" },
                { label: "Reserving credits (server)", done: jobStatus === "running" },
                { label: "Executing AI pipeline", done: false, active: jobStatus === "running" },
                { label: "Auditing & saving results", done: false },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 text-status-validated shrink-0" />
                  ) : step.active ? (
                    <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-border shrink-0" />
                  )}
                  <span className={cn("text-sm", step.done ? "text-foreground" : step.active ? "text-primary font-medium" : "text-muted-foreground")}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {jobResult && (
          <div className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {jobStatus === "completed" ? "Results (Audited)" : "Generating..."}
            </h2>
            <div className="bg-card border border-border rounded-xl p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed">{jobResult}</pre>
            </div>
            {jobStatus === "completed" && (
              <div className="flex items-center gap-2 mt-3">
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate("/jobs")}>
                  View All Jobs
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate("/credits")}>
                  <Coins className="h-3 w-3" /> View Credits
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => {
                  setJobStatus("idle");
                  setJobResult("");
                  setJobId(null);
                  loadData();
                }}>
                  Run Again
                </Button>
              </div>
            )}
          </div>
        )}

        {jobStatus === "failed" && !jobResult && (
          <div className="mt-8 flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Job failed. Credits released if reserved. Try again.</span>
          </div>
        )}
      </div>
    </div>
  );
}
