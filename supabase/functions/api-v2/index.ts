import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";

/**
 * P3-009: Public API v2
 * Extended REST-like API with structured endpoints for:
 * - Neurons (list, get, search)
 * - Entities (list, get, relations)
 * - Services (catalog, execute)
 * - Artifacts (list, get, export)
 *
 * Auth: API key via x-api-key header, validated against api_keys table.
 */
Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Authenticate via API key
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return json({ error: "Missing x-api-key header" }, 401, corsHeaders);
  }

  // Hash the key and look up
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const keyHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const { data: keyRecord } = await supabase
    .from("api_keys")
    .select("id, user_id, scopes, is_active, daily_limit, requests_today")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .maybeSingle();

  if (!keyRecord) {
    return json({ error: "Invalid API key" }, 403, corsHeaders);
  }

  // Rate limit check
  if (keyRecord.requests_today >= keyRecord.daily_limit) {
    return json({ error: "Daily rate limit exceeded", limit: keyRecord.daily_limit }, 429, corsHeaders);
  }

  // Increment usage
  await supabase
    .from("api_keys")
    .update({
      requests_today: keyRecord.requests_today + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", keyRecord.id);

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  // Expected: /api-v2 or function invocation path, then resource/id
  // We parse from query params for edge function compatibility
  const resource = url.searchParams.get("resource") || pathParts[pathParts.length - 2] || "";
  const resourceId = url.searchParams.get("id") || pathParts[pathParts.length - 1] || "";
  const action = url.searchParams.get("action") || "list";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  try {
    switch (resource) {
      case "neurons": {
        if (!hasScope(keyRecord.scopes, "neurons:read")) {
          return json({ error: "Scope neurons:read required" }, 403, corsHeaders);
        }
        if (resourceId && action !== "list") {
          const { data, error } = await supabase
            .from("neurons" as any)
            .select("*")
            .eq("id", parseInt(resourceId))
            .eq("author_id", keyRecord.user_id)
            .single();
          if (error) throw error;
          return json({ data }, 200, corsHeaders);
        }
        const { data, error, count } = await supabase
          .from("neurons" as any)
          .select("id, title, score, status, lifecycle, created_at, content_category", { count: "exact" })
          .eq("author_id", keyRecord.user_id)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) throw error;
        return json({ data, total: count, limit, offset }, 200, corsHeaders);
      }

      case "entities": {
        if (!hasScope(keyRecord.scopes, "entities:read")) {
          return json({ error: "Scope entities:read required" }, 403, corsHeaders);
        }

        // SECURITY: Scope entities to user's own neurons to prevent cross-tenant IDOR
        const { data: userNeuronIds } = await supabase
          .from("neurons" as any)
          .select("id")
          .eq("author_id", keyRecord.user_id);
        const allowedNeuronIds = (userNeuronIds || []).map((n: any) => n.id);

        if (resourceId && action !== "list") {
          const { data, error } = await supabase
            .from("entities")
            .select("*, entity_labels(*), entity_relations!entity_relations_source_entity_id_fkey(*)")
            .eq("id", resourceId)
            .in("neuron_id", allowedNeuronIds)
            .single();
          if (error) throw error;
          return json({ data }, 200, corsHeaders);
        }
        const search = url.searchParams.get("search");
        // Sanitize search param — strip PostgREST operators to prevent filter injection
        const sanitizedSearch = search
          ? search.replace(/[.,()]/g, "").slice(0, 200)
          : null;
        let query = supabase
          .from("entities")
          .select("id, title, entity_type, idea_rank, slug, description", { count: "exact" })
          .in("neuron_id", allowedNeuronIds)
          .order("idea_rank", { ascending: false, nullsFirst: false })
          .range(offset, offset + limit - 1);
        if (sanitizedSearch) {
          query = query.or(`title.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
        }
        const { data, error, count } = await query;
        if (error) throw error;
        return json({ data, total: count, limit, offset }, 200, corsHeaders);
      }

      case "services": {
        if (!hasScope(keyRecord.scopes, "services:read")) {
          return json({ error: "Scope services:read required" }, 403, corsHeaders);
        }
        const { data, error } = await supabase
          .from("service_catalog")
          .select("id, service_key, name, description, category, credits_cost, access_tier, is_active")
          .eq("is_active", true)
          .order("name")
          .range(offset, offset + limit - 1);
        if (error) throw error;
        return json({ data, limit, offset }, 200, corsHeaders);
      }

      case "artifacts": {
        if (!hasScope(keyRecord.scopes, "artifacts:read")) {
          return json({ error: "Scope artifacts:read required" }, 403, corsHeaders);
        }
        if (resourceId && action !== "list") {
          const { data, error } = await supabase
            .from("artifacts")
            .select("*")
            .eq("id", resourceId)
            .eq("author_id", keyRecord.user_id)
            .single();
          if (error) throw error;
          return json({ data }, 200, corsHeaders);
        }
        const { data, error, count } = await supabase
          .from("artifacts")
          .select("id, title, artifact_type, format, status, created_at", { count: "exact" })
          .eq("author_id", keyRecord.user_id)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) throw error;
        return json({ data, total: count, limit, offset }, 200, corsHeaders);
      }

      default:
        return json({
          error: "Unknown resource",
          available: ["neurons", "entities", "services", "artifacts"],
          usage: "?resource=neurons&action=list&limit=20",
        }, 400, corsHeaders);
    }
  } catch (err) {
    return json({ error: (err as Error).message }, 500, corsHeaders);
  }
});

function hasScope(scopes: string[], required: string): boolean {
  return scopes.includes("*") || scopes.includes(required);
}

function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
