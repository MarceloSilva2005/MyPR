import type { Metadata } from "next";

import { appPages } from "@/content/app-pages";
import { PlaceholderPage } from "@/features/shell/placeholder-page";

const copy = appPages.exercises;

export const metadata: Metadata = { title: copy.title };

export default function ExercisesPage() {
  return <PlaceholderPage title={copy.title} description={copy.description} />;
}
