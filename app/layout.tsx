import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Next Chapter AI — 내가 다시 시작할 수 있는 일의 방향 찾기",
  description:
    "미국 한인 이민자 엄마를 위한 AI 진단. 15분이면, 내 경험으로 다시 시작할 수 있는 일의 방향 하나가 선명해져요.",
  openGraph: {
    title: "My Next Chapter AI",
    description:
      "내 경험으로 다시 시작할 수 있는 일의 방향 하나를, AI와 함께 찾아보세요.",
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
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
