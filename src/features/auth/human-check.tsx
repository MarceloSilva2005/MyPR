"use client";

import { useEffect, useRef, useState } from "react";

import { authContent } from "@/content/auth";
import { InlineAlert } from "@/ds/feedback";

interface TurnstileApi {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loading: Promise<TurnstileApi> | null = null;

// Loaded only on the pages that show the check. The script is added by our own
// trusted code, which the Content Security Policy allows through 'strict-dynamic'.
function loadTurnstile(): Promise<TurnstileApi> {
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile did not initialise"));
    };
    script.onerror = () => {
      reject(new Error("Turnstile could not be loaded"));
    };
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    loading = null;
    throw error;
  });
  return loading;
}

interface HumanCheckProps {
  siteKey: string;
  /** Must match the action the server verifies (src/server/turnstile.ts). */
  action: "sign-up" | "sign-in" | "password-reset";
  /** Any new value resets the widget: tokens are single use. */
  resetSignal: unknown;
}

/**
 * Cloudflare Turnstile. It usually completes on its own without showing
 * anything; when it needs the person, it shows its own accessible challenge. The token travels with the
 * form in the field the widget adds.
 */
export function HumanCheck({ siteKey, action, resetSignal }: HumanCheckProps) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    loadTurnstile()
      .then((turnstile) => {
        if (!active || !container.current) return;
        widget.current = turnstile.render(container.current, {
          sitekey: siteKey,
          action,
          language: "pt-br",
          theme: "auto",
          size: "flexible",
          // Shown only when Cloudflare needs the person; usually it passes unseen.
          appearance: "interaction-only",
        });
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [siteKey, action]);

  useEffect(() => {
    if (widget.current) window.turnstile?.reset(widget.current);
  }, [resetSignal]);

  return (
    <div role="group" aria-label={authContent.humanCheckLabel}>
      <div ref={container} />
      {failed ? (
        <InlineAlert tone="warning">{authContent.humanCheckUnavailable}</InlineAlert>
      ) : null}
    </div>
  );
}
