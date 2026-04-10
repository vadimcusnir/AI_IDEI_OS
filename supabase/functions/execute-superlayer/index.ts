/**
 * execute-superlayer — Runs Cusnir_OS superlayer modules across 4 axes with real AI.
 * Axes: Psychological, Social, Commercial, Infrastructure
 * Each axis has 3 modules = 12 total modules.
 * 
 * POST { axis, module_key, input_text, depth?: "surface"|"standard"|"deep" }
 * Returns structured analysis output.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AI_GATEWAY = "https://ai.lovable.dev/v1/chat/completions";

interface ModuleDef {
  axis: string;
  key: string;
  name: string;
  prompt_template: string;
  cost: number;
}

const MODULES: ModuleDef[] = [
  // ═══ AXA PSIHOLOGICĂ ═══
  {
    axis: "psychological",
    key: "identity_simulation",
    name: "Identity Simulation Engine",
    cost: 20,
    prompt_template: `Ești un motor de simulare a identității. Analizează textul furnizat și generează:

1. **Profiluri Comportamentale** — 3 arhetipuri de audiență cu reacții simulate la mesaj
2. **Predicții de Reacție** — cum va răspunde fiecare arhetip (emoțional, cognitiv, acțional)
3. **Optimizare Narativă** — 3 variante de reformulare care maximizează impactul per segment
4. **Trigger Map** — harta trigger-ilor psihologici activi vs latenți în text
5. **Vulnerability Assessment** — puncte slabe ale mesajului curent per segment

Returnează JSON structurat cu secțiunile de mai sus. Fii specific, nu generic.`,
  },
  {
    axis: "psychological",
    key: "behavioral_leverage",
    name: "Behavioral Leverage Scanner",
    cost: 18,
    prompt_template: `Ești un scanner de pârghii comportamentale. Analizează textul și identifică:

1. **Friction Map** — toate punctele de fricțiune care blochează conversia
2. **Missing Triggers** — trigger-e psihologice absente (urgency, scarcity, social proof, authority, etc.)
3. **Leverage Points** — puncte exacte unde o intervenție mică produce efect maxim
4. **Conversion Barriers** — barierele cognitive și emoționale ale audienței
5. **Optimization Matrix** — matrice prioritizată: what to fix × expected impact × effort

Returnează JSON structurat. Prioritizează după impact.`,
  },
  {
    axis: "psychological",
    key: "narrative_domination",
    name: "Narrative Domination Engine",
    cost: 22,
    prompt_template: `Ești un motor de dominare narativă. Din textul furnizat, generează:

1. **Anti-Market Position** — poziționare care invalidează toate alternativele
2. **Doctrine Statement** — doctrină de brand în 3-5 propoziții care creează monopol perceptual
3. **Enemy Framework** — definirea unui inamic comun care unește audiența
4. **Ownership Narrative** — narativ care face brandul proprietar al categoriei
5. **Linguistic Weapons** — 5 formulări-armă care domină conversația din nișă

Returnează JSON structurat. Fiecare secțiune trebuie să fie acționabilă.`,
  },

  // ═══ AXA SOCIALĂ ═══
  {
    axis: "social",
    key: "influence_graph",
    name: "Influence Graph Engine",
    cost: 18,
    prompt_template: `Ești un motor de cartografiere a influenței. Din textul furnizat, generează:

1. **Influence Map** — actori cheie din nișă, nivel de influență (1-10), tip (gatekeeper/amplifier/validator)
2. **Entry Points** — 3 puncte optime de penetrare în rețeaua de influență
3. **Alliance Strategy** — strategie de alianțe cu actori complementari
4. **Counter-Influence** — actori ostili și strategie de neutralizare
5. **Viral Pathways** — căi naturale de propagare a mesajului prin rețea

Returnează JSON structurat cu metrici.`,
  },
  {
    axis: "social",
    key: "viral_structure",
    name: "Viral Structure Generator",
    cost: 20,
    prompt_template: `Ești un generator de structuri virale. Din textul furnizat, creează:

1. **Hook Arsenal** — 5 hook-uri optimizate per platformă (LinkedIn, Twitter/X, YouTube, Instagram)
2. **Distribution Loops** — 3 loop-uri de redistribuire autonome (share → value → share)
3. **Content Mutations** — 5 variante ale aceluiași mesaj adaptate per format
4. **Controversy Engine** — 2 unghiuri controversate care generează engagement organic
5. **Shareability Score** — scor 1-100 cu recomandări de îmbunătățire

Returnează JSON structurat.`,
  },
  {
    axis: "social",
    key: "reputation_accumulator",
    name: "Reputation Accumulation System",
    cost: 16,
    prompt_template: `Ești un sistem de acumulare a reputației. Analizează textul și generează:

1. **Authority Index** — scor de autoritate perceput (1-100) cu breakdown per dimensiune
2. **Trust Signals** — semnale de încredere prezente vs absente
3. **Credibility Gaps** — lacune de credibilitate și cum să le acoperi
4. **Compound Strategy** — strategie de acumulare compusă a reputației pe 90 zile
5. **Platform Authority** — plan de autoritate per canal (blog, social, podcast, speaking)

Returnează JSON structurat cu timeline.`,
  },

  // ═══ AXA COMERCIALĂ ═══
  {
    axis: "commercial",
    key: "offer_multiplication",
    name: "Offer Multiplication Engine",
    cost: 22,
    prompt_template: `Ești un motor de multiplicare a ofertelor. Din textul furnizat, generează:

1. **Offer Stack** — minimum 5 oferte derivate din același asset (upsell, downsell, cross-sell, bundle)
2. **Audience Segments** — segmentare granulară cu ofertă optimă per segment
3. **Pricing Tiers** — 3 nivele de preț cu justificare psihologică
4. **Value Ladder** — scară de valoare de la gratuit la premium
5. **Revenue Projections** — estimare venituri per ofertă (conservator/realist/optimist)

Returnează JSON structurat cu metrici financiare.`,
  },
  {
    axis: "commercial",
    key: "pricing_intelligence",
    name: "Pricing Intelligence System",
    cost: 20,
    prompt_template: `Ești un sistem de inteligență a prețurilor. Analizează textul și generează:

1. **Elasticity Analysis** — estimare elasticitate cerere per segment
2. **Root2 Validation** — validare preț prin formula Root2 (preț optim = √2 × cost perceput)
3. **Anchor Strategy** — strategie de ancoraj (preț de referință care face oferta irezistibilă)
4. **Psychological Pricing** — recomandări de preț bazate pe psihologie (charm pricing, prestige, etc.)
5. **Competitive Position** — poziționare față de alternative și justificare premium

Returnează JSON structurat cu calcule.`,
  },
  {
    axis: "commercial",
    key: "funnel_autogenerator",
    name: "Funnel Autogenerator",
    cost: 25,
    prompt_template: `Ești un autogenerator de funnel-uri. Din textul furnizat, creează:

1. **Funnel Architecture** — structură completă: awareness → interest → desire → action
2. **Hook & Headline** — 3 hook-uri + 3 headline-uri testate
3. **Landing Page Blueprint** — structura paginii (hero, problem, solution, proof, CTA)
4. **Email Sequence** — 5 email-uri de nurture cu subject lines și CTA
5. **Upsell Chain** — secvență de upsell post-purchase cu timing optim

Returnează JSON structurat cu copy gata de folosit.`,
  },

  // ═══ INFRASTRUCTURĂ ═══
  {
    axis: "infrastructure",
    key: "stepback_compiler",
    name: "Stepback Compiler",
    cost: 24,
    prompt_template: `Ești un compilator Stepback. Analizează textul prin lentila cauzalității și generează:

1. **Causal Chain** — lanțul cauză-efect complet (minimum 5 niveluri de profunzime)
2. **Control Points** — puncte de control unde intervenția schimbă rezultatul
3. **OTOS Generation** — 3 One-Thing Operating Systems derivate din analiză
4. **MMS Composition** — 2 Multi-Mechanism Systems compuse din OTOS-uri
5. **LCSS Blueprint** — un Large Compound Strategic System care integrează totul

Returnează JSON structurat cu ierarhia OTOS → MMS → LCSS.`,
  },
  {
    axis: "infrastructure",
    key: "agent_swarm_orchestrator",
    name: "Agent Swarm Orchestrator",
    cost: 22,
    prompt_template: `Ești un orchestrator de swarm de agenți. Din textul furnizat, generează:

1. **Objective Decomposition** — descompunere obiectiv în sub-task-uri executabile
2. **Agent Assignment** — asignare agent specializat per sub-task (tip, capabilități necesare)
3. **Execution DAG** — graf de execuție cu dependențe și paralelism
4. **Validation Gates** — puncte de validare inter-agenți
5. **Autonomy Plan** — plan de execuție autonomă cu escalation rules

Returnează JSON structurat cu DAG executabil.`,
  },
  {
    axis: "infrastructure",
    key: "knowledge_arbitrage",
    name: "Knowledge Arbitrage Engine",
    cost: 20,
    prompt_template: `Ești un motor de arbitraj al cunoașterii. Analizează textul și identifică:

1. **Knowledge Gaps** — lacune de cunoaștere neexploatate în piață
2. **Trend Detection** — trend-uri emergente cu potențial de monetizare
3. **Arbitrage Opportunities** — oportunități unde cunoașterea existentă poate fi repackaged
4. **Information Asymmetry** — puncte de asimetrie informațională exploatabilă
5. **Monetization Routes** — 3 rute de monetizare per oportunitate detectată

Returnează JSON structurat cu scoring per oportunitate.`,
  },
];

async function callAI(prompt: string, input: string, depth: string): Promise<Record<string, unknown>> {
  const depthInstruction = depth === "deep"
    ? "Analizează în profunzime maximă. Fiecare secțiune trebuie să aibă minimum 5 puncte detaliate."
    : depth === "surface"
    ? "Analiză rapidă, esențială. 2-3 puncte per secțiune."
    : "Analiză standard. 3-4 puncte per secțiune cu detalii moderate.";

  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: `${prompt}\n\n${depthInstruction}\n\nRăspunde STRICT în JSON valid. Nu adăuga text înainte sau după JSON.` },
        { role: "user", content: input },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) throw new Error(`AI error: ${res.status}`);

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "{}";

  // Robust JSON parsing
  let cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return { raw_output: cleaned, parse_error: true };
  }
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authError } = await createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });

    const { axis, module_key, input_text, depth = "standard" } = await req.json();

    if (!axis || !module_key || !input_text) {
      return new Response(JSON.stringify({ error: "missing_fields", required: ["axis", "module_key", "input_text"] }), { status: 400, headers: cors });
    }

    const mod = MODULES.find(m => m.axis === axis && m.key === module_key);
    if (!mod) {
      return new Response(JSON.stringify({ error: "unknown_module", available: MODULES.map(m => `${m.axis}/${m.key}`) }), { status: 400, headers: cors });
    }

    // Reserve credits
    const { data: reserveData, error: reserveErr } = await supabase.rpc("reserve_neurons", {
      _user_id: user.id,
      _amount: mod.cost,
      _reason: `superlayer:${mod.axis}/${mod.key}`,
    });
    if (reserveErr || !reserveData?.success) {
      return new Response(JSON.stringify({ error: "insufficient_credits", required: mod.cost }), { status: 402, headers: cors });
    }

    // Execute AI
    const output = await callAI(mod.prompt_template, input_text, depth);

    // Settle credits
    await supabase.rpc("settle_neurons", {
      _user_id: user.id,
      _amount: mod.cost,
      _reason: `superlayer:${mod.axis}/${mod.key}`,
    });

    // Store result
    await supabase.from("os_superlayer_results").insert({
      user_id: user.id,
      axis: mod.axis,
      module_key: mod.key,
      input_text: input_text.slice(0, 5000),
      output,
      quality_score: output.parse_error ? 0.3 : 0.85,
      credits_cost: mod.cost,
      model_used: "google/gemini-2.5-flash",
    });

    return new Response(JSON.stringify({
      success: true,
      module: mod.name,
      axis: mod.axis,
      credits_charged: mod.cost,
      output,
    }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: "internal", message: String(err) }), { status: 500, headers: cors });
  }
});
