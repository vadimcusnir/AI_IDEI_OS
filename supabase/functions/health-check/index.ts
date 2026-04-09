import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckResult {
  name: string;
  status: "healthy" | "degraded" | "failed";
  latency_ms: number;
  detail?: string;
}

async function checkDatabase(supabase: any): Promise<CheckResult> {
  const start = Date.now();
  try {
    const { error } = await supabase.from("capacity_state").select("id").limit(1).single();
    const latency = Date.now() - start;
    if (error) return { name: "database", status: latency > 2000 ? "failed" : "degraded", latency_ms: latency, detail: error.message };
    return { name: "database", status: latency > 1000 ? "degraded" : "healthy", latency_ms: latency };
  } catch (e) {
    return { name: "database", status: "failed", latency_ms: Date.now() - start, detail: String(e) };
  }
}

async function checkAuth(supabase: any): Promise<CheckResult> {
  const start = Date.now();
  try {
    const { error } = await supabase.auth.getSession();
    const latency = Date.now() - start;
    return { name: "auth", status: error ? "degraded" : latency > 1000 ? "degraded" : "healthy", latency_ms: latency, detail: error?.message };
  } catch (e) {
    return { name: "auth", status: "failed", latency_ms: Date.now() - start, detail: String(e) };
  }
}

async function checkEdgeFunctions(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/`;
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    const latency = Date.now() - start;
    return { name: "edge_functions", status: res.status < 500 ? (latency > 2000 ? "degraded" : "healthy") : "failed", latency_ms: latency };
  } catch (e) {
    return { name: "edge_functions", status: "failed", latency_ms: Date.now() - start, detail: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const checks = await Promise.all([
    checkDatabase(supabase),
    checkAuth(supabase),
    checkEdgeFunctions(),
  ]);

  const overallStatus = checks.some(c => c.status === "failed") ? "failed"
    : checks.some(c => c.status === "degraded") ? "degraded" : "healthy";

  const isInternal = req.headers.get("Authorization")?.includes("Bearer");

  // If called by cron (no auth), log alerts for failures
  const url = new URL(req.url);
  if (url.searchParams.get("cron") === "true") {
    const failedChecks = checks.filter(c => c.status !== "healthy");
    for (const check of failedChecks) {
      await supabase.from("admin_alerts").upsert({
        alert_type: "health_check",
        severity: check.status === "failed" ? "critical" : "warning",
        title: `Health check: ${check.name} is ${check.status}`,
        description: check.detail || `Latency: ${check.latency_ms}ms`,
        error_signal: check.name,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      }, { onConflict: "alert_type,error_signal", ignoreDuplicates: false });
    }
  }

  const body: any = { status: overallStatus, timestamp: new Date().toISOString(), checks };
  if (!isInternal) {
    // Public endpoint: minimal info
    body.checks = checks.map(c => ({ name: c.name, status: c.status }));
  }

  return new Response(JSON.stringify(body), {
    status: overallStatus === "failed" ? 503 : 200,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
});
