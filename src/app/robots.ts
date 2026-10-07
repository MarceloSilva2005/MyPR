import type { MetadataRoute } from "next";

import { getEnv } from "@/env";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const { ALLOW_INDEXING } = getEnv();
  return {
    rules: ALLOW_INDEXING ? { userAgent: "*", allow: "/" } : { userAgent: "*", disallow: "/" },
  };
}
