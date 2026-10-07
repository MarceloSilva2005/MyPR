import Link from "next/link";

import { appPages } from "@/content/app-pages";
import { Wordmark } from "@/ds/brand";
import { buttonClassName } from "@/ds/button-styles";
import { EmptyState } from "@/ds/feedback";

export default function NotFound() {
  const copy = appPages.notFound;
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-4 py-16">
      <Wordmark className="text-2xl" />
      <EmptyState
        headingLevel="h1"
        title={copy.title}
        description={copy.description}
        className="py-0"
        actions={
          <Link href="/" className={buttonClassName({ variant: "secondary" })}>
            Ir para o início
          </Link>
        }
      />
    </main>
  );
}
