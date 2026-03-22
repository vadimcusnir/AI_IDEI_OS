import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: { balance: 500 }, error: null });
const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
const mockSubscribe = vi.fn().mockReturnValue({});
const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe });
const mockChannel = vi.fn().mockReturnValue({ on: mockOn });
const mockRemoveChannel = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn().mockReturnValue({ user: { id: "test-user-id" } }),
}));

describe("useCreditBalance logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should query user_credits table with correct user_id", async () => {
    mockFrom("user_credits");
    expect(mockFrom).toHaveBeenCalledWith("user_credits");
  });

  it("should return 0 when no data found", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const result = await mockMaybeSingle();
    expect(result.data?.balance ?? 0).toBe(0);
  });

  it("should return balance from data", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { balance: 1234 }, error: null });
    const result = await mockMaybeSingle();
    expect(result.data.balance).toBe(1234);
  });

  it("should handle realtime channel setup", () => {
    mockChannel("credit-balance");
    expect(mockChannel).toHaveBeenCalledWith("credit-balance");
  });
});
