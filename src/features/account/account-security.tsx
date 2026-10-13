"use client";

import { useState } from "react";

import { changePassword, signOutOtherDevices } from "./actions";
import { accountContent } from "@/content/account";
import { authContent } from "@/content/auth";
import { Button } from "@/ds/button";
import { Modal } from "@/ds/modal";
import { PasswordField } from "@/ds/password-field";
import { useToast } from "@/ds/toast";
import { AuthForm } from "@/features/auth/auth-form";

const toggle = { showLabel: authContent.showPassword, hideLabel: authContent.hidePassword };

function CurrentPasswordField({ error }: { error: string | undefined }) {
  return (
    <PasswordField
      label={accountContent.currentPassword}
      name="currentPassword"
      autoComplete="current-password"
      isRequired
      {...toggle}
      {...(error ? { error } : {})}
    />
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg">{label}</p>
        {hint ? <p className="text-sm text-fg-muted">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

/** Password change and session control. Both ask for the current password. */
export function AccountSecurity() {
  const [dialog, setDialog] = useState<"password" | "sessions" | null>(null);
  const { show } = useToast();
  const close = () => {
    setDialog(null);
  };
  const finish = (message: string | undefined) => {
    setDialog(null);
    if (message) show({ message, tone: "success" });
  };

  const { password, sessions } = accountContent;

  return (
    <>
      <Row label={password.label}>
        <Button
          variant="secondary"
          onPress={() => {
            setDialog("password");
          }}
        >
          {password.action}
        </Button>
      </Row>
      <Row label={sessions.label} hint={sessions.hint}>
        <Button
          variant="secondary"
          onPress={() => {
            setDialog("sessions");
          }}
        >
          {sessions.action}
        </Button>
      </Row>

      <Modal
        title={password.title}
        description={password.description}
        isOpen={dialog === "password"}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <AuthForm
          action={changePassword}
          submitLabel={password.submit}
          onDone={(state) => {
            finish(state.message);
          }}
        >
          {(state) => (
            <>
              <CurrentPasswordField error={state.fieldErrors?.currentPassword} />
              <PasswordField
                label={authContent.fields.newPassword}
                name="password"
                autoComplete="new-password"
                description={authContent.fields.passwordHint}
                isRequired
                {...toggle}
                {...(state.fieldErrors?.password ? { error: state.fieldErrors.password } : {})}
              />
            </>
          )}
        </AuthForm>
      </Modal>

      <Modal
        title={sessions.title}
        description={sessions.description}
        isOpen={dialog === "sessions"}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <AuthForm
          action={signOutOtherDevices}
          submitLabel={sessions.submit}
          onDone={(state) => {
            finish(state.message);
          }}
        >
          {(state) => <CurrentPasswordField error={state.fieldErrors?.currentPassword} />}
        </AuthForm>
      </Modal>
    </>
  );
}
