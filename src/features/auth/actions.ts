"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { messageForAuthError, revealsAccount } from "./errors";
import { fieldErrors, readFields, type AuthFormState } from "./form-state";
import { rememberPendingEmail } from "./pending-email";
import { authContent } from "@/content/auth";
import { usesContextWords } from "@/domain/password";
import { safeRedirectPath } from "@/lib/redirect";
import { AUTH_ROUTES } from "@/lib/routes";
import { emailOnlySchema, newPasswordSchema, signInSchema, signUpSchema } from "@/schemas/auth";
import { anyLimitReached, clientAddress, RATE_RULES, withinRateLimits } from "@/server/rate-limit";
import { createSupabaseServerClient } from "@/server/supabase";
import { TURNSTILE_FIELD, verifyHuman, type HumanCheckAction } from "@/server/turnstile";

// Next.js rejects Server Actions whose Origin differs from the host, which
// covers cross-site request forgery for every action in this file.

const { errors } = authContent;

/** Message for a failed human check, or nothing when it passed. */
async function humanCheckFailure(form: FormData, action: HumanCheckAction): Promise<string | null> {
  const result = await verifyHuman(form.get(TURNSTILE_FIELD), action, await clientAddress());
  if (result === "passed") return null;
  return result === "unavailable" ? errors.unavailable : errors.humanCheck;
}

type SignUpField = "displayName" | "email" | "password";

export async function signUp(
  _previous: AuthFormState<SignUpField>,
  form: FormData,
): Promise<AuthFormState<SignUpField>> {
  const raw = readFields(form, ["displayName", "email", "password"]);
  const values = { displayName: raw.displayName, email: raw.email };
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      values,
      fieldErrors: fieldErrors(parsed.error, {
        displayName: errors.displayName,
        email: errors.email,
        password: errors.password,
      }),
    };
  }

  if (usesContextWords(parsed.data.password, parsed.data)) {
    return { status: "error", values, fieldErrors: { password: errors.contextPassword } };
  }

  const humanCheck = await humanCheckFailure(form, "sign-up");
  if (humanCheck) return { status: "error", values, message: humanCheck };

  if (!(await withinRateLimits([[RATE_RULES.signUpByAddress, await clientAddress()]]))) {
    return { status: "error", values, message: errors.rateLimited };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName } },
  });

  // An address that already has an account gets the same answer as a new one.
  if (error && !revealsAccount(error.code)) {
    const message = messageForAuthError(error.code);
    return error.code === "weak_password"
      ? { status: "error", values, fieldErrors: { password: message } }
      : { status: "error", values, message };
  }

  await rememberPendingEmail(parsed.data.email);
  redirect(AUTH_ROUTES.checkEmail);
}

type SignInField = "email" | "password";

export async function signIn(
  _previous: AuthFormState<SignInField>,
  form: FormData,
): Promise<AuthFormState<SignInField>> {
  const raw = readFields(form, ["email", "password"]);
  const values = { email: raw.email };
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      values,
      fieldErrors: fieldErrors(parsed.error, {
        email: errors.email,
        password: errors.passwordRequired,
      }),
    };
  }

  const address = await clientAddress();
  const failures = [
    [RATE_RULES.signInFailuresByEmail, parsed.data.email],
    [RATE_RULES.signInFailuresByAddress, address],
  ] as const;

  // After repeated failures for this e-mail or address, sign-in asks for the human check.
  if (await anyLimitReached(failures)) {
    const humanCheck = await humanCheckFailure(form, "sign-in");
    if (humanCheck) return { status: "error", values, message: humanCheck, humanCheck: true };
  }

  const allowed = await withinRateLimits([
    [RATE_RULES.signInByAddress, address],
    [RATE_RULES.signInByEmail, parsed.data.email],
  ]);
  if (!allowed) return { status: "error", values, message: errors.rateLimited };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") await rememberPendingEmail(parsed.data.email);
    if (error.code === "invalid_credentials") await withinRateLimits(failures);
    return {
      status: "error",
      values,
      message: messageForAuthError(error.code),
      humanCheck: await anyLimitReached(failures),
    };
  }

  const next = form.get("next");
  redirect(safeRedirectPath(typeof next === "string" ? next : null));
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  // Ends this device's session only; ending every session is a separate action.
  await supabase.auth.signOut({ scope: "local" });
  redirect(`${AUTH_ROUTES.signIn}?status=signed-out`);
}

type EmailField = "email";

// Applies to every e-mail sent on request, counted per sender and per recipient.
async function withinEmailLimits(email: string): Promise<boolean> {
  return withinRateLimits([
    [RATE_RULES.emailByAddress, await clientAddress()],
    [RATE_RULES.emailByRecipient, email],
  ]);
}

export async function resendConfirmation(
  _previous: AuthFormState<EmailField>,
  form: FormData,
): Promise<AuthFormState<EmailField>> {
  const raw = readFields(form, ["email"]);
  const parsed = emailOnlySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", values: raw, fieldErrors: { email: errors.email } };
  }

  if (!(await withinEmailLimits(parsed.data.email))) {
    return { status: "error", values: raw, message: errors.rateLimited };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: parsed.data.email });
  if (error?.code?.startsWith("over_")) {
    return { status: "error", values: raw, message: messageForAuthError(error.code) };
  }
  return { status: "done", values: raw, message: authContent.checkEmail.resent };
}

export async function requestPasswordReset(
  _previous: AuthFormState<EmailField>,
  form: FormData,
): Promise<AuthFormState<EmailField>> {
  const raw = readFields(form, ["email"]);
  const parsed = emailOnlySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", values: raw, fieldErrors: { email: errors.email } };
  }

  const humanCheck = await humanCheckFailure(form, "password-reset");
  if (humanCheck) return { status: "error", values: raw, message: humanCheck };

  if (!(await withinEmailLimits(parsed.data.email))) {
    return { status: "error", values: raw, message: errors.rateLimited };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);
  // Only rate limits are reported; anything else would hint at the account.
  if (error?.code?.startsWith("over_")) {
    return { status: "error", values: raw, message: messageForAuthError(error.code) };
  }
  return { status: "done", values: raw, message: authContent.forgotPassword.sent };
}

type PasswordField = "password";

export async function updatePassword(
  _previous: AuthFormState<PasswordField>,
  form: FormData,
): Promise<AuthFormState<PasswordField>> {
  const parsed = newPasswordSchema.safeParse(readFields(form, ["password"]));
  if (!parsed.success) {
    return { status: "error", fieldErrors: { password: errors.password } };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data) return { status: "error", message: authContent.resetPassword.expired };

  const email = typeof data.claims.email === "string" ? data.claims.email : "";
  if (usesContextWords(parsed.data.password, { email })) {
    return { status: "error", fieldErrors: { password: errors.contextPassword } };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    const message = messageForAuthError(error.code);
    return error.code === "weak_password" || error.code === "same_password"
      ? { status: "error", fieldErrors: { password: message } }
      : { status: "error", message };
  }
  redirect("/app?status=password-updated");
}

const CONFIRMABLE: readonly EmailOtpType[] = ["signup", "email", "recovery", "email_change"];

/**
 * Consumes the token from an e-mail link. It runs on a button press, not when
 * the link is opened, so mail scanners that follow links cannot use it up.
 */
export async function confirmEmailLink(form: FormData): Promise<void> {
  const tokenHash = form.get("token_hash");
  const type = form.get("type");
  if (
    typeof tokenHash !== "string" ||
    !/^[A-Za-z0-9_-]{8,256}$/.test(tokenHash) ||
    !CONFIRMABLE.includes(type as EmailOtpType)
  ) {
    redirect(`${AUTH_ROUTES.signIn}?status=link-invalid`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash,
  });

  if (type === "recovery") {
    redirect(
      error ? `${AUTH_ROUTES.forgotPassword}?status=link-expired` : AUTH_ROUTES.resetPassword,
    );
  }
  redirect(error ? `${AUTH_ROUTES.signIn}?status=link-invalid` : "/app?status=confirmed");
}
