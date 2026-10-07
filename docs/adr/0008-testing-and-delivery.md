# 0008. Testes, entrega e observabilidade

- Status: aceita
- Data: 07/10/2026
- Decisões do plano: D-15, D-17

## Contexto

O Documento Mestre exige testes proporcionais ao risco, jornadas críticas ponta a ponta, isolamento entre usuários comprovado por testes negativos, entregas reproduzíveis e telemetria sem dados sensíveis.

## Decisão

- **Testes:** Vitest (unidade e integração), fast-check (propriedades), Testing Library (componentes) e Playwright (ponta a ponta com vários usuários, offline, mobile, regressão visual e axe). Testes de banco rodam contra o Supabase local com duas contas de teste.
- **Cobertura:** 100% de ramos em `src/domain`; meta de 80% de linhas nos demais módulos.
- **CI:** GitHub Actions com verificação (formatação, lint, tipos, código morto, testes, build, higiene), segurança (auditoria de dependências, varredura de segredos, CodeQL) e validação de mensagens de commit. Ações de terceiros fixadas por SHA.
- **Release:** workflow disparado por tag que repete os checks e só então cria a GitHub Release com as notas em PT-BR.
- **Observabilidade:** Sentry com release e source maps, sem dados pessoais e com remoção de payloads de séries. Web Vitals e eventos de produto em endpoint e tabela próprios, sem analytics de terceiros.

## Alternativas consideradas

- Jest e Cypress: menor velocidade e menos suporte a múltiplos contextos de usuário.
- Analytics de terceiros: amplia a superfície de privacidade e exigiria consentimento.

## Consequências

- Métricas de campo (Core Web Vitals) só existem com tráfego; o gate de pré-lançamento usa orçamentos de laboratório.
- Testes ponta a ponta exigem Docker no ambiente local e no CI.
