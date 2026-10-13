import "server-only";

import { cookies } from "next/headers";

import { AUTH_ROUTES } from "@/lib/routes";

// Lets the "check your e-mail" page offer a resend without putting the
// address in the URL. Readable only by the server, only on that page.
const PENDING_EMAIL_COOKIE = "mypr-pending-email";

export async function rememberPendingEmail(email: string): Promise<void> {
  (await cookies()).set(PENDING_EMAIL_COOKIE, email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: AUTH_ROUTES.checkEmail,
    maxAge: 60 * 60,
  });
}

export async function readPendingEmail(): Promise<string> {
  return (await cookies()).get(PENDING_EMAIL_COOKIE)?.value ?? "";
}
