import type { ReactNode } from "react";

import { Providers } from "../providers";
import { requireUser } from "@/server/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // The proxy already turns visitors away; this check does not depend on it.
  await requireUser();

  return <Providers>{children}</Providers>;
}
