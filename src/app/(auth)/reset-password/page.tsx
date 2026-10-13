import type { Metadata } from "next";

import { authContent } from "@/content/auth";
import { ButtonLink } from "@/ds/button";
import { InlineAlert } from "@/ds/feedback";
import { AuthHeader } from "@/features/auth/auth-header";
import { ResetPasswordForm } from "@/features/auth/forms";
import { AUTH_ROUTES } from "@/lib/routes";
import { getSessionUser } from "@/server/session";

export const metadata: Metadata = { title: authContent.resetPassword.title };

export default async function ResetPasswordPage() {
  // The recovery link signs the person in; without that session the link was not used.
  const user = await getSessionUser();
  const copy = authContent.resetPassword;

  return (
    <>
      <AuthHeader title={copy.title} {...(user ? { description: copy.description } : {})} />
      {user ? (
        <ResetPasswordForm />
      ) : (
        <>
          <InlineAlert tone="warning">{copy.expired}</InlineAlert>
          <ButtonLink href={AUTH_ROUTES.forgotPassword} variant="primary" className="w-full">
            {copy.requestAgain}
          </ButtonLink>
        </>
      )}
    </>
  );
}
