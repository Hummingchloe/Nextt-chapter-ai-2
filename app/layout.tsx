import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppTabBar from "./components/AppTabBar";

export const metadata: Metadata = {
  title: "My Next Chapter AI — Compass Chat",
  description:
    "채팅 기록으로 나의 방향을 찾고, 대시보드에서 정렬도와 다음 행동을 확인하는 Compass Chat.",
  openGraph: {
    title: "My Next Chapter AI",
    description:
      "채팅에 기록하면 Compass가 갱신되고 대시보드에서 다음 행동을 확인할 수 있어요.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf7f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-dvh antialiased">
        {children}
        <AppTabBar />
      </body>
    </html>
  );
}
