/** Start time for a workout that began the given number of minutes ago. Dev preview only. */
export function minutesAgo(minutes: number): number {
  return Date.now() - minutes * 60 * 1000;
}
