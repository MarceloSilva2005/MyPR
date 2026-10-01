import type { ReactNode, SVGProps } from "react";

export type MarkProps = SVGProps<SVGSVGElement>;

function Mark({ className, children, ...props }: MarkProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export function MarkBar(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M2 12h20" />
      <path d="M6 8.5v7M18 8.5v7" />
      <path d="M4 10v4M20 10v4" />
    </Mark>
  );
}

export function MarkToday(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M4 5h16v15H4z" />
      <path d="M4 9h16" />
      <path d="M9 3v4M15 3v4" />
    </Mark>
  );
}

export function MarkLedger(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M5 7h14M5 12h14M5 17h9" />
    </Mark>
  );
}

export function MarkYou(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M5 20v-3.5h14V20" />
      <path d="M8 16.5V9h8v7.5" />
      <path d="M10 9V6h4v3" />
    </Mark>
  );
}

export function MarkRecord(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M7 21V4" />
      <path d="M7 4h10l-2.5 3.5L17 11H7" />
    </Mark>
  );
}

export function MarkPlus(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M12 5v14M5 12h14" />
    </Mark>
  );
}

export function MarkMinus(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M5 12h14" />
    </Mark>
  );
}

export function MarkUp(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M6 14l6-6 6 6" />
    </Mark>
  );
}

export function MarkDown(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M6 10l6 6 6-6" />
    </Mark>
  );
}

export function MarkClose(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Mark>
  );
}

export function MarkSearch(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M5 5h10v10H5z" />
      <path d="M14 14l5 5" />
    </Mark>
  );
}

export function MarkTimer(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M8 3h8" />
      <path d="M6 7h12v13H6z" />
      <path d="M12 11v4" />
    </Mark>
  );
}

export function MarkCopy(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M8 8h11v12H8z" />
      <path d="M5 16V4h11" />
    </Mark>
  );
}

export function MarkPencil(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M14 5l5 5" />
      <path d="M4 20l1.5-6L15 4.5 19.5 9 10 18.5z" />
    </Mark>
  );
}

export function MarkTrash(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M5 7h14" />
      <path d="M8 7V4h8v3" />
      <path d="M7 7l1 13h8l1-13" />
    </Mark>
  );
}

export function MarkCheck(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </Mark>
  );
}

export function MarkCloud(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M7 17h10a4 4 0 0 0 .4-8 5 5 0 0 0-9.6-1.2A3.5 3.5 0 0 0 7 17z" />
    </Mark>
  );
}

export function MarkDownload(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M12 4v11" />
      <path d="M8 11l4 4 4-4" />
      <path d="M5 19h14" />
    </Mark>
  );
}

export function MarkMoon(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M15 4a7 7 0 1 0 5 12 6 6 0 0 1-5-12z" />
    </Mark>
  );
}

export function MarkArchive(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M4 7h16v12H4z" />
      <path d="M4 7l2-3h12l2 3" />
      <path d="M10 12h4" />
    </Mark>
  );
}

export function MarkRefresh(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M19 12a7 7 0 1 1-2-5" />
      <path d="M19 4v5h-5" />
    </Mark>
  );
}

export function MarkMail(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M4 6h16v12H4z" />
      <path d="M4 7l8 6 8-6" />
    </Mark>
  );
}

export function MarkEnter(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M14 6h5v12H9" />
      <path d="M9 14l-4-4 4-4" />
    </Mark>
  );
}

export function MarkShield(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7-7 9-4-2-7-4.5-7-9V6z" />
    </Mark>
  );
}

export function MarkTrend(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M4 17l5-5 3 3 8-8" />
      <path d="M14 7h6v6" />
    </Mark>
  );
}

export function MarkRepeat(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M6 8h11l-2-2" />
      <path d="M18 16H7l2 2" />
    </Mark>
  );
}

export function MarkPlates(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M3 12h18" />
      <path d="M7 7v10M11 9v6M15 7v10M19 9v6" />
    </Mark>
  );
}

export function MarkWait(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M6 4h12v16H6z" />
      <path d="M12 4v8" />
    </Mark>
  );
}
