/**
 * analyze-tone-of-voice — Full NLP Tone of Voice Analysis Engine
 *
 * Implements:
 *   • 10 NLP analysis dimensions (lexical, tone, clarity, audience, techniques,
 *     examples/analogy, rhetorical questions, logic, humor, style)
 *   • Lingvist la Atom 8-part deep report
 *   • Structured JSON output with quantitative metrics
 *
 * POST { content: string, mode: "nlp10" | "lingvist" | "full", part?: 1-8 }
 * Returns structured analysis report
 */
import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";
import { aiCallWithRetry, extractAiContent } from "../_shared/ai-retry.ts";

const NEURON_COST_NLP10 = 1800;
const NEURON_COST_LINGVIST = 2200;
const NEURON_COST_FULL = 3600;

// ── 10 NLP Dimensions (Section 2.3) ──────────────────────────────────────────
const NLP_DIMENSIONS = [
  {
    key: "lexical_analysis",
    name: "Analiză Lexicală și Nivel de Limbaj",
    prompt: `Analizează textul și prezintă o analiză detaliată a lexicului folosit. Identifică dacă limbajul este formal, informal, tehnic sau accesibil publicului larg. Descrie nivelul de cunoaștere a limbii și gradul de diversitate lexicală. Return JSON: { "register": "formal|informal|technical|accessible", "diversity_score": 0-100, "vocabulary_richness": 0-100, "jargon_density": 0-100, "top_keywords": ["..."], "language_mastery": 0-100, "observations": "..." }`,
  },
  {
    key: "tone_voice",
    name: "Analiză a Tonului și Vocii",
    prompt: `Evaluează tonul textului: formal, relaxat, ironic, empatic sau autoritar? Analizează vocea autorului – personală, colectivă sau obiectivă? Explică cum influențează percepția cititorului. Return JSON: { "primary_tone": "...", "secondary_tones": ["..."], "voice_type": "personal|collective|objective", "formality_score": 0-10, "empathy_score": 0-10, "authority_score": 0-10, "reader_perception": "..." }`,
  },
  {
    key: "clarity",
    name: "Claritatea Exprimării",
    prompt: `Identifică nivelul de claritate al textului. Găsește exemple de fraze concise și clare, dar și de fraze ambigue. Oferă sugestii pentru îmbunătățirea clarității. Return JSON: { "clarity_score": 0-100, "avg_sentence_length": 0, "clear_examples": ["..."], "ambiguous_examples": ["..."], "passive_voice_pct": 0-100, "readability_index": 0-100, "improvements": ["..."] }`,
  },
  {
    key: "audience_targeting",
    name: "Adresare și Public-Țintă",
    prompt: `Analizează modul de adresare al textului. Este scris pentru un public larg, specific sau restrâns? Identifică dacă tonul și stilul sunt adaptate corespunzător audienței vizate. Return JSON: { "target_audience": "broad|specific|niche", "audience_fit_score": 0-100, "formality_match": true, "cultural_references": ["..."], "industry_vocabulary": ["..."], "addressing_style": "direct|indirect|mixed" }`,
  },
  {
    key: "techniques",
    name: "Tehnici de Formulare și Structură",
    prompt: `Evaluează tehnicile de formulare: repetări, paralelisme, fraze scurte vs. lungi, structura propozițiilor. Cum contribuie la stilul general? Return JSON: { "repetition_patterns": ["..."], "parallelisms": ["..."], "short_sentence_pct": 0-100, "long_sentence_pct": 0-100, "sentence_variety_score": 0-100, "structural_techniques": ["..."], "rhythm_score": 0-100 }`,
  },
  {
    key: "exemplification",
    name: "Nivel de Exemplificare și Utilizarea Analogiei",
    prompt: `Identifică și analizează exemplele și analogiile folosite. Sunt eficiente în clarificarea ideilor? Evaluează impactul lor. Return JSON: { "examples_count": 0, "analogies_count": 0, "effectiveness_score": 0-100, "notable_examples": ["..."], "notable_analogies": ["..."], "impact_assessment": "..." }`,
  },
  {
    key: "rhetorical_questions",
    name: "Întrebări Retorice și Implicarea Cititorului",
    prompt: `Caută și analizează întrebările retorice din text. Cum stimulează gândirea critică sau implicarea cititorului? Return JSON: { "rhetorical_count": 0, "engagement_score": 0-100, "question_types": ["provocative", "reflective", "persuasive"], "examples": ["..."], "effectiveness": "..." }`,
  },
  {
    key: "logic_coherence",
    name: "Logica și Coerența Sensurilor",
    prompt: `Evaluează structura logică a textului. Identifică legături clare între idei sau confuzii. Propune îmbunătățiri. Return JSON: { "coherence_score": 0-100, "logical_flow": "linear|branching|fragmented", "logic_gaps": ["..."], "transition_quality": 0-100, "argument_structure": "...", "improvements": ["..."] }`,
  },
  {
    key: "humor_irony",
    name: "Umor și Ironie",
    prompt: `Analizează nivelul de umor și ironie. Sunt utilizate subtil sau evident? Evaluează impactul asupra tonului. Return JSON: { "humor_level": "none|subtle|moderate|heavy", "irony_level": "none|subtle|moderate|heavy", "humor_instances": ["..."], "irony_instances": ["..."], "tonal_impact": "...", "audience_reception": "..." }`,
  },
  {
    key: "writing_style",
    name: "Stil de Scriere și Originalitate",
    prompt: `Identifică trăsăturile stilului: descriptiv, narativ, persuasiv sau informativ? Evaluează originalitatea și semnătura stilistică. Return JSON: { "primary_style": "descriptive|narrative|persuasive|informative", "originality_score": 0-100, "signature_markers": ["..."], "distinctive_phrases": ["..."], "style_influences": ["..."], "reproducibility_difficulty": "low|medium|high" }`,
  },
];

// ── Lingvist la Atom — 8 Parts (Section 2.4 / GPT Config) ───────────────────
const LINGVIST_PARTS: Record<number, { key: string; name: string; prompt: string }> = {
  1: {
    key: "linguistic_levels",
    name: "Niveluri (lexical, morfosintactic, stilistic, semantic)",
    prompt: `Perform a stratified linguistic analysis on the following levels:
1. LEXICAL: Register, word frequency distribution, vocabulary diversity (type-token ratio), domain-specific terms.
2. MORPHOSYNTACTIC: Dominant grammatical forms, syntactic structures, clause complexity, active/passive ratio.
3. STYLISTIC: Stylistic markers, rhetorical devices, figurative language density, style classification.
4. SEMANTIC: Semantic fields, polysemy, connotation patterns, ambiguities.
Return JSON: { "lexical": { "register": "...", "type_token_ratio": 0.0, "top_words": [...], "domain_terms": [...] }, "morphosyntactic": { "avg_clause_depth": 0, "active_passive_ratio": 0.0, "dominant_structures": [...] }, "stylistic": { "devices": [...], "figurative_density": 0-100, "classification": "..." }, "semantic": { "fields": [...], "polysemies": [...], "ambiguities": [...] } }`,
  },
  2: {
    key: "rhetorical_narrative_semiotic",
    name: "Analize (retorică, narativă, semiotică, pragmatică)",
    prompt: `Perform rhetorical, narrative, semiotic, and pragmatic analysis:
1. RHETORICAL: Figures of speech (tropes and schemes), persuasion strategy (ethos/pathos/logos %), dominant argumentative techniques.
2. NARRATIVE: Story structure (beginning/middle/end), narrator perspective, temporal organization, narrative arc.
3. SEMIOTIC: Sign systems used, symbolic codes, denotation/connotation layers, intertextual references.
4. PRAGMATIC: Speaker-reader relationship, speech acts, presuppositions, implicatures, politeness strategies.
Return JSON with keys: "rhetorical", "narrative", "semiotic", "pragmatic", each containing relevant sub-fields.`,
  },
  3: {
    key: "simulations_interpretations",
    name: "Simulări și Interpretări (polisemii, scenarii, receptări)",
    prompt: `Simulate multiple possible readings of the text:
1. Identify intentional ambiguities and polysemies.
2. Generate 3 alternative interpretation scenarios for key passages.
3. Analyze how different audiences would receive the text (academic, general, professional, youth).
4. Map effects based on reader context.
Return JSON: { "polysemies": [...], "alternative_readings": [{ "passage": "...", "interpretations": ["..."] }], "audience_receptions": { "academic": "...", "general": "...", "professional": "...", "youth": "..." }, "contextual_effects": [...] }`,
  },
  4: {
    key: "metaphors_symbols",
    name: "Metafore și Simboluri (funcții, origini, rețele de sens)",
    prompt: `Map the internal symbolism of the text:
1. Identify all metaphors (conceptual and decorative), classify by function.
2. Map symbols and their cultural/literary origins.
3. Build semantic networks connecting metaphors and symbols.
4. Analyze analogical reasoning patterns.
Return JSON: { "metaphors": [{ "expression": "...", "type": "conceptual|decorative", "function": "...", "source_domain": "...", "target_domain": "..." }], "symbols": [{ "symbol": "...", "origin": "...", "cultural_matrix": "..." }], "semantic_networks": [...], "analogy_patterns": [...] }`,
  },
  5: {
    key: "critical_theoretical",
    name: "Abordări Critice și Teoretice",
    prompt: `Apply theoretical reading grids to the text:
1. FEMINIST: Gender representation, power dynamics, voice distribution.
2. MARXIST: Class indicators, economic language, power structures.
3. POSTMODERN: Irony, fragmentation, meta-narratives, intertextuality.
4. PSYCHOANALYTIC: Subconscious patterns, desire/anxiety markers, symbolic repressions.
Return JSON with keys for each theoretical approach, containing findings, textual evidence, and relevance score (0-100).`,
  },
  6: {
    key: "impact_reception",
    name: "Evaluarea Impactului și Receptării",
    prompt: `Evaluate text effectiveness:
1. PERSUASIVE POWER: Conviction score (0-100), persuasion techniques used, emotional vs logical appeal.
2. TONALITY: Emotional mapping per section, tonal shifts, consistency score.
3. RETENTION: Memorability of key phrases, hook analysis, recall probability.
4. ENGAGEMENT: Reader activation methods, call-to-action analysis, involvement depth.
Return JSON: { "persuasion": { "score": 0, "techniques": [...] }, "tonality": { "map": [...], "consistency": 0 }, "retention": { "memorable_phrases": [...], "hook_score": 0 }, "engagement": { "activation_methods": [...], "involvement_depth": "..." } }`,
  },
  7: {
    key: "narrative_temporality",
    name: "Structura Narativă și Temporalitate",
    prompt: `Anatomize the narrative mechanism:
1. EVENT ORDER: Chronological vs non-chronological, analepsis/prolepsis instances.
2. TEMPORAL TYPES: Duration, frequency, pausing, stretching, summarizing.
3. FOCALIZATION: Internal/external/zero, shifts in perspective.
4. NARRATIVE RHYTHM: Pacing analysis, tension arc, climax identification, opening/closing type.
Return JSON with keys: "event_order", "temporality", "focalization", "rhythm", each with relevant metrics and examples.`,
  },
  8: {
    key: "advanced_reports",
    name: "Rapoarte Avansate (strategice, creative, psihologice)",
    prompt: `Generate advanced applied analyses:
1. STRATEGIC REWRITE: 3 alternative versions optimized for different purposes (sales, academic, storytelling).
2. STYLOMETRY & AUTHOR PROFILE: Estimated education level, psychological profile indicators, ideological markers.
3. PRAGMATIC INTENT: Hidden intentions, positioning vis-a-vis reader, manipulation techniques.
4. SEMANTIC POLARIZATION: Bias detection, extremism indicators, ideological loading.
5. EMOTIONAL MAPPING: Emotions invoked per section, emotional arc, alternative emotional rewrites.
6. TRIGGERS & HOOKS: Psychological triggers identified (curiosity, contradiction, provocation).
7. TEMPLATE EXTRACTION: Implicit structural formulas extracted as reusable templates.
8. SEMANTIC INDEXING: Each fragment tagged (premise, example, argument, conclusion, transition).
Return JSON with keys for each of the 8 sub-analyses.`,
  },
};

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  const supabase = createClient(supabaseUrl, serviceKey);

  // Auth
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401, cors);
  }
  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return json({ error: "Unauthorized" }, 401, cors);

  // Rate limit
  const rl = await rateLimitGuard(user.id, req, { maxRequests: 8, windowSeconds: 60 }, cors);
  if (rl) return rl;

  if (!apiKey) return json({ error: "AI not configured" }, 500, cors);

  try {
    const body = await req.json();
    const { content, mode = "full", part } = body as {
      content: string;
      mode?: "nlp10" | "lingvist" | "full";
      part?: number;
    };

    if (!content || content.length < 100) {
      return json({ error: "Content too short (min 100 chars)" }, 400, cors);
    }

    const cost = mode === "nlp10" ? NEURON_COST_NLP10
      : mode === "lingvist" ? NEURON_COST_LINGVIST
      : NEURON_COST_FULL;

    // Reserve neurons
    const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_neurons", {
      _user_id: user.id,
      _amount: cost,
    });
    if (reserveErr || !(reserved as any)?.ok) {
      return json({
        error: "INSUFFICIENT_BALANCE",
        balance: (reserved as any)?.balance || 0,
        cost,
      }, 402, cors);
    }

    let settled = false;
    try {
      const truncatedContent = content.slice(0, 15000);
      const report: Record<string, any> = {};

      // ── NLP 10 Dimensions ──
      if (mode === "nlp10" || mode === "full") {
        const nlpResults = await runBatchedAnalysis(
          apiKey,
          truncatedContent,
          NLP_DIMENSIONS,
          3, // batch size
        );
        report.nlp_dimensions = nlpResults;
      }

      // ── Lingvist la Atom ──
      if (mode === "lingvist" || mode === "full") {
        const partsToRun = part
          ? [LINGVIST_PARTS[part]].filter(Boolean)
          : Object.values(LINGVIST_PARTS);

        const lingvistResults = await runBatchedAnalysis(
          apiKey,
          truncatedContent,
          partsToRun,
          2, // batch size (heavier prompts)
        );
        report.lingvist_la_atom = lingvistResults;
      }

      // Store results
      const { data: job } = await supabase.from("neuron_jobs").insert({
        author_id: user.id,
        worker_type: "tone_of_voice_analysis",
        status: "completed",
        input: { mode, content_length: content.length, part },
        result: report,
        completed_at: new Date().toISOString(),
      }).select("id").single();

      // Settle neurons
      await supabase.rpc("settle_neurons", { _user_id: user.id, _amount: cost });
      settled = true;

      return json({
        status: "COMPLETED",
        job_id: job?.id,
        cost,
        mode,
        report,
      }, 200, cors);
    } catch (innerErr) {
      if (!settled) {
        try { await supabase.rpc("release_neurons", { _user_id: user.id, _amount: cost }); } catch (_) { /* ignore */ }
      }
      throw innerErr;
    }
  } catch (err) {
    console.error("analyze-tone-of-voice error:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500, cors);
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function runBatchedAnalysis(
  apiKey: string,
  content: string,
  dimensions: Array<{ key: string; name: string; prompt: string }>,
  batchSize: number,
): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  for (let i = 0; i < dimensions.length; i += batchSize) {
    const batch = dimensions.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (dim) => {
        const systemPrompt = `You are an expert NLP and computational linguistics analyst performing "${dim.name}" analysis. You MUST return valid JSON only. No markdown, no explanation outside JSON.`;
        const aiData = await aiCallWithRetry(apiKey, {
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `${dim.prompt}\n\nTEXT TO ANALYZE:\n${content}` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        });

        const raw = extractAiContent(aiData);
        try {
          return { key: dim.key, name: dim.name, data: JSON.parse(raw) };
        } catch {
          // Repair: strip code fences, try again
          const cleaned = raw.replace(/```json\s*/g, "").replace(/```/g, "").trim();
          try {
            return { key: dim.key, name: dim.name, data: JSON.parse(cleaned) };
          } catch {
            return { key: dim.key, name: dim.name, data: { raw_output: raw, parse_error: true } };
          }
        }
      }),
    );

    for (const r of batchResults) {
      results[r.key] = { name: r.name, ...r.data };
    }
  }

  return results;
}

function json(data: any, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
