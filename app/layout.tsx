import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard Keuangan",
  description: "Financial dashboard with real-time transaction analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif" }}
    >
      <body className="min-h-full flex flex-col" style={{ fontFamily: "inherit" }}>{children}</body>
    </html>
  );
}
