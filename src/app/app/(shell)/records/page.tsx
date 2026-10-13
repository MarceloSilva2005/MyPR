import type { Metadata } from "next";

import { appPages } from "@/content/app-pages";
import { PlaceholderPage } from "@/features/shell/placeholder-page";

const copy = appPages.records;

export const metadata: Metadata = { title: copy.title };

export default function RecordsPage() {
  return <PlaceholderPage title={copy.title} description={copy.description} />;
}
