import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { loadPrompt } from "../_shared/prompt-loader.ts";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

const FALLBACK_SYSTEM_PROMPT = `You are the AI assistant embedded in a Knowledge Operating System called AI-IDEI.

You have full context of the current Neuron (a structured knowledge document) the user is working on.

Your capabilities:
- Answer questions about the neuron's content
- Explain concepts mentioned in the neuron
- Suggest improvements, connections, or expansions
- Help refine ideas, arguments, and frameworks
- Generate related content on request

Rules:
- Be concise but thorough
- Use markdown formatting
- Reference specific parts of the neuron content when relevant
- If the neuron is empty, suggest what the user could add
- Speak in the same language as the user`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    // ── Authenticate via JWT ──
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ── Regime enforcement ──
    const regime = await getRegimeConfig("neuron-chat");
    const blockReason = checkRegimeBlock(regime, 0);
    if (blockReason) {
      return new Response(JSON.stringify({ error: "Service blocked", reason: blockReason, regime: regime.regime }), {
        status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const MessageSchema = z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().max(150_000, "Message too long (max 150k chars)"),
    });
    const InputSchema = z.object({
      messages: z.array(MessageSchema).min(1, "Messages array required").max(50, "Too many messages"),
      neuron_context: z.object({
        title: z.string().max(500).optional(),
        blocks: z.array(z.object({
          type: z.string(),
          content: z.string().max(50_000),
        })).optional(),
      }).optional(),
    });

    const parsed = InputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message || "Invalid input" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const { messages, neuron_context } = parsed.data;

    // Build context from neuron blocks
    let contextBlock = "";
    if (neuron_context) {
      const { title, blocks } = neuron_context;
      const content = (blocks || [])
        .filter((b: any) => b.content?.trim())
        .map((b: any) => `[${b.type}] ${b.content}`)
        .join("\n\n");
      contextBlock = `\n\nCurrent Neuron: "${title || "Untitled"}"\n\nNeuron Content:\n${content}`;
    }

    // Load prompt from registry (falls back to hardcoded if no DB entry)
    const { prompt: basePrompt } = await loadPrompt("neuron_chat", FALLBACK_SYSTEM_PROMPT);
    const systemPrompt = basePrompt + contextBlock;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt.slice(0, 80_000) },
          ...messages.slice(-20).map(m => ({
            ...m,
            content: m.content.length > 100_000 ? m.content.slice(0, 100_000) + "\n\n[...truncated]" : m.content,
          })),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...getCorsHeaders(req), "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("neuron-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
