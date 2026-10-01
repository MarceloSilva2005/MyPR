import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Public_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const sans = Public_Sans({
  variable: "--font-sans-mypr",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono-mypr",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "MyPR — Sua evolução nos treinos",
  description: "Registre séries, acompanhe volume, evolução de carga e recordes pessoais.",
  applicationName: "MyPR",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#1A1613",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${sans.variable} ${mono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
