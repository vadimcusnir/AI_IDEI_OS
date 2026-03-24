import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    // Rate limit guard (IP-based)
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimited = rateLimitGuard(clientIP, req, { maxRequests: 10, windowSeconds: 60 }, corsHeaders);
    if (rateLimited) return rateLimited;


  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { mode, service_keys } = await req.json();
    // mode: "missing" = generate for services without manifests
    // mode: "specific" = generate for provided service_keys

    // Get services that need manifests
    let query = supabase
      .from("service_catalog")
      .select("service_key, name, credits_cost, complexity, domain, description, execution_mode, service_class");

    if (mode === "specific" && service_keys?.length > 0) {
      query = query.in("service_key", service_keys);
    }

    const { data: services, error: sErr } = await query.eq("is_active", true);
    if (sErr) throw sErr;
    if (!services?.length) {
      return new Response(JSON.stringify({ generated: 0, message: "No services found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get existing manifests
    const { data: existing } = await supabase
      .from("service_manifests")
      .select("service_key");

    const existingKeys = new Set((existing || []).map(e => e.service_key));

    // Filter to only missing if mode is "missing"
    const toGenerate = mode === "missing"
      ? services.filter(s => !existingKeys.has(s.service_key))
      : services;

    if (toGenerate.length === 0) {
      return new Response(JSON.stringify({ generated: 0, message: "All services already have manifests" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map complexity to pipeline class
    const classMap: Record<string, string> = {
      low: "S",
      medium: "C",
      high: "X",
      L1: "S",
      L2: "C",
      L3: "X",
    };

    // Generate manifests
    const manifests = toGenerate.map(svc => {
      const pipelineClass = classMap[svc.complexity || ""] || classMap[svc.service_class || ""] || "S";
      const baseCost = svc.credits_cost || (pipelineClass === "S" ? 290 : pipelineClass === "C" ? 580 : 1450);

      // Auto-generate pipeline steps based on class
      const pipelineSteps = pipelineClass === "S"
        ? [{ step: "generate", agent: "content_generator", label: "Generare conținut" }]
        : pipelineClass === "C"
          ? [
              { step: "extract", agent: "neuron_extractor", label: "Extragere cunoștințe" },
              { step: "structure", agent: "framework_builder", label: "Structurare framework" },
              { step: "generate", agent: "asset_generator", label: "Generare deliverables" },
            ]
          : [
              { step: "analyze", agent: "deep_analyzer", label: "Analiză profundă" },
              { step: "extract", agent: "neuron_extractor", label: "Extragere neuroni" },
              { step: "structure", agent: "framework_builder", label: "Construcție framework" },
              { step: "generate", agent: "asset_generator", label: "Generare assets" },
              { step: "optimize", agent: "quality_optimizer", label: "Optimizare calitate" },
            ];

      // Auto-generate input schema
      const inputSchema = [
        { name: "source", type: "text", label: "Conținut sursă", required: true },
        { name: "goal", type: "string", label: "Obiectiv", required: false },
      ];

      // Auto-generate output schema
      const outputSchema = {
        artifacts: [
          { type: pipelineClass === "S" ? "content" : "framework" },
          ...(pipelineClass !== "S" ? [{ type: "content_pack" }] : []),
        ],
      };

      return {
        service_key: svc.service_key,
        pipeline_class: pipelineClass,
        base_neurons: baseCost,
        cost_multiplier: 1.2,
        input_schema: inputSchema,
        output_schema: outputSchema,
        pipeline_steps: pipelineSteps,
        estimated_duration_seconds: pipelineClass === "S" ? 30 : pipelineClass === "C" ? 90 : 180,
        preview_enabled: true,
        preview_limit_pct: 20,
        retry_attempts: 2,
        confidence_threshold: 0.75,
        is_validated: false,
      };
    });

    // Upsert manifests
    const { error: insertErr, data: inserted } = await supabase
      .from("service_manifests")
      .upsert(manifests, { onConflict: "service_key" })
      .select("service_key");

    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({
      generated: inserted?.length || 0,
      total_services: services.length,
      already_had: existingKeys.size,
      message: `Generated ${inserted?.length || 0} manifests`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-manifest error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
