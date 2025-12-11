import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trading PnL Tracker",
  description: "Professional trading performance tracker with real-time analytics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
