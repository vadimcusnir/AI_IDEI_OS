/**
 * marketplaceGates — Quality gate checks before marketplace publishing.
 * Returns structured validation results.
 */

export interface GateResult {
  passed: boolean;
  checks: GateCheck[];
}

export interface GateCheck {
  key: string;
  label: string;
  passed: boolean;
  reason?: string;
}

const MIN_TITLE_LENGTH = 5;
const MIN_DESCRIPTION_LENGTH = 20;
const MIN_CONTENT_LENGTH = 100;
const MIN_PRICE_NEURONS = 20;
const MAX_PRICE_NEURONS = 50000;

export function runPublishGates(params: {
  title: string;
  description: string;
  content: string;
  priceNeurons: number;
  category: string;
}): GateResult {
  const { title, description, content, priceNeurons, category } = params;
  const checks: GateCheck[] = [];

  // Title quality
  checks.push({
    key: "title_length",
    label: "Titlu valid",
    passed: title.trim().length >= MIN_TITLE_LENGTH,
    reason: title.trim().length < MIN_TITLE_LENGTH
      ? `Minim ${MIN_TITLE_LENGTH} caractere (ai ${title.trim().length})`
      : undefined,
  });

  // Description quality
  checks.push({
    key: "description_length",
    label: "Descriere completă",
    passed: description.trim().length >= MIN_DESCRIPTION_LENGTH,
    reason: description.trim().length < MIN_DESCRIPTION_LENGTH
      ? `Minim ${MIN_DESCRIPTION_LENGTH} caractere (ai ${description.trim().length})`
      : undefined,
  });

  // Content substance
  checks.push({
    key: "content_length",
    label: "Conținut substanțial",
    passed: content.trim().length >= MIN_CONTENT_LENGTH,
    reason: content.trim().length < MIN_CONTENT_LENGTH
      ? `Conținutul trebuie să aibă minim ${MIN_CONTENT_LENGTH} caractere`
      : undefined,
  });

  // Price range
  const priceValid = priceNeurons >= MIN_PRICE_NEURONS && priceNeurons <= MAX_PRICE_NEURONS;
  checks.push({
    key: "price_range",
    label: "Preț valid",
    passed: priceValid,
    reason: !priceValid
      ? `Prețul trebuie să fie între ${MIN_PRICE_NEURONS} și ${MAX_PRICE_NEURONS} NEURONS`
      : undefined,
  });

  // Category set
  checks.push({
    key: "category_set",
    label: "Categorie selectată",
    passed: !!category && category.length > 0,
    reason: !category ? "Selectează o categorie" : undefined,
  });

  // PII scrub (basic patterns)
  const piiPatterns = [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // phone numbers
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // emails
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // card numbers
  ];
  const hasPII = piiPatterns.some(p => p.test(content) || p.test(description));
  checks.push({
    key: "pii_scrub",
    label: "Fără date personale",
    passed: !hasPII,
    reason: hasPII
      ? "Conținutul pare să includă date personale (telefon, email sau card). Elimină-le."
      : undefined,
  });

  return {
    passed: checks.every(c => c.passed),
    checks,
  };
}
