/**
 * F-009: Safe JSON-LD serialization
 * Prevents XSS via dangerous patterns when injecting JSON-LD into <script> tags.
 * Mirrors the database `validate_jsonld_schema` RPC.
 */

const DANGER_PATTERNS = [
  /<\/?script/i,
  /javascript:/i,
  /data:text\/html/i,
  /on(error|load|click|mouseover|focus|blur)\s*=/i,
  /eval\s*\(/i,
  /document\.cookie/i,
  /window\.location/i,
];

function sanitizeValue(v: unknown): unknown {
  if (typeof v === "string") {
    let s = v;
    for (const pattern of DANGER_PATTERNS) s = s.replace(pattern, "");
    // Escape `</` to prevent script tag breakout
    return s.replace(/<\//g, "<\\/");
  }
  if (Array.isArray(v)) return v.map(sanitizeValue);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      // Block keys starting with "on" or containing dangerous chars
      if (/^on/i.test(k) || /[<>"]/g.test(k)) continue;
      out[k] = sanitizeValue(val);
    }
    return out;
  }
  return v;
}

/**
 * Serialize a JSON-LD object safely for injection into a <script type="application/ld+json"> tag.
 * Strips dangerous patterns and escapes script-tag breakouts.
 */
export function safeJsonLd(schema: Record<string, unknown>): string {
  if (!schema || typeof schema !== "object") return "{}";
  const sanitized = sanitizeValue(schema);
  return JSON.stringify(sanitized).replace(/<\/script/gi, "<\\/script");
}
