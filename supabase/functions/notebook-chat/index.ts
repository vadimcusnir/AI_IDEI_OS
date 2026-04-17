import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

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

    // Rate limit guard (user-based)
    const rateLimited = await rateLimitGuard(user.id, req, { maxRequests: 20, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    const { messages, sources, mode } = await req.json();

    // ── Billing constants ──
    // notebook-chat uses Gemini 3 Flash with multi-source context — slightly heavier than neuron-chat.
    const CHAT_COST_NEURONS = 7;

    // ── Atomic credit deduction (fail-closed: no AI without payment) ──
    const adminClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: deductData, error: deductErr } = await adminClient.rpc("atomic_deduct_neurons", {
      p_user_id: user.id,
      p_amount: CHAT_COST_NEURONS,
      p_description: "notebook_chat",
    });
    const deductRow = Array.isArray(deductData) ? deductData[0] : deductData;
    if (deductErr || !deductRow?.success) {
      const errMsg = deductRow?.error === "Insufficient balance"
        ? "AI credits exhausted. Add credits."
        : (deductRow?.error || "Billing failed");
      return new Response(JSON.stringify({ error: errMsg, code: "INSUFFICIENT_CREDITS", required: CHAT_COST_NEURONS }), {
        status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      await adminClient.rpc("add_credits", { p_user_id: user.id, p_amount: CHAT_COST_NEURONS });
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build context from selected sources
    const sourceContext = (sources || [])
      .map((s: { title: string; content: string }, i: number) => `[Source ${i + 1}: ${s.title}]\n${s.content}`)
      .join("\n\n---\n\n");

    const systemPrompt = mode === "studio"
      ? `Ești un motor AI de generare conținut. Primești surse de cunoștințe și generezi artefacte de înaltă calitate.
Răspunde în limba în care este scris conținutul surselor. Fii concis, structurat, profesional.
Dacă nu ai surse, explică ce ai nevoie.

SURSE DISPONIBILE:
${sourceContext || "Nicio sursă selectată."}`
      : `Ești un asistent AI de analiză și sinteză a cunoștințelor. Lucrezi cu un workspace de tip Notebook.
Ai acces la sursele de mai jos. Răspunde întrebărilor utilizatorului pe baza lor.
Fii concis, structurat, și citează sursele când e relevant.
Răspunde în limba în care ți se pune întrebarea.

SURSE DISPONIBILE:
${sourceContext || "Nicio sursă selectată. Cere utilizatorului să adauge surse."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      // Refund on AI gateway failure
      await adminClient.rpc("add_credits", { p_user_id: user.id, p_amount: CHAT_COST_NEURONS });
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...getCorsHeaders(req), "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("notebook-chat error:", error);
    return new Response(
      JSON.stringify({ error: "Chat processing failed" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
