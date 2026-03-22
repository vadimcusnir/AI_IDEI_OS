import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

/**
 * Incoming Webhook Endpoint
 * POST /webhook-ingest?key=<webhook_key>
 * Body: { title, content, content_type, url, metadata }
 */
Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const webhookKey = url.searchParams.get("key");

    if (!webhookKey) {
      return new Response(JSON.stringify({ error: "Missing webhook key" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate webhook key
    const { data: webhook, error: whError } = await supabase
      .from("incoming_webhooks")
      .select("*")
      .eq("webhook_key", webhookKey)
      .eq("is_active", true)
      .single();

    if (whError || !webhook) {
      return new Response(JSON.stringify({ error: "Invalid or inactive webhook" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      title = "Webhook Import",
      content,
      content_type = "text",
      url: externalUrl,
      metadata = {},
    } = body;

    if (!content && !externalUrl) {
      return new Response(JSON.stringify({ error: "Provide 'content' or 'url'" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Validate content_type
    if (!webhook.accepted_content_types.includes(content_type)) {
      return new Response(
        JSON.stringify({
          error: `Content type '${content_type}' not accepted. Allowed: ${webhook.accepted_content_types.join(", ")}`,
        }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Insert source document
    const { data: doc, error: docError } = await supabase
      .from("source_documents")
      .insert({
        user_id: webhook.user_id,
        title,
        content_type,
        raw_content: content || null,
        external_url: externalUrl || null,
        external_id: metadata?.external_id || null,
        metadata: {
          ...metadata,
          source: "webhook",
          webhook_id: webhook.id,
          webhook_name: webhook.name,
        },
        status: "pending",
      })
      .select("id, status, content_hash")
      .single();

    if (docError) throw docError;

    // Update webhook stats
    await supabase
      .from("incoming_webhooks")
      .update({
        calls_count: webhook.calls_count + 1,
        last_called_at: new Date().toISOString(),
      })
      .eq("id", webhook.id);

    // If duplicate detected by trigger
    if (doc.status === "duplicate") {
      return new Response(
        JSON.stringify({
          success: true,
          document_id: doc.id,
          status: "duplicate",
          message: "Content already exists (duplicate hash detected)",
        }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Auto-extract if enabled: create episode + trigger pipeline
    if (webhook.auto_extract && content) {
      const { data: episode } = await supabase
        .from("episodes")
        .insert({
          author_id: webhook.user_id,
          title,
          source_type: content_type === "url" ? "url" : "text",
          source_url: externalUrl || null,
          transcript: content,
          status: "transcribed",
          workspace_id: webhook.target_workspace_id,
        })
        .select("id")
        .single();

      if (episode) {
        await supabase
          .from("source_documents")
          .update({ episode_id: episode.id, status: "processing" })
          .eq("id", doc.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        document_id: doc.id,
        status: doc.status,
        content_hash: doc.content_hash,
      }),
      { status: 201, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook ingest error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
