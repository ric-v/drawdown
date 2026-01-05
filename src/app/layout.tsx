import type { Metadata } from "next";
import { Gantari } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { auth } from "@/config/auth";
import { SessionProvider } from "@/components/auth/session-provider";
import { LoginScreen } from "@/components/auth/login-screen";

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${gantari.variable} font-sans antialiased`}>
        <ThemeProvider>
          <SessionProvider>
            {session ? children : <LoginScreen />}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
