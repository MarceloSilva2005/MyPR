"use client";

import { shellCopy, type NavigationItem } from "@/content/navigation";
import { Modal } from "@/ds/modal";
import { NavLink } from "./nav-link";

/** Bottom sheet with the destinations that do not fit in the phone navigation bar. */
export function MoreSheet({
  items,
  pathname,
  onClose,
}: {
  items: readonly NavigationItem[];
  pathname: string;
  onClose: () => void;
}) {
  return (
    <Modal
      title={shellCopy.moreTitle}
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <nav aria-label={shellCopy.moreTitle} className="-mx-3 flex flex-col">
        {items.map((item) => (
          <NavLink
            key={item.id}
            item={item}
            pathname={pathname}
            layout="sheet"
            onNavigate={onClose}
          />
        ))}
      </nav>
    </Modal>
  );
}
