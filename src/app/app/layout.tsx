import type { ReactNode } from "react";

import { Providers } from "../providers";
import { AppShell } from "@/features/shell/app-shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
