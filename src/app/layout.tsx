import type { Metadata } from "next";
import { Gantari } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SettingsProvider } from "@/hooks/use-settings";
import { SessionProvider } from "@/components/auth/session-provider";
import { Analytics } from "@vercel/analytics/next"

const gantari = Gantari({
  subsets: ["latin"],
  variable: "--font-gantari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Drawdown",
  description: "Professional trading performance tracker",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Root layout just provides the base HTML structure and providers
  // Authentication is handled by individual route groups
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${gantari.variable} font-sans antialiased h-full flex flex-col`}>
        <ThemeProvider>
          <SessionProvider>
            <SettingsProvider>
              {children}
            </SettingsProvider>
          </SessionProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
