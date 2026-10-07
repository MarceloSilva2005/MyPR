import { notFound } from "next/navigation";

import { getEnv } from "@/env";

/** The design gallery is an internal tool: any environment that does not enable it answers 404. */
export function requireDesignGallery(): void {
  if (!getEnv().ENABLE_DESIGN_GALLERY) notFound();
}
