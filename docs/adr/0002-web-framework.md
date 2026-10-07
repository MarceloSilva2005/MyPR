# 0002. Framework web

- Status: aceita
- Data: 07/10/2026
- Decisões do plano: D-01

## Contexto

O produto tem uma página pública que precisa carregar rápido (LCP) e uma área autenticada interativa com requisitos de offline. Há também operações que devem acontecer em camada confiável (autorização, validação, limitação de taxa).

## Decisão

Next.js com App Router, React e TypeScript. A página pública usa renderização estática; a área autenticada usa Server Components e Route Handlers como camada de servidor (BFF) no mesmo deploy.

## Alternativas consideradas

- SvelteKit: bundles menores, mas ecossistema de primitivos acessíveis bem menor.
- SPA com Vite e PWA: simplifica o offline, mas perde renderização no servidor para a página pública e a camada de servidor integrada.
- React Router 7: viável, com menos integração de hospedagem para o fluxo planejado.

## Consequências

- O modelo de cache do framework exige disciplina: rotas autenticadas respondem sempre com `Cache-Control: private, no-store`, com teste automatizado.
- O domínio (`src/domain`) não depende do framework, o que limita o custo de uma troca futura.
