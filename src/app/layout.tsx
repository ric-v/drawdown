import type { Metadata } from "next";
import { Gantari } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { auth } from "@/config/auth";
import { SessionProvider } from "@/components/auth/session-provider";
import { LoginScreen } from "@/components/auth/login-screen";
import { Analytics } from "@vercel/analytics/next"
import { headers } from "next/headers";
import { isPublicRoute } from "@/lib/is-public-route";

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
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  
  // Check if current route is public
  const isPublic = isPublicRoute(pathname);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${gantari.variable} font-sans antialiased`}>
        <ThemeProvider>
          <SessionProvider>
            {session || isPublic ? children : <LoginScreen />}
          </SessionProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
