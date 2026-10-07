# MyPR — Plano de Execução

| Campo | Valor |
| --- | --- |
| Versão do plano | 1.0 (para aprovação) |
| Data | 07 de outubro de 2026 |
| Base normativa | Documento Mestre de Produto, UX/UI e Engenharia, v1.1 |
| Autores do projeto | [MarceloSilva2005](https://github.com/MarceloSilva2005) e [Felipe1dev](https://github.com/Felipe1dev) |
| Idioma | Conteúdo em PT-BR. Nomes de arquivos, código, commits e branches em inglês. |
| Estado | Etapas E0 (`v0.1.0`) e E1 (`v0.2.0`) concluídas em 07/10/2026. Próxima: E2. Aprovações registradas abaixo. |

### Registro de aprovações

Aprovadas por MarceloSilva2005 em 07/10/2026: A-01 (repositório público com direitos reservados, sem arquivo de licença), A-02 (stack das decisões D-01 a D-22), A-03 (push somente ao fim da etapa), A-04 (janela de exclusão de conta de 7 dias), A-05 (direção visual com accent azul ultramar e fonte Geist). Pendentes: A-06 (responsável pela revisão dos textos legais, necessário na E8) e A-07 (Docker Desktop e contas Supabase, Vercel e Sentry, necessários a partir da E2).

### Ajustes registrados durante a E0

- **D-02 e D-16, versões fixadas.** O `typescript-eslint` aceita TypeScript apenas abaixo de 6.1 e o `eslint-plugin-jsx-a11y` aceita ESLint até a versão 9. Adotados TypeScript 6.0.x e ESLint 9.x (ver ADR 0001). O risco R-01 se confirmou e foi resolvido pelo plano B previsto.
- **Checks obrigatórios do ruleset.** Na E0 são `verify`, `security` e `commitlint`. `e2e` entra na E1, quando existir, e `db` na E2.
- **Escopos de commit.** Acrescentados `deps`, `deps-dev`, `release`, `repo` e `tooling`.
- **T0.4, prova do ruleset.** Em vez de abrir um PR descartável, a prova é a tentativa real de push direto e de force push em `main`, que devem ser rejeitados, mais a conferência da configuração por API.
- **T0.5, adiado.** A ligação dos projetos Vercel e Supabase depende de P-03. O contrato de ambiente e o endpoint de saúde foram entregues; a conexão dos provedores passa a ser a primeira tarefa da E2 (Supabase) e uma pendência do titular da conta (Vercel).
- **CODEOWNERS.** Lista apenas MarceloSilva2005 enquanto Felipe1dev não tiver acesso de escrita; o GitHub ignora donos sem esse acesso.

### Ajustes registrados durante a E1

- **Lighthouse CI substituído por medição de laboratório.** CLS e LCP são medidos pelo Playwright nas rotas principais e o JavaScript de primeira carga tem limite por rota (`pnpm check:bundle`). O Lighthouse CI volta na E6, quando houver páginas com conteúdo real.
- **Galeria como rota em vez de Storybook.** A galeria (`/dev/system`) é habilitada por `ENABLE_DESIGN_GALLERY` e responde 404 por padrão (T1.6).
- **Regressão visual somente em Linux.** As linhas de base são geradas na CI pelo workflow `Visual baselines`; no Windows os testes visuais são ignorados por diferenças de renderização de fonte.
- **Toast próprio.** O toast do React Aria ainda é instável (ver ADR 0007).
- **Check `e2e` obrigatório.** Entra no ruleset de `main` ao fim da E1, como previsto.
- **Release.** O workflow passou a fixar os links relativos das notas na tag e a usar o primeiro título como nome da release.

Este plano responde ao Apêndice E do Documento Mestre. Ele escolhe e justifica a arquitetura, divide o trabalho em etapas verificáveis, define a estratégia Git e de releases e lista o que ainda depende de decisão dos autores. Quando uma decisão aqui contraria ou interpreta o Documento Mestre, isso está registrado na seção 11.

## Sumário

1. Estado inicial e pré-requisitos
2. Reset do repositório
3. Estratégia Git, commits, versionamento e releases
4. Decisões técnicas
5. Arquitetura
6. Modelo de dados
7. Design System e revisão anti-genérico
8. Qualidade: gates, testes e evidências
9. Ambientes, CI/CD e operação
10. Etapas e tarefas
11. Contradições, ambiguidades e pontos a validar
12. Riscos
13. Decisões abertas do Documento Mestre (§21.3)
14. Rastreabilidade

---

## 1. Estado inicial e pré-requisitos

### 1.1 Estado verificado em 07/10/2026

| Item | Situação |
| --- | --- |
| Repositório legado | `MarceloSilva2005/MyPR`, público, branch `main`, 46 commits, 80 arquivos, sem tags, releases, issues, PRs ou forks. Site publicado em uma URL da Vercel. |
| Backup do legado | Concluído: espelho completo (`git clone --mirror`), pacote `git bundle` verificado (`bundle verify`) e cópia de trabalho para consulta. Guardado fora do repositório novo e fora da pasta da sessão. |
| Autenticação do GitHub CLI | Conta `MarceloSilva2005`. Escopos do token: `repo`, `read:org`, `gist`. **Falta `delete_repo`.** |
| Conta `Felipe1dev` | Existe e é um usuário válido. Usada apenas para crédito público. |
| Ambiente local | Node 24 LTS, npm, Git 2.49 e GitHub CLI presentes. Docker, pnpm e Supabase CLI ausentes. |

### 1.2 Pré-requisitos

| ID | Pré-requisito | Bloqueia | Ação |
| --- | --- | --- | --- |
| P-01 | Escopo `delete_repo` no token do GitHub CLI | T0.1 (exclusão e recriação) | O titular da conta executa `gh auth refresh -h github.com -s delete_repo` e autoriza no navegador, ou exclui o repositório em Settings, Danger Zone. |
| P-02 | Docker Desktop com WSL2 | E2 em diante (Supabase local, testes de RLS, E2E) | Instalar. Sem Docker só dá para testar contra um projeto remoto de desenvolvimento, o que é mais lento e limitado por taxa de e-mail. |
| P-03 | Contas: Supabase (dois projetos, `staging` e `production`, região São Paulo), Vercel, Sentry, provedor de e-mail transacional | Deploys e E2 | Criar e entregar acesso. Segredos ficam apenas em variáveis de ambiente dos provedores e do GitHub Actions. |
| P-04 | Domínio próprio | Beta (E9) | Necessário para SPF, DKIM e DMARC dos e-mails de verificação e recuperação e para os links de produção. |
| P-05 | Projeto legado na Vercel ligado ao repositório antigo | Nenhum | Ao excluir o repositório, novos deploys do projeto legado deixam de acontecer; o último deploy segue no ar. Decidir se permanece até o lançamento. O novo produto usa projeto novo. |
| P-06 | Banco de dados legado (Supabase) | Nenhum | O backup cobre só o código. Se existirem treinos reais no banco legado, exportá-los antes de desativá-lo. Não será reaproveitado. |

---

## 2. Reset do repositório

### 2.1 Procedimento (T0.1)

1. **Backup** — feito. Antes da exclusão, reconfirmar que o pacote ainda passa em `git bundle verify` e que a contagem de commits do espelho é 46.
2. **Permissão** — confirmar `delete_repo` (P-01). Sem ela, a exclusão não é tentada e a etapa permanece bloqueada.
3. **Exclusão** — `gh repo delete MarceloSilva2005/MyPR --yes`. O GitHub documenta a possibilidade de restaurar repositórios excluídos por um período limitado; este plano não depende disso, o backup é a garantia.
4. **Criação** — `gh repo create MarceloSilva2005/MyPR --public` sem README, licença ou `.gitignore` gerados pelo GitHub. O histórico nasce localmente com `git init -b main`.
5. **Primeiro commit** — fundação real do projeto (scaffold, ferramentas, documentação), com a mensagem `chore: initialize project foundation`. Nenhum arquivo, commit, tag, release ou branch do legado é importado.
6. **Verificação de ruptura de histórico** — o novo repositório tem um único ramo de histórico a partir do commit raiz novo, nenhum SHA do legado resolve (`git cat-file -e <sha legado>` falha) e `gh api` não lista tags, releases ou branches antigos.

### 2.2 Configuração do novo repositório

| Área | Configuração |
| --- | --- |
| Visibilidade | Pública, igual ao legado (validar, ver A-01). |
| Descrição e topics | Descrição curta em PT-BR; topics `workout-tracker`, `strength-training`, `pwa`, `nextjs`, `typescript`. |
| Recursos | Issues ligado. Wiki, Projects e Discussions desligados (documentação vive no repositório). |
| Merge | Somente rebase merge (histórico linear preservando commits de tarefa). Squash e merge commit desligados. Apagar branch ao integrar. |
| Ruleset de `main` | PR obrigatório, checks obrigatórios (`verify`, `security`, `commitlint` na E0; `e2e` e `db` quando existirem), histórico linear, sem force push, sem exclusão, conversas resolvidas. Aprovações obrigatórias: 0 enquanto a equipe efetiva for uma pessoa; não se simulam revisões (ver §3.3). Ativado em T0.4, quando os checks já existem. |
| Segurança | Dependabot (alertas e atualizações de segurança), secret scanning com push protection, CodeQL em configuração padrão, relato privado de vulnerabilidades, `SECURITY.md`. |
| Organização | Labels em PT-BR, templates de issue e PR em PT-BR, `CODEOWNERS` com os dois autores. |

### 2.3 Créditos públicos

MarceloSilva2005 e Felipe1dev aparecem em: README (seção Autores), `package.json` (`author` e `contributors`), `LICENSE` ou aviso de direitos no README, `humans.txt`, página Sobre em Configurações, rodapé da landing e `<meta name="author">`. **Crédito de projeto não é autoria de commit.** Commits levam a identidade Git de quem os produziu. Nenhum commit é atribuído a Felipe1dev se ele não participou dele, e não se usa `Co-authored-by` para nenhuma ferramenta.

### 2.4 Higiene de repositório

- Configurações de ferramentas locais de desenvolvimento não são versionadas; ficam em `.git/info/exclude`, não no `.gitignore` público.
- Sem assinaturas automáticas de ferramentas em código, comentários, commits, PRs, README, releases ou metadados.
- Sem arquivos de instrução interna, rascunhos, logs de depuração ou dados reais de teste.
- Verificação automática em CI (`scripts/check-repo-hygiene`) para termos proibidos e para segredos (gitleaks).

---

## 3. Estratégia Git, commits, versionamento e releases

### 3.1 Branches

| Branch | Uso | Vida |
| --- | --- | --- |
| `main` | Sempre em estado aprovado e implantável. Só recebe etapas que passaram em todos os gates. | Permanente |
| `stage/<nn>-<slug>` | Trabalho de uma etapa, por exemplo `stage/04-live-workout`. | Até a etapa fechar |
| `feat/…`, `fix/…`, `chore/…` | Trabalho paralelo ou correção isolada, curtos. | Dias |
| `hotfix/…` | Correção de defeito em versão já publicada; gera release de patch. | Horas |

Não há `develop`. Com uma equipe pequena, um segundo ramo de integração só cria divergência.

### 3.2 Commits

Padrão **Conventional Commits** em inglês, no imperativo, assunto até 72 caracteres, corpo opcional explicando o motivo.

`tipo(escopo): assunto`

- Tipos: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`, `revert`.
- Escopos: `auth`, `db`, `ds`, `shell`, `exercises`, `routines`, `workout`, `sync`, `history`, `records`, `analytics`, `settings`, `pwa`, `landing`, `security`, `a11y`, `deps`, `deps-dev`, `release`, `repo`, `tooling`.
- Exemplos: `feat(auth): implement email verification flow`, `feat(workout): persist active session locally`, `fix(sync): prevent duplicate set records on retry`, `test(records): cover retroactive record recalculation`, `refactor(analytics): simplify weekly aggregation`.
- Proibido: `update`, `changes`, `wip`, `misc`, `fix stuff`. Validado por `commitlint` (hook `commit-msg` e job de CI).
- Granularidade: um commit por tarefa verificável. Sem commits que quebrem lint, tipos ou testes unitários.

### 3.3 Fluxo de integração

1. A etapa é desenvolvida em `stage/<nn>-<slug>`. Cada tarefa fecha com um commit local após os checks da própria tarefa (lint, tipos, testes da tarefa).
2. Ao fim da etapa, roda-se a bateria completa de gates (seção 8). Corrigem-se todos os problemas.
3. **Somente com os critérios de aceite aprovados**, a branch é enviada ao GitHub e abre-se o PR contra `main`. O CI repete os gates em ambiente limpo.
4. Integração por rebase merge. Em seguida: tag anotada, GitHub Release, atualização do `CHANGELOG.md`.

Isso segue a regra de só fazer push de estado aprovado. O custo é não haver cópia remota do trabalho em andamento; mitigado mantendo o repositório de trabalho em pasta durável. Ver C-10.

Revisão: o PR carrega checklist de Definition of Done e as evidências da etapa. Como a equipe efetiva é uma pessoa, não há aprovação obrigatória; se Felipe1dev passar a contribuir, exige-se uma aprovação por PR.

### 3.4 Versionamento (SemVer)

| Marco | Versão | Release no GitHub |
| --- | --- | --- |
| E0 Fundação | `v0.1.0` | Pre-release |
| E1 Design System e shell | `v0.2.0` | Pre-release |
| E2 Dados, autenticação e autorização | `v0.3.0` | Pre-release |
| E3 Exercícios e rotinas | `v0.4.0` | Pre-release |
| E4 Treino ao vivo | `v0.5.0` | Pre-release |
| E5 Histórico, recordes e progressão | `v0.6.0` | Pre-release |
| E6 Dashboard e analytics | `v0.7.0` | Pre-release |
| E7 Configurações, dados e PWA | `v0.8.0` | Pre-release |
| E8 Landing, legal e entitlements | `v0.9.0` | Pre-release |
| E9 Beta (escopo completo, foco em QA) | `v1.0.0-beta.N` | Pre-release |
| E10 Candidato a lançamento (somente correções) | `v1.0.0-rc.N` | Pre-release |
| E11 Lançamento público | `v1.0.0` | Latest |

Correções posteriores a uma etapa geram patch (`v0.5.1`). Nenhuma tag nasce sem release e nenhuma release nasce sem tag. Releases `0.x`, `beta` e `rc` são marcadas como pre-release para não sugerir estabilidade antes da hora.

### 3.5 Release por etapa

- Workflow `release.yml` disparado por tag `v*`: reexecuta toda a bateria de gates e **só então** cria a GitHub Release com `gh release create --notes-file docs/releases/<tag>.md`. Tag com gate falhando não vira release.
- Notas em PT-BR com cinco seções fixas: **O que foi implementado**, **Principais alterações**, **Correções**, **Testes executados** (comandos e resultado), **Limitações conhecidas**.
- Sem notas geradas automaticamente com rodapé de ferramenta. Evidências (screenshots desktop e mobile, relatórios) anexadas como assets da release.
- `CHANGELOG.md` em PT-BR, atualizado no mesmo PR da etapa.
- **Definição de etapa concluída**: implementação, critérios de aceite, testes, commit, push, tag e Release. Faltando qualquer item, a etapa não está fechada.

---

## 4. Decisões técnicas

Cada decisão registra alternativas e riscos. As decisões estruturais viram ADRs em `docs/adr/` na E0. Versões abaixo são as estáveis consultadas no registro npm em 07/10/2026 e serão fixadas por lockfile na E0.

| ID | Decisão | Alternativas consideradas | Justificativa | Risco e mitigação |
| --- | --- | --- | --- | --- |
| D-01 | **Next.js (App Router) com React e TypeScript.** | SvelteKit; Vite SPA com PWA; React Router 7. | Landing estática rápida (LCP) e app autenticado no mesmo deploy; Server Components e Route Handlers formam o BFF; ecossistema de acessibilidade em React. | Complexidade do modelo de cache. Mitigação: rotas autenticadas sempre `private, no-store` com teste de cabeçalho; domínio independente de framework. |
| D-02 | **TypeScript estrito**: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`. **Zod** nas fronteiras. | JS com JSDoc; validação manual. | Erros silenciosos são o principal risco em cálculos e sincronização. Esquemas Zod compartilhados evitam divergência entre cliente e servidor. | TypeScript 7 não é aceito pelo `typescript-eslint`: fixada a linha 6.0.x (ADR 0001), a reavaliar quando houver suporte. |
| D-03 | **PostgreSQL gerenciado pelo Supabase** (banco, Auth e RLS), região São Paulo. Migrações SQL versionadas no repositório. | Neon + Drizzle + Better Auth; Firebase; Convex; PocketBase auto-hospedado. | Dados relacionais com agregações; **RLS como camada de autorização independente da aplicação**; fluxos de verificação de e-mail, recuperação, limites e CAPTCHA prontos e mantidos; esquema em SQL puro, portável. | Dependência do Auth. Mitigação: tabelas de domínio ligam-se ao `user_id` por uma única coluna; hashes bcrypt são exportáveis; ADR de saída. Projetos gratuitos podem pausar por inatividade e não têm recuperação pontual: produção em plano pago (confirmar condições vigentes). |
| D-04 | **BFF**: o navegador nunca fala direto com o Supabase. Server Components, Server Actions e Route Handlers acessam o banco com o JWT do usuário (RLS sempre ativa). A chave `service_role` existe só em módulo `server-only` com lista de importadores permitidos (exclusão de conta, expurgo agendado). | PostgREST direto do navegador. | CSP com `connect-src 'self'`; cookies `httpOnly`; validação e limitação de taxa em um único ponto; troca de backend possível. | Mais código que acesso direto e um salto de rede a mais. Mitigação: funções de implantação na região `gru1`, co-localizadas com o banco. |
| D-05 | **Autorização em três camadas**: (1) proxy/middleware exige sessão em `/app`; (2) handler deriva identidade do JWT validado, nunca do payload; (3) RLS em toda tabela privada com `owner_id = (select auth.uid())` e `FORCE ROW LEVEL SECURITY`. **FKs compostas `(owner_id, id)`** impedem que uma linha referencie dados de outro usuário. | Apenas checagem na aplicação; apenas RLS. | Defesa em profundidade e verificabilidade. Teste-meta falha o CI se existir tabela em `public` sem RLS ou sem política. | Desempenho de RLS: usar `(select auth.uid())` e índices em `owner_id`; medir na E6. |
| D-06 | **Autenticação**: e-mail e senha pelo Supabase Auth; verificação obrigatória antes de acessar `/app`; cookies `httpOnly` via `@supabase/ssr`; rotação de refresh token; Turnstile em cadastro, recuperação e login após falhas; verificação de senhas vazadas quando o plano permitir. Reautenticação para ações sensíveis. Redirecionamento pós-login só para caminhos internos de uma lista permitida. | Auth.js; Better Auth; login social. | Cobre os requisitos da §5.1 sem implementar criptografia ou envio de tokens por conta própria. Login social fica no backlog. | Entregabilidade de e-mail. Mitigação: SMTP próprio com SPF, DKIM e DMARC antes do beta; Mailpit local. |
| D-07 | **Métricas derivadas sob demanda.** Séries brutas são a fonte de verdade. Volume, 1RM estimado e cadeia de recordes são definidos em `src/domain` (TypeScript) e projetados em **views SQL** `security_invoker` para agregação. Uma suíte de **paridade** (testes de propriedade com fast-check contra o Postgres local) garante que TypeScript e SQL concordem. A detecção de PR **durante o treino** roda no cliente com os melhores atuais em cache. | Colunas materializadas e triggers; cálculo só no cliente. | Edição retroativa recalcula tudo sem reprocessamento. Sem fonte conflitante. Funciona offline. | Fórmula duplicada em dois lugares. Mitigação: paridade obrigatória no CI. Gatilho para materializar: p95 acima de 150 ms em Recordes ou Analytics com 50 mil séries (medido na E6). |
| D-08 | **Offline restrito à sessão ativa**, com IndexedDB via **Dexie**. IDs de cliente (UUIDv7). Sincronização por **snapshot da sessão** em fila (outbox), com concorrência otimista por `revision`, endpoint idempotente (`sync_workout_session`) e cópia recuperável em caso de conflito. | Replicação offline completa; CRDTs; log de operações finas. | Cobre o requisito de nunca perder treino sem replicar a plataforma. Snapshot por agregado é idempotente por construção e simples de testar. Dexie tem transações e migração de esquema maduras. | Detalhes e limites na §5.4. Armazenamento pode ser evictado (Safari sem instalação): `navigator.storage.persist()`, aviso ao usuário e prioridade de sincronização. |
| D-09 | **PWA com Service Worker via Serwist** (ou SW compilado com esbuild se o plugin não suportar o bundler do Next): pré-cache de ativos versionados e do shell de `/app`, navegação *network-first* com fallback ao shell, API nunca em cache, atualização só quando não há treino ativo. | SW manual; sem SW. | Recarregar offline durante o treino exige shell em cache. Atualização controlada evita código obsoleto. | Compatibilidade com Turbopack. Mitigação: spike de dois dias no início da E4 com plano B documentado. |
| D-10 | **UI**: **React Aria Components** estilizados com **Tailwind CSS v4** sobre tokens próprios. Sem shadcn. Ícones Lucide, com label nas ações primárias. | Radix; Base UI; shadcn/ui; biblioteca pronta (MUI, Chakra). | Reordenação por teclado e leitor de tela, ComboBox, NumberField, Table e foco de modais são resolvidos em nível de acessibilidade difícil de igualar; sendo sem estilo, o visual é todo do MyPR. | Curva de aprendizado e verbosidade. Mitigação: camada `ds/` encapsula. |
| D-11 | **Formulários**: Zod compartilhado; React Hook Form onde há *field arrays* (editor de rotina, treino); formulários simples usam validação do React Aria e Server Actions. | RHF em tudo; Formik. | Evita biblioteca onde não é necessária (§2.2). | Dois estilos. Mitigação: um wrapper `ds/form` com contrato único de erro. |
| D-12 | **Estado de leitura**: TanStack Query para dados interativos (filtros de Analytics refletem sem recarregar), com persistência em IndexedDB para leitura offline de rotinas, catálogo e primeira página do histórico. Filtros vivem na **URL** (sobrevivem à ida ao detalhe e volta). | SWR; apenas RSC; Zustand. | Filtro instantâneo, retry e *stale-while-revalidate* sem escrever infraestrutura. | Cache obsoleto exibido como atual. Mitigação: indicador de atualização e invalidação por mutação. |
| D-13 | **Gráficos**: `d3-scale`, `d3-shape`, `d3-array` com componentes SVG próprios (linha, barras, faixa semanal), navegação por teclado entre pontos, tooltip com valor exato, tabela alternativa, carregamento sob demanda. | Recharts; visx; ECharts; uPlot. | Controle total do visual (sem aparência de biblioteca padrão), peso pequeno, acessibilidade sob nosso controle. | Mais código inicial; só há três tipos de gráfico na V1. |
| D-14 | **Motion**: tokens CSS (`--motion-instant…slow`, easings) e `prefers-reduced-motion` global. Biblioteca `motion` (LazyMotion) apenas se a E1 comprovar necessidade para reordenação; números por hook próprio. | Framer Motion completo; GSAP. | Atende o §12 com custo mínimo. | Dispersão de animações. Mitigação: regra de lint proibindo `transition` fora dos tokens. |
| D-15 | **Testes**: Vitest (unidade e integração), fast-check (propriedades), Testing Library, Playwright (E2E multiusuário, offline, mobile, visual, axe). Testes de banco em Vitest contra Supabase local com **personas A e B** e *role switching*. | Jest; Cypress. | Velocidade, TypeScript nativo, multi-contexto do Playwright para isolamento entre usuários e `setOffline`. | Flakiness de E2E. Mitigação: sem `sleep`, esperas por estado, retries somente em CI e registro de falhas intermitentes. |
| D-16 | **Qualidade estática**: ESLint 9 (flat config) com `typescript-eslint` em modo estrito com tipos, `jsx-a11y`, `react-hooks`, `eslint-plugin-boundaries` (camadas), Prettier, `knip` (código morto), `pnpm audit`, gitleaks, CodeQL. **pnpm** sobre Node 24 LTS (`.nvmrc`, `engines`, `packageManager`). Hooks com lefthook. | Biome; npm. | Código morto e dependências sem uso são proibidos pelo §10.4. | Ruído de lint. Mitigação: regras ajustadas na E0, depois estáveis. |
| D-17 | **Observabilidade**: Sentry (cliente e servidor, release, source maps, `sendDefaultPii: false`, `beforeSend` removendo payloads de séries e e-mails, túnel próprio). Web Vitals e eventos de produto em **endpoint e tabela próprios**, sem analytics de terceiros e sem cookies além dos essenciais. Verificação de saúde em `/api/health`. | Analytics de terceiros; log em texto livre. | Menos superfície de privacidade (LGPD) e nenhum banner de consentimento necessário na V1. | Métricas de campo só existem com tráfego. Ver C-15. |
| D-18 | **Entitlements** em tabelas `plans` e `user_entitlements`, registro de *features* em código e função única `can(user, feature)`. Billing em módulo isolado, adiado (ver C-04 e gate G-02). | Condicionais de plano na UI; billing já na V1. | Cumpre o §4.1 sem espalhar condicionais. | Escopo comercial indefinido. Mitigação: gate de decisão antes do código de cobrança. |
| D-19 | **Catálogo de exercícios** curado em PT-BR (aproximadamente 150 a 200 itens) em arquivo versionado, com `slug` estável e UUID determinístico derivado do `slug`; carga por migração idempotente; aliases em metadados. Conteúdo próprio, sem copiar bases de terceiros. | Importar base pública; catálogo vazio. | IDs idênticos entre ambientes; renomear nunca quebra histórico, pois sessões guardam o nome como *snapshot*. | Trabalho editorial. Mitigação: começar pelos movimentos mais comuns e ampliar por migração. |
| D-20 | **Unidade**: carga armazenada em **kg** (`numeric(9,4)`); preferência kg/lb só altera apresentação. Entrada em lb é convertida sem arredondar; exibição arredonda. | Armazenar valor e unidade originais. | Uma única verdade; comparação de PR sem conversão ambígua; trocar unidade não altera semântica (§8.7). | Ruído de arredondamento ao reexibir lb: coberto por testes de ida e volta. |
| D-21 | **Datas**: `timestamptz` em UTC + fuso IANA gravado na sessão; "dia do treino" e semana calculados no fuso da sessão; primeiro dia da semana vem do perfil. `date-fns` com `@date-fns/tz`. | `Temporal` (suporte ainda irregular); armazenar horário local. | Ordenação correta e semanas coerentes ao viajar. | Horário de verão e mudança de fuso: casos de borda testados. |
| D-22 | **Segurança de borda**: CSP restritiva com nonce, HSTS, `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`; mutações exigem `Content-Type: application/json`, validação de `Origin` e `Sec-Fetch-Site`; limitação de taxa por usuário e IP em handlers públicos e de sincronização (implementação em Postgres, sem novo fornecedor, salvo medição contrária). | Cabeçalhos padrão do framework. | Referência ASVS 5.0 nível 2 (§14.1 do Documento Mestre). | Nonce exige renderização dinâmica; a landing estática usará política por hashes. Validar em T2.3. |

---

## 5. Arquitetura

### 5.1 Estrutura do repositório

```
.
├── src/
│   ├── app/            rotas (marketing, auth, app) e route handlers em /api/v1
│   ├── domain/         TypeScript puro: unidades, volume, 1RM, recordes, progressão, calendário
│   ├── features/       UI, hooks e actions por funcionalidade (workout, routines, exercises, history,
│   │                   records, analytics, settings, auth, onboarding)
│   ├── data/           repositórios por agregado, mapeamento linha <-> domínio
│   ├── server/         somente servidor: sessão, autorização, limitação de taxa, telemetria, service_role
│   ├── sync/           IndexedDB (Dexie), outbox, reconciliação, conflitos
│   ├── schemas/        Zod compartilhado, incluindo formato versionado de exportação
│   ├── ds/             Design System: tokens, primitivos, gráficos, motion
│   ├── entitlements/   registro de features e can()
│   ├── billing/        criado apenas após o gate G-02
│   └── content/        textos da interface em PT-BR, centralizados
├── supabase/           migrations, seed, config, testes de banco
├── e2e/                Playwright
├── docs/               execution-plan, adr/, architecture/, security/, releases/
├── scripts/            verificações de higiene, copy e design guards
└── .github/            workflows, templates, CODEOWNERS
```

**Regras de dependência** (aplicadas por `eslint-plugin-boundaries`): `domain` não importa nada do projeto; `schemas` importa só `domain` e Zod; `ds` não conhece `features`; `features` usam `ds`, `data` e `domain`; `data` e `server` nunca são importados por código de cliente (`server-only`); o módulo `service_role` só é importável por uma lista curta.

Todo texto de interface fica em `src/content`. Isso evita copy espalhada e facilita revisar tom de voz e ausência de frases genéricas.

### 5.2 Fluxos de dados

```
Leitura:   Server Component -> data/ (JWT do usuário, RLS) -> Postgres
Mutação:   Server Action / Route Handler -> Zod -> autorização -> data/ -> Postgres
Treino:    UI -> Dexie (gravação imediata) -> outbox -> POST /api/v1/sync/sessions
              -> Zod -> identidade do JWT -> RPC sync_workout_session -> Postgres
```

### 5.3 Autorização e segurança

- Identidade sempre vem do JWT validado no servidor. `owner_id`, plano e papéis enviados pelo cliente são ignorados ou rejeitados.
- RLS habilitada e forçada em toda tabela privada; dados globais (catálogo oficial) têm leitura pública a usuários autenticados e escrita apenas por migração.
- Mapeamento ASVS 5.0 nível 2 em `docs/security/asvs.md`, requisito por requisito, com situação e evidência. Modelo de ameaças curto (STRIDE) em `docs/security/threat-model.md`. Ambos criados na E2 e revisados na E9.
- Respostas públicas neutras: o cadastro de e-mail existente e a recuperação de senha respondem de forma idêntica; login falho não distingue e-mail inexistente de senha errada.
- Segredos só em variáveis de ambiente de servidor; `.env.example` sem valores reais; validação de ambiente na inicialização com Zod; gitleaks no CI e no hook de pre-commit.

### 5.4 Sincronização e comportamento offline

| Situação | Comportamento |
| --- | --- |
| Online | Cada alteração é gravada no IndexedDB antes de qualquer outra coisa. A fila envia o snapshot da sessão em segundo plano, com *debounce* e coalescência (só o estado mais recente de cada sessão é enviado). |
| Sem rede | Registro integral continua. Estado visível: "Salvo neste dispositivo". Nenhuma ação é bloqueada. |
| Rede volta | A fila reenvia. A sessão só é marcada "Sincronizado" após resposta de sucesso do servidor. O reenvio é idempotente porque o servidor faz *upsert* por IDs gerados no cliente. |
| Recarregar ou fechar | Ao abrir, restaura-se a sessão ativa local e reconcilia-se com o servidor. O cronômetro de descanso guarda o instante final (`endsAt`), não um contador, então sobrevive a recarregamento e a abas em segundo plano. |
| Duas abas | Uma única aba sincroniza, coordenada por `navigator.locks`. |
| Conflito (dois dispositivos) | O servidor compara `base_revision` com a revisão atual. Divergindo, responde 409 com a versão do servidor e **guarda a versão recebida** em `workout_session_conflicts`. O usuário escolhe manter a versão deste dispositivo ou a do servidor; a descartada fica recuperável por 30 dias no histórico. |
| Falha permanente | Estado "Não sincronizado" com ação "Tentar novamente"; uso local nunca é impedido. |
| Concluir sessão | O estado local só é limpo após confirmação do servidor ou registro seguro na fila. |

**Limites documentados da V1**: o modo offline cobre a sessão ativa, o catálogo, as rotinas e a última performance em cache. Criar ou editar rotinas, configurações e importar dados exigem conexão. Não há notificação push de fim de descanso (o alerta é visual, sonoro e por vibração com o app aberto). Em navegadores que removem armazenamento de sites não instalados após período sem uso (Safari), a instalação do PWA e `storage.persist()` reduzem o risco; o aviso fica visível quando o armazenamento não é persistente.

---

## 6. Modelo de dados

Todas as tabelas privadas têm `owner_id uuid not null`, RLS forçada, política por operação e índices iniciados por `owner_id`. Tabelas filhas usam FK composta `(owner_id, parent_id)`. Datas em `timestamptz`.

| Tabela | Conteúdo e invariantes |
| --- | --- |
| `profiles` | Nome de exibição, unidade, tema, primeiro dia da semana, descanso padrão, incremento de carga, objetivo, nível, fuso, `onboarding_completed_at`. |
| `exercises` | `owner_id` nulo para exercícios do sistema. Nome, `slug`, aliases, grupo primário, secundários, equipamento, categoria, padrão de movimento, tipo de carga (externa, peso corporal, assistida), `archived_at`. Usuário só escreve em linhas próprias. |
| `routines`, `routine_days`, `routine_exercises` | Planejamento. Séries planejadas, faixa de repetições, carga de referência, descanso, notas, técnica. Dias da semana agendados são preferência. |
| `workout_sessions` | ID gerado no cliente, `routine_id` opcional, nome em *snapshot*, status (`active`, `completed`, `discarded`), início, fim, fuso, notas, `revision`, `deleted_at` (exclusão lógica). |
| `session_exercises` | Exercício, nome em *snapshot* e parâmetros do template em *snapshot* (`plan_snapshot`). Editar template ou exercício depois não altera o histórico. |
| `workout_sets` | Posição, tipo (`warmup`, `work`, `drop`), `load_kg`, `reps`, RPE e RIR opcionais, `completed`, `failed`. Restrições de faixa (por exemplo carga entre 0 e 2000 kg, RPE entre 1 e 10). |
| `workout_session_conflicts` | Cópia recuperável da versão descartada em conflito. |
| `session_audit_log` | Registro append-only de correções manuais (§5.6). Sem interface na V1. |
| `progression_decisions` | Sugestão apresentada (com base) e decisão do usuário: aceitar, ajustar ou ignorar. |
| `plans`, `user_entitlements` | Plano e direitos. |
| `product_events` | Eventos de produto e de sincronização com propriedades em lista permitida, sem conteúdo de séries. |
| `account_deletion_requests` | Fila de exclusão com data efetiva. |

**Views** (`security_invoker`): `v_set_metrics` (volume e 1RM por série válida), `v_exercise_session_stats`, `v_personal_records` (cadeia de recordes por exercício e tipo), `v_weekly_summary`.

**Definição de série válida** (interpretação adotada, ver C-01): série `completed = true`, `reps >= 1`, `load_kg >= 0`. Aquecimento fica fora de volume e recordes. `drop` entra em volume e fora de recorde de carga. `failed` (falha muscular ou meta não atingida) entra em volume e recordes, mas nunca conta como sucesso para progressão. Série não concluída não entra em nada.

**Exclusão e retenção**: exclusão de sessão é lógica e recuperável por 30 dias, depois expurgada por job. Exclusão de conta remove dados após a janela descrita na E7. Backups do provedor podem reter cópias por prazo definido; isso consta na política de privacidade.

---

## 7. Design System e revisão anti-genérico

### 7.1 Contrato visual

- **Direção**: precisão técnica. Neutros frios grafite e branco, um único *accent*, verde só para sucesso, vermelho só para erro, âmbar só para atenção.
- **Accent**: azul ultramar controlado. A matiz final é validada na E1 contra contraste AA em claro e escuro e contra a paleta dos gráficos. Aprovação em A-05.
- **Tipografia**: Geist Sans variável (subconjuntos latin e latin-ext para PT-BR) com *fallback* de métrica ajustada para evitar CLS; Geist Mono apenas para dados técnicos; `font-variant-numeric: tabular-nums` em todo dado numérico.
- **Tokens**: espaçamento em escala de 4 px; raio 6 a 10 px; bordas de 1 px de baixo contraste; sombra só em camadas flutuantes; cores em OKLCH com variantes claro e escuro geradas do mesmo sistema; motion `instant 100 ms`, `fast 160 ms`, `base 220 ms`, `slow 320 ms`.
- **Cor em dados**: paleta categórica estável e segura para daltonismo, validada por script; série nunca depende só de matiz (marcador, padrão ou rótulo direto).
- **Componentes**: os do §11.4 do Documento Mestre, mais `WorkoutSetRow`, `RestTimer`, `SyncStatus`, `PRBadge` e `ExercisePicker` como componentes de domínio prioritários.
- **Acessibilidade WCAG 2.2 AA com atenção aos critérios novos**: 2.5.7 (alternativa a arrastar), 2.5.8 e alvos de pelo menos 44 px no treino, 2.4.11 (cronômetro e cabeçalho fixos não podem cobrir o foco), 3.3.8 (autenticação sem teste cognitivo; permitir colar e gerenciadores de senha), 3.3.7 (não pedir de novo dados já informados).

### 7.2 Salvaguardas automáticas (`scripts/check-*`)

| Verificação | Regra |
| --- | --- |
| Tokens | Falha em cor, espaçamento, raio ou sombra literais fora dos tokens. |
| Anti-padrões | Falha em `backdrop-filter`, gradientes fora de lista permitida, `rounded-full` fora de chips e status, animações fora dos tokens de motion. |
| Copy | Falha em emoji em código e textos, em frases da lista de proibidas e em saudações genéricas. |
| Higiene | Falha em emojis, assinaturas automáticas de ferramentas e termos de uma lista de proibidos mantida fora do repositório (variável do CI e arquivo local não versionado). |

### 7.3 Revisão visual por etapa com interface

Antes de fechar qualquer etapa com UI, executa-se o checklist do Apêndice C do Documento Mestre e procura-se, nesta ordem: **design genérico, inconsistências entre telas, excesso de elementos, padrões visuais repetitivos e microinterações** sem função ou sem token de motion. Procedimento:

1. Capturas de todas as telas e estados em 1440, 820, 390 e 360 px, claro e escuro.
2. Comparação lado a lado com as telas das etapas anteriores (consistência).
3. Cada card, borda, ícone, sombra e animação precisa justificar função; o que não justifica sai.
4. Resultado e decisões registrados no PR. Tela correta porém genérica reprova a etapa.

---

## 8. Qualidade: gates, testes e evidências

### 8.1 Comandos padrão

`pnpm lint`, `pnpm typecheck`, `pnpm test` (unidade e integração), `pnpm test:db` (RLS, paridade, migrações), `pnpm build`, `pnpm test:e2e`, `pnpm test:a11y`, `pnpm test:visual`, `pnpm knip`, `pnpm audit`, `pnpm check:guards`, `pnpm lhci`.

### 8.2 Matriz de gates (obrigatório a partir de)

| Gate | E0 | E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9+ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lint, tipos, knip | x | x | x | x | x | x | x | x | x | x |
| Build de produção reproduzível | x | x | x | x | x | x | x | x | x | x |
| Testes de unidade e integração | x | x | x | x | x | x | x | x | x | x |
| Console sem erros e requests sem falha (assert nos E2E) | | x | x | x | x | x | x | x | x | x |
| Testes de banco: RLS positivos e negativos, teste-meta | | | x | x | x | x | x | x | x | x |
| Paridade SQL e TypeScript | | | | | x | x | x | x | x | x |
| E2E das jornadas alteradas | | | x | x | x | x | x | x | x | x |
| axe: zero violações sérias ou críticas; revisão de teclado | | x | x | x | x | x | x | x | x | x |
| Regressão visual (claro e escuro, desktop e mobile) | | x | x | x | x | x | x | x | x | x |
| Revisão visual anti-genérico (§7.3) | | x | x | x | x | x | x | x | x | x |
| Orçamentos de performance (Lighthouse CI, tamanho de bundle) | | x | | | x | | x | x | x | x |
| Segurança: audit, gitleaks, CodeQL, revisão ASVS da superfície alterada | x | | x | x | x | x | x | x | x | x |
| Exploratório manual (rede, retomada, estados extremos) | | | | | x | x | x | x | x | x |
| Documentação viva atualizada | x | x | x | x | x | x | x | x | x | x |

### 8.3 Metas

- Domínio (`src/domain`): 100% de ramos cobertos e testes de propriedade. Demais módulos: meta de 80% de linhas, sem relaxar para passar.
- Core Web Vitals: orçamento de laboratório LCP ≤ 2,5 s, INP ≤ 200 ms (entrada de série) e CLS ≤ 0,1 em perfil móvel intermediário; medição de campo pelo endpoint próprio após o lançamento (C-15).
- Zero erro P0 ou P1 conhecido para pré-lançamento e lançamento. Defeito corrigido ganha teste de regressão.

### 8.4 Evidências por etapa (anexadas à release)

Comandos executados e resultado; resumo do que entrou e do que ficou fora; screenshots desktop e mobile das telas novas ou alteradas; lista de defeitos encontrados na QA e situação; commits; notas em PT-BR; documentação atualizada.

---

## 9. Ambientes, CI/CD e operação

| Ambiente | Aplicação | Banco | Observações |
| --- | --- | --- | --- |
| Local | Next em desenvolvimento | Supabase local (Docker), Mailpit para e-mails | Seed determinístico, conta de teste local gerada por script. |
| Preview | Deploy por PR na Vercel | Projeto Supabase `staging` | `X-Robots-Tag: noindex`. |
| Produção | `main` na Vercel | Projeto Supabase `production` | `noindex` até o lançamento v1.0.0. |

- **CI (GitHub Actions)**: `verify` (instalação congelada, lint, tipos, unidade, build), `db` (Supabase local, migrações do zero, RLS, paridade), `e2e` (Playwright em shards, com falha em erro de console), `security` (audit, gitleaks, CodeQL), `visual`, `lhci`, `commitlint`.
- **Migrações**: estratégia *expand and contract* (compatíveis com a versão anterior do app). Aplicadas ao `staging` automaticamente; ao `production` pelo workflow de release, com aprovação manual no *environment* protegido. Reversão de app por *rollback* da Vercel; reversão de dados por migração corretiva e recuperação pontual do provedor (testada na E9).
- **Observabilidade**: Sentry com *release* e *source maps*; alertas de aumento de 5xx, falhas de autenticação e falhas de sincronização; verificação externa de disponibilidade em `/api/health`. Logs sem senhas, tokens, e-mails ou payloads de séries.
- **Custos**: produção exige plano pago do Supabase e da Vercel (o plano gratuito da Vercel é voltado a uso não comercial; confirmar termos vigentes), mais domínio. Sentry e o provedor de e-mail começam em planos gratuitos.

---

## 10. Etapas e tarefas

Formato: **Objetivo**, **Dependências**, tarefas (módulos, testes, condição de pronto), **Critérios de aceite**, **Release**. Em toda tarefa, o checkpoint é: lint, tipos e testes da tarefa verdes antes do commit. O checkpoint da etapa é a matriz da seção 8.2.

### E0 — Fundação do repositório (`v0.1.0`)

**Objetivo.** Repositório novo, ferramentas, CI e documentação viva prontos para receber produto.
**Dependências.** P-01. Aprovações A-01 a A-03.

| ID | Tarefa | Testes | Pronto quando |
| --- | --- | --- | --- |
| T0.1 | Excluir e recriar o repositório; configurar conforme §2.2. | Verificações da §2.1 passo 6. | Repositório novo sem nenhum objeto do legado; configuração conferida por `gh api`. |
| T0.2 | Scaffold Next + TypeScript estrito + pnpm + ESLint + Prettier + knip + lefthook + commitlint; confirmar compatibilidade TS 7 e `typescript-eslint`; regras de camada. | `pnpm lint`, `typecheck`, `build`. | Comandos padrão rodam do zero em máquina limpa seguindo o README. |
| T0.3 | Documentação: README PT-BR (propósito, autores, estado, como executar), CONTRIBUTING, SECURITY, CHANGELOG, `docs/adr/` com as decisões D-01 a D-22, `docs/execution-plan.md`; decisão de licença (A-01). | Revisão de links e higiene. | Sem emoji, sem assinaturas automáticas, créditos presentes. |
| T0.4 | CI, templates, CODEOWNERS, labels, Dependabot e ruleset de `main`. | Tentativa de push direto e de force push em `main` rejeitada. | Ruleset ativo e comprovado. |
| T0.5 | Contrato de variáveis de ambiente (`src/env.ts`), `/api/health` e `noindex`. Ligação dos projetos Vercel e Supabase adiada (ver ajustes). | Teste de validação de ambiente e do endpoint. | Endpoint responde sem cache e sem vazar internos; cabeçalho `noindex` ativo. |
| T0.6 | `release.yml`, modelo de notas, script de higiene. | Tag de teste em repositório de ensaio. | Release só nasce após gates verdes. |

**Aceite.** Histórico novo e independente; CI verde em `main`; ruleset ativo; README com autores; `v0.1.0` publicada como pre-release.
**Commits de exemplo.** `chore: initialize project foundation`, `ci: add verification and security workflows`, `docs: add execution plan and architecture decisions`.

### E1 — Design System, shell e padrões de estado (`v0.2.0`)

**Objetivo.** Contrato visual implementado e a casca de navegação funcionando, antes de qualquer tela de produto.
**Dependências.** E0.

| ID | Tarefa | Testes | Pronto quando |
| --- | --- | --- | --- |
| T1.1 | Tokens (cor OKLCH claro e escuro, tipografia, espaço, raio, borda, sombra, motion), tema sistema/claro/escuro sem *flash*, fontes. | Teste de contraste automatizado dos pares de tokens. | Todos os pares de texto e componente atendem AA nos dois temas. |
| T1.2 | Primitivos: Button, TextField, NumberInput, Select, ComboBox, Tabs e Segmented, Dialog e Drawer, Toast, Tooltip, Table e DataList, Metric. | Testes de componente e axe por estado. | Cada componente com estados normal, foco, desabilitado, carregando e erro. |
| T1.3 | Componentes de domínio: WorkoutSetRow, RestTimer, SyncStatus, PRBadge, ExercisePicker, EmptyState, ErrorState, Skeleton. | Testes de componente e visual. | Skeletons preservam dimensões (CLS 0 no gallery). |
| T1.4 | Contêiner de gráfico e primitivas de linha, barras e faixa semanal com tabela alternativa. | Testes de teclado e de acessibilidade. | Tooltip com valor exato, legenda, unidade e estado vazio. |
| T1.5 | Shell: sidebar desktop, navegação inferior mobile com "Mais", navegação reduzida em treino ativo, limites de erro, página 404. | E2E de navegação e teclado. | Ordem e rótulos conforme §6 do Documento Mestre. |
| T1.6 | Galeria interna (excluída do build de produção), regressão visual e axe. | `test:visual`, `test:a11y`. | Linhas de base aprovadas em 4 larguras e 2 temas. |
| T1.7 | Salvaguardas de §7.2. | Testes com casos positivos e negativos. | Falham em violação intencional. |

**Aceite.** Sistema único e coerente; revisão anti-genérico aprovada; orçamento de bundle definido.
**Commits de exemplo.** `feat(ds): add color, type and spacing tokens`, `feat(shell): implement responsive navigation`.

### E2 — Dados, autenticação e autorização (`v0.3.0`)

**Objetivo.** Contas seguras e isolamento de dados verificável.
**Dependências.** E1, P-02, P-03.

| ID | Tarefa | Testes | Pronto quando |
| --- | --- | --- | --- |
| T2.1 | Supabase local, migração base, estrutura de testes de banco com personas A e B. | `test:db` do zero em CI. | Banco recriável com um comando. |
| T2.2 | `profiles` e padrão de RLS; teste-meta que falha para tabela sem RLS. | Positivos e negativos. | Teste-meta presente e verde. |
| T2.3 | Camada de servidor: sessão, proxy de rotas, redirecionamento seguro, verificação de origem, cabeçalhos e CSP. | Testes de integração; scanner de cabeçalhos. | Rota privada sem sessão redireciona; CSP sem violações. |
| T2.4 | Cadastro, login, logout, verificação de e-mail com reenvio, recuperação de senha, links expirados ou inválidos, Turnstile; e-mails em PT-BR. | E2E completo com Mailpit. | Mensagens neutras, sem enumeração, formulário preservado em erro. |
| T2.5 | Reautenticação, troca de senha, revogação de sessões. | E2E. | Ação sensível exige senha recente. |
| T2.6 | Onboarding passos 1, 2, 3 e 5, retomável. Passo 4 chega na E3. | E2E de retomada. | Usuário interrompido volta ao passo em que parou. |
| T2.7 | Limitação de taxa e controles de abuso. | Integração. | Limites aplicados em handlers públicos. |
| T2.8 | `docs/security/asvs.md` e `threat-model.md`. | Revisão. | Requisitos de nível 2 aplicáveis mapeados com evidência. |

**Aceite.** Usuário A não lê, altera ou exclui dados de B por nenhuma rota nem chamada direta; `owner_id` forjado é ignorado ou rejeitado; FK entre usuários é rejeitada; respostas públicas não revelam existência de conta; WCAG nas telas de autenticação (rótulos persistentes, `autocomplete`, mostrar senha acessível).
**Commits de exemplo.** `feat(auth): implement email verification flow`, `test(security): cover cross-user access denial`.

### E3 — Exercícios e rotinas (`v0.4.0`)

**Objetivo.** Catálogo pesquisável e planejamento de treino editável.
**Dependências.** E2.

| ID | Tarefa | Testes | Pronto quando |
| --- | --- | --- | --- |
| T3.1 | Esquema e *seed* do catálogo, ID determinístico por `slug`, busca sem acento e por alias. | Unidade da normalização; integração. | "supino" encontra "Supino reto" independente de acento e caixa. |
| T3.2 | Biblioteca: filtros por grupo, equipamento e padrão; exercícios personalizados (criar, editar, arquivar); página do exercício (histórico preenchido na E5). | E2E; RLS: sistema somente leitura. | Exercício do sistema não é alterável por usuário. |
| T3.3 | Rotinas, dias e exercícios com RLS e FKs compostas. | Banco. | Isolamento verificado. |
| T3.4 | Lista e editor: reordenação por arrastar **e por teclado**, controles de mover no mobile, parâmetros em linha, rascunho com estado de alterações pendentes, erro sem perda de edição. | E2E de teclado e de falha de rede. | Reordenação completa só com teclado. |
| T3.5 | Duplicar, renomear, arquivar, agendar dias da semana. | E2E. | Arquivar não afeta histórico. |
| T3.6 | Onboarding passo 4 (modelos iniciais neutros e editáveis). | E2E. | Onboarding completo de ponta a ponta. |
| T3.7 | Cache de leitura (catálogo e rotinas) em IndexedDB. | Integração com rede cortada. | Rotinas e catálogo abrem sem rede após o primeiro carregamento. |

**Aceite.** Jornada "criar rotina e adicionar exercício" passa em E2E; estados de carregamento, vazio, erro e offline presentes; revisão visual aprovada.

### E4 — Treino ao vivo, persistência e retomada (`v0.5.0`)

**Objetivo.** A experiência central do produto, com garantia de não perder treino. Prioridade máxima.
**Dependências.** E3.

| ID | Tarefa | Testes | Pronto quando |
| --- | --- | --- | --- |
| T4.1 | Núcleo de domínio (TDD): conversão de unidades, volume, 1RM (Epley, 1 a 12 repetições), validade de série, detecção de PR com consolidação de feedback, sugestão de progressão. | Unidade e propriedades; 100% de ramos. | Tabela de casos do Documento Mestre (§8) reproduzida em testes. |
| T4.2 | Esquema de sessões, séries, conflitos e auditoria; RPC `sync_workout_session`; views; suíte de paridade. | Banco e paridade. | Reenvio idêntico não duplica; paridade verde. |
| T4.3 | Armazenamento local (Dexie): gravação imediata a cada alteração, migração de esquema, `storage.persist()`, restauração. | Integração com IndexedDB real. | Matar a aba e reabrir restaura o último estado persistido. |
| T4.4 | Outbox e sincronizador: backoff, eventos de rede, `navigator.locks`, detecção de conflito e interface de resolução. | Falhas injetadas; duas abas; dois dispositivos. | Cenários da §5.4 cobertos por teste. |
| T4.5 | Interface do treino: cabeçalho, foco no exercício, linha de série, entrada rápida (teclado numérico, incremento configurável, copiar anterior), última performance, notas, adicionar série e exercício, anotação de PR, descanso (minimizar, pausar, +tempo, dispensar), treino livre. | E2E e testes de componente; INP medido. | Registrar uma série leva poucas ações; nenhuma animação bloqueia entrada. |
| T4.6 | Encerramento com resumo prévio, aviso de séries não concluídas e resumo pós-treino com comparação apenas quando houver base. | E2E. | Sem confete; sem porcentagem inventada. |
| T4.7 | Service Worker e shell offline (spike, depois implementação), política de atualização que não interrompe treino. | E2E offline de recarga. | Recarregar sem rede abre o treino ativo. |
| T4.8 | Suíte de resiliência: recarregar a cada série, rede intermitente, requisições duplicadas, cota de armazenamento, relógio alterado. | Playwright com `setOffline` e injeção de falhas. | Nenhum cenário perde ou duplica série. |

**Aceite.** E2E: registrar várias séries, recarregar e retomar; concluir treino offline e sincronizar com contagem exata; gerar PR conhecido; INP ≤ 200 ms com 60 séries na sessão.
**Commits de exemplo.** `feat(workout): persist active session locally`, `feat(sync): add idempotent session synchronization`, `test(workout): cover recovery after reload`.

### E5 — Histórico, recordes e progressão (`v0.6.0`)

**Objetivo.** Dar valor ao registro: consulta confiável, recordes corretos e sugestão explicada.
**Dependências.** E4.

| ID | Tarefa | Testes | Pronto quando |
| --- | --- | --- | --- |
| T5.1 | Histórico: lista com filtros (período, rotina, status), busca, carregamento incremental, filtros na URL, detalhe fiel ao *snapshot*. | E2E. | Filtro persiste ao abrir detalhe e voltar. |
| T5.2 | Correção de sessão (com registro de auditoria e recálculo) e exclusão lógica com confirmação forte e restauração. | Integração. | Editar série passada recalcula a cadeia de recordes. |
| T5.3 | Página de Recordes: filtros, tabela densa no desktop, variação em relação ao anterior, link para a sessão de origem. | Banco e E2E. | Sem PR de série inválida ou aquecimento. |
| T5.4 | Página do exercício completa: última sessão, melhores marcas, curva, histórico recente. | E2E. | Consulta rápida sem ir ao Analytics. |
| T5.5 | Progressão: recomendação com base explícita (por exemplo "Última sessão: 10/10/10. Sugestão: +2,5 kg"), aceitar, ajustar ou ignorar, decisão registrada. | Unidade (tabela de casos) e E2E. | Nunca altera carga sem ação do usuário; dados insuficientes não geram sugestão. |

**Aceite.** Editar template não altera sessões antigas; trocar kg para lb não altera dados; recordes consistentes após edição retroativa.

### E6 — Dashboard e analytics (`v0.7.0`)

**Objetivo.** Responder "o que faço hoje" e "estou evoluindo".
**Dependências.** E5.

| ID | Tarefa | Testes | Pronto quando |
| --- | --- | --- | --- |
| T6.1 | Dashboard conforme prioridades P0 a P2 do §5.8: sessão ativa domina; próximo treino; resumo semanal comparado; PRs recentes; um gráfico principal; faixa de atividade. | E2E; visual. | Conta nova mostra estado vazio que ensina o próximo passo. |
| T6.2 | Analytics: períodos predefinidos e intervalo personalizado, métricas, gráfico principal com seletor, tabela por exercício, *drill-down*. | E2E e acessibilidade. | Filtros respondem sem recarregar a aplicação. |
| T6.3 | Agregações, índices e plano de execução; gerador de massa realista (2 anos de treino). | Medição com `EXPLAIN` e orçamento de tempo. | p95 dentro do orçamento com 50 mil séries. |
| T6.4 | Orçamento de performance de laboratório; gráficos sob demanda. | `lhci`. | LCP, INP e CLS dentro das metas. |

**Aceite.** Sem linha zero inventada em gráfico vazio; legenda e unidade sempre presentes; cores estáveis por série.

### E7 — Configurações, dados, conta e PWA (`v0.8.0`)

**Objetivo.** Controle do usuário sobre preferências e dados; instalação e atualização previsíveis.
**Dependências.** E6.

| ID | Tarefa | Testes | Pronto quando |
| --- | --- | --- | --- |
| T7.1 | Configurações por seção (Conta, Treino, Interface, Dados, Plano, Sobre) com salvamento imediato quando seguro. | E2E. | Preferência de unidade e tema persiste entre sessões e dispositivos. |
| T7.2 | Exportação JSON versionada (`mypr.export.v1`) e CSV de sessões e séries, sem segredos nem identificadores internos desnecessários. | Esquema e integração. | Exportação sempre acessível, inclusive no fluxo de saída. |
| T7.3 | Importação: validação de versão e esquema antes de escrever, prévia e resumo, confirmação, inserção transacional com remapeamento de IDs, sem sobrescrever. | Integração e E2E de ida e volta entre duas contas. | Arquivo inválido aborta antes de qualquer escrita, explicando versão ou campo. |
| T7.4 | Exclusão de conta: explicação das consequências, oferta de exportação, reautenticação, janela de 7 dias para desistir, expurgo e confirmação por e-mail. | E2E e job de expurgo. | Dados removidos do banco após a janela. |
| T7.5 | Manifesto, ícones, instalação, aviso de nova versão que nunca interrompe treino ativo, Wake Lock e vibração com *fallback*. | E2E; Lighthouse PWA. | Experiência no navegador continua completa sem instalar. |
| T7.6 | Página Sobre: versão, changelog, termos, privacidade e créditos. | E2E. | Créditos dos dois autores visíveis. |

### E8 — Landing, legal, planos e entitlements (`v0.9.0`)

**Objetivo.** Apresentação pública e base comercial, com escopo da V1 completo ao final.
**Dependências.** E7.

| ID | Tarefa | Testes | Pronto quando |
| --- | --- | --- | --- |
| T8.1 | Entitlements: tabelas, registro de *features*, `can()`, componente `Gate`, página de planos objetiva (sem preço enquanto não definido). | Unidade e banco. | Nenhuma condicional de plano espalhada pela UI. |
| T8.2 | Landing com telas reais capturadas de uma conta de demonstração semeada; seções: registro, progressão, PRs e analytics, confiabilidade e PWA, planos. Sem depoimentos, logos ou números inventados. | Visual; Lighthouse; axe. | LCP dentro da meta; CTA visível no mobile sem ocupar a tela. |
| T8.3 | Termos de uso e Política de Privacidade (LGPD): controlador, finalidades, bases legais, retenção, direitos do titular, contato. | Revisão. | Textos revisados por responsável jurídico (A-06). Este plano não é aconselhamento jurídico. |
| T8.4 | SEO básico, Open Graph, `robots` e `sitemap` (ainda `noindex`), páginas 404 e 500. | Verificação automática. | Metadados coerentes. |
| T8.5 | **Gate G-02**: se a oferta comercial estiver definida, integrar billing em `src/billing` com webhooks idempotentes. Se não, registrar a decisão e lançar com todos os recursos liberados. | Integração com ambiente de teste do provedor. | Decisão documentada em ADR. |

**Aceite.** Escopo essencial da V1 completo; a partir daqui, nenhuma funcionalidade estrutural nova.

### E9 — Beta (`v1.0.0-beta.N`)

**Objetivo.** Qualidade, não funcionalidade.
**Dependências.** E8, P-04.

Atividades: auditoria visual completa (checklist do Apêndice C em todas as telas); auditoria de acessibilidade (axe mais passagem manual com teclado, NVDA, VoiceOver e TalkBack nos fluxos essenciais); performance (Lighthouse CI e perfis em dispositivo intermediário); revisão de segurança (ASVS nível 2 completo, fuzzing de autorização, dependências, cabeçalhos); compatibilidade (Chrome, Edge, Firefox, Safari iOS e Android); sessões exploratórias com caos de rede; **ensaio de restauração de backup** e **ensaio de rollback**; teste de carga de sincronização e analytics; documentação operacional. Triagem de defeitos em P0 a P3.
**Saída.** Zero P0 e P1; P2 com decisão registrada.

### E10 — Candidato a lançamento (`v1.0.0-rc.N`)

Congelamento: somente correções. Regressão completa, revisão final de copy e de documentos legais, verificação de domínio, e-mail e monitoramento em produção.
**Saída.** Todos os critérios do §20 do Documento Mestre atendidos.

### E11 — Lançamento (`v1.0.0`)

Remoção de `noindex`, domínio de produção, comunicação, `CHANGELOG.md`, release `v1.0.0` como *latest*. Verificação de Core Web Vitals de campo nas quatro semanas seguintes (C-15).

---

## 11. Contradições, ambiguidades e pontos a validar

| ID | Ponto | Resolução adotada |
| --- | --- | --- |
| C-01 | "Série válida" para recordes não está definida de forma única (§5.7, §8.1 e §8.4 divergem sobre `drop` e falha). | Definição da §6 deste plano. `drop` entra em volume, não em recorde de carga; `failed` entra em volume e recordes, mas não em progressão. **Validar com os autores.** |
| C-02 | Volume de exercício sem carga externa (§8.2). | Peso corporal não recebe carga inventada: entram séries e repetições, fora do volume em kg. Exercícios com lastro usam a carga adicionada. |
| C-03 | "Exportações avançadas" no Pro (§4.1) versus exportação sempre acessível (§4.2, §7.11). | Exportação JSON completa e CSV completo são sempre gratuitas. "Avançadas" significa recortes e formatos adicionais futuros. |
| C-04 | Analytics exige entitlement (Apêndice A) mas o Free inclui dashboard e PRs básicos; o que é "avançado" não está fixado. | A infraestrutura nasce na E8; a V1.0.0 lança com tudo liberado se a oferta comercial não estiver definida (gate G-02). |
| C-05 | Landing deve ter seção de planos (§7.1) mas preço não pode ser congelado (§4.1). | A seção descreve diferenças objetivas sem preços até a definição. |
| C-06 | Exclusão lógica de sessão (§5.6) versus exclusão de dados exigida pela LGPD (§14.2) versus backups. | Retenção de 30 dias para exclusão lógica; expurgo após janela de exclusão de conta; política de privacidade declara retenção em backups. |
| C-07 | Screenshots por etapa (§19.4) pesam no repositório. | Evidências como assets da release; no repositório ficam só as linhas de base de regressão visual. |
| C-08 | O Documento Mestre nomeia Geist e Lucide (§11) mas afirma não impor stack. | Tratados como contrato visual, não como stack; ambos têm licenças permissivas. |
| C-09 | Verde reservado a sucesso (§11.3), mas PR é um resultado positivo. | PR usa o *accent* e texto, não verde. Verde fica para confirmações de sucesso. |
| C-10 | A instrução de só fazer push de estado aprovado conflita com ter cópia remota durante a etapa. | Adotada a regra literal: push apenas ao fim da etapa, com gates aprovados. Alternativa a aprovar (A-03): permitir push de branch `stage/*` por tarefa aprovada, mantendo `main` somente com etapas completas. |
| C-11 | Core Web Vitals p75 de campo (§2.3) é impossível antes de haver tráfego. | O gate de pré-lançamento usa orçamento de laboratório; o campo é verificado após o lançamento. |
| C-12 | Tolerância offline plena em iOS Safari tem limite de plataforma (armazenamento pode ser removido). | Limite documentado e mitigado (§5.4). |
| C-13 | Parte da stack escolhida (Next.js, Supabase, Dexie) coincide com a do projeto anterior, e o Documento Mestre proíbe reaproveitar arquitetura por inércia (Apêndice E.3). | Reuso de tecnologia não implica reuso de código nem de arquitetura. D-03 e D-08 foram justificados contra alternativas, de forma independente do legado, e o código antigo permanece fora do repositório. |

### Aprovações necessárias antes de iniciar a E0

| ID | Pergunta | Recomendação |
| --- | --- | --- |
| A-01 | Visibilidade do repositório e licença. | Público, com aviso de "todos os direitos reservados" no README até a oferta comercial ser definida. |
| A-02 | Aceitar a stack das decisões D-01 a D-22. | Aceitar. |
| A-03 | Política de push (C-10). | Regra literal (push só ao fim da etapa). |
| A-04 | Janela de exclusão de conta de 7 dias (T7.4). | Aceitar. |
| A-05 | Direção do *accent* (azul ultramar) e fonte Geist. | Aceitar; validação final na E1. |
| A-06 | Quem revisará os textos legais. | Responsável jurídico indicado pelos autores. |
| A-07 | Instalar Docker Desktop (P-02) e criar contas (P-03). | Antes da E2. |

---

## 12. Riscos

| ID | Risco | Impacto | Mitigação |
| --- | --- | --- | --- |
| R-01 | Compatibilidade do TypeScript 7 com ferramentas de lint. | Atraso na E0. | Verificação em T0.2 e plano B na linha 6.x. |
| R-02 | Service Worker incompatível com o bundler do Next. | Atraso na E4. | Spike inicial e SW compilado à parte. |
| R-03 | Perda ou duplicação de dados na sincronização. | Perda de confiança. | Snapshot idempotente, conflito sem descarte, suíte de resiliência obrigatória. |
| R-04 | Vazamento entre usuários por cache compartilhado do framework. | Crítico. | `private, no-store` em rotas autenticadas e teste de cabeçalho em CI. |
| R-05 | RLS lenta em consultas de analytics. | UI lenta. | `(select auth.uid())`, índices por `owner_id`, medição na E6, gatilho de materialização. |
| R-06 | Divergência entre cálculo em TypeScript e em SQL. | Recordes errados. | Testes de paridade bloqueantes. |
| R-07 | Deriva visual entre etapas. | Produto parece colagem. | Tokens obrigatórios, salvaguardas automáticas, revisão por etapa. |
| R-08 | Entregabilidade de e-mail de verificação. | Cadastros bloqueados. | SMTP próprio, SPF/DKIM/DMARC, teste de entrega no beta. |
| R-09 | Capacidade de duas pessoas versus escopo. | V1 não chega ao beta. | V1 fechada, backlog explícito, etapas pequenas e demonstráveis. |
| R-10 | Custo recorrente antes de receita. | Pressão financeira. | Planos gratuitos até o beta; pagos apenas para produção. |

---

## 13. Decisões abertas do Documento Mestre (§21.3)

| Decisão aberta | Resposta deste plano |
| --- | --- |
| Tecnologia de PWA e offline, limites de cache, atualização, recuperação de versão | D-08, D-09, §5.4. |
| Billing, provedor e entitlements | D-18, gate G-02; provedor decidido apenas quando a oferta existir. |
| Monitoramento de erros e política de dados sensíveis | D-17. |
| Recordes e métricas derivadas: sob demanda, materializados ou híbrido | D-07: sob demanda com views e paridade, gatilho de materialização medido. |
| Versionamento e compatibilidade de exportações | Formato `mypr.export.v<N>`, migração entre versões na importação, rejeição explícita de versões desconhecidas. |
| Catálogo inicial de exercícios, *seed* e manutenção | D-19. |
| Política final de conflito entre dispositivos | §5.4: nunca descartar, cópia recuperável por 30 dias, escolha do usuário. |

---

## 14. Rastreabilidade

| Seção do Documento Mestre | Onde é atendida |
| --- | --- |
| §5.1 Conta, autenticação e sessão | D-04 a D-06, E2 |
| §5.2 Onboarding | T2.6, T3.6 |
| §5.3 Biblioteca de exercícios | D-19, T3.1, T3.2 |
| §5.4 Rotinas e templates | T3.3 a T3.5, *snapshots* na §6 |
| §5.5 Treino ao vivo | E4 |
| §5.6 Histórico | T5.1, T5.2 |
| §5.7 PRs e recordes | D-07, T4.1, T5.3 |
| §5.8 Dashboard | T6.1 |
| §5.9 Analytics | T6.2 a T6.4 |
| §5.10 Importação, exportação e backup | T7.2, T7.3 |
| §5.11 Configurações | T7.1, T7.6 |
| §6 Navegação | T1.5 |
| §7.1 Landing | T8.2 |
| §8 Regras de negócio | T4.1, T5.5, D-20 |
| §9 Dados e sincronização | §5.4, §6, D-08 |
| §10 e §11 Engenharia e Design System | §4, §5, §7, E1 |
| §12 Motion | D-14, T1.1 |
| §13 Responsividade e acessibilidade | §7.1, matriz de gates |
| §14 Segurança e privacidade | D-04 a D-06, D-22, T2.8, T8.3 |
| §15 Performance e PWA | D-09, T6.4, T7.5 |
| §16 Testes | D-15, §8 |
| §17 Observabilidade | D-17 |
| §18 e §19 Git, etapas e releases | §2, §3, §10 |
| §20 Definition of Done | §8, E10 |
| §21 Riscos e decisões abertas | §12, §13 |
