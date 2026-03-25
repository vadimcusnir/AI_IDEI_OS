/**
 * Shared AI call utility with exponential backoff retry logic.
 * Wraps fetch calls to Lovable AI Gateway with automatic retries.
 */

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export interface AiCallOptions {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: string };
}

export interface AiRetryConfig {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULT_RETRY: AiRetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

/**
 * Call AI Gateway with exponential backoff retry.
 * Retries on: 429 (rate limit), 500+, network errors.
 * Does NOT retry on: 400, 401, 403 (client errors).
 */
export async function aiCallWithRetry(
  apiKey: string,
  options: AiCallOptions,
  retryConfig: Partial<AiRetryConfig> = {}
): Promise<any> {
  const config = { ...DEFAULT_RETRY, ...retryConfig };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries!; attempt++) {
    try {
      const response = await fetch(AI_GATEWAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: options.model || "google/gemini-2.5-flash",
          messages: options.messages,
          temperature: options.temperature ?? 0.3,
          max_tokens: options.max_tokens ?? 16000,
          ...(options.response_format ? { response_format: options.response_format } : {}),
        }),
      });

      // Don't retry client errors
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        const errorBody = await response.text();
        throw new Error(`AI Gateway ${response.status}: ${errorBody}`);
      }

      // Retry on rate limit or server errors
      if (response.status === 429 || response.status >= 500) {
        const retryAfter = response.headers.get("Retry-After");
        const delay = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.min(config.baseDelayMs! * Math.pow(2, attempt), config.maxDelayMs!);

        if (attempt < config.maxRetries!) {
          console.warn(`[ai-retry] ${response.status} on attempt ${attempt + 1}, retrying in ${delay}ms`);
          await sleep(delay);
          continue;
        }
        const errorBody = await response.text();
        throw new Error(`AI Gateway ${response.status} after ${config.maxRetries} retries: ${errorBody}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Network errors — retry
      if (attempt < config.maxRetries! && isRetryableError(lastError)) {
        const delay = Math.min(config.baseDelayMs! * Math.pow(2, attempt), config.maxDelayMs!);
        console.warn(`[ai-retry] Network error on attempt ${attempt + 1}, retrying in ${delay}ms: ${lastError.message}`);
        await sleep(delay);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error("AI call failed after retries");
}

function isRetryableError(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return (
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("timeout") ||
    msg.includes("econnreset") ||
    msg.includes("socket hang up")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract text content from AI response.
 */
export function extractAiContent(response: any): string {
  return response?.choices?.[0]?.message?.content || "";
}
