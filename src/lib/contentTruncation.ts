/**
 * Content truncation utility for service execution.
 * LLM context windows have limits — we gracefully truncate and notify.
 */

// ~100k tokens ≈ 400k chars for most models, but we cap at 100k chars for safety
export const MAX_SERVICE_CONTENT_CHARS = 100_000;

export interface TruncationResult {
  content: string;
  wasTruncated: boolean;
  originalLength: number;
  truncatedLength: number;
  percentUsed: number;
}

export function truncateForService(text: string, maxChars = MAX_SERVICE_CONTENT_CHARS): TruncationResult {
  const originalLength = text.length;
  
  if (originalLength <= maxChars) {
    return {
      content: text,
      wasTruncated: false,
      originalLength,
      truncatedLength: originalLength,
      percentUsed: 100,
    };
  }

  // Truncate at a sentence boundary if possible
  const truncated = text.slice(0, maxChars);
  const lastSentence = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf(".\n"),
    truncated.lastIndexOf("! "),
    truncated.lastIndexOf("? "),
  );
  
  const finalContent = lastSentence > maxChars * 0.8
    ? truncated.slice(0, lastSentence + 1)
    : truncated;

  return {
    content: finalContent,
    wasTruncated: true,
    originalLength,
    truncatedLength: finalContent.length,
    percentUsed: Math.round((finalContent.length / originalLength) * 100),
  };
}

export function formatTruncationMessage(result: TruncationResult): string {
  if (!result.wasTruncated) return "";
  const originalK = (result.originalLength / 1000).toFixed(0);
  const usedK = (result.truncatedLength / 1000).toFixed(0);
  return `Conținutul a fost trunchiat automat: ${usedK}k din ${originalK}k caractere procesate (${result.percentUsed}%). Restul nu a fost inclus în analiză.`;
}
