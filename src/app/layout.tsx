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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'||t==='system'){if(t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.classList.add(t);}else{var d=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.classList.add(d);}}catch(e){document.documentElement.classList.add(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}})();`,
          }}
        />
      </head>
      <body className={`${gantari.variable} font-sans antialiased h-full flex flex-col`}>
        <SessionProvider>
          <SettingsProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </SettingsProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
