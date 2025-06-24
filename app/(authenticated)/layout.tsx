import type { ReactNode } from "react";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100">
      <div
        className="absolute inset-x-0 top-0 z-0 h-96 bg-center bg-cover"
        style={{
          backgroundImage: "url('/top.webp')",
          WebkitMask: "linear-gradient(to bottom, black 0%, transparent 100%)",
          mask: "linear-gradient(to bottom, black 0%, transparent 100%)",
        }}
      />
      <div className="container relative z-10 mx-auto px-4">{children}</div>
    </div>
  );
}
