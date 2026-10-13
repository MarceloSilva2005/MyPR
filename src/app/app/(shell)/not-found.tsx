import { appPages } from "@/content/app-pages";
import { ButtonLink } from "@/ds/button";
import { EmptyState } from "@/ds/feedback";
import { PageContainer } from "@/ds/page-header";

export default function AppNotFound() {
  const copy = appPages.notFound;
  return (
    <PageContainer>
      <EmptyState
        headingLevel="h1"
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
