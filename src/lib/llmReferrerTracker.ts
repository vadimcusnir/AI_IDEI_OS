/**
 * LLM Referrer Tracker — Detects and logs traffic from AI/LLM sources.
 * Runs once on page load, checks referrer and user-agent for known LLM patterns.
 */
import { supabase } from "@/integrations/supabase/client";

const LLM_REFERRER_PATTERNS: Record<string, RegExp[]> = {
  ChatGPT: [/^chat\.openai\.com$/i, /^chatgpt\.com$/i],
  Perplexity: [/^perplexity\.ai$/i],
  Gemini: [/^gemini\.google\.com$/i, /^bard\.google\.com$/i],
  Claude: [/^claude\.ai$/i],
  Copilot: [/^copilot\.microsoft\.com$/i, /^bing\.com$/i],
  "You.com": [/^you\.com$/i],
  Phind: [/^phind\.com$/i],
};

const LLM_BOT_PATTERNS: Record<string, RegExp> = {
  GPTBot: /GPTBot/i,
  PerplexityBot: /PerplexityBot/i,
  ClaudeBot: /ClaudeBot/i,
  GoogleBot: /Googlebot/i,
  BingBot: /bingbot/i,
};

let tracked = false;

export function trackLLMReferrer() {
  if (tracked) return;
  tracked = true;

  const referrer = document.referrer;
  let referrerHost = referrer;
  try {
    if (referrer) {
      const url = new URL(referrer);
      referrerHost = url.hostname;
    }
  } catch {
    // If referrer is not a valid URL, fall back to the raw string
  }
  const userAgent = navigator.userAgent;
  const pagePath = window.location.pathname;

  // Check referrer
  let source: string | null = null;

  for (const [name, patterns] of Object.entries(LLM_REFERRER_PATTERNS)) {
    if (patterns.some(p => p.test(referrerHost))) {
      source = name;
      break;
    }
  }

  // Check user-agent for bots
  if (!source) {
    for (const [name, pattern] of Object.entries(LLM_BOT_PATTERNS)) {
      if (pattern.test(userAgent)) {
        source = name;
        break;
      }
    }
  }

  if (!source) return;

  // Log to database (fire and forget)
  supabase
    .from("llm_referrer_log")
    .insert({
      referrer_source: source,
      page_path: pagePath,
      user_agent: userAgent.slice(0, 500),
    })
    .then(({ error }) => {
      if (error) console.warn("LLM referrer tracking failed:", error.message);
    });
}
