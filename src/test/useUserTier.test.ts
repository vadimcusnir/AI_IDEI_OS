import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules before imports
const mockUseAuth = vi.fn();
const mockUseSubscription = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => mockUseAuth() }));
vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: () => mockUseSubscription(),
  SUBSCRIPTION_TIERS: {},
}));

import { useUserTier } from "@/hooks/useUserTier";
import { renderHook } from "@testing-library/react";

describe("useUserTier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 'free' when no user", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    mockUseSubscription.mockReturnValue({ subscribed: false, tier: null, loading: false });
    const { result } = renderHook(() => useUserTier());
    expect(result.current.tier).toBe("free");
    expect(result.current.loading).toBe(false);
  });

  it("returns 'authenticated' when user exists but no subscription", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, loading: false });
    mockUseSubscription.mockReturnValue({ subscribed: false, tier: null, loading: false });
    const { result } = renderHook(() => useUserTier());
    expect(result.current.tier).toBe("authenticated");
  });

  it("returns 'pro' when user has active subscription", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, loading: false });
    mockUseSubscription.mockReturnValue({ subscribed: true, tier: "pro_monthly", loading: false });
    const { result } = renderHook(() => useUserTier());
    expect(result.current.tier).toBe("pro");
  });

  it("returns loading=true when auth is loading", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    mockUseSubscription.mockReturnValue({ subscribed: false, tier: null, loading: false });
    const { result } = renderHook(() => useUserTier());
    expect(result.current.loading).toBe(true);
  });

  it("returns loading=true when subscription is loading", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, loading: false });
    mockUseSubscription.mockReturnValue({ subscribed: false, tier: null, loading: true });
    const { result } = renderHook(() => useUserTier());
    expect(result.current.loading).toBe(true);
  });
});
