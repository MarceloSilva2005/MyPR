"use client";

import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

import { Button } from "./button";
import { cx } from "./cx";
import { dsLabels } from "./labels";

export type ToastTone = "neutral" | "success";

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  /** Milliseconds before the toast leaves on its own. Defaults to 5000. */
  durationMs?: number;
  action?: { label: string; onPress: () => void };
}

interface ToastItem extends ToastOptions {
  id: number;
}

const ToastContext = createContext<{ show: (options: ToastOptions) => void } | null>(null);

/**
 * Confirms a non-critical outcome ("Treino salvo."). It disappears by itself, so it is never
 * used for errors that need action: use an InlineAlert for those.
 */
export function useToast(): { show: (options: ToastOptions) => void } {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside a ToastProvider");
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const show = useCallback((options: ToastOptions) => {
    nextId.current += 1;
    const id = nextId.current;
    setItems((current) => [...current.slice(-2), { ...options, id }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="region"
        aria-label={dsLabels.notifications}
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 pb-20 md:items-end md:pb-4"
      >
        {items.map((item) => (
          <ToastView key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const { id, durationMs = 5000 } = item;

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => {
      onDismiss(id);
    }, durationMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [paused, id, durationMs, onDismiss]);

  return (
    <div
      onMouseEnter={() => {
        setPaused(true);
      }}
      onMouseLeave={() => {
        setPaused(false);
      }}
      onFocus={() => {
        setPaused(true);
      }}
      onBlur={() => {
        setPaused(false);
      }}
      className={cx(
        "pointer-events-auto flex w-full max-w-sm animate-rise items-center gap-3 rounded-lg border border-line bg-overlay py-2 pr-2 pl-4 shadow-float",
        item.tone === "success" && "border-l-4 border-l-success",
      )}
    >
      <p className="min-w-0 flex-1 text-sm text-fg">{item.message}</p>
      {item.action ? (
        <Button
          variant="ghost"
          size="sm"
          onPress={() => {
            item.action?.onPress();
            onDismiss(id);
          }}
        >
          {item.action.label}
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-label={dsLabels.dismiss}
        onPress={() => {
          onDismiss(id);
        }}
      >
        <X aria-hidden className="size-4" />
      </Button>
    </div>
  );
}
