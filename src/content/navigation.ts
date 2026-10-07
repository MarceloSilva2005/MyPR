export type NavigationId =
  | "overview"
  | "workout"
  | "routines"
  | "exercises"
  | "history"
  | "records"
  | "analytics"
  | "settings";

export interface NavigationItem {
  id: NavigationId;
  href: string;
  label: string;
}

/** Order and labels follow section 6 of the product specification. */
export const primaryNavigation: readonly NavigationItem[] = [
  { id: "overview", href: "/app", label: "Visão geral" },
  { id: "workout", href: "/app/workout", label: "Treino" },
  { id: "routines", href: "/app/routines", label: "Rotinas" },
  { id: "exercises", href: "/app/exercises", label: "Exercícios" },
  { id: "history", href: "/app/history", label: "Histórico" },
  { id: "records", href: "/app/records", label: "Recordes" },
  { id: "analytics", href: "/app/analytics", label: "Analytics" },
];

export const settingsNavigation: NavigationItem = {
  id: "settings",
  href: "/app/settings",
  label: "Configurações",
};

/** Destinations kept in the bottom bar on small screens. The rest live under "Mais". */
export const mobileBarIds: readonly NavigationId[] = ["overview", "workout", "routines", "history"];

export const shellCopy = {
  skipToContent: "Ir para o conteúdo",
  primaryNavigation: "Navegação principal",
  mobileNavigation: "Navegação",
  more: "Mais",
  moreTitle: "Mais opções",
  startWorkout: "Iniciar treino",
  activeWorkout: "Treino em andamento",
  resumeWorkout: "Voltar ao treino",
} as const;
