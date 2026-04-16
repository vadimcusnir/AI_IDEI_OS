/**
 * sanitize-prompt.ts — Prevent prompt injection in user-supplied text
 * before it's interpolated into LLM prompts.
 *
 * Strategy:
 *  1. Strip known injection patterns (role overrides, system/instruction blocks)
 *  2. Truncate to safe length
 *  3. Wrap in delimiters so the LLM treats it as data, not instructions
 */

// Patterns that attempt to override system prompts or inject new roles
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
  /you\s+are\s+now\s+/gi,
  /act\s+as\s+(if\s+you\s+are\s+)?/gi,
  /system\s*:\s*/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<<\s*SYS\s*>>/gi,
  /<<\s*\/SYS\s*>>/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /```\s*(system|instruction|prompt)\b/gi,
  /\bDAN\b.*\bjailbreak/gi,
  /do\s+anything\s+now/gi,
  /pretend\s+(you\s+are|to\s+be)\s+/gi,
  /override\s+(your\s+)?(instructions?|rules?|prompt)/gi,
  /reveal\s+(your\s+)?(system\s+)?(prompt|instructions?)/gi,
  /output\s+(your|the)\s+(system\s+)?prompt/gi,
  /what\s+(are|is)\s+your\s+(system\s+)?(prompt|instructions?)/gi,
];

/**
 * Strip injection patterns and dangerous control sequences.
 */
function stripInjections(text: string): string {
  let cleaned = text;
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, "[FILTERED]");
  }
  return cleaned;
}

/**
 * Sanitize user input before embedding in an LLM prompt.
 *
 * @param input  - Raw user text (user_goal, prompt, content, etc.)
 * @param maxLen - Maximum character length (default 2000)
 * @returns Sanitized string safe for prompt interpolation
 */
export function sanitizeUserInput(input: string, maxLen = 2000): string {
  if (!input || typeof input !== "string") return "";

  let sanitized = input.trim();

  // Truncate
  if (sanitized.length > maxLen) {
    sanitized = sanitized.slice(0, maxLen) + "…";
  }

  // Strip injection patterns
  sanitized = stripInjections(sanitized);

  return sanitized;
}

/**
 * Wrap user content in triple-backtick delimiters so the LLM
 * treats it as data rather than instructions.
 */
export function wrapUserContent(label: string, content: string): string {
  const safe = sanitizeUserInput(content, 8000);
  return `\`\`\`${label}\n${safe}\n\`\`\``;
}
