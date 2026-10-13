import { authContent } from "@/content/auth";

const { errors } = authContent;

/**
 * Turns an auth provider error into copy for the person. Provider names,
 * status codes and internal details never reach the page.
 */
export function messageForAuthError(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return errors.credentials;
    case "email_not_confirmed":
      return errors.notConfirmed;
    case "weak_password":
      return errors.weakPassword;
    case "same_password":
      return errors.samePassword;
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return errors.rateLimited;
    default:
      return errors.unavailable;
  }
}

/** Errors that would reveal whether an e-mail has an account. Treated as success. */
export function revealsAccount(code: string | undefined): boolean {
  return code === "user_already_exists" || code === "email_exists" || code === "user_not_found";
}
