import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

let _currentReq: Request | null = null;

function json(data: unknown, status = 200) {
  const headers = _currentReq ? getCorsHeaders(_currentReq) : { "Content-Type": "application/json" };
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400) {
  return json({ error: message }, status);
}

// ── Auth: supports both JWT (Authorization: Bearer <jwt>) and API Key (X-API-Key: aiidei_xxx) ──
async function authenticate(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceKey);

  // Try API Key first
  const apiKey = req.headers.get("x-api-key");
  if (apiKey && apiKey.startsWith("aiidei_")) {
    // Hash the key to match stored hash
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    const { data: keyRecord } = await adminClient
      .from("api_keys")
      .select("*")
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .single();

    if (!keyRecord) return { user: null, userId: null, scopes: [], supabase: adminClient, error: "Invalid API key" };

    // Check expiry
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return { user: null, userId: null, scopes: [], supabase: adminClient, error: "API key expired" };
    }

    // Check rate limit
    if (keyRecord.requests_today >= keyRecord.daily_limit) {
      return { user: null, userId: null, scopes: [], supabase: adminClient, error: "Daily rate limit exceeded" };
    }

    // Update usage
    await adminClient.from("api_keys").update({
      last_used_at: new Date().toISOString(),
      requests_today: keyRecord.requests_today + 1,
    }).eq("id", keyRecord.id);

    return {
      user: { id: keyRecord.user_id },
      userId: keyRecord.user_id,
      scopes: keyRecord.scopes || ["read"],
      supabase: adminClient,
      error: null,
    };
  }

  // Fall back to JWT
  const authHeader = req.headers.get("Authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (user) {
      return {
        user,
        userId: user.id,
        scopes: ["read", "write", "admin"],
        supabase: userClient,
        error: null,
      };
    }
  }

  // Unauthenticated — read-only access for public endpoints
  const anonClient = createClient(supabaseUrl, anonKey);
  return { user: null, userId: null, scopes: ["read"], supabase: anonClient, error: null };
}

function hasScope(scopes: string[], required: string): boolean {
  return scopes.includes(required) || scopes.includes("admin");
}

// Parse URL path segments after /neuron-api/
function parsePath(url: URL): string[] {
  const path = url.pathname.replace(/^\/neuron-api\/?/, "").replace(/\/$/, "");
  return path ? path.split("/") : [];
}

Deno.serve(async (req) => {
  _currentReq = req;
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  // Rate limit (IP + API key based)
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const apiKey = req.headers.get("x-api-key") || "";
  const limitKey = apiKey ? `neuron-api:${apiKey.slice(0, 12)}` : `neuron-api:${clientIp}`;
  const rateLimited = await rateLimitGuard(limitKey, req, { maxRequests: 60, windowSeconds: 60 }, getCorsHeaders(req));
  if (rateLimited) return rateLimited;

  const url = new URL(req.url);
  const segments = parsePath(url);
  const method = req.method;

  // ── Root: API info ──
  if (segments.length === 0 && method === "GET") {
    return json({
      name: "AI-IDEI Public API",
      version: "1.0.0",
      endpoints: [
        "GET /neurons",
        "GET /neurons/:id",
        "POST /neurons",
        "PATCH /neurons/:id",
        "DELETE /neurons/:id",
        "GET /neurons/:id/blocks",
        "POST /neurons/:id/blocks",
        "GET /neurons/:id/versions",
        "POST /neurons/:id/versions",
        "POST /neurons/:id/clone",
        "POST /neurons/:id/fork",
        "GET /neurons/:id/links",
        "GET /entities",
        "GET /entities/:slug",
        "GET /jobs",
        "GET /jobs/:id",
        "GET /search?q=...",
        "GET /templates",
        "GET /idearank",
      ],
      auth: "Bearer JWT or X-API-Key header",
      rate_limit: "1000 requests/day per API key",
    });
  }

  const { user, userId, scopes, supabase, error: authError } = await authenticate(req);

  try {
    // ===== SEARCH =====
    if (segments[0] === "search" && method === "GET") {
      const q = url.searchParams.get("q") || "";
      if (!q) return err("Missing search query 'q'");
      const { data, error } = await supabase
        .from("neurons")
        .select("id, number, title, status, visibility, score, updated_at")
        .textSearch("title", q)
        .limit(20);
      if (error) return err(error.message, 500);
      return json(data);
    }

    // ===== ENTITIES =====
    if (segments[0] === "entities") {
      if (method === "GET" && segments.length === 1) {
        const page = parseInt(url.searchParams.get("page") || "1");
        const perPage = Math.min(parseInt(url.searchParams.get("per_page") || "20"), 100);
        const entityType = url.searchParams.get("type");
        const sort = url.searchParams.get("sort") || "importance_score";
        const order = url.searchParams.get("order") || "desc";

        let query = supabase
          .from("entities")
          .select("id, title, slug, entity_type, description, importance_score, idea_rank, confidence_score, evidence_count, reuse_count, created_at", { count: "exact" })
          .eq("is_published", true);
        if (entityType) query = query.eq("entity_type", entityType);
        query = query.order(sort, { ascending: order === "asc" }).range((page - 1) * perPage, page * perPage - 1);

        const { data, error, count } = await query;
        if (error) return err(error.message, 500);
        return json({ data, total: count, page, per_page: perPage });
      }

      if (method === "GET" && segments.length === 2) {
        const slug = segments[1];
        const { data: entity, error } = await supabase
          .from("entities")
          .select("*")
          .eq("slug", slug)
          .eq("is_published", true)
          .single();
        if (error) return err("Entity not found", 404);

        // Get relations
        const { data: relations } = await supabase
          .from("entity_relations")
          .select("id, relation_type, weight, source_entity_id, target_entity_id")
          .or(`source_entity_id.eq.${entity.id},target_entity_id.eq.${entity.id}`);

        // Get topics
        const { data: topics } = await supabase
          .from("entity_topics")
          .select("topic_id, relevance_score")
          .eq("entity_id", entity.id);

        return json({ ...entity, relations, topics });
      }
    }

    // ===== IDEARANK (top entities by importance) =====
    if (segments[0] === "idearank" && method === "GET") {
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
      const { data, error } = await supabase
        .from("entities")
        .select("id, title, slug, entity_type, importance_score, idea_rank, confidence_score, evidence_count, reuse_count")
        .eq("is_published", true)
        .not("importance_score", "is", null)
        .order("importance_score", { ascending: false })
        .limit(limit);
      if (error) return err(error.message, 500);
      return json(data);
    }

    // ===== JOBS =====
    if (segments[0] === "jobs") {
      if (!userId) return err("Authentication required", 401);
      if (authError) return err(authError, 401);

      if (method === "GET" && segments.length === 1) {
        const page = parseInt(url.searchParams.get("page") || "1");
        const perPage = Math.min(parseInt(url.searchParams.get("per_page") || "20"), 100);
        const status = url.searchParams.get("status");

        let query = supabase
          .from("neuron_jobs")
          .select("id, neuron_id, worker_type, status, created_at, completed_at, error_message, retry_count", { count: "exact" })
          .eq("author_id", userId);
        if (status) query = query.eq("status", status);
        query = query.order("created_at", { ascending: false }).range((page - 1) * perPage, page * perPage - 1);

        const { data, error, count } = await query;
        if (error) return err(error.message, 500);
        return json({ data, total: count, page, per_page: perPage });
      }

      if (method === "GET" && segments.length === 2) {
        const { data, error } = await supabase
          .from("neuron_jobs")
          .select("*")
          .eq("id", segments[1])
          .eq("author_id", userId)
          .single();
        if (error) return err("Job not found", 404);
        return json(data);
      }
    }

    // ===== TEMPLATES =====
    if (segments[0] === "templates") {
      if (method === "GET") {
        const { data, error } = await supabase
          .from("neuron_templates")
          .select("*")
          .order("usage_count", { ascending: false });
        if (error) return err(error.message, 500);
        return json(data);
      }
      if (method === "POST" && segments.length === 1) {
        if (!userId || !hasScope(scopes, "write")) return err("Unauthorized", 401);
        const body = await req.json();
        const { data, error } = await supabase
          .from("neuron_templates")
          .insert({ ...body, author_id: userId })
          .select()
          .single();
        if (error) return err(error.message, 500);
        return json(data, 201);
      }
      if (method === "POST" && segments.length === 3 && segments[2] === "use") {
        if (!userId || !hasScope(scopes, "write")) return err("Unauthorized", 401);
        const templateId = segments[1];
        const { data: tpl, error: tplErr } = await supabase
          .from("neuron_templates").select("*").eq("id", templateId).single();
        if (tplErr || !tpl) return err("Template not found", 404);

        const { data: neuron, error: nErr } = await supabase
          .from("neurons").insert({ author_id: userId, title: tpl.name }).select().single();
        if (nErr) return err(nErr.message, 500);

        const blocks = (tpl.blocks_template as any[]).map((b: any, i: number) => ({
          neuron_id: neuron.id, type: b.type || "text", content: b.content || "",
          position: i, execution_mode: b.execution_mode || "passive",
          language: b.language || null, checked: b.type === "todo" ? false : null,
        }));
        if (blocks.length) await supabase.from("neuron_blocks").insert(blocks);
        await supabase.from("neuron_templates").update({ usage_count: (tpl.usage_count || 0) + 1 }).eq("id", templateId);
        return json({ neuron, blocks_created: blocks.length }, 201);
      }
    }

    // ===== NEURONS =====
    if (segments[0] === "neurons") {
      // GET /neurons
      if (method === "GET" && segments.length === 1) {
        const page = parseInt(url.searchParams.get("page") || "1");
        const perPage = Math.min(parseInt(url.searchParams.get("per_page") || "20"), 100);
        const status = url.searchParams.get("status");
        const sort = url.searchParams.get("sort") || "updated_at";
        const order = url.searchParams.get("order") || "desc";

        let query = supabase.from("neurons").select("id, number, title, status, visibility, score, updated_at, created_at", { count: "exact" });
        if (status) query = query.eq("status", status);
        query = query.order(sort, { ascending: order === "asc" }).range((page - 1) * perPage, page * perPage - 1);

        const { data, error, count } = await query;
        if (error) return err(error.message, 500);
        return json({ data, total: count, page, per_page: perPage });
      }

      // POST /neurons
      if (method === "POST" && segments.length === 1) {
        if (!userId || !hasScope(scopes, "write")) return err("Unauthorized", 401);
        const body = await req.json();
        const { data, error } = await supabase
          .from("neurons").insert({ author_id: userId, title: body.title || "Untitled Neuron" }).select().single();
        if (error) return err(error.message, 500);
        return json(data, 201);
      }

      // GET /neurons/:id
      if (method === "GET" && segments.length === 2) {
        const id = segments[1];
        const include = url.searchParams.get("include")?.split(",") || [];
        const { data: neuron, error } = await supabase.from("neurons").select("*").eq("number", id).single();
        if (error) return err("Neuron not found", 404);

        const result: any = { ...neuron };
        if (include.includes("blocks")) {
          const { data: blocks } = await supabase.from("neuron_blocks").select("*").eq("neuron_id", neuron.id).order("position");
          result.blocks = blocks;
        }
        if (include.includes("links")) {
          const { data: outgoing } = await supabase.from("neuron_links").select("*").eq("source_neuron_id", neuron.id);
          const { data: incoming } = await supabase.from("neuron_links").select("*").eq("target_neuron_id", neuron.id);
          result.links = { outgoing, incoming };
        }
        return json(result);
      }

      // PATCH /neurons/:id
      if (method === "PATCH" && segments.length === 2) {
        if (!userId || !hasScope(scopes, "write")) return err("Unauthorized", 401);
        const body = await req.json();
        const allowed = ["title", "status", "visibility"];
        const updates: Record<string, any> = {};
        for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k];
        const { data, error } = await supabase.from("neurons").update(updates).eq("number", segments[1]).select().single();
        if (error) return err(error.message, 500);
        return json(data);
      }

      // DELETE /neurons/:id
      if (method === "DELETE" && segments.length === 2) {
        if (!userId || !hasScope(scopes, "write")) return err("Unauthorized", 401);
        const { error } = await supabase.from("neurons").delete().eq("number", segments[1]);
        if (error) return err(error.message, 500);
        return json({ deleted: true });
      }

      // POST /neurons/:id/clone
      if (method === "POST" && segments.length === 3 && segments[2] === "clone") {
        if (!userId || !hasScope(scopes, "write")) return err("Unauthorized", 401);
        const { data: source } = await supabase.from("neurons").select("*").eq("number", segments[1]).single();
        if (!source) return err("Source neuron not found", 404);

        const { data: cloned } = await supabase.from("neurons").insert({ author_id: userId, title: `${source.title} (clone)` }).select().single();
        if (!cloned) return err("Clone failed", 500);

        const { data: srcBlocks } = await supabase.from("neuron_blocks").select("*").eq("neuron_id", source.id).order("position");
        if (srcBlocks?.length) {
          await supabase.from("neuron_blocks").insert(srcBlocks.map(b => ({
            neuron_id: cloned.id, type: b.type, content: b.content, position: b.position,
            execution_mode: b.execution_mode, language: b.language, checked: b.checked, metadata: b.metadata,
          })));
        }
        await supabase.from("neuron_clones").insert({ source_neuron_id: source.id, cloned_neuron_id: cloned.id, cloned_by: userId, clone_type: "full" });
        return json({ neuron: cloned, blocks_copied: srcBlocks?.length || 0 }, 201);
      }

      // POST /neurons/:id/fork
      if (method === "POST" && segments.length === 3 && segments[2] === "fork") {
        if (!userId || !hasScope(scopes, "write")) return err("Unauthorized", 401);
        const { data: source } = await supabase.from("neurons").select("*").eq("number", segments[1]).single();
        if (!source) return err("Source neuron not found", 404);

        const { data: forked } = await supabase.from("neurons").insert({ author_id: userId, title: `${source.title} (fork)` }).select().single();
        if (!forked) return err("Fork failed", 500);

        const { data: srcBlocks } = await supabase.from("neuron_blocks").select("*").eq("neuron_id", source.id).order("position");
        if (srcBlocks?.length) {
          await supabase.from("neuron_blocks").insert(srcBlocks.map(b => ({
            neuron_id: forked.id, type: b.type, content: b.content, position: b.position,
            execution_mode: b.execution_mode, language: b.language, checked: b.checked, metadata: b.metadata,
          })));
        }
        await supabase.from("neuron_clones").insert({ source_neuron_id: source.id, cloned_neuron_id: forked.id, cloned_by: userId, clone_type: "fork" });
        await supabase.from("neuron_links").insert({ source_neuron_id: forked.id, target_neuron_id: source.id, relation_type: "derived_from" });
        return json({ neuron: forked, blocks_copied: srcBlocks?.length || 0 }, 201);
      }

      // Blocks sub-resources
      if (method === "POST" && segments.length === 3 && segments[2] === "blocks") {
        if (!userId || !hasScope(scopes, "write")) return err("Unauthorized", 401);
        const { data: neuron } = await supabase.from("neurons").select("id").eq("number", segments[1]).single();
        if (!neuron) return err("Neuron not found", 404);
        const body = await req.json();
        const { data, error } = await supabase.from("neuron_blocks").insert({
          neuron_id: neuron.id, type: body.type || "text", content: body.content || "",
          position: body.position ?? 0, execution_mode: body.execution_mode || "passive",
          language: body.language || null, checked: body.type === "todo" ? false : null,
        }).select().single();
        if (error) return err(error.message, 500);
        return json(data, 201);
      }

      if (method === "GET" && segments.length === 3 && segments[2] === "blocks") {
        const { data: neuron } = await supabase.from("neurons").select("id").eq("number", segments[1]).single();
        if (!neuron) return err("Neuron not found", 404);
        const { data, error } = await supabase.from("neuron_blocks").select("*").eq("neuron_id", neuron.id).order("position");
        if (error) return err(error.message, 500);
        return json(data);
      }

      if (method === "GET" && segments.length === 3 && segments[2] === "versions") {
        const { data: neuron } = await supabase.from("neurons").select("id").eq("number", segments[1]).single();
        if (!neuron) return err("Neuron not found", 404);
        const { data, error } = await supabase.from("neuron_versions").select("*").eq("neuron_id", neuron.id).order("version", { ascending: false });
        if (error) return err(error.message, 500);
        return json(data);
      }

      if (method === "POST" && segments.length === 3 && segments[2] === "versions") {
        if (!userId || !hasScope(scopes, "write")) return err("Unauthorized", 401);
        const { data: neuron } = await supabase.from("neurons").select("id, title").eq("number", segments[1]).single();
        if (!neuron) return err("Neuron not found", 404);
        const { data: blocks } = await supabase.from("neuron_blocks").select("*").eq("neuron_id", neuron.id).order("position");
        const body = await req.json().catch(() => ({}));
        const { data: lastVersion } = await supabase.from("neuron_versions").select("id, version").eq("neuron_id", neuron.id).order("version", { ascending: false }).limit(1).single();
        const { data, error } = await supabase.from("neuron_versions").insert({
          neuron_id: neuron.id, version: (lastVersion?.version || 0) + 1,
          title: body.title || neuron.title, change_summary: body.change_summary || "",
          blocks_snapshot: blocks || [], parent_version_id: lastVersion?.id || null, author_id: userId,
        }).select().single();
        if (error) return err(error.message, 500);
        return json(data, 201);
      }

      if (method === "GET" && segments.length === 3 && segments[2] === "links") {
        const { data: neuron } = await supabase.from("neurons").select("id").eq("number", segments[1]).single();
        if (!neuron) return err("Neuron not found", 404);
        const { data: outgoing } = await supabase.from("neuron_links").select("*").eq("source_neuron_id", neuron.id);
        const { data: incoming } = await supabase.from("neuron_links").select("*").eq("target_neuron_id", neuron.id);
        return json({ outgoing, incoming });
      }
    }

    // ===== BLOCKS (standalone) =====
    if (segments[0] === "blocks") {
      if (method === "PATCH" && segments.length === 2) {
        if (!userId || !hasScope(scopes, "write")) return err("Unauthorized", 401);
        const body = await req.json();
        const allowed = ["content", "type", "position", "execution_mode", "language", "checked", "metadata"];
        const updates: Record<string, any> = {};
        for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k];
        const { data, error } = await supabase.from("neuron_blocks").update(updates).eq("id", segments[1]).select().single();
        if (error) return err(error.message, 500);
        return json(data);
      }
      if (method === "DELETE" && segments.length === 2) {
        if (!userId || !hasScope(scopes, "write")) return err("Unauthorized", 401);
        const { error } = await supabase.from("neuron_blocks").delete().eq("id", segments[1]);
        if (error) return err(error.message, 500);
        return json({ deleted: true });
      }
      if (method === "POST" && segments.length === 2 && segments[1] === "reorder") {
        if (!userId || !hasScope(scopes, "write")) return err("Unauthorized", 401);
        const body = await req.json();
        for (const b of body.blocks || []) {
          await supabase.from("neuron_blocks").update({ position: b.position }).eq("id", b.id);
        }
        return json({ reordered: true });
      }
    }

    // ===== LINKS (standalone) =====
    if (segments[0] === "links") {
      if (method === "POST" && segments.length === 1) {
        if (!userId || !hasScope(scopes, "write")) return err("Unauthorized", 401);
        const body = await req.json();
        const { data, error } = await supabase.from("neuron_links").insert({
          source_neuron_id: body.source_neuron_id, target_neuron_id: body.target_neuron_id,
          relation_type: body.relation_type,
        }).select().single();
        if (error) return err(error.message, 500);
        return json(data, 201);
      }
      if (method === "DELETE" && segments.length === 2) {
        if (!userId || !hasScope(scopes, "write")) return err("Unauthorized", 401);
        const { error } = await supabase.from("neuron_links").delete().eq("id", segments[1]);
        if (error) return err(error.message, 500);
        return json({ deleted: true });
      }
    }

    // ===== VERSIONS (standalone) =====
    if (segments[0] === "versions") {
      if (method === "POST" && segments.length === 3 && segments[2] === "restore") {
        if (!userId || !hasScope(scopes, "write")) return err("Unauthorized", 401);
        const { data: version, error: vErr } = await supabase.from("neuron_versions").select("*").eq("id", segments[1]).single();
        if (vErr || !version) return err("Version not found", 404);

        await supabase.from("neuron_blocks").delete().eq("neuron_id", version.neuron_id);
        const snapshot = version.blocks_snapshot as any[];
        if (snapshot?.length) {
          await supabase.from("neuron_blocks").insert(snapshot.map((b: any, i: number) => ({
            neuron_id: version.neuron_id, type: b.type || "text", content: b.content || "",
            position: i, execution_mode: b.execution_mode || b.executionMode || "passive",
            language: b.language || null, checked: b.checked ?? null, metadata: b.metadata || {},
          })));
        }
        await supabase.from("neurons").update({ title: version.title }).eq("id", version.neuron_id);
        return json({ restored: true, version: version.version });
      }
    }

    return err("Not found", 404);
  } catch (e) {
    console.error("Edge function error:", e);
    return err("Internal server error", 500);
  }
});
