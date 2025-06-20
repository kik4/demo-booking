import type { Metadata } from "next";
import { Lato, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import clsx from "clsx";

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
  title: "デモ予約アプリ : kik4",
  description: "デモ予約アプリ created by kik4",
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
      </body>
    </html>
  );
}
