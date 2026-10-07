import { notFound } from "next/navigation";

/** Sends unknown addresses under /app to the not-found screen, which renders inside the shell. */
export default function UnknownAppRoute() {
  notFound();
}
