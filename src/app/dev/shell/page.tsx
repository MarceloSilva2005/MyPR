import type { Metadata } from "next";

import { requireDesignGallery } from "../gallery-guard";
import { minutesAgo } from "./clock";
import { PageContainer, PageHeader } from "@/ds/page-header";
import { InlineAlert } from "@/ds/feedback";
import { AppShell } from "@/features/shell/app-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shell" };

/** Renders the application shell outside the product routes, with an optional active workout. */
export default async function ShellPreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  requireDesignGallery();
  const { activeWorkout } = await searchParams;
  const active = activeWorkout === "1";

  return (
    <AppShell
      activeWorkout={active ? { name: "Peito e tríceps", startedAt: minutesAgo(42) } : undefined}
    >
      <PageContainer>
        <PageHeader
          title="Treino"
          description={active ? "Sessão em andamento." : "Nenhuma sessão em andamento."}
        />
        <InlineAlert tone="info">
          Prévia do shell. Com um treino ativo, a barra inferior do celular é reduzida ao treino e
          ao menu Mais.
        </InlineAlert>
      </PageContainer>
    </AppShell>
  );
}
