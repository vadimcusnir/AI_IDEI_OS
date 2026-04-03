import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

/**
 * Integration Auto-Sync Engine
 * Called by cron or manually to sync connected integrations.
 * POST /integration-sync { integration_id? }
 * If no integration_id, syncs all due integrations.
 */
Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // Rate limit guard (IP-based)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimited = await rateLimitGuard(clientIp + ":integration-sync", req, { maxRequests: 20, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    // Internal-only: verify service role key
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (token !== serviceKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceKey
    );

    let integrationId: string | null = null;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      integrationId = body.integration_id || null;
    }

    // Find integrations due for sync
    let query = supabase
      .from("user_integrations")
      .select("*, integration_connectors!inner(*)")
      .eq("status", "connected");

    if (integrationId) {
      query = query.eq("id", integrationId);
    } else {
      // Only scheduled connectors that are overdue
      query = query
        .eq("integration_connectors.sync_mode", "scheduled")
        .or(`next_sync_at.is.null,next_sync_at.lte.${new Date().toISOString()}`);
    }

    const { data: integrations, error } = await query.limit(10);
    if (error) throw error;

    const results = [];

    for (const integration of integrations || []) {
      const startTime = Date.now();

      // Create sync history entry
      const { data: syncRun } = await supabase
        .from("sync_history")
        .insert({
          integration_id: integration.id,
          user_id: integration.user_id,
          status: "running",
        })
        .select("id")
        .single();

      try {
        // Mark as syncing
        await supabase
          .from("user_integrations")
          .update({ status: "syncing" })
          .eq("id", integration.id);

        // Provider-specific sync logic
        let syncResult = { found: 0, new: 0, updated: 0, skipped: 0, neurons: 0 };

        const provider = integration.integration_connectors?.provider;

        switch (provider) {
          case "youtube":
            // YouTube sync: check for new URLs in settings.watched_urls
            syncResult = await syncYouTube(supabase, integration);
            break;
          case "rss":
            // RSS sync: fetch and parse feed
            syncResult = await syncRSS(supabase, integration);
            break;
          default:
            // Generic: just mark as completed
            syncResult = { found: 0, new: 0, updated: 0, skipped: 0, neurons: 0 };
        }

        // Calculate next sync
        const nextSync = new Date();
        nextSync.setHours(nextSync.getHours() + integration.sync_interval_hours);

        // Update integration
        await supabase
          .from("user_integrations")
          .update({
            status: "connected",
            last_sync_at: new Date().toISOString(),
            next_sync_at: nextSync.toISOString(),
            documents_imported: integration.documents_imported + syncResult.new,
            neurons_generated: integration.neurons_generated + syncResult.neurons,
            error_message: null,
          })
          .eq("id", integration.id);

        // Update sync history
        if (syncRun) {
          await supabase
            .from("sync_history")
            .update({
              status: "completed",
              documents_found: syncResult.found,
              documents_new: syncResult.new,
              documents_updated: syncResult.updated,
              documents_skipped: syncResult.skipped,
              neurons_generated: syncResult.neurons,
              completed_at: new Date().toISOString(),
              duration_ms: Date.now() - startTime,
            })
            .eq("id", syncRun.id);
        }

        results.push({ integration_id: integration.id, provider, status: "ok", ...syncResult });
      } catch (syncErr) {
        const errMsg = syncErr instanceof Error ? syncErr.message : "Unknown sync error";

        await supabase
          .from("user_integrations")
          .update({ status: "error", error_message: errMsg })
          .eq("id", integration.id);

        if (syncRun) {
          await supabase
            .from("sync_history")
            .update({
              status: "failed",
              error_log: [{ error: errMsg, at: new Date().toISOString() }],
              completed_at: new Date().toISOString(),
              duration_ms: Date.now() - startTime,
            })
            .eq("id", syncRun.id);
        }

        results.push({ integration_id: integration.id, provider, status: "error", error: errMsg });
      }
    }

    return new Response(
      JSON.stringify({ synced: results.length, results }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Sync engine error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});

// ── Provider-specific sync implementations ──

interface SyncResult {
  found: number;
  new: number;
  updated: number;
  skipped: number;
  neurons: number;
}

async function syncYouTube(supabase: any, integration: any): Promise<SyncResult> {
  const urls: string[] = integration.settings?.watched_urls || [];
  let found = 0, newDocs = 0, skipped = 0;

  for (const url of urls) {
    found++;
    // Check if already imported
    const { data: existing } = await supabase
      .from("source_documents")
      .select("id")
      .eq("user_id", integration.user_id)
      .eq("external_url", url)
      .limit(1);

    if (existing?.length) {
      skipped++;
      continue;
    }

    // Insert as pending source document
    await supabase.from("source_documents").insert({
      user_id: integration.user_id,
      integration_id: integration.id,
      external_url: url,
      title: `YouTube: ${url}`,
      content_type: "video",
      status: "pending",
      metadata: { source: "youtube_sync" },
    });
    newDocs++;
  }

  return { found, new: newDocs, updated: 0, skipped, neurons: 0 };
}

async function syncRSS(supabase: any, integration: any): Promise<SyncResult> {
  const feedUrl = integration.settings?.feed_url;
  if (!feedUrl) return { found: 0, new: 0, updated: 0, skipped: 0, neurons: 0 };

  let found = 0, newDocs = 0, skipped = 0;

  try {
    const resp = await fetch(feedUrl);
    const text = await resp.text();

    // Simple RSS item extraction (title + link)
    const items = text.match(/<item[\s\S]*?<\/item>/gi) || [];
    found = items.length;

    for (const item of items.slice(0, 20)) {
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/);
      const linkMatch = item.match(/<link>(.*?)<\/link>/);
      const title = titleMatch?.[1] || titleMatch?.[2] || "RSS Item";
      const link = linkMatch?.[1] || "";

      if (!link) { skipped++; continue; }

      // Check if already imported
      const { data: existing } = await supabase
        .from("source_documents")
        .select("id")
        .eq("user_id", integration.user_id)
        .eq("external_url", link)
        .limit(1);

      if (existing?.length) { skipped++; continue; }

      await supabase.from("source_documents").insert({
        user_id: integration.user_id,
        integration_id: integration.id,
        external_url: link,
        title,
        content_type: "url",
        status: "pending",
        metadata: { source: "rss_sync", feed_url: feedUrl },
      });
      newDocs++;
    }
  } catch (e) {
    console.error("RSS fetch error:", e);
  }

  return { found, new: newDocs, updated: 0, skipped, neurons: 0 };
}
