import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUseAuth = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => mockUseAuth() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: (...args: any[]) => mockRpc(...args) },
}));

import { useAdminCheck } from "@/hooks/useAdminCheck";
import { renderHook, waitFor } from "@testing-library/react";

describe("useAdminCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns isAdmin=false when no user", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    const { result } = renderHook(() => useAdminCheck());
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it("checks admin role via RPC when user exists", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, loading: false });
    mockRpc.mockResolvedValue({ data: true });
    const { result } = renderHook(() => useAdminCheck());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockRpc).toHaveBeenCalledWith("has_role", { _user_id: "u1", _role: "admin" });
    expect(result.current.isAdmin).toBe(true);
  });

  it("returns isAdmin=false when RPC returns false", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u2" }, loading: false });
    mockRpc.mockResolvedValue({ data: false });
    const { result } = renderHook(() => useAdminCheck());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAdmin).toBe(false);
  });

  it("stays loading while auth is loading", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    const { result } = renderHook(() => useAdminCheck());
    expect(result.current.loading).toBe(true);
  });
});
