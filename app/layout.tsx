import type { Metadata } from "next";
import { Lato, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import clsx from "clsx";
import { Toaster } from "react-hot-toast";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "デモ予約システム : kik4",
  description: "デモ予約システム created by kik4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={clsx(
          notoSansJp.variable,
          lato.variable,
          "font-default antialiased",
        )}
      >
        {children}
        <footer className="fixed right-0 bottom-0 left-0 z-50 py-2 text-center">
          <p className="text-gray-500 text-xs">
            ©{" "}
            <a
              href="https://kik4.work/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-gray-700"
            >
              kik4
            </a>
          </p>
        </footer>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
