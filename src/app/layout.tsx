import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import "./globals.css";
import { themeInitScript } from "@/ds/theme";

export const metadata: Metadata = {
  title: { default: "MyPR", template: "%s · MyPR" },
  description: "Plataforma de acompanhamento de performance para musculação.",
  authors: [
    { name: "MarceloSilva2005", url: "https://github.com/MarceloSilva2005" },
    { name: "Felipe1dev", url: "https://github.com/Felipe1dev" },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Set by src/proxy.ts. Reading it renders every page per request, which the
  // nonce-based Content Security Policy requires (see ADR 0004).
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="pt-BR"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* React Aria reads the nonce from here for the styles it injects. */}
        <meta name="csp-nonce" nonce={nonce} />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
