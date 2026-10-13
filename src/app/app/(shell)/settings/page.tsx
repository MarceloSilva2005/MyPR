import type { Metadata } from "next";

import { appPages } from "@/content/app-pages";
import { PageContainer, PageHeader } from "@/ds/page-header";
import { AccountSection } from "@/features/account/account-section";
import { InterfaceSettings } from "@/features/shell/interface-settings";
import { requireUser } from "@/server/session";

const copy = appPages.settings;

export const metadata: Metadata = { title: copy.title };

export default async function SettingsPage() {
  const user = await requireUser("/app/settings");

  return (
    <PageContainer width="narrow">
      <PageHeader title={copy.title} description={copy.description} />
      <div className="divide-y divide-line [&>*]:py-6 [&>*:first-child]:pt-0">
        <AccountSection email={user.email} />
        <InterfaceSettings />
      </div>
    </PageContainer>
  );
}
