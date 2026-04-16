import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Expert = {
  key: string;
  name: string;
  role: string;
  systemPrompt: string;
  contextFetcher?: (sb: any) => Promise<string>;
};

const EXPERTS: Record<string, Expert> = {
  cfo: {
    key: "cfo",
    name: "CFO Advisor",
    role: "Director Financiar",
    systemPrompt: `Ești CFO al AI-IDEI (SaaS bazat pe credite/neuroni, 1 NEURON = $0.05). Interpretezi: break-even, liability (credite vândute - consumate), unit economics, contribution margin, margin of safety. Răspunzi în română, scurt, cu cifre concrete și acțiuni prioritizate.`,
    contextFetcher: async (sb) => {
      const [be, liab, ue] = await Promise.all([
        sb.from("mcl_break_even_state").select("*").order("computed_at", { ascending: false }).limit(1),
        sb.from("mcl_internal_liability").select("*").order("snapshot_at", { ascending: false }).limit(1),
        sb.from("mcl_unit_economics").select("*").order("computed_at", { ascending: false }).limit(10),
      ]);
      return `### Date financiare curente:\nBreak-even: ${JSON.stringify(be.data?.[0] || null)}\nLiability: ${JSON.stringify(liab.data?.[0] || null)}\nUnit Economics (top 10): ${JSON.stringify(ue.data || [])}`;
    },
  },
  control_center: {
    key: "control_center",
    name: "Control Center Advisor",
    role: "Operations Director",
    systemPrompt: `Ești responsabil cu Control Center: jobs, cron, edge functions, alerte sistem. Interpretezi capacitate, queue depth, kill-switch state, anomalii. Răspunzi în română cu diagnostic + acțiuni operaționale.`,
    contextFetcher: async (sb) => {
      const [cap, alerts, jobs] = await Promise.all([
        sb.from("capacity_state").select("*").limit(1),
        sb.from("admin_alerts").select("*").is("resolved_at", null).order("last_seen", { ascending: false }).limit(10),
        sb.from("neuron_jobs").select("status").gte("created_at", new Date(Date.now() - 86400000).toISOString()),
      ]);
      const jobStats = (jobs.data || []).reduce((a: any, j: any) => { a[j.status] = (a[j.status] || 0) + 1; return a; }, {});
      return `### Sistem operațional:\nCapacity: ${JSON.stringify(cap.data?.[0] || null)}\nAlerte active: ${JSON.stringify(alerts.data || [])}\nJobs 24h: ${JSON.stringify(jobStats)}`;
    },
  },
  analytics: {
    key: "analytics",
    name: "Analytics Advisor",
    role: "Data Analyst",
    systemPrompt: `Ești analist de date. Interpretezi evenimente, trafic, conversii, retention. Răspunzi în română cu insight-uri statistice și recomandări de growth.`,
    contextFetcher: async (sb) => {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const [events, sessions] = await Promise.all([
        sb.from("analytics_events").select("event_name").gte("created_at", since),
        sb.from("user_sessions").select("user_id").gte("started_at", since),
      ]);
      const eventCounts = (events.data || []).reduce((a: any, e: any) => { a[e.event_name] = (a[e.event_name] || 0) + 1; return a; }, {});
      const uniqueUsers = new Set((sessions.data || []).map((s: any) => s.user_id)).size;
      return `### Analytics 7 zile:\nEvenimente top: ${JSON.stringify(eventCounts)}\nUtilizatori unici activi: ${uniqueUsers}\nTotal sessions: ${sessions.data?.length || 0}`;
    },
  },
  kernel: {
    key: "kernel",
    name: "Kernel Advisor",
    role: "Platform Architect",
    systemPrompt: `Ești arhitect Cusnir_OS Kernel. Interpretezi compliance ledger, governance, lock-in score, policy violations. Răspunzi în română cu evaluări de integritate sistem.`,
    contextFetcher: async (sb) => {
      const [ledger, compliance] = await Promise.all([
        sb.from("cusnir_os_ledger").select("event_type, severity").order("created_at", { ascending: false }).limit(50),
        sb.from("compliance_log").select("action_type, severity").order("created_at", { ascending: false }).limit(20),
      ]);
      return `### Kernel state:\nLedger recent (50): ${JSON.stringify(ledger.data || [])}\nCompliance recent: ${JSON.stringify(compliance.data || [])}`;
    },
  },
  content: {
    key: "content",
    name: "Content Advisor",
    role: "Knowledge Director",
    systemPrompt: `Ești director de conținut/knowledge. Interpretezi neuroni publicați, blog posts, calitatea cognitive units, asset marketplace. Răspunzi în română cu recomandări editoriale și de calitate.`,
    contextFetcher: async (sb) => {
      const [neurons, posts, units] = await Promise.all([
        sb.from("neurons").select("status, published").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
        sb.from("blog_posts").select("status").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
        sb.from("cognitive_units").select("quality_score, is_validated").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
      ]);
      const avgQ = units.data?.length ? (units.data.reduce((s: number, u: any) => s + Number(u.quality_score || 0), 0) / units.data.length).toFixed(2) : "n/a";
      return `### Content 30 zile:\nNeuroni: ${neurons.data?.length || 0} (publicați: ${neurons.data?.filter((n: any) => n.published).length || 0})\nBlog posts: ${posts.data?.length || 0}\nCognitive units: ${units.data?.length || 0}, avg quality: ${avgQ}`;
    },
  },
  security: {
    key: "security",
    name: "Security Advisor",
    role: "CISO",
    systemPrompt: `Ești CISO. Interpretezi abuse events, login attempts, RLS issues, prompt injection risks. Răspunzi în română cu evaluare de risc și mitigări.`,
    contextFetcher: async (sb) => {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const [abuse, logins] = await Promise.all([
        sb.from("abuse_events").select("abuse_type, severity").gte("created_at", since),
        sb.from("login_attempts").select("success").gte("attempted_at", since),
      ]);
      const failed = (logins.data || []).filter((l: any) => !l.success).length;
      return `### Security 7 zile:\nAbuse events: ${JSON.stringify(abuse.data || [])}\nLogin failures: ${failed}/${logins.data?.length || 0}`;
    },
  },
  growth: {
    key: "growth",
    name: "Growth/SEO Advisor",
    role: "Head of Growth",
    systemPrompt: `Ești Head of Growth. Focus pe acquisition, SEO, conversion funnel, viral loops. Răspunzi în română cu tactici concrete și metrici de creștere.`,
    contextFetcher: async (sb) => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [profiles, posts] = await Promise.all([
        sb.from("profiles").select("id").gte("created_at", since),
        sb.from("blog_posts").select("status, published_at").eq("status", "published"),
      ]);
      return `### Growth 30 zile:\nUser signups: ${profiles.data?.length || 0}\nPublished blog posts total: ${posts.data?.length || 0}`;
    },
  },
  operations: {
    key: "operations",
    name: "Operations Advisor",
    role: "COO",
    systemPrompt: `Ești COO. Optimizezi workflows, automatizări, eficiență operațională. Răspunzi în română cu propuneri concrete de optimizare a fluxurilor.`,
    contextFetcher: async (sb) => {
      const [autoJobs, autoRuns] = await Promise.all([
        sb.from("automation_jobs").select("is_active, total_runs"),
        sb.from("automation_runs").select("status").gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      ]);
      const active = (autoJobs.data || []).filter((j: any) => j.is_active).length;
      const failed = (autoRuns.data || []).filter((r: any) => r.status === "failed").length;
      return `### Operations:\nAutomation jobs: ${autoJobs.data?.length || 0} (active: ${active})\nRuns 7d: ${autoRuns.data?.length || 0}, failed: ${failed}`;
    },
  },
  pricing: {
    key: "pricing",
    name: "Pricing Advisor",
    role: "Revenue Strategist",
    systemPrompt: `Ești strateg de pricing. Interpretezi billing config, planuri, conversii, ARPU. Sugerezi ajustări de preț pe baza datelor. Răspunzi în română cu logica economică din spate.`,
    contextFetcher: async (sb) => {
      const [config, txn] = await Promise.all([
        sb.from("billing_config").select("*"),
        sb.from("credit_transactions").select("amount, type").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
      ]);
      const purchased = (txn.data || []).filter((t: any) => t.type === "purchase").reduce((s: number, t: any) => s + Number(t.amount), 0);
      const consumed = (txn.data || []).filter((t: any) => t.type === "spend").reduce((s: number, t: any) => s + Math.abs(Number(t.amount)), 0);
      return `### Pricing 30 zile:\nBilling config: ${JSON.stringify(config.data || [])}\nCredits purchased: ${purchased}, consumed: ${consumed}`;
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";

    // Auth verification
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sbAdmin = createClient(supabaseUrl, serviceKey);
    const { data: roleCheck } = await sbAdmin.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Admin required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { conversationId, userMessage, expertKeys } = await req.json();
    if (!conversationId || !userMessage || !Array.isArray(expertKeys) || expertKeys.length === 0) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify conversation ownership
    const { data: conv } = await sbAdmin.from("advisor_conversations").select("user_id").eq("id", conversationId).single();
    if (!conv || conv.user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Save user message
    await sbAdmin.from("advisor_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: userMessage,
    });

    // Fetch full history
    const { data: history } = await sbAdmin
      .from("advisor_messages")
      .select("role, expert_key, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    const baseHistory = (history || []).map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.role === "assistant" && m.expert_key ? `[${EXPERTS[m.expert_key]?.name || m.expert_key}]: ${m.content}` : m.content,
    }));

    // Stream multi-expert: SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (obj: any) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

        for (const expertKey of expertKeys) {
          const expert = EXPERTS[expertKey];
          if (!expert) continue;

          let context = "";
          try {
            if (expert.contextFetcher) context = await expert.contextFetcher(sbAdmin);
          } catch (e) {
            console.error(`Context fetch failed for ${expertKey}:`, e);
          }

          send({ type: "expert_start", expert_key: expertKey, expert_name: expert.name, role: expert.role });

          const messages = [
            { role: "system", content: `${expert.systemPrompt}\n\n${context}\n\nDacă alți consilieri au răspuns deja în acest thread, complementează-le, nu repeta.` },
            ...baseHistory,
          ];

          const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "google/gemini-2.5-flash", messages, stream: true }),
          });

          if (!aiResp.ok || !aiResp.body) {
            const errText = await aiResp.text();
            console.error(`AI error for ${expertKey}:`, aiResp.status, errText);
            if (aiResp.status === 429) send({ type: "error", expert_key: expertKey, error: "Rate limit" });
            else if (aiResp.status === 402) send({ type: "error", expert_key: expertKey, error: "Credite Lovable AI epuizate" });
            else send({ type: "error", expert_key: expertKey, error: "AI gateway error" });
            continue;
          }

          let fullText = "";
          const reader = aiResp.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let nl: number;
            while ((nl = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, nl);
              buffer = buffer.slice(nl + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  fullText += delta;
                  send({ type: "delta", expert_key: expertKey, delta });
                }
              } catch {
                buffer = line + "\n" + buffer;
                break;
              }
            }
          }

          // Persist assistant message
          await sbAdmin.from("advisor_messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            expert_key: expertKey,
            content: fullText,
          });

          // Add to history for next expert
          baseHistory.push({ role: "assistant", content: `[${expert.name}]: ${fullText}` });

          send({ type: "expert_done", expert_key: expertKey });
        }

        // Update conversation timestamp
        await sbAdmin.from("advisor_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);

        send({ type: "done" });
        controller.close();
      },
    });

    return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("admin-council error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
