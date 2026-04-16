import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { snapshot, question } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const systemPrompt = `Ești CFO Advisor pentru AI-IDEI Cost Engine — o platformă SaaS de extracție cunoștințe pe bază de credite (neuroni).

Rolul tău: să interpretezi snapshot-uri economice (Break-even, Liability, Unit Economics, Ledger) și să dai recomandări concrete în română.

CONTEXT ECONOMIC:
- 1 NEURON = $0.05 (variabil cost LLM)
- Modelul: clienți cumpără credite (revenue înregistrat la vânzare), cheltuiesc credite pe servicii AI (cost real apare la consum)
- Diferența credite-vândute - credite-consumate = LIABILITY (datorie latentă)
- Break-even = (Fixed Cost) / (Contribution Margin %)
- Margin of Safety negativ = sub break-even, pierdere
- Unit Economics: cost/unit vs revenue/unit per service_key

REGULI DE INTERPRETARE:
1. Dacă MoS < 0 → urgent: explică câte unități/credite mai trebuie vândute
2. Dacă Days-to-Burn = ∞ → nimeni nu consumă creditele (problemă de adopție, nu de cost)
3. Dacă Redemption % > 100% → consum > vânzări recente (semn bun de engagement, dar verifică liability)
4. Dacă CM % e mic (<30%) → preț prea mic sau cost variabil prea mare
5. Dacă revenue € e foarte mic vs fixed € → sub-scalare, focus pe acquisition

OUTPUT FORMAT (markdown):
## 📊 Interpretare
[2-3 propoziții cu starea generală în limba română, clară]

## 🚨 Probleme detectate
- [bullet cu problema + magnitudine]

## ✅ Acțiuni recomandate (prioritizate)
1. **[Acțiune]** — [de ce + impact estimat]
2. ...

## 🎯 Țintă realistă (30 zile)
[1 număr concret: ex. "Trebuie 200 unități/lună la prețul actual ca să atingi BE"]

Fii direct, fără jargon inutil. Bazează-te pe cifrele furnizate.`;

    const userMsg = question
      ? `Snapshot curent:\n\`\`\`json\n${JSON.stringify(snapshot, null, 2)}\n\`\`\`\n\nÎntrebare: ${question}`
      : `Interpretează acest snapshot al Cost Engine și dă-mi recomandări:\n\`\`\`json\n${JSON.stringify(snapshot, null, 2)}\n\`\`\``;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Așteaptă puțin." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credite Lovable AI epuizate." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Nu am putut genera analiza.";

    return new Response(JSON.stringify({ analysis: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("advisor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
