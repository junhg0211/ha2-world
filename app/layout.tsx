import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Living Ring — RP World",
  description: "Discord와 연동되는 캐릭터 중심 오픈월드 RP 시스템",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
