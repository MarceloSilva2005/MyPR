import type { Metadata } from "next";

import { appPages } from "@/content/app-pages";
import { PlaceholderPage } from "@/features/shell/placeholder-page";

const copy = appPages.analytics;

export const metadata: Metadata = { title: copy.title };

export default function AnalyticsPage() {
  return <PlaceholderPage title={copy.title} description={copy.description} />;
}
