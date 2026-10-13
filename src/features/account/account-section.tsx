import { AccountSecurity } from "./account-security";
import { accountContent } from "@/content/account";
import { Button } from "@/ds/button";
import { signOut } from "@/features/auth/actions";

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
      <form
        action={signOut}
        className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg">{accountContent.signOutLabel}</p>
          <p className="text-sm text-fg-muted">{accountContent.signOutHint}</p>
        </div>
        <Button type="submit" variant="secondary">
          {accountContent.signOut}
        </Button>
      </form>
    </section>
  );
}
