import type { Metadata } from "next";

import { authContent } from "@/content/auth";
import { getSupabaseEnv } from "@/env";
import { InlineAlert } from "@/ds/feedback";
import { Link } from "@/ds/link";
import { AuthHeader } from "@/features/auth/auth-header";
import { ForgotPasswordForm } from "@/features/auth/forms";
import { AUTH_ROUTES } from "@/lib/routes";

export const metadata: Metadata = { title: authContent.forgotPassword.title };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { status } = await searchParams;
  const copy = authContent.forgotPassword;

  return (
    <>
      <AuthHeader title={copy.title} description={copy.description} />
      {status === "link-expired" ? (
        <InlineAlert tone="warning">{authContent.resetPassword.expired}</InlineAlert>
      ) : null}
      <ForgotPasswordForm siteKey={getSupabaseEnv().TURNSTILE_SITE_KEY} />
      <Link href={AUTH_ROUTES.signIn} className="self-start text-sm">
        {copy.back}
      </Link>
    </>
  );
}
