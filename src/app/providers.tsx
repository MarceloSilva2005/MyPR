"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { I18nProvider, RouterProvider } from "react-aria-components";

import { ToastProvider } from "@/ds/toast";

/** Wires React Aria to the Next.js router and to the product locale, and mounts the toast region. */
export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <RouterProvider
      navigate={(to) => {
        router.push(to);
      }}
    >
      <I18nProvider locale="pt-BR">
        <ToastProvider>{children}</ToastProvider>
      </I18nProvider>
    </RouterProvider>
  );
}
