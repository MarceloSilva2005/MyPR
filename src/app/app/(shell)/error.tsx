"use client";

import { appPages } from "@/content/app-pages";
import { Button, ButtonLink } from "@/ds/button";
import { ErrorState } from "@/ds/feedback";
import { PageContainer } from "@/ds/page-header";

/** Boundary for unexpected failures inside the app. It never shows technical details. */
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  const copy = appPages.error;
  return (
    <PageContainer>
      <ErrorState
        headingLevel="h1"
        title={copy.title}
        description={copy.description}
        actions={
          <>
            <Button variant="primary" onPress={reset}>
              {copy.retry}
            </Button>
            <ButtonLink href="/app" variant="secondary">
              {copy.home}
            </ButtonLink>
          </>
        }
      />
    </PageContainer>
  );
}
