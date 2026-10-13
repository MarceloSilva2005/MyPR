import type { ReactNode } from "react";

import { Wordmark } from "@/ds/brand";

/** A focused page without the application navigation. */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-12 md:justify-center">
      <Wordmark className="self-start text-xl" />
      {children}
    </main>
  );
}
