import { AccountSecurity } from "./account-security";
import { accountContent } from "@/content/account";

// Signing out lives in the navigation, reachable from every page.
export function AccountSection({ email }: { email: string }) {
  return (
    <section aria-labelledby="account-title" className="space-y-6">
      <h2 id="account-title" className="text-base font-medium tracking-tight">
        {accountContent.title}
      </h2>
      <dl>
        <dt className="text-sm font-medium text-fg">{accountContent.email}</dt>
        <dd className="text-sm break-all text-fg-muted">{email}</dd>
      </dl>
      <AccountSecurity />
    </section>
  );
}
