export const ROUTES = {
  ROOT: "/",

  // Auth routes
  AUTH: {
    CALLBACK: "/auth/callback",
  },

  // User routes
  REGISTER: "/register",
  USER: {
    HOME: "/home",
    PROFILE: {
      ROOT: "/profile",
      EDIT: "/profile/edit",
      DELETE: "/profile/delete",
    },
    BOOKING: {
      NEW: "/booking",
      LIST: "/bookings",
    },
  },

  // Admin routes
  ADMIN: {
    ROOT: "/admin",
  },
} as const;

/**
 * Extracts all string values from ROUTES.USER object recursively
 */
export function getUserRouteValues(): string[] {
  const values: string[] = [];

  function extractValues(obj: Record<string, unknown>): void {
    for (const value of Object.values(obj)) {
      if (typeof value === "string") {
        values.push(value);
      } else if (typeof value === "object" && value !== null) {
        extractValues(value as Record<string, unknown>);
      }
    }
  }

  extractValues(ROUTES.USER);
  return values;
}
export const UserRouteValues = getUserRouteValues();
