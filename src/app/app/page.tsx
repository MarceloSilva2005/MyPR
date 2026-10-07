import type { Metadata } from "next";

import { appPages } from "@/content/app-pages";
import { ButtonLink } from "@/ds/button";
import { EmptyState } from "@/ds/feedback";
import { PageContainer, PageHeader } from "@/ds/page-header";

const copy = appPages.overview;

export const metadata: Metadata = { title: copy.title };

export default function OverviewPage() {
  return (
    <PageContainer>
      <PageHeader title={copy.title} description={copy.description} />
      <EmptyState
        title={copy.emptyTitle}
        description={copy.emptyDescription}
        actions={
          <>
            <ButtonLink href="/app/routines" variant="primary">
              {copy.buildRoutine}
            </ButtonLink>
            <ButtonLink href="/app/workout" variant="secondary">
              {copy.startFreeWorkout}
            </ButtonLink>
          </>
        }
      />
    </PageContainer>
  );
}
