import NextLink from "next/link";
import type { ReactNode } from "react";

import { Providers } from "../providers";
import { Wordmark } from "@/ds/brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-8 px-4 py-12 md:justify-center">
        <NextLink href="/" aria-label="MyPR, página inicial" className="self-start rounded-sm">
          <Wordmark className="text-xl" />
        </NextLink>
        <div className="flex flex-col gap-6">{children}</div>
      </main>
    </Providers>
  );
}
