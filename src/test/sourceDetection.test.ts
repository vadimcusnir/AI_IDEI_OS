import { describe, it, expect } from "vitest";
import { digitalRoot, isRoot2, toRoot2, root2PricesInRange } from "@/lib/root2";

describe("Root2 pricing – extended coverage", () => {
  it("toRoot2 returns closest valid price", () => {
    expect(isRoot2(toRoot2(10))).toBe(true);
    expect(isRoot2(toRoot2(50))).toBe(true);
    expect(isRoot2(toRoot2(100))).toBe(true);
    expect(isRoot2(toRoot2(999))).toBe(true);
  });

  it("root2PricesInRange returns only valid prices", () => {
    const prices = root2PricesInRange(1, 100, 5);
    expect(prices.length).toBeLessThanOrEqual(5);
    prices.forEach((p) => expect(isRoot2(p)).toBe(true));
  });

  it("root2PricesInRange handles range with fewer valid prices than count", () => {
    const prices = root2PricesInRange(1, 5, 100);
    prices.forEach((p) => expect(isRoot2(p)).toBe(true));
  });

  it("digitalRoot returns 0 for 0 or negative", () => {
    expect(digitalRoot(0)).toBe(0);
    expect(digitalRoot(-5)).toBe(0);
  });

  it("isRoot2 matches known prices: 2, 11, 74, 9992", () => {
    expect(isRoot2(2)).toBe(true);
    expect(isRoot2(11)).toBe(true);
    expect(isRoot2(74)).toBe(true);
    expect(isRoot2(9992)).toBe(true);
    expect(isRoot2(455)).toBe(false);
  });
});
