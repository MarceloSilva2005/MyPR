"use server";

import { z } from "zod";

import { accountContent } from "@/content/account";
import { authContent } from "@/content/auth";
import { usesContextWords } from "@/domain/password";
import { messageForAuthError } from "@/features/auth/errors";
import { readFields, type AuthFormState } from "@/features/auth/form-state";
import { newPasswordSchema } from "@/schemas/auth";
import { confirmPassword, endReauthSession, type ReauthResult } from "@/server/reauth";
import { requireUser } from "@/server/session";
import { createSupabaseServerClient } from "@/server/supabase";

const currentPassword = z.string().min(1).max(1024);

function reauthFailure(result: Exclude<ReauthResult, { ok: true }>) {
  switch (result.reason) {
    case "invalid":
      return { fieldErrors: { currentPassword: accountContent.errors.wrongPassword } };
    case "rate_limited":
      return { message: authContent.errors.rateLimited };
    case "unavailable":
      return { message: authContent.errors.unavailable };
  }
}

type ChangePasswordField = "currentPassword" | "password";

export async function changePassword(
  _previous: AuthFormState<ChangePasswordField>,
  form: FormData,
): Promise<AuthFormState<ChangePasswordField>> {
  const user = await requireUser("/app/settings");
  const raw = readFields(form, ["currentPassword", "password"]);

  const fieldErrors: Partial<Record<ChangePasswordField, string>> = {};
  if (!currentPassword.safeParse(raw.currentPassword).success) {
    fieldErrors.currentPassword = accountContent.errors.currentPassword;
  }
  const next = newPasswordSchema.safeParse({ password: raw.password });
  if (!next.success) fieldErrors.password = authContent.errors.password;
  else if (usesContextWords(next.data.password, { email: user.email })) {
    fieldErrors.password = authContent.errors.contextPassword;
  }
  if (!next.success || fieldErrors.currentPassword || fieldErrors.password) {
    return { status: "error", fieldErrors };
  }

  const reauth = await confirmPassword(user, raw.currentPassword);
  if (!reauth.ok) return { status: "error", ...reauthFailure(reauth) };

  // Changed through the session created by the confirmation, which counts as a
  // recent sign-in for the provider.
  const { error } = await reauth.session.auth.updateUser({ password: next.data.password });
  if (error) {
    await endReauthSession(reauth.session);
    const message = messageForAuthError(error.code);
    return error.code === "weak_password" || error.code === "same_password"
      ? { status: "error", fieldErrors: { password: message } }
      : { status: "error", message };
  }

  // The provider ends the account's other sessions on a password change,
  // including the one of this device. This device continues on the fresh
  // session from the confirmation, and anything left elsewhere is ended.
  const { data } = await reauth.session.auth.getSession();
  const supabase = await createSupabaseServerClient();
  if (data.session) {
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  }
  await supabase.auth.signOut({ scope: "others" });
  return { status: "done", message: accountContent.password.done };
}

type SessionsField = "currentPassword";

export async function signOutOtherDevices(
  _previous: AuthFormState<SessionsField>,
  form: FormData,
): Promise<AuthFormState<SessionsField>> {
  const user = await requireUser("/app/settings");
  const raw = readFields(form, ["currentPassword"]);
  if (!currentPassword.safeParse(raw.currentPassword).success) {
    return {
      status: "error",
      fieldErrors: { currentPassword: accountContent.errors.currentPassword },
    };
  }

  const reauth = await confirmPassword(user, raw.currentPassword);
  if (!reauth.ok) return { status: "error", ...reauthFailure(reauth) };

  await endOtherSessions();
  await endReauthSession(reauth.session);
  return { status: "done", message: accountContent.sessions.done };
}

/** Ends every session of the account except the one making this request. */
async function endOtherSessions(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "others" });
}
