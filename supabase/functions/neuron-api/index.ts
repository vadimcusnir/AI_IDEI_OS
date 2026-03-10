import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400) {
  return json({ error: message }, status);
}

function getSupabase(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

// Parse URL path segments after /neuron-api/
function parsePath(url: URL): string[] {
  const path = url.pathname.replace(/^\/neuron-api\/?/, "").replace(/\/$/, "");
  return path ? path.split("/") : [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const segments = parsePath(url);
  const method = req.method;
  const supabase = getSupabase(req);

  // Auth check
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

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
        if (!user) return err("Unauthorized", 401);
        const body = await req.json();
        const { data, error } = await supabase
          .from("neuron_templates")
          .insert({ ...body, author_id: user.id })
          .select()
          .single();
        if (error) return err(error.message, 500);
        return json(data, 201);
      }
      // POST /templates/:id/use
      if (method === "POST" && segments.length === 3 && segments[2] === "use") {
        if (!user) return err("Unauthorized", 401);
        const templateId = segments[1];
        const { data: tpl, error: tplErr } = await supabase
          .from("neuron_templates")
          .select("*")
          .eq("id", templateId)
          .single();
        if (tplErr || !tpl) return err("Template not found", 404);

        // Create neuron from template
        const { data: neuron, error: nErr } = await supabase
          .from("neurons")
          .insert({ author_id: user.id, title: tpl.name })
          .select()
          .single();
        if (nErr) return err(nErr.message, 500);

        // Create blocks from template
        const blocks = (tpl.blocks_template as any[]).map((b: any, i: number) => ({
          neuron_id: neuron.id,
          type: b.type || "text",
          content: b.content || "",
          position: i,
          execution_mode: b.execution_mode || "passive",
          language: b.language || null,
          checked: b.type === "todo" ? false : null,
        }));
        if (blocks.length) await supabase.from("neuron_blocks").insert(blocks);

        // Increment usage count (service level, may fail silently)
        await supabase.from("neuron_templates").update({ usage_count: (tpl.usage_count || 0) + 1 }).eq("id", templateId);

        return json({ neuron, blocks_created: blocks.length }, 201);
      }
    }

    // ===== NEURONS =====
    if (segments[0] === "neurons") {
      // GET /neurons — list
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

      // POST /neurons — create
      if (method === "POST" && segments.length === 1) {
        if (!user) return err("Unauthorized", 401);
        const body = await req.json();
        const { data, error } = await supabase
          .from("neurons")
          .insert({ author_id: user.id, title: body.title || "Untitled Neuron" })
          .select()
          .single();
        if (error) return err(error.message, 500);
        return json(data, 201);
      }

      // GET /neurons/:id
      if (method === "GET" && segments.length === 2) {
        const id = segments[1];
        const include = url.searchParams.get("include")?.split(",") || [];
        const { data: neuron, error } = await supabase
          .from("neurons")
          .select("*")
          .eq("number", id)
          .single();
        if (error) return err("Neuron not found", 404);

        const result: any = { ...neuron };
        if (include.includes("blocks")) {
          const { data: blocks } = await supabase
            .from("neuron_blocks").select("*").eq("neuron_id", neuron.id).order("position");
          result.blocks = blocks;
        }
        if (include.includes("links")) {
          const { data: outgoing } = await supabase
            .from("neuron_links").select("*").eq("source_neuron_id", neuron.id);
          const { data: incoming } = await supabase
            .from("neuron_links").select("*").eq("target_neuron_id", neuron.id);
          result.links = { outgoing, incoming };
        }
        return json(result);
      }

      // PATCH /neurons/:id
      if (method === "PATCH" && segments.length === 2) {
        if (!user) return err("Unauthorized", 401);
        const id = segments[1];
        const body = await req.json();
        const allowed = ["title", "status", "visibility"];
        const updates: Record<string, any> = {};
        for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k];

        const { data, error } = await supabase
          .from("neurons").update(updates).eq("number", id).select().single();
        if (error) return err(error.message, 500);
        return json(data);
      }

      // DELETE /neurons/:id
      if (method === "DELETE" && segments.length === 2) {
        if (!user) return err("Unauthorized", 401);
        const id = segments[1];
        const { error } = await supabase.from("neurons").delete().eq("number", id);
        if (error) return err(error.message, 500);
        return json({ deleted: true });
      }

      // POST /neurons/:id/clone
      if (method === "POST" && segments.length === 3 && segments[2] === "clone") {
        if (!user) return err("Unauthorized", 401);
        const sourceNumber = segments[1];

        const { data: source, error: srcErr } = await supabase
          .from("neurons").select("*").eq("number", sourceNumber).single();
        if (srcErr) return err("Source neuron not found", 404);

        // Create cloned neuron
        const { data: cloned, error: cloneErr } = await supabase
          .from("neurons")
          .insert({ author_id: user.id, title: `${source.title} (clone)` })
          .select().single();
        if (cloneErr) return err(cloneErr.message, 500);

        // Copy blocks
        const { data: srcBlocks } = await supabase
          .from("neuron_blocks").select("*").eq("neuron_id", source.id).order("position");
        if (srcBlocks?.length) {
          const newBlocks = srcBlocks.map(b => ({
            neuron_id: cloned.id,
            type: b.type,
            content: b.content,
            position: b.position,
            execution_mode: b.execution_mode,
            language: b.language,
            checked: b.checked,
            metadata: b.metadata,
          }));
          await supabase.from("neuron_blocks").insert(newBlocks);
        }

        // Track lineage
        await supabase.from("neuron_clones").insert({
          source_neuron_id: source.id,
          cloned_neuron_id: cloned.id,
          cloned_by: user.id,
          clone_type: "full",
        });

        return json({ neuron: cloned, blocks_copied: srcBlocks?.length || 0 }, 201);
      }

      // POST /neurons/:id/fork
      if (method === "POST" && segments.length === 3 && segments[2] === "fork") {
        if (!user) return err("Unauthorized", 401);
        const sourceNumber = segments[1];

        const { data: source } = await supabase
          .from("neurons").select("*").eq("number", sourceNumber).single();
        if (!source) return err("Source neuron not found", 404);

        const { data: forked } = await supabase
          .from("neurons")
          .insert({ author_id: user.id, title: `${source.title} (fork)` })
          .select().single();
        if (!forked) return err("Failed to create fork", 500);

        // Copy blocks
        const { data: srcBlocks } = await supabase
          .from("neuron_blocks").select("*").eq("neuron_id", source.id).order("position");
        if (srcBlocks?.length) {
          await supabase.from("neuron_blocks").insert(
            srcBlocks.map(b => ({
              neuron_id: forked.id, type: b.type, content: b.content,
              position: b.position, execution_mode: b.execution_mode,
              language: b.language, checked: b.checked, metadata: b.metadata,
            }))
          );
        }

        // Track lineage + create derived_from link
        await supabase.from("neuron_clones").insert({
          source_neuron_id: source.id, cloned_neuron_id: forked.id,
          cloned_by: user.id, clone_type: "fork",
        });
        await supabase.from("neuron_links").insert({
          source_neuron_id: forked.id, target_neuron_id: source.id,
          relation_type: "derived_from",
        });

        return json({ neuron: forked, blocks_copied: srcBlocks?.length || 0 }, 201);
      }

      // ===== BLOCKS within neuron =====
      // POST /neurons/:id/blocks
      if (method === "POST" && segments.length === 3 && segments[2] === "blocks") {
        if (!user) return err("Unauthorized", 401);
        const neuronNumber = segments[1];
        const { data: neuron } = await supabase
          .from("neurons").select("id").eq("number", neuronNumber).single();
        if (!neuron) return err("Neuron not found", 404);

        const body = await req.json();
        const { data, error } = await supabase
          .from("neuron_blocks")
          .insert({
            neuron_id: neuron.id,
            type: body.type || "text",
            content: body.content || "",
            position: body.position ?? 0,
            execution_mode: body.execution_mode || "passive",
            language: body.language || null,
            checked: body.type === "todo" ? false : null,
          })
          .select().single();
        if (error) return err(error.message, 500);
        return json(data, 201);
      }

      // GET /neurons/:id/blocks
      if (method === "GET" && segments.length === 3 && segments[2] === "blocks") {
        const neuronNumber = segments[1];
        const { data: neuron } = await supabase
          .from("neurons").select("id").eq("number", neuronNumber).single();
        if (!neuron) return err("Neuron not found", 404);
        const { data, error } = await supabase
          .from("neuron_blocks").select("*").eq("neuron_id", neuron.id).order("position");
        if (error) return err(error.message, 500);
        return json(data);
      }

      // ===== VERSIONS within neuron =====
      // GET /neurons/:id/versions
      if (method === "GET" && segments.length === 3 && segments[2] === "versions") {
        const neuronNumber = segments[1];
        const { data: neuron } = await supabase
          .from("neurons").select("id").eq("number", neuronNumber).single();
        if (!neuron) return err("Neuron not found", 404);
        const { data, error } = await supabase
          .from("neuron_versions").select("*").eq("neuron_id", neuron.id).order("version", { ascending: false });
        if (error) return err(error.message, 500);
        return json(data);
      }

      // POST /neurons/:id/versions — create snapshot
      if (method === "POST" && segments.length === 3 && segments[2] === "versions") {
        if (!user) return err("Unauthorized", 401);
        const neuronNumber = segments[1];
        const { data: neuron } = await supabase
          .from("neurons").select("id, title").eq("number", neuronNumber).single();
        if (!neuron) return err("Neuron not found", 404);

        const { data: blocks } = await supabase
          .from("neuron_blocks").select("*").eq("neuron_id", neuron.id).order("position");

        const body = await req.json().catch(() => ({}));
        const { data: lastVersion } = await supabase
          .from("neuron_versions").select("id, version").eq("neuron_id", neuron.id)
          .order("version", { ascending: false }).limit(1).single();

        const { data, error } = await supabase
          .from("neuron_versions")
          .insert({
            neuron_id: neuron.id,
            version: (lastVersion?.version || 0) + 1,
            title: body.title || neuron.title,
            change_summary: body.change_summary || "",
            blocks_snapshot: blocks || [],
            parent_version_id: lastVersion?.id || null,
            author_id: user.id,
          })
          .select().single();
        if (error) return err(error.message, 500);
        return json(data, 201);
      }

      // GET /neurons/:id/links
      if (method === "GET" && segments.length === 3 && segments[2] === "links") {
        const neuronNumber = segments[1];
        const { data: neuron } = await supabase
          .from("neurons").select("id").eq("number", neuronNumber).single();
        if (!neuron) return err("Neuron not found", 404);
        const { data: outgoing } = await supabase
          .from("neuron_links").select("*").eq("source_neuron_id", neuron.id);
        const { data: incoming } = await supabase
          .from("neuron_links").select("*").eq("target_neuron_id", neuron.id);
        return json({ outgoing, incoming });
      }
    }

    // ===== BLOCKS (standalone) =====
    if (segments[0] === "blocks") {
      // PATCH /blocks/:id
      if (method === "PATCH" && segments.length === 2) {
        if (!user) return err("Unauthorized", 401);
        const body = await req.json();
        const allowed = ["content", "type", "position", "execution_mode", "language", "checked", "metadata"];
        const updates: Record<string, any> = {};
        for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k];

        const { data, error } = await supabase
          .from("neuron_blocks").update(updates).eq("id", segments[1]).select().single();
        if (error) return err(error.message, 500);
        return json(data);
      }

      // DELETE /blocks/:id
      if (method === "DELETE" && segments.length === 2) {
        if (!user) return err("Unauthorized", 401);
        const { error } = await supabase.from("neuron_blocks").delete().eq("id", segments[1]);
        if (error) return err(error.message, 500);
        return json({ deleted: true });
      }

      // POST /blocks/reorder
      if (method === "POST" && segments.length === 2 && segments[1] === "reorder") {
        if (!user) return err("Unauthorized", 401);
        const body = await req.json();
        // body.blocks = [{ id, position }]
        for (const b of body.blocks || []) {
          await supabase.from("neuron_blocks").update({ position: b.position }).eq("id", b.id);
        }
        return json({ reordered: true });
      }
    }

    // ===== LINKS (standalone) =====
    if (segments[0] === "links") {
      if (method === "POST" && segments.length === 1) {
        if (!user) return err("Unauthorized", 401);
        const body = await req.json();
        const { data, error } = await supabase
          .from("neuron_links")
          .insert({
            source_neuron_id: body.source_neuron_id,
            target_neuron_id: body.target_neuron_id,
            relation_type: body.relation_type,
          })
          .select().single();
        if (error) return err(error.message, 500);
        return json(data, 201);
      }
      if (method === "DELETE" && segments.length === 2) {
        if (!user) return err("Unauthorized", 401);
        const { error } = await supabase.from("neuron_links").delete().eq("id", segments[1]);
        if (error) return err(error.message, 500);
        return json({ deleted: true });
      }
    }

    // ===== VERSIONS (standalone) =====
    if (segments[0] === "versions") {
      // POST /versions/:id/restore
      if (method === "POST" && segments.length === 3 && segments[2] === "restore") {
        if (!user) return err("Unauthorized", 401);
        const versionId = segments[1];
        const { data: version, error: vErr } = await supabase
          .from("neuron_versions").select("*").eq("id", versionId).single();
        if (vErr || !version) return err("Version not found", 404);

        // Delete current blocks
        await supabase.from("neuron_blocks").delete().eq("neuron_id", version.neuron_id);

        // Restore from snapshot
        const snapshot = version.blocks_snapshot as any[];
        if (snapshot?.length) {
          const blocks = snapshot.map((b: any, i: number) => ({
            neuron_id: version.neuron_id,
            type: b.type || "text",
            content: b.content || "",
            position: i,
            execution_mode: b.execution_mode || b.executionMode || "passive",
            language: b.language || null,
            checked: b.checked ?? null,
            metadata: b.metadata || {},
          }));
          await supabase.from("neuron_blocks").insert(blocks);
        }

        // Update neuron title
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
