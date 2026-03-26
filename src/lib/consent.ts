/**
 * GDPR Consent Manager — handles localStorage + gtag consent signals.
 * 
 * Frequency rules:
 *  - Accept → don't show for 180 days
 *  - Reject → re-show after 7 days
 *  - Ignore → re-show after 2 days
 */

const CONSENT_KEY = "ai-idei-cookie-consent";
const CONSENT_TS_KEY = "ai-idei-consent-ts";
const CONSENT_CATEGORIES_KEY = "ai-idei-consent-categories";
const CONSENT_VERSION = "2.0";

export interface ConsentCategories {
  analytics: boolean;
  ads: boolean;
  personalization: boolean;
  data_sharing: boolean;
}

export type ConsentDecision = "accepted" | "declined" | "custom" | null;

const RESHOW_DAYS: Record<string, number> = {
  accepted: 180,
  declined: 7,
  custom: 180,
};
const IGNORE_RESHOW_DAYS = 2;

function daysSince(ts: number): number {
  return (Date.now() - ts) / (1000 * 60 * 60 * 24);
}

/** Check if banner should be shown based on frequency rules */
export function shouldShowBanner(): boolean {
  try {
    const decision = localStorage.getItem(CONSENT_KEY) as ConsentDecision;
    const ts = localStorage.getItem(CONSENT_TS_KEY);
    if (!decision || !ts) return true;

    const days = daysSince(Number(ts));
    const maxDays = RESHOW_DAYS[decision] ?? IGNORE_RESHOW_DAYS;
    return days >= maxDays;
  } catch {
    return true;
  }
}

/** Get current stored categories */
export function getStoredCategories(): ConsentCategories {
  try {
    const raw = localStorage.getItem(CONSENT_CATEGORIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { analytics: false, ads: false, personalization: false, data_sharing: false };
}

/** Get current consent decision */
export function getConsentDecision(): ConsentDecision {
  try {
    return localStorage.getItem(CONSENT_KEY) as ConsentDecision;
  } catch {
    return null;
  }
}

/** Push consent signals to Google gtag */
export function updateGtagConsent(categories: ConsentCategories) {
  if (typeof window.gtag !== "function") return;
  window.gtag("consent", "update", {
    analytics_storage: categories.analytics ? "granted" : "denied",
    ad_storage: categories.ads ? "granted" : "denied",
    ad_user_data: categories.ads ? "granted" : "denied",
    ad_personalization: categories.personalization ? "granted" : "denied",
  });
}

/** Save consent locally */
export function saveConsent(decision: ConsentDecision, categories: ConsentCategories) {
  try {
    localStorage.setItem(CONSENT_KEY, decision || "declined");
    localStorage.setItem(CONSENT_TS_KEY, String(Date.now()));
    localStorage.setItem(CONSENT_CATEGORIES_KEY, JSON.stringify(categories));
  } catch {}
  updateGtagConsent(categories);
}

/** Accept all categories */
export function acceptAll(): ConsentCategories {
  const cats: ConsentCategories = { analytics: true, ads: true, personalization: true, data_sharing: true };
  saveConsent("accepted", cats);
  return cats;
}

/** Reject all categories */
export function rejectAll(): ConsentCategories {
  const cats: ConsentCategories = { analytics: false, ads: false, personalization: false, data_sharing: false };
  saveConsent("declined", cats);
  return cats;
}

/** Save custom categories */
export function saveCustomConsent(categories: ConsentCategories) {
  saveConsent("custom", categories);
}

export const CONSENT_VERSION_CURRENT = CONSENT_VERSION;
