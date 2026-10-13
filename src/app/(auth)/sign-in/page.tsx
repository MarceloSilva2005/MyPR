import type { Metadata } from "next";

import { authContent } from "@/content/auth";
import { getSupabaseEnv } from "@/env";
import { InlineAlert } from "@/ds/feedback";
import { AuthHeader } from "@/features/auth/auth-header";
import { SignInForm } from "@/features/auth/forms";

export const metadata: Metadata = { title: authContent.signIn.title };

// Messages addressed by a fixed code, so no text from the URL reaches the page.
const NOTICES = {
  "signed-out": { tone: "info", text: authContent.signedOut },
  "link-invalid": { tone: "warning", text: authContent.linkInvalid },
} as const;

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; status?: string | string[] }>;
}) {
  const { next, status } = await searchParams;
  const notice =
    typeof status === "string" && status in NOTICES
      ? NOTICES[status as keyof typeof NOTICES]
      : null;

  return (
    <>
      <AuthHeader title={authContent.signIn.title} />
      {notice ? <InlineAlert tone={notice.tone}>{notice.text}</InlineAlert> : null}
      <SignInForm
        next={typeof next === "string" ? next : undefined}
        siteKey={getSupabaseEnv().TURNSTILE_SITE_KEY}
      />
    </>
  );
}
