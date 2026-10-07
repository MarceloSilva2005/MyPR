const NBSP = " ";
const MINUS = "−";

const formatters = new Map<number, Intl.NumberFormat>();

function numberFormat(maximumFractionDigits: number): Intl.NumberFormat {
  let formatter = formatters.get(maximumFractionDigits);
  if (!formatter) {
    formatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits });
    formatters.set(maximumFractionDigits, formatter);
  }
  return formatter;
}

/** Formats a number using the pt-BR convention (decimal comma, dot for thousands). */
export function formatNumber(value: number, maximumFractionDigits = 1): string {
  return numberFormat(maximumFractionDigits).format(value);
}

/** Formats a load for display, e.g. "82,5 kg". The unit is never separated from the value. */
export function formatLoad(value: number, unit: "kg" | "lb"): string {
  return `${formatNumber(value, 2)}${NBSP}${unit}`;
}

/** Formats a signed change with a true minus sign, e.g. "+2,5" or "−1". */
export function formatSigned(value: number, maximumFractionDigits = 1): string {
  const formatted = formatNumber(Math.abs(value), maximumFractionDigits);
  if (Number(formatted.replace(",", ".")) === 0) return "0";
  return `${value > 0 ? "+" : MINUS}${formatted}`;
}

/** Formats elapsed time as "m:ss" or "h:mm:ss". */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (value: number): string => String(value).padStart(2, "0");
  return hours > 0
    ? `${String(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${String(minutes)}:${pad(seconds)}`;
}
