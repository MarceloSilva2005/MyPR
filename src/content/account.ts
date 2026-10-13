export const accountContent = {
  title: "Conta",
  email: "E-mail",
  password: {
    label: "Senha",
    action: "Alterar senha",
    title: "Alterar senha",
    description: "Ao salvar, as sessões nos outros dispositivos são encerradas.",
    submit: "Salvar nova senha",
    done: "Senha alterada. As sessões nos outros dispositivos foram encerradas.",
  },
  sessions: {
    label: "Sessões",
    hint: "Saia dos outros navegadores e aparelhos em que você entrou.",
    action: "Encerrar outras sessões",
    title: "Encerrar outras sessões",
    description: "Esta sessão continua ativa. Confirme sua senha para continuar.",
    submit: "Encerrar outras sessões",
    done: "As sessões nos outros dispositivos foram encerradas.",
  },
  currentPassword: "Senha atual",
  signOut: "Sair",
  signOutLabel: "Sair da conta",
  signOutHint: "Encerra a sessão neste dispositivo.",
  errors: {
    currentPassword: "Informe a senha atual.",
    wrongPassword: "A senha atual não confere.",
  },
} as const;
