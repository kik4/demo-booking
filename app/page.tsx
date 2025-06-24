import { DevLoginButtonContainer } from "./_components/DevLoginButtonContainer";
import { LoginButtonContainer } from "./_components/LoginButtonContainer";

export default function Page() {
  return (
    <div className="relative min-h-screen bg-white">
      {/* Background image container */}
      <div
        className="absolute top-0 left-0 h-screen w-full bg-center bg-cover bg-no-repeat opacity-90 blur-sm"
        style={{
          backgroundImage: "url('/top.webp')",
          backgroundPosition: "center center",
        }}
      >
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white/80" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
          <h1 className="mb-8 text-center font-bold text-3xl text-gray-800 tracking-tight">
            デモ予約システム
          </h1>

          <div className="space-y-6">
            <div className="flex justify-center">
              {process.env.NEXT_PUBLIC_VERCEL_ENV === "development" ? (
                <DevLoginButtonContainer />
              ) : (
                <LoginButtonContainer />
              )}
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 h-20 w-20 rounded-full bg-blue-100 opacity-60 blur-xl" />
        <div className="absolute right-10 bottom-20 h-32 w-32 rounded-full bg-purple-100 opacity-40 blur-2xl" />
        <div className="absolute top-1/2 left-1/4 h-16 w-16 rounded-full bg-pink-100 opacity-50 blur-lg" />
      </div>
    </div>
  );
}
