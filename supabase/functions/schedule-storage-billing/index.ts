import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: unknown) => {
  console.log(`[STORAGE-BILLING] ${step}${details ? ` — ${JSON.stringify(details)}` : ""}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    logStep("Starting daily storage billing run");

    // Get billing config
    const { data: configs, error: cfgErr } = await supabase
      .from("billing_config")
      .select("config_key, config_value")
      .in("config_key", ["storage_rate", "storage_free_gb", "storage_free_days"]);

    if (cfgErr) throw cfgErr;

    const cfgMap = Object.fromEntries((configs || []).map(c => [c.config_key, c.config_value]));
    const ratePerGb = cfgMap.storage_rate?.neurons_per_gb_month ?? 50;
    const freeGb = cfgMap.storage_free_gb?.gb ?? 5;
    const freeDays = cfgMap.storage_free_days?.days ?? 30;
    const freeBytes = freeGb * 1073741824;

    logStep("Config loaded", { ratePerGb, freeGb, freeDays });

    // Get all users with artifacts
    const { data: userStats, error: statsErr } = await supabase
      .from("artifacts")
      .select("author_id, size_bytes, stored_at")
      .gt("size_bytes", 0);

    if (statsErr) throw statsErr;

    // Aggregate per user
    const userMap = new Map<string, { totalBytes: number; count: number }>();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - freeDays);

    for (const a of (userStats || [])) {
      // Only bill artifacts past the free period
      if (a.stored_at && new Date(a.stored_at) > cutoffDate) continue;

      const entry = userMap.get(a.author_id) || { totalBytes: 0, count: 0 };
      entry.totalBytes += a.size_bytes || 0;
      entry.count++;
      userMap.set(a.author_id, entry);
    }

    logStep("Users with billable artifacts", { count: userMap.size });

    let totalCharged = 0;
    let usersCharged = 0;
    const today = new Date().toISOString().split("T")[0];

    for (const [userId, stats] of userMap) {
      const billableBytes = Math.max(0, stats.totalBytes - freeBytes);
      if (billableBytes <= 0) continue;

      // Daily rate = monthly rate / 30
      const dailyNeurons = Math.ceil((billableBytes / 1073741824) * ratePerGb / 30);
      if (dailyNeurons <= 0) continue;

      // Check if already billed today
      const { data: existing } = await supabase
        .from("storage_billing_log")
        .select("id")
        .eq("user_id", userId)
        .eq("billing_date", today)
        .limit(1);

      if (existing && existing.length > 0) {
        logStep("Already billed today, skipping", { userId });
        continue;
      }

      // Debit credits
      const { data: spent } = await supabase.rpc("spend_credits", {
        _user_id: userId,
        _amount: dailyNeurons,
        _description: `Storage fee: ${(billableBytes / 1073741824).toFixed(2)} GB`,
      });

      // Log billing
      await supabase.from("storage_billing_log").insert({
        user_id: userId,
        billing_date: today,
        total_bytes: stats.totalBytes,
        billable_bytes: billableBytes,
        neurons_charged: dailyNeurons,
        artifact_count: stats.count,
        details: { rate_per_gb: ratePerGb, free_gb: freeGb, debit_success: !!spent },
      });

      totalCharged += dailyNeurons;
      usersCharged++;

      // Check if user is near quota limit (80%)
      // Get workspace for notification
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", userId)
        .limit(1)
        .single();

      // Send notification at 80%+ usage
      const usagePercent = (stats.totalBytes / (freeBytes || 1)) * 100;
      if (usagePercent >= 80 && workspace) {
        await supabase.from("notifications").insert({
          user_id: userId,
          title: usagePercent >= 100 ? "Storage limit reached" : "Storage almost full",
          message: `You're using ${usagePercent.toFixed(0)}% of your free storage. ${usagePercent >= 100 ? "Additional storage is being billed." : "Consider archiving old artifacts."}`,
          type: usagePercent >= 100 ? "warning" : "info",
          action_url: "/credits",
        });
      }

      logStep("Billed user", { userId, dailyNeurons, billableBytes });
    }

    logStep("Billing run complete", { usersCharged, totalCharged });

    return new Response(
      JSON.stringify({ success: true, users_charged: usersCharged, total_neurons: totalCharged }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }, status: 500 }
    );
  }
});
