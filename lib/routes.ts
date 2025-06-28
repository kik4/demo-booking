export const ROUTES = {
  ROOT: "/",

  // Auth routes
  AUTH: {
    CALLBACK: "/auth/callback",
  },

  // User routes
  USER: {
    HOME: "/home",
    REGISTER: "/register",
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
