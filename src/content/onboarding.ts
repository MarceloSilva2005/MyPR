// Copy of the onboarding (section 5.2): short, factual, no motivational lines.
export const onboardingContent = {
  pageTitle: "Configuração inicial",
  progress: (current: number, total: number) => `Passo ${String(current)} de ${String(total)}`,
  back: "Voltar",
  next: "Continuar",
  welcome: {
    title: "Boas-vindas ao MyPR",
    body: [
      "O MyPR registra seus treinos de musculação série a série e mostra a evolução de cargas, volume e recordes.",
      "Antes de começar, ajuste algumas preferências. Leva menos de um minuto.",
    ],
    start: "Começar",
  },
  preferences: {
    title: "Preferências",
    description: "Dá para mudar tudo isso depois, em Configurações.",
    weightUnit: "Unidade de carga",
    weightUnits: { kg: "Quilogramas (kg)", lb: "Libras (lb)" },
    theme: "Tema",
    themes: { system: "Sistema", light: "Claro", dark: "Escuro" },
    weekStartsOn: "A semana começa no",
    weekDays: { "1": "Segunda-feira", "0": "Domingo" },
  },
  trainingProfile: {
    title: "Perfil de treino",
    description:
      "Com essas respostas, o MyPR já começa com o descanso entre séries ajustado ao seu objetivo. As duas são opcionais.",
    goal: "Objetivo predominante",
    goals: {
      hypertrophy: {
        label: "Hipertrofia",
        hint: "Ganhar massa muscular. Descanso de 2 min.",
      },
      strength: {
        label: "Força",
        hint: "Levantar mais carga. Descanso de 3 min.",
      },
      general_fitness: {
        label: "Condicionamento geral",
        hint: "Saúde e constância. Descanso de 1 min 30 s.",
      },
    },
    experience: "Experiência com musculação",
    levels: {
      beginner: { label: "Iniciante", hint: "Menos de 1 ano de treino regular." },
      intermediate: { label: "Intermediário", hint: "De 1 a 3 anos de treino regular." },
      advanced: { label: "Avançado", hint: "Mais de 3 anos de treino regular." },
    },
    skip: "Pular",
  },
  done: {
    title: "Configuração concluída",
    body: "Monte uma rotina com os treinos da semana ou registre agora um treino livre.",
    buildRoutine: "Montar rotina",
    startWorkout: "Iniciar treino livre",
  },
  errors: {
    invalid: "Revise as opções marcadas e tente de novo.",
    unavailable: "Não foi possível salvar agora. Tente de novo em instantes.",
  },
} as const;
