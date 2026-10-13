import type { Metadata } from "next";

import { authContent } from "@/content/auth";
import { Link } from "@/ds/link";
import { AuthHeader } from "@/features/auth/auth-header";
import { ResendConfirmationForm } from "@/features/auth/forms";
import { readPendingEmail } from "@/features/auth/pending-email";
import { AUTH_ROUTES } from "@/lib/routes";

export const metadata: Metadata = { title: authContent.checkEmail.title };

export default async function CheckEmailPage() {
  const email = await readPendingEmail();
  const copy = authContent.checkEmail;

  return (
    <>
      <AuthHeader title={copy.title} description={copy.body} />
      <p className="text-sm text-fg-muted">{copy.spam}</p>
      <ResendConfirmationForm email={email} />
      <Link href={AUTH_ROUTES.signIn} className="self-start text-sm">
        {copy.back}
      </Link>
    </>
  );
}
