export const appPages = {
  overview: {
    title: "Visão geral",
    description: "O que fazer hoje e como você está evoluindo.",
    emptyTitle: "Você ainda não registrou treinos.",
    emptyDescription: "Crie uma rotina ou inicie um treino livre.",
    buildRoutine: "Montar rotina",
    startFreeWorkout: "Iniciar treino livre",
  },
  workout: {
    title: "Treino",
    description: "Registre séries, acompanhe o descanso e veja a última performance.",
  },
  routines: {
    title: "Rotinas",
    description: "Monte a estrutura da semana e reutilize treinos.",
  },
  exercises: {
    title: "Exercícios",
    description: "Biblioteca de exercícios e o histórico de cada movimento.",
  },
  history: {
    title: "Histórico",
    description: "Sessões anteriores, com tudo o que foi executado.",
  },
  records: {
    title: "Recordes",
    description: "Melhores marcas por exercício e a sua evolução.",
  },
  analytics: {
    title: "Analytics",
    description: "Volume, frequência e tendência por período.",
  },
  settings: {
    title: "Configurações",
    description: "Preferências da conta e do treino.",
    interface: "Interface",
    theme: "Tema",
    themeDescription: "O tema do sistema operacional é usado por padrão.",
    themeOptions: { system: "Sistema", light: "Claro", dark: "Escuro" },
  },
  placeholder: {
    title: "Disponível em uma próxima versão",
    description: "Esta área ainda está em desenvolvimento.",
    back: "Voltar à visão geral",
  },
  loadingStatus: "Carregando a página",
  notFound: {
    title: "Página não encontrada",
    description: "O endereço não existe ou foi movido.",
    back: "Voltar à visão geral",
  },
  error: {
    title: "Não foi possível carregar esta página.",
    description: "Seus dados registrados continuam salvos. Tente novamente.",
    retry: "Tentar novamente",
    home: "Voltar à visão geral",
  },
} as const;
