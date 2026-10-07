import { appPages } from "@/content/app-pages";
import { ButtonLink } from "@/ds/button";
import { EmptyState } from "@/ds/feedback";
import { PageContainer, PageHeader } from "@/ds/page-header";

/** Honest stand-in for an area whose stage has not shipped yet. */
export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  const copy = appPages.placeholder;
  return (
    <PageContainer>
      <PageHeader title={title} description={description} />
      <EmptyState
        title={copy.title}
        description={copy.description}
        actions={
          <ButtonLink href="/app" variant="secondary">
            {copy.back}
          </ButtonLink>
        }
      />
    </PageContainer>
  );
}
