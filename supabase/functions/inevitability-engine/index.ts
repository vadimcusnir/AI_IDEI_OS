import { getCorsHeaders } from "../_shared/cors.ts";
/**
 * inevitability-engine — Lock-in computation, creator ranking, platform metrics
 * 
 * POST { action: "compute_lock_in" | "update_rankings" | "snapshot_metrics" | "auto_evolve" }
 * Admin-only endpoint
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

function jsonResp(req: Request, data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Admin auth
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return jsonResp(req, { error: "Unauthorized" }, 401);
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
    const { action = "snapshot_metrics" } = body;

    switch (action) {
      case "compute_lock_in": return await computeLockIn(req, supabase);
      case "update_rankings": return await updateRankings(req, supabase);
      case "snapshot_metrics": return await snapshotMetrics(req, supabase);
      case "auto_evolve": return await autoEvolve(req, supabase);
      default: return jsonResp(req, { error: "Invalid action" }, 400);
    }
  } catch (err) {
    console.error("inevitability-engine error:", err);
    return jsonResp(req, { error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// 1. COMPUTE LOCK-IN — Score each user's dependency on the platform
// ═══════════════════════════════════════════════════════════════
async function computeLockIn(req: Request, supabase: any) {
  // Get all users with activity
  const { data: profiles } = await supabase
    .from("profiles").select("id").limit(1000);

  let updated = 0;

  for (const profile of (profiles || [])) {
    const userId = profile.id;

    // Asset dependency: how many assets has user created?
    const { count: assetsCount } = await supabase
      .from("artifacts").select("id", { count: "exact", head: true })
      .eq("author_id", userId);

    // Revenue dependency: marketplace earnings
    const { data: txns } = await supabase
      .from("asset_transactions").select("amount_neurons")
      .eq("seller_id", userId).eq("status", "completed");
    const totalRevenue = (txns || []).reduce((s: number, t: any) => s + (t.amount_neurons || 0), 0);

    // Identity dependency: executions + memory entries
    const { count: execCount } = await supabase
      .from("neuron_jobs").select("id", { count: "exact", head: true })
      .eq("author_id", userId);

    const { count: memoryCount } = await supabase
      .from("user_memory").select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    // Score computation (0-10 scale each)
    const assetDep = Math.min(10, (assetsCount || 0) / 5);       // 50 assets = max
    const revenueDep = Math.min(10, totalRevenue / 5000);          // 50K neurons revenue = max
    const identityDep = Math.min(10, ((execCount || 0) + (memoryCount || 0)) / 20); // 200 actions = max
    const totalScore = Math.round(((assetDep * 0.35) + (revenueDep * 0.4) + (identityDep * 0.25)) * 100) / 100;

    // Tier assignment
    const tier = totalScore >= 8 ? "locked" 
      : totalScore >= 5 ? "dependent" 
      : totalScore >= 2 ? "engaged" 
      : "explorer";

    await supabase.from("user_lock_in").upsert({
      user_id: userId,
      asset_dependency: Math.round(assetDep * 100) / 100,
      revenue_dependency: Math.round(revenueDep * 100) / 100,
      identity_dependency: Math.round(identityDep * 100) / 100,
      total_score: totalScore,
      tier,
      assets_count: assetsCount || 0,
      executions_count: execCount || 0,
      marketplace_revenue: totalRevenue,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    updated++;
  }

  return jsonResp(req, { users_processed: updated });
}

// ═══════════════════════════════════════════════════════════════
// 2. UPDATE RANKINGS — Creator leaderboard
// ═══════════════════════════════════════════════════════════════
async function updateRankings(req: Request, supabase: any) {
  // Get all sellers with transactions
  const { data: txns } = await supabase
    .from("asset_transactions").select("seller_id, amount_neurons, asset_id")
    .eq("status", "completed");

  const sellerStats: Record<string, { revenue: number; assetsSold: Set<string>; count: number }> = {};

  for (const tx of (txns || [])) {
    if (!sellerStats[tx.seller_id]) {
      sellerStats[tx.seller_id] = { revenue: 0, assetsSold: new Set(), count: 0 };
    }
    sellerStats[tx.seller_id].revenue += tx.amount_neurons || 0;
    if (tx.asset_id) sellerStats[tx.seller_id].assetsSold.add(tx.asset_id);
    sellerStats[tx.seller_id].count++;
  }

  // Get asset ratings
  const { data: reviews } = await supabase
    .from("asset_reviews").select("asset_id, rating, user_id");

  // Sort sellers by revenue for ranking
  const sorted = Object.entries(sellerStats)
    .sort(([, a], [, b]) => b.revenue - a.revenue);

  let updated = 0;
  for (let i = 0; i < sorted.length; i++) {
    const [sellerId, stats] = sorted[i];
    
    // Portfolio value = count of published assets * avg price
    const { count: publishedAssets } = await supabase
      .from("knowledge_assets").select("id", { count: "exact", head: true })
      .eq("creator_id", sellerId).eq("is_published", true);

    const portfolioValue = (publishedAssets || 0) * 2000; // avg 2000N per asset

    // Avg rating across seller's assets
    const sellerReviews = (reviews || []).filter((r: any) => 
      stats.assetsSold.has(r.asset_id)
    );
    const avgRating = sellerReviews.length > 0
      ? sellerReviews.reduce((s: number, r: any) => s + r.rating, 0) / sellerReviews.length
      : 0;

    const creatorTier = stats.revenue >= 50000 ? "legend"
      : stats.revenue >= 10000 ? "expert"
      : stats.revenue >= 2000 ? "creator"
      : "newcomer";

    const reputationScore = Math.min(10,
      (stats.revenue / 10000) * 3 +
      (stats.count / 20) * 2 +
      (avgRating / 5) * 3 +
      ((publishedAssets || 0) / 10) * 2
    );

    await supabase.from("creator_rankings").upsert({
      user_id: sellerId,
      creator_rank: i + 1,
      creator_tier: creatorTier,
      total_assets_sold: stats.count,
      total_revenue_neurons: stats.revenue,
      avg_asset_rating: Math.round(avgRating * 100) / 100,
      portfolio_value: portfolioValue,
      reputation_score: Math.round(reputationScore * 100) / 100,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    updated++;
  }

  return jsonResp(req, { creators_ranked: updated });
}

// ═══════════════════════════════════════════════════════════════
// 3. SNAPSHOT METRICS — Daily platform health
// ═══════════════════════════════════════════════════════════════
async function snapshotMetrics(req: Request, supabase: any) {
  const today = new Date().toISOString().split("T")[0];

  // Total users
  const { count: totalUsers } = await supabase
    .from("profiles").select("id", { count: "exact", head: true });

  // Active users (7d) — users with jobs in last 7 days
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: activeJobs } = await supabase
    .from("neuron_jobs").select("author_id")
    .gte("created_at", weekAgo);
  const activeUsers7d = new Set((activeJobs || []).map((j: any) => j.author_id)).size;

  // Total assets
  const { count: totalAssets } = await supabase
    .from("knowledge_assets").select("id", { count: "exact", head: true });

  // Total executions
  const { count: totalExecutions } = await supabase
    .from("neuron_jobs").select("id", { count: "exact", head: true });

  // Revenue
  const { data: revTxns } = await supabase
    .from("asset_transactions").select("amount_neurons").eq("status", "completed");
  const totalRevenueNeurons = (revTxns || []).reduce((s: number, t: any) => s + (t.amount_neurons || 0), 0);

  // Revenue per user
  const revenuePerUser = (totalUsers || 1) > 0 ? totalRevenueNeurons / (totalUsers || 1) : 0;

  // Assets per execution
  const assetsPerExecution = (totalExecutions || 1) > 0 ? (totalAssets || 0) / (totalExecutions || 1) : 0;

  // Marketplace velocity (transactions in last 7 days)
  const { count: weeklyTxns } = await supabase
    .from("asset_transactions").select("id", { count: "exact", head: true })
    .gte("created_at", weekAgo);
  const marketplaceVelocity = (weeklyTxns || 0) / 7; // per day

  // Reuse rate: artifacts used as input in other jobs / total artifacts
  const { count: totalArtifacts } = await supabase
    .from("artifacts").select("id", { count: "exact", head: true });
  const { count: reusedArtifacts } = await supabase
    .from("artifact_neurons").select("id", { count: "exact", head: true });
  const reuseRate = (totalArtifacts || 1) > 0 ? (reusedArtifacts || 0) / (totalArtifacts || 1) : 0;

  // Avg lock-in score
  const { data: lockIns } = await supabase
    .from("user_lock_in").select("total_score");
  const avgLockIn = (lockIns || []).length > 0
    ? (lockIns || []).reduce((s: number, l: any) => s + Number(l.total_score), 0) / lockIns.length
    : 0;

  await supabase.from("platform_metrics").upsert({
    metric_date: today,
    total_users: totalUsers || 0,
    active_users_7d: activeUsers7d,
    total_assets: totalAssets || 0,
    total_executions: totalExecutions || 0,
    total_revenue_neurons: totalRevenueNeurons,
    revenue_per_user: Math.round(revenuePerUser * 100) / 100,
    assets_per_execution: Math.round(assetsPerExecution * 100) / 100,
    marketplace_velocity: Math.round(marketplaceVelocity * 100) / 100,
    reuse_rate: Math.round(reuseRate * 10000) / 10000,
    avg_lock_in_score: Math.round(avgLockIn * 100) / 100,
  }, { onConflict: "metric_date" });

  return jsonResp(req, {
    metric_date: today,
    total_users: totalUsers || 0,
    active_users_7d: activeUsers7d,
    total_assets: totalAssets || 0,
    total_executions: totalExecutions || 0,
    total_revenue_neurons: totalRevenueNeurons,
    revenue_per_user: Math.round(revenuePerUser * 100) / 100,
    marketplace_velocity: Math.round(marketplaceVelocity * 100) / 100,
    reuse_rate: Math.round(reuseRate * 10000) / 10000,
    avg_lock_in_score: Math.round(avgLockIn * 100) / 100,
  });
}

// ═══════════════════════════════════════════════════════════════
// 4. AUTO-EVOLVE — Self-improving system triggers
// ═══════════════════════════════════════════════════════════════
async function autoEvolve(req: Request, supabase: any) {
  const actions: string[] = [];

  // Auto-pricing: adjust prices of high-performing assets
  const { data: topMetrics } = await supabase
    .from("domination_metrics")
    .select("entity_id, revenue, usage_count, quality_score")
    .eq("entity_type", "asset")
    .eq("action_taken", "boost")
    .order("revenue", { ascending: false })
    .limit(20);

  for (const metric of (topMetrics || [])) {
    if (metric.revenue > 1000) {
      // Increase price by 20% for top performers
      const { data: asset } = await supabase
        .from("knowledge_assets")
        .select("id, price_neurons")
        .eq("id", metric.entity_id)
        .single();
      
      if (asset && asset.price_neurons) {
        const newPrice = Math.round(asset.price_neurons * 1.2);
        await supabase.from("knowledge_assets")
          .update({ price_neurons: newPrice })
          .eq("id", asset.id);
        actions.push(`price_increase:${asset.id}:${asset.price_neurons}->${newPrice}`);
      }
    }
  }

  // Auto-activate high-quality draft services
  const { data: draftServices } = await supabase
    .from("service_catalog")
    .select("id, service_key, name")
    .eq("is_active", false)
    .limit(10);

  // Only activate if they were auto-generated and have matching patterns
  for (const svc of (draftServices || []).filter((s: any) => s.service_key?.startsWith("auto-"))) {
    await supabase.from("service_catalog")
      .update({ is_active: true })
      .eq("id", svc.id);
    actions.push(`service_activated:${svc.service_key}`);
  }

  return jsonResp(req, { actions_taken: actions.length, actions });
}
