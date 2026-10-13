"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  type SubmitEvent,
  type ReactNode,
} from "react";

import { idle, type AuthFormState } from "./form-state";
import { Button } from "@/ds/button";
import { InlineAlert } from "@/ds/feedback";

type Action<Field extends string> = (
  previous: AuthFormState<Field>,
  form: FormData,
) => Promise<AuthFormState<Field>>;

interface AuthFormProps<Field extends string> {
  action: Action<Field>;
  submitLabel: string;
  /** Secondary when the form is not the main task of the page. */
  submitVariant?: "primary" | "secondary";
  children: (state: AuthFormState<Field>) => ReactNode;
  /** Extra content under the submit button, such as links to other flows. */
  footer?: ReactNode;
  /** Called once when the action reports success, for example to close a dialog. */
  onDone?: (state: AuthFormState<Field>) => void;
}

/**
 * Form for the authentication flows. Submitting never clears what was typed,
 * the button blocks double submits while pending, and after a failed submit
 * focus moves to the first invalid field or to the message, so keyboard and
 * screen reader users learn what happened. Works without JavaScript too.
 */
export function AuthForm<Field extends string>({
  action,
  submitLabel,
  submitVariant = "primary",
  children,
  footer,
  onDone,
}: AuthFormProps<Field>) {
  const [state, dispatch, pending] = useActionState(action, idle as AuthFormState<Field>);
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  // Read through a ref so a new callback on each render does not repeat the call.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (state.status === "done") onDoneRef.current?.(state);
    if (state.status !== "error") return;
    const firstInvalid = Object.keys(state.fieldErrors ?? {})[0];
    const field = firstInvalid
      ? formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)
      : null;
    (field ?? messageRef.current)?.focus();
  }, [state]);

  // React resets a form after an action passed to `action` runs. Dispatching
  // from the submit handler keeps the fields as the person left them.
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => {
      dispatch(data);
    });
  }

  return (
    <form
      ref={formRef}
      action={dispatch}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4"
    >
      {children(state)}
      {state.message ? (
        <div ref={messageRef} tabIndex={-1} className="outline-none">
          <InlineAlert tone={state.status === "error" ? "danger" : "success"}>
            {state.message}
          </InlineAlert>
        </div>
      ) : null}
      <Button type="submit" variant={submitVariant} isPending={pending} className="w-full">
        {submitLabel}
      </Button>
      {footer}
    </form>
  );
}
