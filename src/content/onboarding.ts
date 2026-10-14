// Copy of the onboarding (section 5.2). Short, direct questions; options in the
// person's own words (outcomes, time spent training) rather than internal
// labels; the last step shows what the answers set, so nothing is silent.

// Keeps a number and its unit on the same line.
const NBSP = " ";

export const onboardingContent = {
  pageTitle: "Configuração inicial",
  progress: (current: number, total: number) => `Passo ${String(current)} de ${String(total)}`,
  back: "Voltar",
  next: "Continuar",
  welcome: {
    title: "Boas-vindas ao MyPR",
    body: [
      "Registre cada série, acompanhe a evolução das cargas e veja seus recordes.",
      "Antes de começar, ajuste o básico. Leva menos de um minuto.",
    ],
    start: "Começar",
  },
  preferences: {
    title: "Preferências",
    description: "Você pode alterar depois em Configurações.",
    weightUnit: "Unidade de peso",
    weightUnits: { kg: "Quilogramas (kg)", lb: "Libras (lb)" },
    theme: "Tema",
    themes: { system: "Sistema", light: "Claro", dark: "Escuro" },
    weekStartsOn: "Início da semana",
    weekDays: { "1": "Segunda-feira", "0": "Domingo" },
  },
  trainingProfile: {
    title: "Seu treino",
    description: "Define seus valores iniciais, como o descanso entre séries.",
    goal: "Qual é o seu objetivo principal?",
    goals: {
      hypertrophy: { label: "Ganhar massa muscular" },
      strength: { label: "Ficar mais forte" },
      general_fitness: { label: "Saúde e condicionamento" },
    },
    experience: "Há quanto tempo você treina com regularidade?",
    levels: {
      beginner: { label: "Menos de 1 ano" },
      intermediate: { label: "De 1 a 3 anos" },
      advanced: { label: "Mais de 3 anos" },
    },
    skip: "Pular",
  },
  done: {
    title: "Tudo pronto",
    body: "Comece um treino agora ou monte sua primeira rotina.",
    summary: "Sua configuração",
    unit: "Unidade de peso",
    weekStart: "Início da semana",
    rest: "Descanso padrão",
    weekDays: { "1": "Segunda-feira", "0": "Domingo" } as Record<string, string>,
    restValue: (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const rest = seconds % 60;
      if (minutes === 0) return `${String(rest)}${NBSP}s`;
      return rest === 0
        ? `${String(minutes)}${NBSP}min`
        : `${String(minutes)}${NBSP}min ${String(rest)}${NBSP}s`;
    },
    editHint: "Você pode alterar tudo em Configurações.",
    buildRoutine: "Montar rotina",
    startWorkout: "Iniciar treino livre",
  },
  errors: {
    invalid: "Revise as opções marcadas e tente de novo.",
    unavailable: "Não foi possível salvar agora. Tente de novo em instantes.",
  },
} as const;
