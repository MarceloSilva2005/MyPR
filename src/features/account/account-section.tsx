import { accountContent } from "@/content/account";
import { Button } from "@/ds/button";
import { signOut } from "@/features/auth/actions";

export function AccountSection({ email }: { email: string }) {
  return (
    <section aria-labelledby="account-title" className="space-y-4">
      <h2 id="account-title" className="text-base font-medium tracking-tight">
        {accountContent.title}
      </h2>
      <dl className="grid gap-1 text-sm">
        <dt className="text-fg-muted">{accountContent.email}</dt>
        <dd className="break-all text-fg">{email}</dd>
      </dl>
      <form action={signOut} className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary">
          {accountContent.signOut}
        </Button>
        <p className="text-sm text-fg-muted">{accountContent.signOutHint}</p>
      </form>
    </section>
  );
}
