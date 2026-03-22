import { describe, it, expect } from "vitest";
import { digitalRoot, isRoot2, toRoot2 } from "@/lib/root2";

describe("Root2 Pricing", () => {
  it("calculates digital root correctly", () => {
    expect(digitalRoot(2)).toBe(2);
    expect(digitalRoot(11)).toBe(2);
    expect(digitalRoot(29)).toBe(2);
    expect(digitalRoot(74)).toBe(2);
    expect(digitalRoot(92)).toBe(2);
    expect(digitalRoot(9992)).toBe(2);
  });

  it("validates Root2 prices", () => {
    expect(isRoot2(11)).toBe(true);
    expect(isRoot2(20)).toBe(true);
    expect(isRoot2(29)).toBe(true);
    expect(isRoot2(74)).toBe(true);
    expect(isRoot2(92)).toBe(true);
    expect(isRoot2(299)).toBe(true);
    expect(isRoot2(10)).toBe(false);
    expect(isRoot2(25)).toBe(false);
    expect(isRoot2(455)).toBe(false);
  });

  it("rounds to nearest Root2", () => {
    expect(isRoot2(toRoot2(30))).toBe(true);
    expect(isRoot2(toRoot2(50))).toBe(true);
    expect(isRoot2(toRoot2(100))).toBe(true);
  });

  it("TopUp prices are Root2", () => {
    [11, 20, 92].forEach(p => expect(isRoot2(p)).toBe(true));
  });

  it("Subscription prices are Root2", () => {
    [20, 155].forEach(p => expect(isRoot2(p)).toBe(true));
  });

  it("Pricing page prices are Root2", () => {
    [29, 74, 299].forEach(p => expect(isRoot2(p)).toBe(true));
  });
});
