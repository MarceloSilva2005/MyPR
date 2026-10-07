import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
