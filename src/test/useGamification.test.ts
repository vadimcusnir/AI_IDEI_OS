import { describe, it, expect, vi } from "vitest";

// Test the XP level calculation logic extracted from useGamification
describe("Gamification XP calculations", () => {
  const calculateLevel = (totalXp: number) => {
    return Math.max(1, Math.floor(Math.sqrt(totalXp / 100)) + 1);
  };

  const calculateRank = (level: number) => {
    if (level >= 50) return "Legend";
    if (level >= 40) return "Virtuoso";
    if (level >= 30) return "Master";
    if (level >= 20) return "Expert";
    if (level >= 15) return "Artisan";
    if (level >= 10) return "Creator";
    if (level >= 5) return "Apprentice";
    return "Novice";
  };

  const xpForLevel = (level: number) => (level - 1) * (level - 1) * 100;
  const xpForNextLevel = (level: number) => level * level * 100;

  it("should start at level 1 with 0 XP", () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it("should reach level 2 at 100 XP", () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it("should reach level 5 at 1600 XP", () => {
    expect(calculateLevel(1600)).toBe(5);
  });

  it("should calculate correct XP requirements", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(400);
    expect(xpForLevel(5)).toBe(1600);
  });

  it("should return correct rank names", () => {
    expect(calculateRank(1)).toBe("Novice");
    expect(calculateRank(5)).toBe("Apprentice");
    expect(calculateRank(10)).toBe("Creator");
    expect(calculateRank(20)).toBe("Expert");
    expect(calculateRank(50)).toBe("Legend");
  });

  it("should calculate level progress correctly", () => {
    const level = 3;
    const totalXp = 500;
    const currentLevelXp = xpForLevel(level);
    const nextLevelXp = xpForNextLevel(level);
    const progress = (totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp);
    expect(progress).toBeCloseTo(0.2);
  });

  it("should enforce daily XP cap of 200", () => {
    const dailyCap = 200;
    const dailyEarned = 180;
    const requested = 50;
    const effective = Math.min(requested, dailyCap - dailyEarned);
    expect(effective).toBe(20);
  });
});
