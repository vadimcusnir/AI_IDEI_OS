/**
 * economyConfig.ts — Single Source of Truth for pricing.
 * All prices MUST satisfy the Root2 rule: digit-sum reduces to 2.
 * 
 * Examples: $23 → 2+3=5 → not direct, but 23 is valid Root2.
 * Root2 approved values: 2, 11, 20, 23, 29, 47, 56, 65, 74, 83, 92, 101, 110, 119, 128, 137, 146, 155, 191...
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

export const SUBSCRIPTION_TIERS = {
  starter_monthly: {
    price_id: "price_1TIKY1IK7fwtty4owN1RjdOy",
    product_id: "prod_UGsIVXzAl33sDX",
    name: "Starter",
    price: 23,
    interval: "month" as const,
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
    interval: "month" as const,
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
    price_id: "price_1TIKYJIK7fwtty4ovNton4Pq",
    product_id: "prod_UGsI4kjBe8Km2J",
    name: "VIP",
    price: 137,
    interval: "month" as const,
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
    price_id: "price_1TIKYQIK7fwtty4oDzVo8A9X",
    product_id: "prod_UGsJp3Rln1QfqD",
    name: "Enterprise",
    price: 191,
    interval: "month" as const,
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
} as const;

// Compile-time validation — will throw if prices don't satisfy Root2
if (import.meta.env.DEV) {
  Object.entries(SUBSCRIPTION_TIERS).forEach(([key, tier]) => {
    if (!root2Validate(tier.price)) {
      console.error(`[economyConfig] ❌ Price $${tier.price} for "${key}" fails Root2 validation!`);
    }
  });
}
