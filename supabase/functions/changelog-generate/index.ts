import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify admin via JWT
    const authHeader = req.headers.get("Authorization");
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: roleCheck } = await supabaseUser.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!roleCheck) throw new Error("Admin required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { version, since } = await req.json();
    const sinceDate = since || new Date(Date.now() - 7 * 86400000).toISOString();

    // Fetch unprocessed raw changes
    const { data: rawChanges } = await supabase
      .from("changes_raw")
      .select("*")
      .gte("created_at", sinceDate)
      .eq("impact_level", "user")
      .order("created_at", { ascending: true });

    if (!rawChanges?.length) {
      return new Response(JSON.stringify({ drafts: 0, message: "No user-facing changes found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt for AI
    const changesSummary = rawChanges.map((c: any) =>
      `- [${c.source}] ${c.component || "system"}: ${c.diff_summary || "change detected"}`
    ).join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a product changelog writer for AI-IDEI, an AI-driven expertise capitalization platform.
Generate user-facing changelog entries from technical changes. NEVER mention admin panels, internal tools, or infrastructure.
Each entry must answer: "What changed for the user?"
Respond in Romanian.`
          },
          {
            role: "user",
            content: `Generate changelog entries from these changes:\n\n${changesSummary}\n\nVersion: ${version || "next"}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_changelog_entries",
            description: "Create structured changelog entries for users",
            parameters: {
              type: "object",
              properties: {
                entries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string", enum: ["new_feature", "improvement", "bug_fix", "ui_ux", "performance", "integration", "documentation"] },
                      title: { type: "string", description: "Short descriptive title in Romanian" },
                      description: { type: "string", description: "User-facing description in Romanian" },
                      example: { type: "string", description: "Practical usage example in Romanian" },
                      user_benefit: { type: "string", description: "User benefit explanation in Romanian" }
                    },
                    required: ["category", "title", "description"],
                    additionalProperties: false
                  }
                }
              },
              required: ["entries"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_changelog_entries" } }
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const { entries } = JSON.parse(toolCall.function.arguments);

    // Insert as drafts
    const drafts = entries.map((e: any, i: number) => ({
      version: version || "",
      category: e.category,
      title: e.title,
      description: e.description || "",
      example: e.example || "",
      user_benefit: e.user_benefit || "",
      status: "draft",
      position: i,
      release_date: new Date().toISOString().split("T")[0],
      created_by: user.id,
    }));

    const { data: inserted, error: insertErr } = await supabase
      .from("changelog_entries")
      .insert(drafts)
      .select("id, title");
    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ drafts: inserted?.length || 0, entries: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("changelog-generate error:", e);
    const status = e.message === "Unauthorized" || e.message === "Admin required" ? 401 : 500;
    return new Response(JSON.stringify({ error: e.message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
