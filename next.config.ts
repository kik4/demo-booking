import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // Dynamic CSP based on environment
    const isDevelopment = process.env.NODE_ENV === "development";
    const connectSrcDirectives = [
      "'self'",
      "https://*.supabase.co",
      "wss://*.supabase.co",
    ];

    // Add local Supabase endpoints for development
    if (isDevelopment) {
      connectSrcDirectives.push(
        "http://127.0.0.1:54321",
        "ws://127.0.0.1:54321",
      );
    }

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              `connect-src ${connectSrcDirectives.join(" ")}`,
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
