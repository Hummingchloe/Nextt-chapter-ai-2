import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppTabBar from "./components/AppTabBar";

export const metadata: Metadata = {
  title: "My Life Compass — AI 시대에 내 경험을 새 수익으로",
  description:
    "AI 시대에 내 경험과 기술을 새로운 수익 기회로 바꾸는 Life Compass OS.",
  openGraph: {
    title: "My Life Compass",
    description:
      "채팅과 리포트를 통해 내 경험을 새 수익 기회로 바꾸는 방향을 찾아요.",
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
