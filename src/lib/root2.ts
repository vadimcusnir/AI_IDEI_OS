/**
 * Root2 Pricing System
 * All prices must have a digital root of 2.
 * Digital root = repeatedly sum digits until single digit.
 * Valid examples: 2, 11, 20, 29, 38, 47, 56, 65, 74, 83, 92, 101...
 */

export function digitalRoot(n: number): number {
  if (n <= 0) return 0;
  const abs = Math.abs(Math.round(n));
  if (abs === 0) return 0;
  return 1 + ((abs - 1) % 9);
}

export function isRoot2(price: number): boolean {
  return digitalRoot(price) === 2;
}

/**
 * Round a price to the nearest Root2-compliant value.
 * Searches ±10 from the input to find the closest valid price.
 */
export function toRoot2(price: number): number {
  const rounded = Math.round(price);
  if (isRoot2(rounded)) return rounded;

  for (let delta = 1; delta <= 10; delta++) {
    if (isRoot2(rounded + delta)) return rounded + delta;
    if (rounded - delta > 0 && isRoot2(rounded - delta)) return rounded - delta;
  }
  return rounded; // fallback
}

/**
 * Generate Root2-compliant price tiers within a range.
 */
export function root2PricesInRange(min: number, max: number, count: number): number[] {
  const prices: number[] = [];
  for (let p = min; p <= max; p++) {
    if (isRoot2(p)) prices.push(p);
  }
  if (prices.length <= count) return prices;

  // Evenly distribute
  const step = Math.floor(prices.length / count);
  return Array.from({ length: count }, (_, i) => prices[Math.min(i * step, prices.length - 1)]);
}

/**
 * Format a price with Root2 badge indicator
 */
export function formatRoot2Price(price: number): string {
  return `$${price}`;
}
