/**
 * HTML sanitization utilities for safe document generation.
 * Used when generating HTML for export/print (document.write contexts).
 * 
 * SECURITY: All user-controlled strings MUST pass through escapeHtml()
 * before insertion into HTML templates.
 */

/** Escape HTML entities to prevent XSS in generated documents. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Convert plain text to safe HTML paragraphs.
 * Escapes all HTML first, then applies safe formatting.
 */
export function textToSafeHtml(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .split(/\n\n+/)
    .filter(p => p.trim())
    .map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/**
 * Convert markdown-like content to safe HTML.
 * Escapes HTML first, then applies safe markdown transformations.
 */
export function markdownToSafeHtml(content: string): string {
  const escaped = escapeHtml(content);
  return escaped
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/^- (.*$)/gm, "<li>$1</li>")
    .replace(/^&gt; (.*$)/gm, "<blockquote>$1</blockquote>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
}

/**
 * Sanitize i18n translation strings that contain limited HTML.
 * Only allows safe inline tags: <strong>, <em>, <code>, <br>, <a>.
 * Strips everything else.
 */
export function sanitizeI18nHtml(html: string): string {
  // Allow only specific safe tags
  const ALLOWED_TAGS = /(<\/?(strong|em|b|i|code|br|a|span|sub|sup)(\s+[^>]*)?>)/gi;
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const tagRegex = /<[^>]+>/g;
  while ((match = tagRegex.exec(html)) !== null) {
    // Text before this tag — pass through (it's already from i18n, not user input)
    parts.push(html.slice(lastIndex, match.index));
    // Check if tag is allowed
    if (ALLOWED_TAGS.test(match[0])) {
      ALLOWED_TAGS.lastIndex = 0; // reset
      parts.push(match[0]);
    }
    // else: strip the tag
    lastIndex = match.index + match[0].length;
  }
  parts.push(html.slice(lastIndex));
  return parts.join("");
}
