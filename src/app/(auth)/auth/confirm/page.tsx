import type { Metadata } from "next";

import { authContent } from "@/content/auth";
import { Button, ButtonLink } from "@/ds/button";
import { InlineAlert } from "@/ds/feedback";
import { confirmEmailLink } from "@/features/auth/actions";
import { AuthHeader } from "@/features/auth/auth-header";
import { AUTH_ROUTES } from "@/lib/routes";

export const metadata: Metadata = { title: authContent.confirm.title };

/**
 * Landing page of every e-mail link. Opening it changes nothing; the token is
 * only used when the person presses the button (see confirmEmailLink).
 */
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string | string[]; type?: string | string[] }>;
}) {
  const { token_hash: tokenHash, type } = await searchParams;
  const copy = authContent.confirm;

  if (typeof tokenHash !== "string" || typeof type !== "string") {
    return (
      <>
        <AuthHeader title={copy.title} />
        <InlineAlert tone="warning">{authContent.linkInvalid}</InlineAlert>
        <ButtonLink href={AUTH_ROUTES.signIn} variant="primary" className="w-full">
          {authContent.signIn.submit}
        </ButtonLink>
      </>
    );
  }

  const recovery = type === "recovery";
  return (
    <>
      <AuthHeader
        title={recovery ? authContent.resetPassword.title : copy.title}
        description={recovery ? copy.recoveryBody : copy.body}
      />
      <form action={confirmEmailLink} className="flex flex-col gap-4">
        <input type="hidden" name="token_hash" value={tokenHash} />
        <input type="hidden" name="type" value={type} />
        <Button type="submit" variant="primary" className="w-full">
          {recovery ? copy.recoverySubmit : copy.submit}
        </Button>
      </form>
    </>
  );
}
