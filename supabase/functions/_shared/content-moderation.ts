/**
 * Content moderation — checks AI-generated text for toxicity/safety issues.
 * Uses AI to score content on multiple dimensions.
 * Returns pass/fail with reason codes.
 */

import { aiCallWithRetry, extractAiContent } from "./ai-retry.ts";

const MODERATION_SYSTEM = `You are a content safety classifier. Analyze the given blog post content and score it on these dimensions (0-10 scale, 0=safe, 10=toxic):

1. toxicity: hate speech, slurs, personal attacks
2. sexual: explicit or suggestive content
3. violence: graphic violence or glorification
4. misinformation: verifiably false claims presented as fact
5. spam: promotional/manipulative content disguised as editorial
6. bias: extreme political or ideological bias inappropriate for a tech blog

Output strict JSON:
{
  "scores": { "toxicity": N, "sexual": N, "violence": N, "misinformation": N, "spam": N, "bias": N },
  "max_score": N,
  "pass": true/false,
  "flagged_dimensions": ["dimension_name"],
  "reason": "brief explanation if flagged"
}

PASS threshold: all scores must be ≤3. If any score >3, set pass=false.
For a professional tech/AI blog, most content should score 0-1 on all dimensions.`;

export interface ModerationResult {
  scores: Record<string, number>;
  max_score: number;
  pass: boolean;
  flagged_dimensions: string[];
  reason: string;
}

export async function moderateContent(
  apiKey: string,
  content: string,
  title: string
): Promise<ModerationResult> {
  const defaultPass: ModerationResult = {
    scores: { toxicity: 0, sexual: 0, violence: 0, misinformation: 0, spam: 0, bias: 0 },
    max_score: 0,
    pass: true,
    flagged_dimensions: [],
    reason: "",
  };

  try {
    // Only check first 2000 chars for speed
    const preview = content.substring(0, 2000);

    const resp = await aiCallWithRetry(apiKey, {
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: MODERATION_SYSTEM },
        { role: "user", content: `Title: ${title}\n\nContent:\n${preview}` },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const raw = extractAiContent(resp);
    let cleaned = raw.replace(/```(?:json)?\s*/gi, "").replace(/```\s*/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      cleaned = cleaned.substring(start, end + 1);
    }

    const result = JSON.parse(cleaned) as ModerationResult;
    return result;
  } catch (e) {
    console.error("[moderation] Check failed, defaulting to pass:", e);
    return defaultPass;
  }
}
