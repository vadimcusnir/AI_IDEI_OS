/**
 * ServiceBuilderTab — 12-section canonical service template builder.
 * Multi-step wizard for creating/editing services with live compliance validation.
 */
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { CheckCircle, Circle, AlertTriangle, Loader2, ChevronLeft, ChevronRight, Shield, Coins, BarChart3, Lock, Zap, FileCheck, RefreshCw, Key, Link2, Eye, ClipboardCheck, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplianceResult {
  service_key: string;
  compliance_score: number;
  completed: number;
  total: number;
  sections: { key: string; label: string; completed: boolean; issues: string[] }[];
  issues: { section: string; label: string; issue: string; severity: string }[];
}

const STEPS = [
  { key: "manifest", label: "Manifest", icon: FileCheck, desc: "Service identity, I/O schema, pipeline class" },
  { key: "economic", label: "Economy", icon: Coins, desc: "Pricing, tiers, refund policy" },
  { key: "verdict", label: "Verdict", icon: BarChart3, desc: "Scoring dimensions, pass thresholds" },
  { key: "access", label: "Access", icon: Lock, desc: "Tier requirements, daily limits" },
  { key: "pipeline", label: "Pipeline", icon: Zap, desc: "Execution steps (min 3)" },
  { key: "qa", label: "QA", icon: ClipboardCheck, desc: "Quality checks, regeneration" },
  { key: "security", label: "Security", icon: Shield, desc: "Sanitization, PII, audit" },
  { key: "retry", label: "Retry", icon: RefreshCw, desc: "Retries, fallback, timeout" },
  { key: "prompt", label: "Prompt Vault", icon: Key, desc: "Execution prompt binding" },
  { key: "dependencies", label: "Dependencies", icon: Link2, desc: "Required sub-services" },
  { key: "preview", label: "Preview", icon: Eye, desc: "Preview configuration" },
  { key: "audit", label: "Audit", icon: ClipboardCheck, desc: "Audit trail settings" },
] as const;

export function ServiceBuilderTab() {
  const [serviceKey, setServiceKey] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [compliance, setCompliance] = useState<ComplianceResult | null>(null);
  const [serviceKeys, setServiceKeys] = useState<string[]>([]);

  // Form states for each section
  const [manifest, setManifest] = useState({ pipeline_class: "atomic", input_schema: "{}", output_schema: "{}", pipeline_steps: "[]", estimated_duration_seconds: 30, base_neurons: 100, retry_attempts: 2, confidence_threshold: 0.7, preview_enabled: false, preview_limit_pct: 20 });
  const [economic, setEconomic] = useState({ base_neurons: 100, tier_multipliers: '{"starter":1,"pro":0.85,"vip":0.7,"enterprise":0.5}', margin_target: 0.3, refund_policy: "full_on_failure", revenue_split_pct: 0, currency_model: "neurons" });
  const [verdict, setVerdict] = useState({ scoring_dimensions: "[]", minimum_pass_score: 60, auto_approve_threshold: 80, human_review_required: false });
  const [access, setAccess] = useState({ min_tier: "starter", cooldown_seconds: 0, max_daily_uses: 100, requires_kyc: false });
  const [qa, setQa] = useState({ qa_checks: "[]", min_word_count: 100, plagiarism_check: false, tone_check: false, auto_regenerate_on_fail: false, max_regenerations: 1 });
  const [security, setSecurity] = useState({ input_sanitization_level: "strict", output_filtering: true, prompt_injection_guard: true, pii_detection: false, audit_log_required: true });
  const [retry, setRetry] = useState({ max_retries: 2, retry_delay_ms: 1000, fallback_model: "", fallback_service_key: "", timeout_seconds: 120, circuit_breaker_threshold: 5 });

  // Load existing service keys
  useEffect(() => {
    supabase.from("service_manifests").select("service_key").then(({ data }) => {
      if (data) setServiceKeys(data.map((d: any) => d.service_key));
    });
  }, []);

  // Load existing data when service key is selected
  const loadServiceData = useCallback(async (key: string) => {
    if (!key) return;
    setLoading(true);
    const [mRes, eRes, vRes, aRes, qRes, sRes, rRes] = await Promise.all([
      supabase.from("service_manifests").select("*").eq("service_key", key).maybeSingle(),
      supabase.from("service_economic_contracts").select("*").eq("service_key", key).maybeSingle(),
      supabase.from("service_verdict_configs").select("*").eq("service_key", key).maybeSingle(),
      supabase.from("service_access_rules").select("*").eq("service_key", key).maybeSingle(),
      supabase.from("service_qa_configs").select("*").eq("service_key", key).maybeSingle(),
      supabase.from("service_security_policies").select("*").eq("service_key", key).maybeSingle(),
      supabase.from("service_retry_configs").select("*").eq("service_key", key).maybeSingle(),
    ]);
    if (mRes.data) {
      const m = mRes.data as any;
      setManifest({ pipeline_class: m.pipeline_class || "atomic", input_schema: JSON.stringify(m.input_schema || {}, null, 2), output_schema: JSON.stringify(m.output_schema || {}, null, 2), pipeline_steps: JSON.stringify(m.pipeline_steps || [], null, 2), estimated_duration_seconds: m.estimated_duration_seconds || 30, base_neurons: m.base_neurons || 100, retry_attempts: m.retry_attempts || 2, confidence_threshold: m.confidence_threshold || 0.7, preview_enabled: m.preview_enabled || false, preview_limit_pct: m.preview_limit_pct || 20 });
    }
    if (eRes.data) {
      const e = eRes.data as any;
      setEconomic({ base_neurons: e.base_neurons, tier_multipliers: JSON.stringify(e.tier_multipliers, null, 2), margin_target: e.margin_target, refund_policy: e.refund_policy, revenue_split_pct: e.revenue_split_pct, currency_model: e.currency_model });
    }
    if (vRes.data) {
      const v = vRes.data as any;
      setVerdict({ scoring_dimensions: JSON.stringify(v.scoring_dimensions, null, 2), minimum_pass_score: v.minimum_pass_score, auto_approve_threshold: v.auto_approve_threshold, human_review_required: v.human_review_required });
    }
    if (aRes.data) {
      const a = aRes.data as any;
      setAccess({ min_tier: a.min_tier, cooldown_seconds: a.cooldown_seconds, max_daily_uses: a.max_daily_uses, requires_kyc: a.requires_kyc });
    }
    if (qRes.data) {
      const q = qRes.data as any;
      setQa({ qa_checks: JSON.stringify(q.qa_checks, null, 2), min_word_count: q.min_word_count, plagiarism_check: q.plagiarism_check, tone_check: q.tone_check, auto_regenerate_on_fail: q.auto_regenerate_on_fail, max_regenerations: q.max_regenerations });
    }
    if (sRes.data) {
      const s = sRes.data as any;
      setSecurity({ input_sanitization_level: s.input_sanitization_level, output_filtering: s.output_filtering, prompt_injection_guard: s.prompt_injection_guard, pii_detection: s.pii_detection, audit_log_required: s.audit_log_required });
    }
    if (rRes.data) {
      const r = rRes.data as any;
      setRetry({ max_retries: r.max_retries, retry_delay_ms: r.retry_delay_ms, fallback_model: r.fallback_model || "", fallback_service_key: r.fallback_service_key || "", timeout_seconds: r.timeout_seconds, circuit_breaker_threshold: r.circuit_breaker_threshold });
    }
    setLoading(false);
  }, []);

  const saveCurrentStep = useCallback(async () => {
    if (!serviceKey) { toast.error("Enter a service key first"); return; }
    setLoading(true);
    try {
      const step = STEPS[activeStep].key;
      let error: any;

      if (step === "manifest") {
        const payload = { service_key: serviceKey, pipeline_class: manifest.pipeline_class, input_schema: JSON.parse(manifest.input_schema), output_schema: JSON.parse(manifest.output_schema), pipeline_steps: JSON.parse(manifest.pipeline_steps), estimated_duration_seconds: manifest.estimated_duration_seconds, base_neurons: manifest.base_neurons, retry_attempts: manifest.retry_attempts, confidence_threshold: manifest.confidence_threshold, preview_enabled: manifest.preview_enabled, preview_limit_pct: manifest.preview_limit_pct };
        ({ error } = await supabase.from("service_manifests").upsert(payload, { onConflict: "service_key" }));
      } else if (step === "economic") {
        ({ error } = await supabase.from("service_economic_contracts").upsert({ service_key: serviceKey, base_neurons: economic.base_neurons, tier_multipliers: JSON.parse(economic.tier_multipliers), margin_target: economic.margin_target, refund_policy: economic.refund_policy, revenue_split_pct: economic.revenue_split_pct, currency_model: economic.currency_model }, { onConflict: "service_key" }));
      } else if (step === "verdict") {
        ({ error } = await supabase.from("service_verdict_configs").upsert({ service_key: serviceKey, scoring_dimensions: JSON.parse(verdict.scoring_dimensions), minimum_pass_score: verdict.minimum_pass_score, auto_approve_threshold: verdict.auto_approve_threshold, human_review_required: verdict.human_review_required }, { onConflict: "service_key" }));
      } else if (step === "access") {
        ({ error } = await supabase.from("service_access_rules").upsert({ service_key: serviceKey, min_tier: access.min_tier, cooldown_seconds: access.cooldown_seconds, max_daily_uses: access.max_daily_uses, requires_kyc: access.requires_kyc }, { onConflict: "service_key" }));
      } else if (step === "qa") {
        ({ error } = await supabase.from("service_qa_configs").upsert({ service_key: serviceKey, qa_checks: JSON.parse(qa.qa_checks), min_word_count: qa.min_word_count, plagiarism_check: qa.plagiarism_check, tone_check: qa.tone_check, auto_regenerate_on_fail: qa.auto_regenerate_on_fail, max_regenerations: qa.max_regenerations }, { onConflict: "service_key" }));
      } else if (step === "security") {
        ({ error } = await supabase.from("service_security_policies").upsert({ service_key: serviceKey, ...security }, { onConflict: "service_key" }));
      } else if (step === "retry") {
        ({ error } = await supabase.from("service_retry_configs").upsert({ service_key: serviceKey, max_retries: retry.max_retries, retry_delay_ms: retry.retry_delay_ms, fallback_model: retry.fallback_model || null, fallback_service_key: retry.fallback_service_key || null, timeout_seconds: retry.timeout_seconds, circuit_breaker_threshold: retry.circuit_breaker_threshold }, { onConflict: "service_key" }));
      } else {
        toast.info(`Step "${STEPS[activeStep].label}" — no additional data to save`);
        setLoading(false);
        return;
      }

      if (error) throw error;
      toast.success(`${STEPS[activeStep].label} saved`);
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
    setLoading(false);
  }, [serviceKey, activeStep, manifest, economic, verdict, access, qa, security, retry]);

  const runValidation = useCallback(async () => {
    if (!serviceKey) return;
    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-service-template", { body: { service_key: serviceKey } });
      if (error) throw error;
      setCompliance(data as ComplianceResult);
      toast.success(`Compliance: ${data.compliance_score}%`);
    } catch (e: any) {
      toast.error(e.message || "Validation failed");
    }
    setValidating(false);
  }, [serviceKey]);

  const renderStepContent = () => {
    const step = STEPS[activeStep].key;

    if (step === "manifest") return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Pipeline Class</Label><Select value={manifest.pipeline_class} onValueChange={v => setManifest(p => ({ ...p, pipeline_class: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="atomic">Atomic (L3)</SelectItem><SelectItem value="cluster">Cluster (L2)</SelectItem><SelectItem value="master">Master (L1)</SelectItem></SelectContent></Select></div>
          <div><Label>Base Neurons</Label><Input type="number" value={manifest.base_neurons} onChange={e => setManifest(p => ({ ...p, base_neurons: +e.target.value }))} /></div>
          <div><Label>Duration (sec)</Label><Input type="number" value={manifest.estimated_duration_seconds} onChange={e => setManifest(p => ({ ...p, estimated_duration_seconds: +e.target.value }))} /></div>
          <div><Label>Confidence Threshold</Label><Input type="number" step="0.1" value={manifest.confidence_threshold} onChange={e => setManifest(p => ({ ...p, confidence_threshold: +e.target.value }))} /></div>
        </div>
        <div><Label>Input Schema (JSON)</Label><Textarea rows={4} className="font-mono text-xs" value={manifest.input_schema} onChange={e => setManifest(p => ({ ...p, input_schema: e.target.value }))} /></div>
        <div><Label>Output Schema (JSON)</Label><Textarea rows={4} className="font-mono text-xs" value={manifest.output_schema} onChange={e => setManifest(p => ({ ...p, output_schema: e.target.value }))} /></div>
        <div><Label>Pipeline Steps (JSON array)</Label><Textarea rows={4} className="font-mono text-xs" value={manifest.pipeline_steps} onChange={e => setManifest(p => ({ ...p, pipeline_steps: e.target.value }))} /></div>
      </div>
    );

    if (step === "economic") return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Base Neurons</Label><Input type="number" value={economic.base_neurons} onChange={e => setEconomic(p => ({ ...p, base_neurons: +e.target.value }))} /></div>
          <div><Label>Margin Target</Label><Input type="number" step="0.05" value={economic.margin_target} onChange={e => setEconomic(p => ({ ...p, margin_target: +e.target.value }))} /></div>
          <div><Label>Currency Model</Label><Select value={economic.currency_model} onValueChange={v => setEconomic(p => ({ ...p, currency_model: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="neurons">Neurons</SelectItem><SelectItem value="usd">USD</SelectItem><SelectItem value="dual">Dual</SelectItem></SelectContent></Select></div>
          <div><Label>Refund Policy</Label><Select value={economic.refund_policy} onValueChange={v => setEconomic(p => ({ ...p, refund_policy: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="full_on_failure">Full on Failure</SelectItem><SelectItem value="partial">Partial</SelectItem><SelectItem value="none">None</SelectItem></SelectContent></Select></div>
          <div><Label>Revenue Split %</Label><Input type="number" step="1" value={economic.revenue_split_pct} onChange={e => setEconomic(p => ({ ...p, revenue_split_pct: +e.target.value }))} /></div>
        </div>
        <div><Label>Tier Multipliers (JSON)</Label><Textarea rows={4} className="font-mono text-xs" value={economic.tier_multipliers} onChange={e => setEconomic(p => ({ ...p, tier_multipliers: e.target.value }))} /></div>
      </div>
    );

    if (step === "verdict") return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Min Pass Score</Label><Input type="number" value={verdict.minimum_pass_score} onChange={e => setVerdict(p => ({ ...p, minimum_pass_score: +e.target.value }))} /></div>
          <div><Label>Auto-Approve Threshold</Label><Input type="number" value={verdict.auto_approve_threshold} onChange={e => setVerdict(p => ({ ...p, auto_approve_threshold: +e.target.value }))} /></div>
        </div>
        <div className="flex items-center gap-2"><Switch checked={verdict.human_review_required} onCheckedChange={v => setVerdict(p => ({ ...p, human_review_required: v }))} /><Label>Human Review Required</Label></div>
        <div><Label>Scoring Dimensions (JSON)</Label><Textarea rows={6} className="font-mono text-xs" value={verdict.scoring_dimensions} onChange={e => setVerdict(p => ({ ...p, scoring_dimensions: e.target.value }))} placeholder='[{"dimension":"accuracy","weight":0.4},{"dimension":"completeness","weight":0.3}]' /></div>
      </div>
    );

    if (step === "access") return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Min Tier</Label><Select value={access.min_tier} onValueChange={v => setAccess(p => ({ ...p, min_tier: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="starter">Starter</SelectItem><SelectItem value="pro">Pro</SelectItem><SelectItem value="vip">VIP</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem></SelectContent></Select></div>
          <div><Label>Max Daily Uses</Label><Input type="number" value={access.max_daily_uses} onChange={e => setAccess(p => ({ ...p, max_daily_uses: +e.target.value }))} /></div>
          <div><Label>Cooldown (sec)</Label><Input type="number" value={access.cooldown_seconds} onChange={e => setAccess(p => ({ ...p, cooldown_seconds: +e.target.value }))} /></div>
        </div>
        <div className="flex items-center gap-2"><Switch checked={access.requires_kyc} onCheckedChange={v => setAccess(p => ({ ...p, requires_kyc: v }))} /><Label>Requires KYC</Label></div>
      </div>
    );

    if (step === "pipeline") return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Pipeline steps are defined in the Manifest section. Navigate to Step 1 to edit them.</p>
        <div><Label>Current Pipeline Steps</Label><Textarea rows={8} className="font-mono text-xs" readOnly value={manifest.pipeline_steps} /></div>
      </div>
    );

    if (step === "qa") return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Min Word Count</Label><Input type="number" value={qa.min_word_count} onChange={e => setQa(p => ({ ...p, min_word_count: +e.target.value }))} /></div>
          <div><Label>Max Regenerations</Label><Input type="number" value={qa.max_regenerations} onChange={e => setQa(p => ({ ...p, max_regenerations: +e.target.value }))} /></div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2"><Switch checked={qa.plagiarism_check} onCheckedChange={v => setQa(p => ({ ...p, plagiarism_check: v }))} /><Label>Plagiarism Check</Label></div>
          <div className="flex items-center gap-2"><Switch checked={qa.tone_check} onCheckedChange={v => setQa(p => ({ ...p, tone_check: v }))} /><Label>Tone Check</Label></div>
          <div className="flex items-center gap-2"><Switch checked={qa.auto_regenerate_on_fail} onCheckedChange={v => setQa(p => ({ ...p, auto_regenerate_on_fail: v }))} /><Label>Auto-Regenerate on Fail</Label></div>
        </div>
        <div><Label>QA Checks (JSON)</Label><Textarea rows={6} className="font-mono text-xs" value={qa.qa_checks} onChange={e => setQa(p => ({ ...p, qa_checks: e.target.value }))} placeholder='[{"check":"word_count","min":100},{"check":"has_headers","required":true}]' /></div>
      </div>
    );

    if (step === "security") return (
      <div className="space-y-4">
        <div><Label>Input Sanitization</Label><Select value={security.input_sanitization_level} onValueChange={v => setSecurity(p => ({ ...p, input_sanitization_level: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="strict">Strict</SelectItem><SelectItem value="moderate">Moderate</SelectItem><SelectItem value="relaxed">Relaxed</SelectItem></SelectContent></Select></div>
        <div className="space-y-2">
          <div className="flex items-center gap-2"><Switch checked={security.output_filtering} onCheckedChange={v => setSecurity(p => ({ ...p, output_filtering: v }))} /><Label>Output Filtering</Label></div>
          <div className="flex items-center gap-2"><Switch checked={security.prompt_injection_guard} onCheckedChange={v => setSecurity(p => ({ ...p, prompt_injection_guard: v }))} /><Label>Prompt Injection Guard</Label></div>
          <div className="flex items-center gap-2"><Switch checked={security.pii_detection} onCheckedChange={v => setSecurity(p => ({ ...p, pii_detection: v }))} /><Label>PII Detection</Label></div>
          <div className="flex items-center gap-2"><Switch checked={security.audit_log_required} onCheckedChange={v => setSecurity(p => ({ ...p, audit_log_required: v }))} /><Label>Audit Log Required</Label></div>
        </div>
      </div>
    );

    if (step === "retry") return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Max Retries</Label><Input type="number" value={retry.max_retries} onChange={e => setRetry(p => ({ ...p, max_retries: +e.target.value }))} /></div>
          <div><Label>Retry Delay (ms)</Label><Input type="number" value={retry.retry_delay_ms} onChange={e => setRetry(p => ({ ...p, retry_delay_ms: +e.target.value }))} /></div>
          <div><Label>Timeout (sec)</Label><Input type="number" value={retry.timeout_seconds} onChange={e => setRetry(p => ({ ...p, timeout_seconds: +e.target.value }))} /></div>
          <div><Label>Circuit Breaker</Label><Input type="number" value={retry.circuit_breaker_threshold} onChange={e => setRetry(p => ({ ...p, circuit_breaker_threshold: +e.target.value }))} /></div>
        </div>
        <div><Label>Fallback Model</Label><Input value={retry.fallback_model} onChange={e => setRetry(p => ({ ...p, fallback_model: e.target.value }))} placeholder="e.g. google/gemini-2.5-flash-lite" /></div>
        <div><Label>Fallback Service Key</Label><Input value={retry.fallback_service_key} onChange={e => setRetry(p => ({ ...p, fallback_service_key: e.target.value }))} placeholder="e.g. tone-of-voice-basic" /></div>
      </div>
    );

    if (step === "prompt") return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Execution prompts are managed in the Prompts tab. Ensure a prompt with this service key exists in the execution_prompts table.</p>
        <Button variant="outline" onClick={() => window.dispatchEvent(new CustomEvent("admin-tab-change", { detail: "prompts" }))}>Go to Prompts Tab</Button>
      </div>
    );

    if (step === "dependencies") return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Dependencies are defined in the Manifest's "dependencies" field. L3 atomic services typically have no dependencies. L2/L1 services reference their component service keys.</p>
      </div>
    );

    if (step === "preview") return (
      <div className="space-y-4">
        <div className="flex items-center gap-2"><Switch checked={manifest.preview_enabled} onCheckedChange={v => setManifest(p => ({ ...p, preview_enabled: v }))} /><Label>Enable Preview</Label></div>
        <div><Label>Preview Limit %</Label><Input type="number" min={5} max={50} value={manifest.preview_limit_pct} onChange={e => setManifest(p => ({ ...p, preview_limit_pct: +e.target.value }))} /></div>
      </div>
    );

    if (step === "audit") return (
      <div className="space-y-4">
        <div className="flex items-center gap-2"><Switch checked={security.audit_log_required} onCheckedChange={v => setSecurity(p => ({ ...p, audit_log_required: v }))} /><Label>Audit Logging Required</Label></div>
        <p className="text-sm text-muted-foreground">When enabled, all executions of this service are logged to the audit trail with input/output hashes.</p>
      </div>
    );

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Service key selector */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Service Key</Label>
              <div className="flex gap-2 mt-1">
                <Input value={serviceKey} onChange={e => setServiceKey(e.target.value)} placeholder="e.g. tone-of-voice-analyzer" className="font-mono text-sm" />
                <Button variant="outline" size="sm" onClick={() => loadServiceData(serviceKey)} disabled={!serviceKey || loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Load
                </Button>
                <Button size="sm" onClick={runValidation} disabled={!serviceKey || validating} className="gap-1">
                  {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                  Validate
                </Button>
              </div>
              {serviceKeys.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {serviceKeys.slice(0, 10).map(k => (
                    <Badge key={k} variant="outline" className="cursor-pointer text-xs hover:bg-primary/10" onClick={() => { setServiceKey(k); loadServiceData(k); }}>
                      {k}
                    </Badge>
                  ))}
                  {serviceKeys.length > 10 && <Badge variant="outline" className="text-xs">+{serviceKeys.length - 10} more</Badge>}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance bar */}
      {compliance && (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Compliance Score</span>
              <Badge variant={compliance.compliance_score >= 80 ? "default" : compliance.compliance_score >= 50 ? "secondary" : "destructive"}>
                {compliance.compliance_score}% ({compliance.completed}/{compliance.total})
              </Badge>
            </div>
            <Progress value={compliance.compliance_score} className="h-2" />
            {compliance.issues.length > 0 && (
              <div className="mt-3 space-y-1">
                {compliance.issues.slice(0, 5).map((issue, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <AlertTriangle className={cn("h-3 w-3 shrink-0", issue.severity === "critical" ? "text-destructive" : "text-warning")} />
                    <span className="text-muted-foreground">{issue.label}:</span>
                    <span>{issue.issue}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Step sidebar */}
        <div className="col-span-3">
          <ScrollArea className="h-[500px]">
            <div className="space-y-1 pr-2">
              {STEPS.map((step, i) => {
                const sectionCompliance = compliance?.sections.find(s => s.key === step.key || (step.key === "economic" && s.key === "economic_contract") || (step.key === "security" && s.key === "security_policy") || (step.key === "retry" && s.key === "retry_config") || (step.key === "prompt" && s.key === "prompt_vault") || (step.key === "preview" && s.key === "preview_config") || (step.key === "audit" && s.key === "audit_trail"));
                const isCompleted = sectionCompliance?.completed;
                return (
                  <button key={step.key} onClick={() => setActiveStep(i)} className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-all", activeStep === i ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-muted/50")}>
                    {isCompleted === true ? <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" /> : isCompleted === false ? <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
                    <div className="min-w-0">
                      <div className="font-medium">{step.label}</div>
                      <div className="text-[10px] text-muted-foreground/60 truncate">{step.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Step content */}
        <div className="col-span-9">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {(() => { const StepIcon = STEPS[activeStep].icon; return <StepIcon className="h-4 w-4" />; })()}
                {STEPS[activeStep].label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderStepContent()}
              <div className="flex items-center justify-between pt-4 border-t border-border/30">
                <Button variant="outline" size="sm" disabled={activeStep === 0} onClick={() => setActiveStep(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button size="sm" onClick={saveCurrentStep} disabled={loading || !serviceKey}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Save Step
                </Button>
                <Button variant="outline" size="sm" disabled={activeStep === STEPS.length - 1} onClick={() => setActiveStep(p => p + 1)}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
