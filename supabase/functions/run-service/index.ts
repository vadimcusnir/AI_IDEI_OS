import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getRegimeConfig, checkRegimeBlock } from "../_shared/regime-check.ts";
import { loadPrompt } from "../_shared/prompt-loader.ts";

/**
 * SERVICE_PROMPTS removed — F-001 Security Remediation.
 * All prompts now live in prompt_registry table and are loaded via loadPrompt().
 * This eliminates IP exposure in deployed edge function code.
 * 
 * The loadPrompt() function (from _shared/prompt-loader.ts) handles:
 * - DB lookup by service_key
 * - In-memory caching per invocation
 * - Modifier application (tone, language, format)
 * - Version tracking
 */
const DEFAULT_FALLBACK_PROMPT = `You are a knowledge extraction and analysis engine. Analyze the provided content thoroughly.
Structure your output with ## headings. Provide actionable insights, patterns, and recommendations.
Be specific, data-driven, and practical.`;
const SERVICE_ARTIFACT_TYPE: Record<string, string> = {
  "insight-extractor": "document",
  "framework-detector": "document",
  "question-engine": "document",
  "quote-extractor": "document",
  "prompt-generator": "prompt",
  "market-research": "report",
  "course-generator": "course",
  "content-classifier": "document",
  "strategy-builder": "strategy",
  "argument-mapper": "document",
  "profile-extractor": "profile",
  "prompt-forge": "prompt",
  "hook-generator": "document",
  "objection-handler": "document",
  "email-sequence": "document",
  "social-carousel": "document",
  "seo-article": "document",
  "podcast-shownotes": "document",
  "video-script": "document",
  "lead-magnet": "document",
  "swipe-file": "document",
  "competitor-analysis": "report",
  "jtbd-extractor": "document",
  "persuasion-map": "document",
  "newsletter-generator": "document",
  "workshop-designer": "document",
  "case-study-builder": "document",
  "brand-voice": "document",
  "pricing-strategy": "report",
  "funnel-architect": "strategy",
  "thought-leadership": "document",
  "audience-avatar": "document",
  // Batch 2
  "webinar-script": "document",
  "linkedin-strategy": "strategy",
  "sales-page": "document",
  "coaching-framework": "document",
  "podcast-pitch": "document",
  "micro-course": "course",
  "storytelling-vault": "document",
  "ad-copy-suite": "document",
  "community-playbook": "strategy",
  "sop-generator": "document",
  "content-repurposer": "document",
  "negotiation-playbook": "document",
  "onboarding-sequence": "strategy",
  "investor-deck": "document",
  "book-outline": "document",
  "crisis-playbook": "strategy",
  "partnership-brief": "document",
  "retention-engine": "strategy",
  "speaking-kit": "document",
  "assessment-builder": "document",
  // Batch 3
  "whitepaper-generator": "document",
  "product-launch": "strategy",
  "faq-generator": "document",
  "manifesto-writer": "document",
  "competitive-battlecard": "document",
  "customer-journey-map": "strategy",
  "annual-report": "report",
  "podcast-series": "strategy",
  "email-cold-outreach": "document",
  "api-documentation": "document",
  "event-playbook": "strategy",
  "upsell-playbook": "strategy",
  "culture-handbook": "document",
  "youtube-strategy": "strategy",
  "grant-proposal": "document",
  "compliance-checklist": "document",
  "referral-program": "strategy",
  "press-kit": "document",
  "loyalty-program": "strategy",
  "personal-brand-audit": "report",
  // Batch 4
  "tiktok-strategy": "strategy",
  "saas-metrics-dashboard": "report",
  "affiliate-program": "strategy",
  "internal-newsletter": "document",
  "customer-win-story": "document",
  "ai-prompt-library": "document",
  "employee-handbook": "document",
  "market-entry": "strategy",
  "content-audit": "report",
  "data-storytelling": "document",
  "ecosystem-map": "strategy",
  "training-curriculum": "course",
  "investor-update": "document",
  "vendor-rfp": "document",
  "crisis-communication": "document",
  "pricing-page": "document",
  "ab-test-playbook": "strategy",
  "changelog-writer": "document",
  "knowledge-base": "document",
  "stakeholder-report": "report",
  // Batch 5
  "product-roadmap": "strategy",
  "linkedin-content-calendar": "strategy",
  "pitch-deck": "document",
  "brand-guidelines": "document",
  "sales-battlecard": "strategy",
  "user-research-plan": "document",
  "okr-framework": "strategy",
  "podcast-guest-prep": "document",
  "technical-spec": "document",
  "social-proof-kit": "document",
  "meeting-playbook": "document",
  "value-proposition-canvas": "strategy",
  "email-nurture-sequence": "document",
  "competitive-intelligence": "report",
  "hiring-playbook": "document",
  "product-hunt-launch": "strategy",
  "retention-analysis": "report",
  "thought-piece": "document",
  "workshop-facilitator": "document",
  "api-go-to-market": "strategy",
  "customer-health-score": "report",
  "content-pillar-strategy": "strategy",
  "partnership-playbook": "strategy",
  "financial-model": "report",
  "launch-retrospective": "report",
  // Phase 3: Tone of Voice
  "tone-of-voice-analyzer": "report",
  "linguistic-deep-analysis": "report",
  "writing-style-instructions": "document",
  "custom-gpt-prompts": "prompt",
  // Phase 3: Market Research
  "market-psychology-engine": "report",
  "launch-plan-generator": "strategy",
  "implementation-guide": "document",
};

// Valid service keys for input validation — now derived from artifact type map (prompts live in DB)
const VALID_SERVICE_KEYS = new Set(Object.keys(SERVICE_ARTIFACT_TYPE));

// ── Rate limiting ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // per hour
const RATE_WINDOW = 3600_000; // 1 hour in ms

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // ── AUTHENTICATE via JWT — derive user_id from token ──
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    // CRITICAL: Always derive user_id from JWT, never from request body
    const user_id = caller.id;

    // ── Rate limit check ──
    if (!checkRateLimit(user_id)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded (20 service runs/hour)" }), {
        status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // ── Check for cancel action ──
    const rawBody = await req.json();
    
    if (rawBody.action === "cancel" && rawBody.job_id) {
      const cancelJobId = z.string().uuid().safeParse(rawBody.job_id);
      if (!cancelJobId.success) {
        return new Response(JSON.stringify({ error: "Invalid job_id" }), {
          status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      // Update job status to cancelled
      const { data: job } = await supabase
        .from("neuron_jobs")
        .select("status, cancel_reason")
        .eq("id", cancelJobId.data)
        .single();

      if (job && job.status !== "completed" && job.status !== "failed") {
        await supabase.from("neuron_jobs").update({
          status: "cancelled",
          cancel_reason: "User cancelled",
          completed_at: new Date().toISOString(),
        }).eq("id", cancelJobId.data);

        // Release reserved credits
        const { data: costData } = await supabase
          .from("neuron_jobs")
          .select("worker_type")
          .eq("id", cancelJobId.data)
          .single();

        if (costData) {
          const { data: svc } = await supabase
            .from("service_catalog")
            .select("credits_cost, name")
            .eq("service_key", costData.worker_type)
            .single();

          if (svc) {
            await supabase.rpc("release_neurons", {
              _user_id: user_id,
              _amount: svc.credits_cost,
              _description: `RELEASE: ${svc.name} — cancelled by user`,
            }).catch(() => {});
          }
        }
      }

      return new Response(JSON.stringify({ cancelled: true, job_id: cancelJobId.data }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const InputSchema = z.object({
      job_id: z.string().uuid("Invalid job_id"),
      service_key: z.string().min(1, "Missing service_key").max(100),
      neuron_id: z.number().int().optional(),
      inputs: z.record(z.string().max(120_000, "Input value too long")).optional(),
    });

    const parsed = InputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message || "Invalid input" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const { job_id, service_key, neuron_id, inputs } = parsed.data;

    // ── Regime enforcement ──
    const regime = await getRegimeConfig(service_key);
    const blockReason = checkRegimeBlock(regime, 0);
    if (blockReason) {
      return new Response(JSON.stringify({ error: "Service blocked by execution regime", reason: blockReason, regime: regime.regime }), {
        status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const isDryRun = regime.dryRun || regime.regime === "simulation";

    // ── Update job to running, track retry count ──
    const { data: currentJob } = await supabase
      .from("neuron_jobs")
      .select("retry_count, max_retries, dead_letter")
      .eq("id", job_id)
      .single();

    if (currentJob?.dead_letter) {
      return new Response(JSON.stringify({ error: "Job is in dead letter queue" }), {
        status: 410, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    await supabase.from("neuron_jobs").update({ 
      status: "running",
      scheduled_at: new Date().toISOString(),
    }).eq("id", job_id);

    // ── Fetch service cost ──
    const { data: service } = await supabase
      .from("service_catalog").select("credits_cost, name").eq("service_key", service_key).single();

    if (!service) {
      await supabase.from("neuron_jobs").update({ status: "failed", completed_at: new Date().toISOString(), result: { error: "Service not found" } }).eq("id", job_id);
      return new Response(JSON.stringify({ error: "Service not found" }), {
        status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ── RESERVE neurons (atomic wallet) ──
    const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_neurons", {
      _user_id: user_id,
      _amount: service.credits_cost,
      _job_id: job_id,
      _description: `RESERVE: ${service.name}`,
    });

    if (reserveErr || !reserved) {
      const reasonCode = "RC.CREDITS.INSUFFICIENT";
      await supabase.from("neuron_jobs").update({
        status: "failed", completed_at: new Date().toISOString(),
        result: { error: reasonCode, reason: reserveErr?.message || `Need ${service.credits_cost} credits` },
      }).eq("id", job_id);

      return new Response(JSON.stringify({
        error: "Insufficient credits",
        reason_code: reasonCode,
        needed: service.credits_cost,
      }), {
        status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let settled = false;

    // ── Execute AI pipeline (with prompt-loader + dry-run) ──
    const { prompt: systemPrompt } = await loadPrompt(service_key, DEFAULT_FALLBACK_PROMPT);

    if (isDryRun) {
      await supabase.from("neuron_jobs").update({
        status: "completed", completed_at: new Date().toISOString(),
        result: { dry_run: true, regime: regime.regime, message: "Simulation mode — no AI call made" },
      }).eq("id", job_id);
      // Release reserved neurons in simulation (no work done)
      await supabase.rpc("release_neurons", { _user_id: user_id, _amount: service.credits_cost, _description: "RELEASE: Dry run — no execution" });
      return new Response(JSON.stringify({ dry_run: true, regime: regime.regime }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const inputText = Object.entries(inputs || {})
      .filter(([_, v]) => v && String(v).trim())
      .map(([k, v]) => `${k}: ${v}`).join("\n\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: inputText || "Analyze the provided context and produce comprehensive results." },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      // RELEASE reserved neurons on AI failure
      await supabase.rpc("release_neurons", {
        _user_id: user_id,
        _amount: service.credits_cost,
        _description: `RELEASE: ${service.name} — AI error ${response.status}`,
      }).catch(() => {});

      // Mark failed with error message for retry system
      const retryCount = currentJob?.retry_count || 0;
      const maxRetries = currentJob?.max_retries || 3;
      const shouldRetry = retryCount < maxRetries && response.status >= 500;

      await supabase.from("neuron_jobs").update({
        status: "failed", 
        completed_at: shouldRetry ? null : new Date().toISOString(),
        error_message: `AI error: ${response.status}`,
        result: { error: `AI error: ${response.status}` },
        ...(shouldRetry ? {
          retry_count: retryCount + 1,
          scheduled_at: new Date(Date.now() + retryCount * 30000).toISOString(),
        } : {
          dead_letter: retryCount >= maxRetries,
        }),
      }).eq("id", job_id);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Credits released." }), {
          status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Credits released." }), {
          status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service unavailable. Credits released." }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ── Stream response, collect for auditing + artifact generation ──
    const [clientStream, auditStream] = response.body!.tee();

    const finalizeJob = async () => {
      try {
        const reader = auditStream.getReader();
        const decoder = new TextDecoder();
        let fullResult = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let nlIndex: number;
          while ((nlIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, nlIndex);
            buffer = buffer.slice(nlIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullResult += content;
            } catch { /* partial */ }
          }
        }

        // Mark job completed
        await supabase.from("neuron_jobs").update({
          status: "completed", completed_at: new Date().toISOString(),
          result: { content: fullResult, credits_spent: service.credits_cost, service: service.name },
        }).eq("id", job_id);

        // SETTLE neurons on successful completion
        await supabase.rpc("settle_neurons", {
          _user_id: user_id,
          _amount: service.credits_cost,
          _description: `SETTLE: ${service.name}`,
        });
        settled = true;

        // Save as neuron block
        if (neuron_id && fullResult) {
          await supabase.from("neuron_blocks").insert({
            neuron_id, type: "markdown", content: fullResult.slice(0, 100_000), position: 0, execution_mode: "passive",
          });
          await supabase.from("neurons").update({
            status: "published", lifecycle: "structured", updated_at: new Date().toISOString(),
          }).eq("id", neuron_id);
        }

        // ── AUTO-GENERATE ARTIFACT ──
        if (fullResult && fullResult.length > 50) {
          const artifactType = SERVICE_ARTIFACT_TYPE[service_key] || "document";
          const artifactTitle = `${service.name} — ${new Date().toLocaleDateString("ro-RO")}`;

          // Generate preview (first 20% of content)
          const previewContent = fullResult.slice(0, Math.floor(fullResult.length * 0.2));

          const { data: artifact } = await supabase.from("artifacts").insert({
            author_id: user_id,
            title: artifactTitle,
            artifact_type: artifactType,
            content: fullResult.slice(0, 200_000),
            preview_content: previewContent,
            is_locked: true,
            format: "markdown",
            status: "generated",
            service_key,
            job_id,
            tags: [service_key, artifactType],
            metadata: { credits_spent: service.credits_cost, neuron_id },
          }).select("id").single();

          // Link artifact to source neuron
          if (artifact && neuron_id) {
            await supabase.from("artifact_neurons").insert({
              artifact_id: artifact.id,
              neuron_id,
              relation_type: "source",
            });
          }

          // ── MARKETPLACE AUTO-LISTING (draft) ──
          if (artifact) {
            try {
              await supabase.from("knowledge_assets").insert({
                author_id: user_id,
                title: artifactTitle,
                description: `Generated by ${service.name} service`,
                asset_type: artifactType,
                artifact_ids: [artifact.id],
                preview_content: previewContent.slice(0, 500),
                price_neurons: Math.max(service.credits_cost * 2, 20),
                is_published: false, // draft — user must approve
                tags: [service_key, artifactType],
                metadata: { source_service: service_key, auto_listed: true },
              });
            } catch (mkErr) {
              console.error("Marketplace auto-list error:", mkErr);
            }
          }
        }
      } catch (e) {
        console.error("Finalize job error:", e);
        // RELEASE neurons if settle didn't happen
        if (!settled) {
          await supabase.rpc("release_neurons", {
            _user_id: user_id,
            _amount: service.credits_cost,
            _description: `RELEASE: ${service.name} — finalization error`,
          }).catch(() => {});
        }
        await supabase.from("neuron_jobs").update({
          status: "completed", completed_at: new Date().toISOString(),
          result: { error: "Finalization error", partial: true },
        }).eq("id", job_id);
      }
    };

    finalizeJob();

    return new Response(clientStream, {
      headers: { ...getCorsHeaders(req), "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("run-service error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
