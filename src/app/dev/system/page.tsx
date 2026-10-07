import type { Metadata } from "next";

import { requireDesignGallery } from "../gallery-guard";
import { Gallery } from "./gallery";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Design System" };

export default function DesignSystemPage() {
  requireDesignGallery();
  return <Gallery />;
}
