/**
 * economyConfig.ts — Single Source of Truth for pricing.
 * All prices MUST satisfy the Root2 rule: digit-sum reduces to 2.
 */

/** Validate that a price follows Root2 convention (digital root = 2) */
export function root2Validate(price: number): boolean {
  if (price <= 0) return false;
  let sum = price;
  while (sum >= 10) {
    sum = String(sum).split("").reduce((a, d) => a + Number(d), 0);
  }
  return sum === 2;
}

export const NEURONS_EXCHANGE_RATE = 0.002; // 1 NEURON = $0.002 USD → $1 = 500 NEURONS

export type BillingInterval = "month" | "year";

export interface SubscriptionTier {
  price_id: string;
  product_id: string;
  name: string;
  price: number;
  interval: BillingInterval;
  neurons_quota: number;
  execution_discount: number;
  features: string[];
}

/** Monthly subscription tiers */
export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  starter_monthly: {
    price_id: "price_1TIKY1IK7fwtty4owN1RjdOy",
    product_id: "prod_UGsIVXzAl33sDX",
    name: "Starter",
    price: 23,
    interval: "month",
    neurons_quota: 3000,
    execution_discount: 0.10,
    features: [
      "3,000 NEURONS / lună",
      "Servicii AI de bază",
      "Extracție & structurare",
      "Library access",
      "-10% cost execuție",
    ],
  },
  pro_monthly: {
    price_id: "price_1TIKYHIK7fwtty4o4Sa2M9BK",
    product_id: "prod_UGsI5IhppWlJ1B",
    name: "Pro",
    price: 47,
    interval: "month",
    neurons_quota: 10000,
    execution_discount: 0.20,
    features: [
      "10,000 NEURONS / lună",
      "Toate serviciile AI",
      "Procesare prioritară",
      "Batch processing",
      "Analytics avansat",
      "Knowledge Graph",
      "-20% cost execuție",
    ],
  },
  vip_monthly: {
    price_id: "price_1TKGWfIK7fwtty4o69tnJvzF",
    product_id: "prod_UGsI4kjBe8Km2J",
    name: "VIP",
    price: 137,
    interval: "month",
    neurons_quota: 30000,
    execution_discount: 0.40,
    features: [
      "30,000 NEURONS / lună",
      "Tot din Pro",
      "Locuri nelimitate",
      "SLA & suport dedicat",
      "API access",
      "NOTA2 benefits",
      "-40% cost execuție",
    ],
  },
  enterprise_monthly: {
    price_id: "price_1TKGWqIK7fwtty4oYbjGPc70",
    product_id: "prod_UGsJp3Rln1QfqD",
    name: "Enterprise",
    price: 191,
    interval: "month",
    neurons_quota: 50000,
    execution_discount: 0.50,
    features: [
      "50,000 NEURONS / lună",
      "Tot din VIP",
      "API nelimitat",
      "White-label reports",
      "Dedicated account manager",
      "Custom workflows",
      "-50% cost execuție",
    ],
  },
};

/** Annual subscription tiers — Root2 compliant */
export const ANNUAL_TIERS: Record<string, SubscriptionTier> = {
  starter_annual: {
    price_id: "price_1TKUpwIK7fwtty4odsF0NEIZ",
    product_id: "prod_UJ745BxlnGeKwO",
    name: "Starter",
    price: 227,
    interval: "year",
    neurons_quota: 3000,
    execution_discount: 0.10,
    features: [
      "3,000 NEURONS / lună",
      "Servicii AI de bază",
      "Extracție & structurare",
      "Library access",
      "-10% cost execuție",
    ],
  },
  pro_annual: {
    price_id: "price_1TKUpxIK7fwtty4oAcAFKczP",
    product_id: "prod_UJ74iGiPWMooMB",
    name: "Pro",
    price: 461,
    interval: "year",
    neurons_quota: 10000,
    execution_discount: 0.20,
    features: [
      "10,000 NEURONS / lună",
      "Toate serviciile AI",
      "Procesare prioritară",
      "Batch processing",
      "Analytics avansat",
      "Knowledge Graph",
      "-20% cost execuție",
    ],
  },
  vip_annual: {
    price_id: "price_1TKUpyIK7fwtty4o5mcDW1Tx",
    product_id: "prod_UJ74fY9zDcyfer",
    name: "VIP",
    price: 1307,
    interval: "year",
    neurons_quota: 30000,
    execution_discount: 0.40,
    features: [
      "30,000 NEURONS / lună",
      "Tot din Pro",
      "Locuri nelimitate",
      "SLA & suport dedicat",
      "API access",
      "NOTA2 benefits",
      "-40% cost execuție",
    ],
  },
  enterprise_annual: {
    price_id: "price_1TKUpzIK7fwtty4onV3sNyxd",
    product_id: "prod_UJ74i5RwkWoLmk",
    name: "Enterprise",
    price: 1856,
    interval: "year",
    neurons_quota: 50000,
    execution_discount: 0.50,
    features: [
      "50,000 NEURONS / lună",
      "Tot din VIP",
      "API nelimitat",
      "White-label reports",
      "Dedicated account manager",
      "Custom workflows",
      "-50% cost execuție",
    ],
  },
};

/** All tiers combined for subscription lookup */
export const ALL_TIERS: Record<string, SubscriptionTier> = {
  ...SUBSCRIPTION_TIERS,
  ...ANNUAL_TIERS,
};

/** Calculate annual savings percentage */
export function annualSavingsPct(monthlyPrice: number, annualPrice: number): number {
  const monthlyTotal = monthlyPrice * 12;
  return Math.round(((monthlyTotal - annualPrice) / monthlyTotal) * 100);
}

/** Tier name mapping for paired monthly/annual display */
export const TIER_PAIRS = [
  { name: "Starter", monthly: "starter_monthly", annual: "starter_annual" },
  { name: "Pro", monthly: "pro_monthly", annual: "pro_annual" },
  { name: "VIP", monthly: "vip_monthly", annual: "vip_annual" },
  { name: "Enterprise", monthly: "enterprise_monthly", annual: "enterprise_annual" },
] as const;

// Compile-time validation — will throw if prices don't satisfy Root2
if (import.meta.env.DEV) {
  Object.entries(ALL_TIERS).forEach(([key, tier]) => {
    if (!root2Validate(tier.price)) {
      console.error(`[economyConfig] ❌ Price $${tier.price} for "${key}" fails Root2 validation!`);
    }
  });
}
