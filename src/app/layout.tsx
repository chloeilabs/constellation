import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { connection } from "next/server";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ApiBanner } from "@/components/api-banner";
import { GlobalIndexTicker } from "@/components/global-index-ticker";
import { hasFmpKey } from "@/lib/fmp";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Stock Analysis — Free stock research and financials",
    template: "%s | Stock Analysis",
  },
  description:
    "All-in-one stock analysis platform with prices, financials, news, forecasts, charts, and a stock screener. Powered by Financial Modeling Prep.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection();
  const configured = hasFmpKey();
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("sa-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <SiteHeader />
        <GlobalIndexTicker />
        {!configured ? <ApiBanner /> : null}
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
