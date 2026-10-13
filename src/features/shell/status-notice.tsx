"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { authContent } from "@/content/auth";
import { useToast } from "@/ds/toast";

// Outcomes reported by redirects, addressed by a fixed code so no text from the
// URL reaches the page.
const NOTICES: Record<string, string> = {
  confirmed: authContent.confirmed,
  "password-updated": authContent.passwordUpdated,
};

/** Shows the outcome once as a toast, then removes it from the address. */
export function StatusNotice() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { show } = useToast();
  const status = params.get("status");
  // Development runs effects twice; the notice must still appear once.
  const shown = useRef<string | null>(null);

  useEffect(() => {
    const message = status ? NOTICES[status] : undefined;
    if (!message || shown.current === status) return;
    shown.current = status;
    show({ message, tone: "success" });
    const rest = new URLSearchParams(params);
    rest.delete("status");
    const query = rest.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [status, params, pathname, router, show]);

  return null;
}
