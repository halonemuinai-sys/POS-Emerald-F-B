import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POS Emerald Dashboard - PT. Rahayu Arumdhani International",
  description: "Executive Data Cockpit & Transaction Ledger for Häagen-Dazs POS Emerald (MRA Group)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
