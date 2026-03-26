/**
 * Client-side security utilities for input sanitization and validation.
 * Defense-in-depth: always validate server-side too.
 */

/** Strip HTML tags from user input to prevent XSS in rendered text. */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/** Sanitize string for safe use in URLs (encodes special characters). */
export function sanitizeForUrl(input: string): string {
  return encodeURIComponent(input.trim());
}

/** Enforce maximum length on a string, returning truncated version. */
export function enforceMaxLength(input: string, max: number): string {
  return input.slice(0, max);
}

/** Validate that a string is a well-formed UUID v4. */
export function isValidUUID(input: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input);
}

/** Sanitize user-provided content before sending to backend. */
export function sanitizeInput(input: string, maxLength = 10000): string {
  return stripHtml(input.trim()).slice(0, maxLength);
}

/** Prevent open-redirect attacks by validating URLs. */
export function isSafeRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

/** Content Security Policy nonce generator for inline scripts. */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}
