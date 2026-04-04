import { getCorsHeaders } from "../_shared/cors.ts";
/**
 * knowledge-graph-export — Exports the platform's knowledge graph as JSON-LD @graph.
 * Public endpoint, cached daily in knowledge_graph_cache table.
 * 
 * GET /knowledge-graph-export → JSON-LD with Person, Organization, CreativeWork, DefinedTerm
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

const BASE_URL = "https://ai-idei.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Rate limit guard (IP-based)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimited = await rateLimitGuard(clientIp + ":knowledge-graph-export", req, { maxRequests: 20, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get("refresh") === "true";

    // Check cache first
    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from("knowledge_graph_cache")
        .select("graph_data, entity_count, generated_at, expires_at")
        .eq("cache_key", "main")
        .single();

      if (cached && new Date(cached.expires_at) > new Date()) {
        return new Response(JSON.stringify(cached.graph_data), {
          headers: { ...getCorsHeaders(req),
            "Content-Type": "application/ld+json",
            "X-Cache": "HIT",
            "X-Entity-Count": String(cached.entity_count),
            "X-Generated-At": cached.generated_at,
          },
        });
      }
    }

    // Build the graph
    const [entitiesResult, guestsResult, topicsResult] = await Promise.all([
      supabase
        .from("entities")
        .select("id, slug, entity_type, name, summary, tags, updated_at")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(1000),
      supabase
        .from("guest_profiles")
        .select("id, full_name, role, bio, expertise_areas")
        .limit(500),
      supabase
        .from("topics")
        .select("id, slug, title, description, updated_at")
        .order("updated_at", { ascending: false })
        .limit(500),
    ]);

    const entities = entitiesResult.data || [];
    const guests = guestsResult.data || [];
    const topics = topicsResult.data || [];

    const graph: any[] = [];

    // Organization node
    graph.push({
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "AI-IDEI",
      url: BASE_URL,
      logo: `${BASE_URL}/favicon.gif`,
      description: "AI-driven expertise capitalization platform",
    });

    // Entity type to schema.org mapping
    const typeMap: Record<string, string> = {
      insight: "CreativeWork",
      pattern: "DefinedTerm",
      formula: "DefinedTerm",
      contradiction: "CreativeWork",
      application: "CreativeWork",
      profile: "Person",
    };

    const pluralMap: Record<string, string> = {
      insight: "insights",
      pattern: "patterns",
      formula: "formulas",
      contradiction: "contradictions",
      application: "applications",
      profile: "profiles",
    };

    // Entities → CreativeWork / DefinedTerm
    for (const entity of entities) {
      const schemaType = typeMap[entity.entity_type] || "CreativeWork";
      const plural = pluralMap[entity.entity_type] || entity.entity_type + "s";

      const node: any = {
        "@type": schemaType,
        "@id": `${BASE_URL}/${plural}/${entity.slug}`,
        name: entity.name,
        url: `${BASE_URL}/${plural}/${entity.slug}`,
        dateModified: entity.updated_at,
        publisher: { "@id": `${BASE_URL}/#organization` },
      };

      if (entity.summary) node.description = entity.summary;
      if (entity.tags?.length) node.keywords = entity.tags.join(", ");

      if (schemaType === "DefinedTerm") {
        node.inDefinedTermSet = {
          "@type": "DefinedTermSet",
          name: `AI-IDEI ${entity.entity_type}s`,
        };
      }

      graph.push(node);
    }

    // Guests → Person
    for (const guest of guests) {
      const node: any = {
        "@type": "Person",
        "@id": `${BASE_URL}/guests/${guest.id}`,
        name: guest.full_name,
        url: `${BASE_URL}/guests/${guest.id}`,
      };

      if (guest.role) node.jobTitle = guest.role;
      if (guest.bio) node.description = guest.bio;
      if (guest.expertise_areas?.length) {
        node.knowsAbout = guest.expertise_areas;
      }

      graph.push(node);
    }

    // Topics → DefinedTerm
    for (const topic of topics) {
      graph.push({
        "@type": "DefinedTerm",
        "@id": `${BASE_URL}/topics/${topic.slug}`,
        name: topic.title,
        url: `${BASE_URL}/topics/${topic.slug}`,
        description: topic.description || "",
        dateModified: topic.updated_at,
        inDefinedTermSet: {
          "@type": "DefinedTermSet",
          name: "AI-IDEI Topics",
        },
      });
    }

    // Dataset node for the whole knowledge graph
    graph.push({
      "@type": "Dataset",
      "@id": `${BASE_URL}/#knowledge-graph`,
      name: "AI-IDEI Knowledge Graph",
      description: "Structured knowledge graph containing insights, patterns, formulas, and expert profiles extracted from expert content.",
      url: `${BASE_URL}/intelligence`,
      creator: { "@id": `${BASE_URL}/#organization` },
      license: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
      keywords: "knowledge graph, AI, marketing, expertise, patterns, insights",
      measurementTechnique: "AI-powered extraction and classification",
      variableMeasured: [
        { "@type": "PropertyValue", name: "entities", value: entities.length },
        { "@type": "PropertyValue", name: "persons", value: guests.length },
        { "@type": "PropertyValue", name: "topics", value: topics.length },
      ],
    });

    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": graph,
    };

    const entityCount = graph.length;

    // Store in cache
    await supabase.from("knowledge_graph_cache").upsert({
      cache_key: "main",
      graph_data: jsonLd,
      entity_count: entityCount,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: "cache_key" });

    return new Response(JSON.stringify(jsonLd), {
      headers: { ...getCorsHeaders(req),
        "Content-Type": "application/ld+json",
        "X-Cache": "MISS",
        "X-Entity-Count": String(entityCount),
      },
    });
  } catch (err) {
    console.error("knowledge-graph-export error:", err);
    return new Response(JSON.stringify({ error: "Failed to generate knowledge graph" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
