import type { Metadata } from "next";
import { Gantari } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SettingsProvider } from "@/hooks/use-settings";
import { auth } from "@/config/auth";
import { SessionProvider } from "@/components/auth/session-provider";
import { LoginScreen } from "@/components/auth/login-screen";
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
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${gantari.variable} font-sans antialiased h-full flex flex-col`}>
        <ThemeProvider>
          <SessionProvider>
            <SettingsProvider>
              {session ? children : <LoginScreen />}
            </SettingsProvider>
          </SessionProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
