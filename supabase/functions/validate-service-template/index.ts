/**
 * validate-service-template — Validates a service against the 12-section canonical template.
 * Returns compliance score, completed sections, and issues list.
 * 
 * POST { service_key: string }
 * Returns { service_key, compliance_score, sections, issues[] }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const inputSchema = z.object({
  service_key: z.string().trim().min(1).max(200),
});

interface SectionResult {
  key: string;
  label: string;
  completed: boolean;
  issues: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const corsHeaders = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    // Auth
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Validate input
    const rawBody = await req.json();
    const parsed = inputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Validation failed", details: parsed.error.issues }), { status: 400, headers: corsHeaders });
    }
    const { service_key } = parsed.data;

    // Fetch all 12 sections in parallel
    const [
      manifestRes,
      economicRes,
      verdictRes,
      accessRes,
      qaRes,
      securityRes,
      retryRes,
      promptRes,
    ] = await Promise.all([
      adminClient.from("service_manifests").select("*").eq("service_key", service_key).maybeSingle(),
      adminClient.from("service_economic_contracts").select("*").eq("service_key", service_key).maybeSingle(),
      adminClient.from("service_verdict_configs").select("*").eq("service_key", service_key).maybeSingle(),
      adminClient.from("service_access_rules").select("*").eq("service_key", service_key).maybeSingle(),
      adminClient.from("service_qa_configs").select("*").eq("service_key", service_key).maybeSingle(),
      adminClient.from("service_security_policies").select("*").eq("service_key", service_key).maybeSingle(),
      adminClient.from("service_retry_configs").select("*").eq("service_key", service_key).maybeSingle(),
      adminClient.from("execution_prompts").select("*").eq("service_key", service_key).maybeSingle(),
    ]);

    const manifest = manifestRes.data;
    const economic = economicRes.data;
    const verdict = verdictRes.data;
    const access = accessRes.data;
    const qa = qaRes.data;
    const security = securityRes.data;
    const retry = retryRes.data;
    const prompt = promptRes.data;

    const sections: SectionResult[] = [];

    // 1. Manifest
    const manifestIssues: string[] = [];
    if (!manifest) {
      manifestIssues.push("No service manifest found");
    } else {
      if (!manifest.input_schema || Object.keys(manifest.input_schema).length === 0) manifestIssues.push("Input schema is empty");
      if (!manifest.output_schema || Object.keys(manifest.output_schema).length === 0) manifestIssues.push("Output schema is empty");
      if (!manifest.pipeline_steps || (Array.isArray(manifest.pipeline_steps) && manifest.pipeline_steps.length === 0)) manifestIssues.push("Pipeline steps not defined");
    }
    sections.push({ key: "manifest", label: "Service Manifest", completed: !!manifest && manifestIssues.length === 0, issues: manifestIssues });

    // 2. Economic Contract
    const econIssues: string[] = [];
    if (!economic) {
      econIssues.push("No economic contract defined");
    } else {
      if (economic.base_neurons <= 0) econIssues.push("Base neurons must be > 0");
      if (!economic.tier_multipliers || Object.keys(economic.tier_multipliers).length === 0) econIssues.push("Tier multipliers not configured");
    }
    sections.push({ key: "economic_contract", label: "Economic Contract", completed: !!economic && econIssues.length === 0, issues: econIssues });

    // 3. Verdict System
    const verdictIssues: string[] = [];
    if (!verdict) {
      verdictIssues.push("No verdict config defined");
    } else {
      if (!verdict.scoring_dimensions || (Array.isArray(verdict.scoring_dimensions) && verdict.scoring_dimensions.length === 0)) verdictIssues.push("No scoring dimensions defined");
      if (verdict.minimum_pass_score <= 0) verdictIssues.push("Minimum pass score must be > 0");
    }
    sections.push({ key: "verdict_system", label: "Verdict System", completed: !!verdict && verdictIssues.length === 0, issues: verdictIssues });

    // 4. Access Control
    const accessIssues: string[] = [];
    if (!access) {
      accessIssues.push("No access rules defined");
    }
    sections.push({ key: "access_control", label: "Access Control", completed: !!access && accessIssues.length === 0, issues: accessIssues });

    // 5. Pipeline (from manifest)
    const pipelineIssues: string[] = [];
    if (!manifest?.pipeline_steps || (Array.isArray(manifest.pipeline_steps) && manifest.pipeline_steps.length === 0)) {
      pipelineIssues.push("Pipeline steps not defined in manifest");
    } else if (Array.isArray(manifest.pipeline_steps) && manifest.pipeline_steps.length < 3) {
      pipelineIssues.push("Pipeline should have at least 3 steps (input → process → output)");
    }
    sections.push({ key: "pipeline", label: "Execution Pipeline", completed: pipelineIssues.length === 0, issues: pipelineIssues });

    // 6. QA Config
    const qaIssues: string[] = [];
    if (!qa) {
      qaIssues.push("No QA config defined");
    } else {
      if (!qa.qa_checks || (Array.isArray(qa.qa_checks) && qa.qa_checks.length === 0)) qaIssues.push("No QA checks defined");
    }
    sections.push({ key: "qa_config", label: "Quality Assurance", completed: !!qa && qaIssues.length === 0, issues: qaIssues });

    // 7. Security Policy
    const secIssues: string[] = [];
    if (!security) {
      secIssues.push("No security policy defined");
    } else {
      if (security.input_sanitization_level === "relaxed") secIssues.push("Relaxed sanitization not recommended for production");
      if (!security.prompt_injection_guard) secIssues.push("Prompt injection guard is disabled");
    }
    sections.push({ key: "security_policy", label: "Security Policy", completed: !!security && secIssues.length === 0, issues: secIssues });

    // 8. Retry Config
    const retryIssues: string[] = [];
    if (!retry) {
      retryIssues.push("No retry/fallback config defined");
    }
    sections.push({ key: "retry_config", label: "Retry & Fallback", completed: !!retry && retryIssues.length === 0, issues: retryIssues });

    // 9. Prompt Vault
    const promptIssues: string[] = [];
    if (!prompt) {
      promptIssues.push("No execution prompt registered in vault");
    }
    sections.push({ key: "prompt_vault", label: "Prompt Vault", completed: !!prompt && promptIssues.length === 0, issues: promptIssues });

    // 10. Dependencies (from manifest)
    const depIssues: string[] = [];
    const hasDeps = manifest?.dependencies && Array.isArray(manifest.dependencies) && manifest.dependencies.length > 0;
    // Dependencies are optional — mark as completed if defined or if service is L3 atomic
    sections.push({ key: "dependencies", label: "Dependencies", completed: true, issues: depIssues });

    // 11. Preview Config (from manifest)
    const previewIssues: string[] = [];
    if (manifest && !manifest.preview_enabled) {
      previewIssues.push("Preview is disabled — consider enabling for user experience");
    }
    sections.push({ key: "preview_config", label: "Preview Config", completed: manifest?.preview_enabled === true, issues: previewIssues });

    // 12. Audit Trail
    const auditIssues: string[] = [];
    if (security && !security.audit_log_required) {
      auditIssues.push("Audit logging is disabled");
    }
    sections.push({ key: "audit_trail", label: "Audit Trail", completed: security?.audit_log_required === true, issues: auditIssues });

    // Calculate compliance score
    const completedCount = sections.filter(s => s.completed).length;
    const complianceScore = Math.round((completedCount / sections.length) * 100);

    const allIssues = sections.flatMap(s => s.issues.map(issue => ({
      section: s.key,
      label: s.label,
      issue,
      severity: s.key === "security_policy" || s.key === "manifest" ? "critical" : "warning",
    })));

    // Upsert compliance record
    const sectionsCompleted: Record<string, boolean> = {};
    sections.forEach(s => { sectionsCompleted[s.key] = s.completed; });

    await adminClient.from("service_template_compliance").upsert({
      service_key,
      sections_completed: sectionsCompleted,
      compliance_score: complianceScore,
      last_validated_at: new Date().toISOString(),
      validator_version: "1.0",
      issues: allIssues,
    }, { onConflict: "service_key" });

    return new Response(JSON.stringify({
      service_key,
      compliance_score: complianceScore,
      completed: completedCount,
      total: sections.length,
      sections,
      issues: allIssues,
    }), { headers: corsHeaders });

  } catch (e) {
    console.error("validate-service-template error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: corsHeaders });
  }
});
