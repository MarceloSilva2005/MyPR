import type { Metadata } from "next";

import { appPages } from "@/content/app-pages";
import { PlaceholderPage } from "@/features/shell/placeholder-page";

const copy = appPages.history;

export const metadata: Metadata = { title: copy.title };

export default function HistoryPage() {
  return <PlaceholderPage title={copy.title} description={copy.description} />;
}
