import { getCorsHeaders } from "../_shared/cors.ts";
/**
 * domination-engine — Market Domination Engine
 * 
 * POST /domination-engine { action: "capture" | "distribute" | "feedback" | "autoscale" }
 * 
 * Modules:
 * - capture: Demand detection → auto page generation
 * - distribute: Asset distribution across channels
 * - feedback: Performance loop — boost top, kill low
 * - autoscale: Auto-generate pages/services on thresholds
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const supabase = createClient(supabaseUrl, serviceKey);

  // Admin auth check
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResp(req, { error: "Unauthorized" }, 401);
  }
  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return jsonResp(req, { error: "Unauthorized" }, 401);

  const { data: roleData } = await supabase
    .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
  if (!roleData) return jsonResp(req, { error: "Admin access required" }, 403);

  // Rate limit (user-based, post-auth)
  const rateLimited = await rateLimitGuard(user.id, req, { maxRequests: 5, windowSeconds: 60 }, getCorsHeaders(req));
  if (rateLimited) return rateLimited;

  try {
    const body = await req.json().catch(() => ({}));
    const { action = "capture", limit = 30 } = body;

    switch (action) {
      case "capture": return await handleCapture(supabase, LOVABLE_API_KEY, limit);
      case "distribute": return await handleDistribute(supabase);
      case "feedback": return await handleFeedback(supabase);
      case "autoscale": return await handleAutoscale(supabase, LOVABLE_API_KEY);
      default: return jsonResp(req, { error: "Invalid action" }, 400);
    }
  } catch (err) {
    console.error("domination-engine error:", err);
    return jsonResp(req, { error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function jsonResp(req: Request, data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

// ═══════════════════════════════════════════════════════════════════
// 1. DEMAND CAPTURE — detect high-intent topics, auto-generate pages
// ═══════════════════════════════════════════════════════════════════
async function handleCapture(supabase: any, apiKey: string | undefined, limit: number) {
  // Get high-ranking published entities not yet mapped to landing pages
  const { data: entities } = await supabase
    .from("entities")
    .select("id, title, slug, entity_type, summary, tags, idea_rank, importance_score")
    .eq("is_published", true)
    .order("idea_rank", { ascending: false, nullsFirst: false })
    .limit(limit * 2);

  if (!entities?.length) return jsonResp(req, { signals_created: 0, pages_generated: 0 });

  // Get existing landing page slugs
  const { data: existingPages } = await supabase
    .from("generated_landing_pages").select("slug");
  const existingSlugs = new Set((existingPages || []).map((p: any) => p.slug));

  // Get existing demand signals
  const { data: existingSignals } = await supabase
    .from("demand_signals").select("keyword");
  const existingKeywords = new Set((existingSignals || []).map((s: any) => s.keyword.toLowerCase()));

  let signalsCreated = 0;
  let pagesGenerated = 0;
  const candidates = entities.filter((e: any) => !existingKeywords.has(e.title.toLowerCase()));

  for (const entity of candidates.slice(0, limit)) {
    const intentScore = Math.min(10, (entity.idea_rank || 0) * 10 + (entity.importance_score || 0) / 10);
    const slug = `solve/${entity.entity_type}/${entity.slug}`;

    // Create demand signal
    const { error: sigErr } = await supabase.from("demand_signals").insert({
      source: "entity_graph",
      keyword: entity.title,
      intent_score: intentScore,
      mapped_service_key: null,
      mapped_entity_id: entity.id,
      page_generated: false,
    });
    if (sigErr) continue;
    signalsCreated++;

    // Auto-generate landing page if high intent and API available
    if (intentScore >= 6 && apiKey && !existingSlugs.has(slug)) {
      const page = await generateLandingPage(apiKey, entity, slug);
      if (page) {
        const { error: pageErr } = await supabase.from("generated_landing_pages").insert({
          slug,
          title: page.title,
          meta_description: page.meta_description,
          content_md: page.content_md,
          cta_service_key: page.cta_service_key || null,
          schema_json: {
            "@context": "https://schema.org",
            "@type": "Article",
            name: page.title,
            description: page.meta_description,
            url: `https://ai-idei.com/${slug}`,
            publisher: { "@type": "Organization", name: "AI-IDEI" },
          },
          status: intentScore >= 8 ? "published" : "draft",
          quality_score: intentScore,
        });
        if (!pageErr) {
          pagesGenerated++;
          await supabase.from("demand_signals")
            .update({ page_generated: true })
            .eq("keyword", entity.title);
        }
      }
    }
  }

  return jsonResp(req, { signals_created: signalsCreated, pages_generated: pagesGenerated, total_entities: entities.length });
}

async function generateLandingPage(apiKey: string, entity: any, slug: string) {
  try {
    const prompt = `Generate a conversion-optimized landing page for this knowledge topic.

TOPIC: ${entity.title}
TYPE: ${entity.entity_type}
SUMMARY: ${entity.summary || "N/A"}
TAGS: ${(entity.tags || []).join(", ")}

Create a page following this structure:
keyword → problem → solution → execute → preview → buy

Output JSON:
{
  "title": "SEO title (max 60 chars)",
  "meta_description": "Compelling meta desc (max 155 chars)",
  "content_md": "Full markdown with: ## Problem, ## Solution, ## How It Works, ## Results, ## Get Started",
  "cta_service_key": "suggested_service_key_or_null"
}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are an expert conversion copywriter. Output valid JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════════════════
// 2. DISTRIBUTE — push assets across channels
// ═══════════════════════════════════════════════════════════════════
async function handleDistribute(supabase: any) {
  // Find published assets without distribution events
  const { data: assets } = await supabase
    .from("knowledge_assets")
    .select("id, title, asset_type, description")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!assets?.length) return jsonResp(req, { distributed: 0 });

  const { data: existingDist } = await supabase
    .from("distribution_events").select("asset_id");
  const distributedIds = new Set((existingDist || []).map((d: any) => d.asset_id));

  const channels = ["marketplace", "seo", "social_queue"];
  let distributed = 0;

  for (const asset of assets) {
    if (distributedIds.has(asset.id)) continue;
    
    for (const channel of channels) {
      await supabase.from("distribution_events").insert({
        asset_id: asset.id,
        channel,
        action: "auto_publish",
        reach_estimate: channel === "marketplace" ? 100 : channel === "seo" ? 500 : 200,
      });
    }
    distributed++;
  }

  return jsonResp(req, { distributed, channels: channels.length });
}

// ═══════════════════════════════════════════════════════════════════
// 3. FEEDBACK LOOP — boost top performers, kill underperformers
// ═══════════════════════════════════════════════════════════════════
async function handleFeedback(supabase: any) {
  // Collect metrics from asset_transactions
  const { data: txns } = await supabase
    .from("asset_transactions")
    .select("asset_id, amount_neurons")
    .eq("status", "completed");

  const assetRevenue: Record<string, number> = {};
  for (const tx of (txns || [])) {
    if (tx.asset_id) {
      assetRevenue[tx.asset_id] = (assetRevenue[tx.asset_id] || 0) + (tx.amount_neurons || 0);
    }
  }

  // Collect service execution metrics
  const { data: jobs } = await supabase
    .from("neuron_jobs")
    .select("service_key, status")
    .not("service_key", "is", null);

  const serviceUsage: Record<string, { total: number; success: number }> = {};
  for (const job of (jobs || [])) {
    if (!serviceUsage[job.service_key]) serviceUsage[job.service_key] = { total: 0, success: 0 };
    serviceUsage[job.service_key].total++;
    if (job.status === "completed") serviceUsage[job.service_key].success++;
  }

  let boosted = 0;
  let killed = 0;

  // Upsert asset performance metrics
  for (const [assetId, revenue] of Object.entries(assetRevenue)) {
    const action = revenue > 500 ? "boost" : revenue < 10 ? "demote" : null;
    if (action === "boost") boosted++;
    if (action === "demote") killed++;

    await supabase.from("domination_metrics").upsert({
      entity_type: "asset",
      entity_id: assetId,
      metric_date: new Date().toISOString().split("T")[0],
      revenue,
      quality_score: Math.min(10, revenue / 100),
      action_taken: action,
    }, { onConflict: "entity_type,entity_id,metric_date" });
  }

  // Upsert service performance metrics
  for (const [serviceKey, stats] of Object.entries(serviceUsage)) {
    const successRate = stats.total > 0 ? stats.success / stats.total : 0;
    const action = successRate > 0.8 && stats.total > 10 ? "boost" : successRate < 0.3 ? "kill" : null;
    if (action === "boost") boosted++;
    if (action === "kill") killed++;

    await supabase.from("domination_metrics").upsert({
      entity_type: "service",
      entity_id: serviceKey,
      metric_date: new Date().toISOString().split("T")[0],
      usage_count: stats.total,
      conversions: stats.success,
      quality_score: successRate * 10,
      action_taken: action,
    }, { onConflict: "entity_type,entity_id,metric_date" });
  }

  return jsonResp(req, { assets_analyzed: Object.keys(assetRevenue).length, services_analyzed: Object.keys(serviceUsage).length, boosted, killed });
}

// ═══════════════════════════════════════════════════════════════════
// 4. AUTOSCALE — trigger expansion based on thresholds
// ═══════════════════════════════════════════════════════════════════
async function handleAutoscale(supabase: any, apiKey: string | undefined) {
  // Check thresholds
  const { count: totalPages } = await supabase
    .from("generated_landing_pages").select("id", { count: "exact", head: true });
  
  const { count: totalAssets } = await supabase
    .from("knowledge_assets").select("id", { count: "exact", head: true }).eq("is_published", true);

  const { data: recentRevenue } = await supabase
    .from("domination_metrics")
    .select("revenue")
    .eq("entity_type", "asset")
    .gte("metric_date", new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]);

  const weeklyRevenue = (recentRevenue || []).reduce((sum: number, r: any) => sum + (r.revenue || 0), 0);

  // Get unpublished high-quality entities for page generation
  const { data: pendingEntities } = await supabase
    .from("entities")
    .select("id, title, slug, entity_type, summary, tags, idea_rank")
    .eq("is_published", true)
    .gt("idea_rank", 0.5)
    .order("idea_rank", { ascending: false })
    .limit(20);

  const { data: existingPages } = await supabase
    .from("generated_landing_pages").select("slug");
  const existingSlugs = new Set((existingPages || []).map((p: any) => p.slug));

  let newPages = 0;
  const scalable = (pendingEntities || []).filter((e: any) => !existingSlugs.has(`solve/${e.entity_type}/${e.slug}`));

  // Auto-generate pages if thresholds met
  if (apiKey && (weeklyRevenue > 1000 || (totalPages || 0) < 100)) {
    for (const entity of scalable.slice(0, 10)) {
      const slug = `solve/${entity.entity_type}/${entity.slug}`;
      const page = await generateLandingPage(apiKey, entity, slug);
      if (page) {
        await supabase.from("generated_landing_pages").insert({
          slug,
          title: page.title,
          meta_description: page.meta_description,
          content_md: page.content_md,
          cta_service_key: page.cta_service_key || null,
          status: "draft",
          quality_score: (entity.idea_rank || 0) * 10,
        });
        newPages++;
      }
    }
  }

  return jsonResp(req, {
    current_pages: totalPages || 0,
    current_assets: totalAssets || 0,
    weekly_revenue: weeklyRevenue,
    new_pages_generated: newPages,
    scalable_entities: scalable.length,
  });
}
