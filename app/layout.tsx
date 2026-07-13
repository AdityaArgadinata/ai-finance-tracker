import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Normiuz",
  description: "Dashboard keuangan dengan analitik transaksi real-time",
  icons: { icon: "/normiuz.png", apple: "/normiuz.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
