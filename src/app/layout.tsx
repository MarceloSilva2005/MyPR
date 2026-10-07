import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "MyPR",
  description: "Plataforma de acompanhamento de performance para musculação.",
  authors: [
    { name: "MarceloSilva2005", url: "https://github.com/MarceloSilva2005" },
    { name: "Felipe1dev", url: "https://github.com/Felipe1dev" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
