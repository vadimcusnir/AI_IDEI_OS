import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

/**
 * Zapier Integration Endpoint
 * Supports both trigger polling and action execution.
 *
 * GET  /zapier-trigger?type=new_neuron&user_id=...  — poll for new items
 * POST /zapier-trigger?action=create_neuron          — execute action
 */
Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const url = new URL(req.url);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth: check Authorization header for API key
    const authHeader = req.headers.get("authorization") || "";
    const apiKey = authHeader.replace("Bearer ", "").trim();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API key" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Validate API key
    const keyPrefix = apiKey.substring(0, 8);
    const { data: keyRow } = await supabase
      .from("api_keys")
      .select("user_id, scopes, is_active")
      .eq("key_prefix", keyPrefix)
      .eq("is_active", true)
      .single();

    if (!keyRow) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const userId = keyRow.user_id;

    // ── GET: Trigger polling ──
    if (req.method === "GET") {
      const triggerType = url.searchParams.get("type") || "new_neuron";
      const since = url.searchParams.get("since") || new Date(Date.now() - 86400000).toISOString();

      let data: any[] = [];

      switch (triggerType) {
        case "new_neuron": {
          const { data: neurons } = await supabase
            .from("neurons")
            .select("id, number, title, status, content_category, created_at, score")
            .eq("author_id", userId)
            .gte("created_at", since)
            .order("created_at", { ascending: false })
            .limit(20);
          data = neurons || [];
          break;
        }
        case "extraction_finished": {
          const { data: jobs } = await supabase
            .from("neuron_jobs")
            .select("id, neuron_id, worker_type, status, created_at, completed_at")
            .eq("author_id", userId)
            .eq("status", "completed")
            .gte("completed_at", since)
            .order("completed_at", { ascending: false })
            .limit(20);
          data = jobs || [];
          break;
        }
        case "new_artifact": {
          const { data: artifacts } = await supabase
            .from("artifacts")
            .select("id, title, artifact_type, format, created_at")
            .eq("author_id", userId)
            .gte("created_at", since)
            .order("created_at", { ascending: false })
            .limit(20);
          data = artifacts || [];
          break;
        }
        default:
          return new Response(
            JSON.stringify({ error: `Unknown trigger type: ${triggerType}` }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
          );
      }

      return new Response(JSON.stringify(data), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── POST: Actions ──
    if (req.method === "POST") {
      const action = url.searchParams.get("action") || "";
      const body = await req.json();

      switch (action) {
        case "create_neuron": {
          const { title, content, tags = [] } = body;
          if (!title) {
            return new Response(JSON.stringify({ error: "title is required" }), {
              status: 400,
              headers: { ...cors, "Content-Type": "application/json" },
            });
          }

          const { data: neuron, error } = await supabase
            .from("neurons")
            .insert({
              author_id: userId,
              title,
              body: content || "",
              tags,
              status: "draft",
            })
            .select("id, number, title")
            .single();

          if (error) throw error;
          return new Response(JSON.stringify({ success: true, neuron }), {
            status: 201,
            headers: { ...cors, "Content-Type": "application/json" },
          });
        }

        case "run_extraction": {
          const { content, url: contentUrl, title = "Zapier Import" } = body;
          if (!content && !contentUrl) {
            return new Response(
              JSON.stringify({ error: "Provide 'content' or 'url'" }),
              { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
            );
          }

          // Create episode
          const { data: episode, error } = await supabase
            .from("episodes")
            .insert({
              author_id: userId,
              title,
              source_type: contentUrl ? "url" : "text",
              source_url: contentUrl || null,
              transcript: content || null,
              status: content ? "transcribed" : "pending",
            })
            .select("id")
            .single();

          if (error) throw error;

          return new Response(
            JSON.stringify({ success: true, episode_id: episode.id }),
            { status: 201, headers: { ...cors, "Content-Type": "application/json" } }
          );
        }

        case "ingest_document": {
          const { title = "Zapier Document", content, content_type = "text", url: extUrl } = body;

          const { data: doc, error } = await supabase
            .from("source_documents")
            .insert({
              user_id: userId,
              title,
              content_type,
              raw_content: content || null,
              external_url: extUrl || null,
              metadata: { source: "zapier" },
            })
            .select("id, status, content_hash")
            .single();

          if (error) throw error;
          return new Response(JSON.stringify({ success: true, document: doc }), {
            status: 201,
            headers: { ...cors, "Content-Type": "application/json" },
          });
        }

        default:
          return new Response(
            JSON.stringify({ error: `Unknown action: ${action}` }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
          );
      }
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Zapier trigger error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
