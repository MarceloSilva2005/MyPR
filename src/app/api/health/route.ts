import pkg from "../../../../package.json";
import { getEnv } from "@/env";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { status: "ok", version: pkg.version, environment: getEnv().APP_ENV },
    { headers: { "Cache-Control": "no-store" } },
  );
}
