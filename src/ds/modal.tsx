"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Dialog, Heading, Modal as AriaModal, ModalOverlay } from "react-aria-components";

import { Button } from "./button";
import { cx } from "./cx";
import { dsLabels } from "./labels";

export type ModalVariant = "dialog" | "drawer";

interface ModalProps {
  title: string;
  description?: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /**
   * "dialog" is centered on large screens; "drawer" slides in from the side.
   * Both become a bottom sheet on small screens.
   */
  variant?: ModalVariant;
  /** Set to false for decisions that must be answered explicitly. */
  isDismissable?: boolean;
  children: ReactNode | ((close: () => void) => ReactNode);
}

export function Modal({
  title,
  description,
  isOpen,
  onOpenChange,
  variant = "dialog",
  isDismissable = true,
  children,
}: ModalProps) {
  const drawer = variant === "drawer";

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={isDismissable}
      className={cx(
        "fixed inset-0 z-50 flex items-end justify-center bg-scrim data-[entering]:animate-fade-in",
        drawer ? "md:items-stretch md:justify-end" : "md:items-center",
      )}
    >
      <AriaModal
        className={cx(
          "flex max-h-[90dvh] w-full flex-col border border-line bg-overlay shadow-overlay data-[entering]:animate-sheet-up",
          "rounded-t-xl md:max-h-none",
          drawer
            ? "md:h-full md:max-w-md md:rounded-none md:border-y-0 md:border-r-0"
            : "md:max-w-lg md:rounded-xl",
        )}
      >
        <Dialog className="flex min-h-0 flex-1 flex-col outline-none">
          {({ close }) => (
            <>
              <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
                <div className="min-w-0">
                  <Heading slot="title" className="text-base font-medium tracking-tight text-fg">
                    {title}
                  </Heading>
                  {description ? <p className="mt-1 text-sm text-fg-muted">{description}</p> : null}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label={dsLabels.close}
                  onPress={close}
                >
                  <X aria-hidden className="size-4" />
                </Button>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                {typeof children === "function" ? children(close) : children}
              </div>
            </>
          )}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
  /** Use for actions that remove data. */
  destructive?: boolean;
  isPending?: boolean;
}

/** Asks for explicit confirmation. It cannot be dismissed by clicking outside. */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  isOpen,
  onOpenChange,
  onConfirm,
  destructive = false,
  isPending = false,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false}>
      {(close) => (
        <div className="flex flex-col gap-6">
          <p className="text-sm text-fg-muted">{description}</p>
          <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
            <Button variant="secondary" onPress={close}>
              {cancelLabel}
            </Button>
            <Button
              variant={destructive ? "destructive-solid" : "primary"}
              isPending={isPending}
              onPress={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
