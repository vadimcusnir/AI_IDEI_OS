/**
 * Blog Post Hard Validation — Code-level structural gates.
 * Mirrors the proven pattern from cusnirvadim.com's ACCOS system.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    wordCount: number;
    headingCount: number;
    paragraphCount: number;
    excerptLength: number;
    titleLength: number;
    seoDescLength: number;
  };
}

export function hardValidateArticle(article: {
  title?: string;
  slug?: string;
  excerpt?: string;
  seo_description?: string;
  content?: string;
  tags?: string[];
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Title
  const titleLen = (article.title || "").length;
  if (!article.title || titleLen < 10) errors.push(`Title too short (${titleLen} chars, min 10)`);
  if (titleLen > 80) warnings.push(`Title long (${titleLen} chars, recommended ≤70)`);

  // Slug
  if (!article.slug || article.slug.length < 5) errors.push("Missing or too-short slug");
  if (article.slug && !/^[a-z0-9-]+$/.test(article.slug)) errors.push("Slug has invalid characters");

  // Excerpt
  const excerptLen = (article.excerpt || "").length;
  if (excerptLen < 20) errors.push(`Excerpt too short (${excerptLen} chars, min 20)`);
  if (excerptLen > 220) warnings.push(`Excerpt long (${excerptLen} chars, recommended ≤160)`);

  // SEO description
  const seoDescLen = (article.seo_description || "").length;
  if (seoDescLen > 0 && seoDescLen < 50) warnings.push("SEO description very short");
  if (seoDescLen > 160) warnings.push(`SEO description long (${seoDescLen}, recommended ≤155)`);

  // Content analysis
  const content = article.content || "";
  const words = content.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount < 600) errors.push(`Word count too low (${wordCount}, min 600)`);
  if (wordCount > 3000) warnings.push(`Word count high (${wordCount}, max recommended 2500)`);

  // Heading count (## headings in markdown)
  const headings = content.match(/^#{2,3}\s+.+$/gm) || [];
  const headingCount = headings.length;
  if (headingCount < 3) errors.push(`Too few headings (${headingCount}, min 3)`);
  if (headingCount > 12) warnings.push(`Many headings (${headingCount})`);

  // Paragraph count (non-empty lines that aren't headings/images)
  const paragraphs = content
    .split(/\n\n+/)
    .filter((p) => p.trim() && !p.trim().startsWith("#") && !p.trim().startsWith("!"));
  const paragraphCount = paragraphs.length;
  if (paragraphCount < 4) errors.push(`Too few paragraphs (${paragraphCount}, min 4)`);

  // Tags
  if (!article.tags || article.tags.length < 2) warnings.push("Few tags (recommended 3-5)");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      wordCount,
      headingCount,
      paragraphCount,
      excerptLength: excerptLen,
      titleLength: titleLen,
      seoDescLength: seoDescLen,
    },
  };
}
