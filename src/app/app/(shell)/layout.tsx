import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { AppShell } from "@/features/shell/app-shell";
import { StatusNotice } from "@/features/shell/status-notice";
import { getCurrentProfile } from "@/server/profile";

export default async function ShellLayout({ children }: { children: ReactNode }) {
  // A first visit that has not finished onboarding continues there (section 7.2).
  const profile = await getCurrentProfile();
  if (!profile.onboarding_completed_at) redirect("/app/onboarding");

  return (
    <AppShell>
      <Suspense>
        <StatusNotice />
      </Suspense>
      {children}
    </AppShell>
  );
}
