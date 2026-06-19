import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppTabBar from "./components/AppTabBar";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: BRAND.meta.title,
  description: BRAND.meta.description,
  openGraph: {
    title: BRAND.meta.ogTitle,
    description: BRAND.meta.ogDescription,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f9fb",
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
