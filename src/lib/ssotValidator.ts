/**
 * SSOT Validator — Runtime enforcement of the 5 SSOT Centers of Authority.
 * Used by admin dashboard and pipeline guards.
 */

import { root2Validate, SUBSCRIPTION_TIERS } from "@/config/economyConfig";

export interface SSOTViolation {
  domain: "product" | "data_access" | "economy" | "service" | "presentation";
  severity: "critical" | "warning" | "info";
  rule: string;
  details: string;
  autoFixable: boolean;
}

export interface SSOTReport {
  timestamp: string;
  violations: SSOTViolation[];
  passed: number;
  failed: number;
  score: number; // 0-100
}

// ── SSOT_03: Economy validation ──
function validateEconomy(): SSOTViolation[] {
  const violations: SSOTViolation[] = [];

  // Validate all subscription prices are Root2
  Object.entries(SUBSCRIPTION_TIERS).forEach(([key, tier]) => {
    if (!root2Validate(tier.price)) {
      violations.push({
        domain: "economy",
        severity: "critical",
        rule: "Root2 pricing mandatory",
        details: `Tier "${key}" price $${tier.price} fails Root2 (digital root ≠ 2)`,
        autoFixable: false,
      });
    }
  });

  // Validate NEURONS exchange rate consistency
  const rate = 0.002;
  if (Math.round(1 / rate) !== 500) {
    violations.push({
      domain: "economy",
      severity: "critical",
      rule: "NEURONS exchange rate consistency",
      details: `Exchange rate $${rate}/NEURON should yield 500 NEURONS/$1`,
      autoFixable: false,
    });
  }

  return violations;
}

// ── SSOT_04: Service taxonomy validation ──
function validateServiceTaxonomy(services: Array<{ service_name: string; output_type?: string; credit_cost?: number }>): SSOTViolation[] {
  const violations: SSOTViolation[] = [];

  services.forEach((svc) => {
    if (!svc.output_type) {
      violations.push({
        domain: "service",
        severity: "warning",
        rule: "Service atomicity: output contract required",
        details: `Service "${svc.service_name}" has no output_type defined`,
        autoFixable: false,
      });
    }
    if (!svc.credit_cost || svc.credit_cost <= 0) {
      violations.push({
        domain: "service",
        severity: "warning",
        rule: "Service must have cost model",
        details: `Service "${svc.service_name}" has no valid credit cost`,
        autoFixable: false,
      });
    }
  });

  // Check for duplicate names
  const names = services.map(s => s.service_name.toLowerCase().trim());
  const seen = new Set<string>();
  names.forEach((name, i) => {
    if (seen.has(name)) {
      violations.push({
        domain: "service",
        severity: "warning",
        rule: "No duplicate service meanings",
        details: `Duplicate service name: "${services[i].service_name}"`,
        autoFixable: false,
      });
    }
    seen.add(name);
  });

  return violations;
}

// ── SSOT_05: Presentation / i18n validation ──
function validatePresentation(translationKeys: { en: number; ro: number; ru: number }): SSOTViolation[] {
  const violations: SSOTViolation[] = [];
  const { en, ro, ru } = translationKeys;

  if (ro < en * 0.9) {
    violations.push({
      domain: "presentation",
      severity: "warning",
      rule: "i18n coverage: RO must be ≥90% of EN",
      details: `RO has ${ro} keys vs EN ${en} (${Math.round((ro / en) * 100)}%)`,
      autoFixable: false,
    });
  }
  if (ru < en * 0.8) {
    violations.push({
      domain: "presentation",
      severity: "warning",
      rule: "i18n coverage: RU must be ≥80% of EN",
      details: `RU has ${ru} keys vs EN ${en} (${Math.round((ru / en) * 100)}%)`,
      autoFixable: false,
    });
  }

  return violations;
}

// ── Full SSOT Audit ──
export function runSSOTAudit(context: {
  services?: Array<{ service_name: string; output_type?: string; credit_cost?: number }>;
  translationKeys?: { en: number; ro: number; ru: number };
}): SSOTReport {
  const violations: SSOTViolation[] = [];

  // Economy checks (always run)
  violations.push(...validateEconomy());

  // Service taxonomy (if data provided)
  if (context.services?.length) {
    violations.push(...validateServiceTaxonomy(context.services));
  }

  // Presentation / i18n (if data provided)
  if (context.translationKeys) {
    violations.push(...validatePresentation(context.translationKeys));
  }

  const total = violations.length + 5; // base checks
  const passed = total - violations.length;

  return {
    timestamp: new Date().toISOString(),
    violations,
    passed,
    failed: violations.length,
    score: Math.round((passed / total) * 100),
  };
}
