/** biome-ignore-all lint/suspicious/noExplicitAny: for utility */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireAuth } from "@/lib/auth";
import { getAvailableTimeSlotsForDate } from "@/lib/db/bookings/getAvailableTimeSlotsForDate";
import {
  createClient,
  createServiceClient,
} from "@/lib/supabase/supabaseClientServer";
import { getAvailableTimeSlotsForDateAction } from "../getAvailableTimeSlotsForDateAction";

vi.mock("@/lib/auth");
vi.mock("@/lib/db/bookings/getAvailableTimeSlotsForDate");
vi.mock("@/lib/supabaseClientServer");

describe("getAvailableTimeSlotsForDateAction", () => {
  const mockCreateClient = vi.mocked(createClient);
  const mockCreateServiceClient = vi.mocked(createServiceClient);
  const mockRequireAuth = vi.mocked(requireAuth);
  const mockGetAvailableTimeSlotsForDate = vi.mocked(
    getAvailableTimeSlotsForDate,
  );

  const mockSupabaseClient = {} as any;
  const mockServiceClient = {} as any;

  beforeEach(() => {
    mockCreateClient.mockResolvedValue(mockSupabaseClient);
    mockCreateServiceClient.mockResolvedValue(mockServiceClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should create both regular and service clients", async () => {
    mockRequireAuth.mockImplementation(async (_client, callback) => {
      return callback({
        success: true,
        user: { id: "test-user", email: "test@example.com" },
      });
    });
    mockGetAvailableTimeSlotsForDate.mockResolvedValue({
      availableSlots: [],
    });

    await getAvailableTimeSlotsForDateAction("2024-01-15");

    expect(mockCreateClient).toHaveBeenCalledOnce();
    expect(mockCreateServiceClient).toHaveBeenCalledOnce();
  });

  it("should call requireAuth with the regular client", async () => {
    mockRequireAuth.mockImplementation(async (_client, callback) => {
      return callback({
        success: true,
        user: { id: "test-user", email: "test@example.com" },
      });
    });
    mockGetAvailableTimeSlotsForDate.mockResolvedValue({
      availableSlots: [],
    });

    await getAvailableTimeSlotsForDateAction("2024-01-15");

    expect(mockRequireAuth).toHaveBeenCalledWith(
      mockSupabaseClient,
      expect.any(Function),
    );
  });

  it("should call getAvailableTimeSlotsForDate with date and service client", async () => {
    mockRequireAuth.mockImplementation(async (_client, callback) => {
      return callback({
        success: true,
        user: { id: "test-user", email: "test@example.com" },
      });
    });
    mockGetAvailableTimeSlotsForDate.mockResolvedValue({
      availableSlots: [],
    });

    await getAvailableTimeSlotsForDateAction("2024-01-15");

    expect(mockGetAvailableTimeSlotsForDate).toHaveBeenCalledWith(
      "2024-01-15",
      mockServiceClient,
    );
  });

  it("should return available slots when authentication succeeds", async () => {
    const mockSlots = [
      { start_time: "09:00", end_time: "13:00" },
      { start_time: "15:00", end_time: "19:00" },
    ];

    mockRequireAuth.mockImplementation(async (_client, callback) => {
      return callback({
        success: true,
        user: { id: "test-user", email: "test@example.com" },
      });
    });
    mockGetAvailableTimeSlotsForDate.mockResolvedValue({
      availableSlots: mockSlots,
    });

    const result = await getAvailableTimeSlotsForDateAction("2024-01-15");

    expect(result).toEqual({
      availableSlots: mockSlots,
    });
  });

  it("should return error when authentication fails", async () => {
    const mockError = { error: "Authentication failed" };
    mockRequireAuth.mockResolvedValue(mockError);

    const result = await getAvailableTimeSlotsForDateAction("2024-01-15");

    expect(result).toEqual(mockError);
  });

  it("should propagate errors from getAvailableTimeSlotsForDate", async () => {
    mockRequireAuth.mockImplementation(async (_client, callback) => {
      return callback({
        success: true,
        user: { id: "test-user", email: "test@example.com" },
      });
    });
    mockGetAvailableTimeSlotsForDate.mockRejectedValue(
      new Error("Database error"),
    );

    await expect(
      getAvailableTimeSlotsForDateAction("2024-01-15"),
    ).rejects.toThrow("Database error");
  });
});
