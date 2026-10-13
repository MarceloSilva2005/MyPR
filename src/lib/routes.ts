// Public pages of the authentication flows. Paths stay in English like the
// rest of the application; labels live in src/content.
export const AUTH_ROUTES = {
  signIn: "/sign-in",
  signUp: "/sign-up",
  checkEmail: "/check-email",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  confirm: "/auth/confirm",
} as const;

// Signed-in visitors are sent to the application instead of these pages.
// The reset page stays reachable: the recovery link signs the person in.
export const GUEST_ONLY_ROUTES: readonly string[] = [
  AUTH_ROUTES.signIn,
  AUTH_ROUTES.signUp,
  AUTH_ROUTES.forgotPassword,
];

export function isPrivatePath(pathname: string): boolean {
  return pathname === "/app" || pathname.startsWith("/app/");
}

/** Paths whose requests need the session cookie refreshed. */
export function needsSession(pathname: string): boolean {
  return (
    isPrivatePath(pathname) ||
    pathname.startsWith("/auth/") ||
    Object.values(AUTH_ROUTES).includes(pathname as never)
  );
}
