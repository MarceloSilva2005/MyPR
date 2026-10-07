"use client";

import { DataSections } from "./data-sections";
import { FoundationSections } from "./foundation-sections";
import { TrainingSections } from "./training-sections";
import { Wordmark } from "@/ds/brand";
import { Link } from "@/ds/link";
import { SegmentedControl } from "@/ds/segmented-control";
import { THEME_PREFERENCES } from "@/ds/theme";
import { useThemePreference } from "@/ds/theme-client";

const THEME_LABELS = { system: "Sistema", light: "Claro", dark: "Escuro" } as const;

const SECTIONS = [
  { id: "tokens", label: "Cores e tipografia" },
  { id: "buttons", label: "Botões" },
  { id: "forms", label: "Campos" },
  { id: "feedback", label: "Estados" },
  { id: "overlays", label: "Diálogos" },
  { id: "training", label: "Treino" },
  { id: "metrics", label: "Métricas" },
  { id: "charts", label: "Gráficos" },
];

/** Living reference of the design system. It is the target of the visual and accessibility tests. */
export function Gallery() {
  const [theme, setTheme] = useThemePreference();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Wordmark />
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Design System</h1>
          <p className="mt-1 max-w-prose text-sm text-fg-muted">
            Referência dos componentes do MyPR em todos os estados. Uso interno.
          </p>
        </div>
        <SegmentedControl
          label="Tema"
          value={theme}
          onChange={setTheme}
          options={THEME_PREFERENCES.map((id) => ({ id, label: THEME_LABELS[id] }))}
        />
      </header>

      <nav aria-label="Seções" className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {SECTIONS.map((section) => (
          <Link key={section.id} href={`#${section.id}`}>
            {section.label}
          </Link>
        ))}
        <Link href="/dev/shell">Shell</Link>
      </nav>

      <FoundationSections />
      <TrainingSections />
      <DataSections />
    </main>
  );
}
