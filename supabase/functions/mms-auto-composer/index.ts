/**
 * mms-auto-composer — Auto-composes an optimal MMS DAG from intent + constraints.
 * Input: { intent: string, constraints?: { max_steps?, max_cost?, domains? }, user_id?: string }
 * Output: { composed_mms: { name, nodes[], edges[], total_cost, estimated_outputs } }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Rate limit guard (IP-based)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimited = await rateLimitGuard(clientIp + ":mms-auto-composer", req, { maxRequests: 10, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    const { intent, constraints, user_id } = await req.json();

    if (!intent) {
      return new Response(JSON.stringify({ error: "Missing 'intent'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const maxSteps = constraints?.max_steps || 6;
    const maxCost = constraints?.max_cost || 300;
    const domainFilter = constraints?.domains || [];

    // 1. Match intent to intent_map
    const { data: intents } = await supabase
      .from("intent_map")
      .select("*")
      .eq("is_active", true);

    const intentLower = intent.toLowerCase();
    let matchedDomains: string[] = domainFilter;

    if (matchedDomains.length === 0) {
      for (const im of intents || []) {
        let score = 0;
        if (intentLower.includes(im.intent_key.replace(/_/g, " "))) score += 3;
        for (const d of im.domain_filter || []) {
          if (intentLower.includes(d)) score += 1;
        }
        if (score > 0) {
          matchedDomains = [...matchedDomains, ...(im.domain_filter || [])];
        }
      }
      matchedDomains = [...new Set(matchedDomains)];
    }

    // 2. Select top-scoring OTOS from matched domains
    let query = supabase
      .from("os_otos")
      .select("id, name, domain, neurons_cost, score_tier, score_total, mechanism, intent")
      .eq("status", "active")
      .in("score_tier", ["S", "A"])
      .order("score_total", { ascending: false })
      .limit(50);

    if (matchedDomains.length > 0) {
      query = query.in("domain", matchedDomains);
    }

    const { data: candidates } = await query;

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({
        error: "No matching OTOS found for this intent",
        intent,
        domains_searched: matchedDomains,
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Greedy DAG composition: select diverse OTOS within budget
    const selected: any[] = [];
    let totalCost = 0;
    const usedDomains = new Set<string>();

    for (const otos of candidates) {
      if (selected.length >= maxSteps) break;
      if (totalCost + (otos.neurons_cost || 20) > maxCost) continue;

      // Prefer domain diversity
      if (usedDomains.has(otos.domain) && selected.length > 2) continue;

      selected.push(otos);
      totalCost += otos.neurons_cost || 20;
      usedDomains.add(otos.domain);
    }

    // 4. Build DAG structure
    const nodes = selected.map((otos, i) => ({
      step_order: i + 1,
      otos_id: otos.id,
      name: otos.name,
      domain: otos.domain,
      role: i === 0 ? "input" : i === selected.length - 1 ? "output" : "processor",
      neurons_cost: otos.neurons_cost || 20,
      mechanism: otos.mechanism,
    }));

    const edges = nodes.slice(0, -1).map((_, i) => ({
      from_step: i + 1,
      to_step: i + 2,
      edge_type: "sequence",
    }));

    // 5. Apply bundle discount (20%)
    const bundleCost = Math.round(totalCost * 0.8);

    return new Response(JSON.stringify({
      composed_mms: {
        name: `Auto: ${intent.slice(0, 60)}`,
        intent,
        node_count: nodes.length,
        nodes,
        edges,
        total_cost_individual: totalCost,
        bundle_cost: bundleCost,
        bundle_discount_pct: 20,
        estimated_outputs: nodes.length,
        domains_covered: [...usedDomains],
        match_quality: matchedDomains.length > 0 ? "domain_matched" : "broad_search",
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
