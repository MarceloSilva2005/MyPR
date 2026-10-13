import { appPages } from "@/content/app-pages";
import { Skeleton } from "@/ds/feedback";
import { PageContainer } from "@/ds/page-header";

/** Mirrors the page header and a content block so the layout does not move once data arrives. */
export default function AppLoading() {
  return (
    <PageContainer>
      <p role="status" className="sr-only">
        {appPages.loadingStatus}
      </p>
      <div className="mb-6 space-y-2 border-b border-line pb-4 md:mb-8">
        <Skeleton className="w-48" height={28} />
        <Skeleton className="w-80 max-w-full" height={20} />
      </div>
      <div className="space-y-3">
        <Skeleton className="w-full" height={64} />
        <Skeleton className="w-full" height={64} />
        <Skeleton className="w-full" height={64} />
      </div>
    </PageContainer>
  );
}
