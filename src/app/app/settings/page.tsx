import type { Metadata } from "next";

import { appPages } from "@/content/app-pages";
import { PageContainer, PageHeader } from "@/ds/page-header";
import { InterfaceSettings } from "@/features/shell/interface-settings";

const copy = appPages.settings;

export const metadata: Metadata = { title: copy.title };

export default function SettingsPage() {
  return (
    <PageContainer width="narrow">
      <PageHeader title={copy.title} description={copy.description} />
      <InterfaceSettings />
    </PageContainer>
  );
}
