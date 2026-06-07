import type { Metadata } from "next";
import { Montserrat, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { StagingBanner } from "@/components/staging/staging-chrome";
import { getAppDisplayName, getPublicAppEnvironment } from "@/lib/app-env";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const appEnv = getPublicAppEnvironment();
const appName = getAppDisplayName();

export const metadata: Metadata = {
  title:
    appEnv === "staging"
      ? `${appName} — Environnement TEST`
      : "SOFISMART — Gestion véhicules",
  description:
    appEnv === "staging"
      ? "SOFISMART — environnement de test et démonstration (données fictives)"
      : "Application de gestion des achats, stocks, ventes et dépôts SOFISMART",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${montserrat.variable} ${display.variable}`}>
      <body className="min-h-screen bg-cream-50 font-sans text-navy-900 antialiased">
        <StagingBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
