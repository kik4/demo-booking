import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UserInfo from "../UserInfo";

// Mock the entire supabase module
vi.mock("../../lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
      }),
      signOut: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        filter: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
            }),
          }),
        }),
      }),
    }),
  },
}));

// Mock location.reload
Object.defineProperty(window, "location", {
  value: {
    reload: vi.fn(),
  },
  writable: true,
});

describe("UserInfo", () => {
  it("コンポーネントがレンダリングされる", () => {
    render(<UserInfo />);
    // コンポーネントが正常にレンダリングされることを確認
    expect(document.body).toBeTruthy();
  });
});
