"use client";

import "./globals.css";
import { appPages } from "@/content/app-pages";
import { buttonClassName } from "@/ds/button-styles";

/**
 * Last-resort boundary, used when the root layout itself fails. It is loaded with every page, so it
 * uses a native button instead of the component library to keep the first load small.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  const copy = appPages.error;
  return (
    <html lang="pt-BR">
      <body>
        <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-4 py-16">
          <h1 className="text-xl font-semibold tracking-tight">{copy.title}</h1>
          <p className="text-fg-muted">{copy.description}</p>
          <div>
            <button
              type="button"
              onClick={reset}
              className={buttonClassName({ variant: "primary" })}
            >
              {copy.retry}
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
