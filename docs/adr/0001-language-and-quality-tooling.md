# 0001. Linguagem, tipagem e ferramentas de qualidade

- Status: aceita
- Data: 07/10/2026
- Decisões do plano: D-02, D-16

## Contexto

Os cálculos de volume, 1RM, recordes e progressão, e a sincronização do treino, são o ponto onde erros silenciosos custam mais. O Documento Mestre exige análise estática rigorosa, ausência de código morto e separação entre domínio, dados e interface.

## Decisão

- TypeScript em modo estrito, com `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature` e `verbatimModuleSyntax`.
- Zod nas fronteiras de entrada, com esquemas compartilhados entre cliente e servidor.
- ESLint com `typescript-eslint` em modo estrito com tipos, `jsx-a11y`, `react-hooks`, regras do Next e `eslint-plugin-boundaries` para impor as camadas descritas na seção 5.1 do plano.
- Prettier para formatação, `knip` para código e dependências sem uso, Vitest para testes.
- pnpm sobre Node.js 24 LTS. Scripts de instalação de dependências ficam bloqueados por padrão e liberados um a um (`pnpm-workspace.yaml`).
- Hooks locais com lefthook (lint, formatação, higiene, commitlint e, no push, tipos e testes).

### Versões fixadas por incompatibilidade, verificadas em 07/10/2026

- **TypeScript 6.0.x, e não 7.** O `typescript-eslint` declara suporte a TypeScript abaixo de 6.1. Sem ele a análise com tipos não funciona.
- **ESLint 9.x, e não 10.** O `eslint-plugin-jsx-a11y` declara suporte apenas até a versão 9, e a acessibilidade da interface é requisito do produto.

Ambas as fixações serão reavaliadas quando os plugins ampliarem o suporte.

## Alternativas consideradas

- JavaScript com JSDoc: menos garantias em código de domínio.
- Biome no lugar de ESLint e Prettier: mais rápido, mas sem o conjunto de regras com tipos e de acessibilidade necessárias.
- npm: sem o bloqueio de scripts de instalação por padrão e com `node_modules` menos estrito.

## Consequências

- A atualização de TypeScript e ESLint depende dos plugins; o risco está registrado como R-01 no plano.
- Scripts utilitários em `scripts/` são TypeScript executado diretamente pelo Node (remoção de tipos nativa), sem etapa de build.
