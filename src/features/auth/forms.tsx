"use client";

import {
  requestPasswordReset,
  resendConfirmation,
  signIn,
  signUp,
  updatePassword,
} from "./actions";
import { AuthForm } from "./auth-form";
import { HumanCheck } from "./human-check";
import { authContent } from "@/content/auth";
import { Link } from "@/ds/link";
import { PasswordField } from "@/ds/password-field";
import { TextField } from "@/ds/text-field";
import { AUTH_ROUTES } from "@/lib/routes";

const { fields } = authContent;

const passwordToggle = {
  showLabel: authContent.showPassword,
  hideLabel: authContent.hidePassword,
};

function EmailField({ error, defaultValue }: { error?: string; defaultValue?: string }) {
  return (
    <TextField
      label={fields.email}
      name="email"
      type="email"
      inputMode="email"
      autoComplete="email"
      spellCheck="false"
      isRequired
      defaultValue={defaultValue ?? ""}
      {...(error ? { error } : {})}
    />
  );
}

export function SignInForm({ next, siteKey }: { next: string | undefined; siteKey: string }) {
  return (
    <AuthForm
      action={signIn}
      submitLabel={authContent.signIn.submit}
      footer={
        <p className="text-center text-sm text-fg-muted">
          {authContent.signIn.noAccount}{" "}
          <Link href={AUTH_ROUTES.signUp}>{authContent.signIn.toSignUp}</Link>
        </p>
      }
    >
      {(state) => (
        <>
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <EmailField
            {...(state.values?.email ? { defaultValue: state.values.email } : {})}
            {...(state.fieldErrors?.email ? { error: state.fieldErrors.email } : {})}
          />
          <div className="flex flex-col gap-2">
            <PasswordField
              label={fields.password}
              name="password"
              autoComplete="current-password"
              isRequired
              {...passwordToggle}
              {...(state.fieldErrors?.password ? { error: state.fieldErrors.password } : {})}
            />
            <Link href={AUTH_ROUTES.forgotPassword} className="self-start text-sm">
              {authContent.signIn.forgot}
            </Link>
          </div>
          {/* Only after repeated failures for this e-mail or address. */}
          {state.humanCheck ? (
            <HumanCheck siteKey={siteKey} action="sign-in" resetSignal={state} />
          ) : null}
        </>
      )}
    </AuthForm>
  );
}

export function SignUpForm({ siteKey }: { siteKey: string }) {
  return (
    <AuthForm
      action={signUp}
      submitLabel={authContent.signUp.submit}
      footer={
        <p className="text-center text-sm text-fg-muted">
          {authContent.signUp.hasAccount}{" "}
          <Link href={AUTH_ROUTES.signIn}>{authContent.signUp.toSignIn}</Link>
        </p>
      }
    >
      {(state) => (
        <>
          <TextField
            label={fields.displayName}
            name="displayName"
            autoComplete="nickname"
            maxLength={60}
            isRequired
            defaultValue={state.values?.displayName ?? ""}
            {...(state.fieldErrors?.displayName ? { error: state.fieldErrors.displayName } : {})}
          />
          <EmailField
            {...(state.values?.email ? { defaultValue: state.values.email } : {})}
            {...(state.fieldErrors?.email ? { error: state.fieldErrors.email } : {})}
          />
          <PasswordField
            label={fields.password}
            name="password"
            autoComplete="new-password"
            description={fields.passwordHint}
            isRequired
            {...passwordToggle}
            {...(state.fieldErrors?.password ? { error: state.fieldErrors.password } : {})}
          />
          <HumanCheck siteKey={siteKey} action="sign-up" resetSignal={state} />
        </>
      )}
    </AuthForm>
  );
}

export function ResendConfirmationForm({ email }: { email: string }) {
  return (
    <AuthForm
      action={resendConfirmation}
      submitLabel={authContent.checkEmail.resend}
      submitVariant="secondary"
    >
      {(state) => (
        <EmailField
          defaultValue={state.values?.email ?? email}
          {...(state.fieldErrors?.email ? { error: state.fieldErrors.email } : {})}
        />
      )}
    </AuthForm>
  );
}

export function ForgotPasswordForm({ siteKey }: { siteKey: string }) {
  return (
    <AuthForm action={requestPasswordReset} submitLabel={authContent.forgotPassword.submit}>
      {(state) => (
        <>
          <EmailField
            {...(state.values?.email ? { defaultValue: state.values.email } : {})}
            {...(state.fieldErrors?.email ? { error: state.fieldErrors.email } : {})}
          />
          <HumanCheck siteKey={siteKey} action="password-reset" resetSignal={state} />
        </>
      )}
    </AuthForm>
  );
}

export function ResetPasswordForm() {
  return (
    <AuthForm action={updatePassword} submitLabel={authContent.resetPassword.submit}>
      {(state) => (
        <PasswordField
          label={fields.newPassword}
          name="password"
          autoComplete="new-password"
          description={fields.passwordHint}
          isRequired
          {...passwordToggle}
          {...(state.fieldErrors?.password ? { error: state.fieldErrors.password } : {})}
        />
      )}
    </AuthForm>
  );
}
