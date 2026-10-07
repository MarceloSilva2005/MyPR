# Guia de contribuição

Este documento descreve como o trabalho é organizado no MyPR. A estratégia completa está na seção 3 do [plano de execução](docs/execution-plan.md).

## Idiomas

| Artefato                                         | Idioma |
| ------------------------------------------------ | ------ |
| Código, nomes de arquivos técnicos e símbolos    | Inglês |
| Comentários técnicos (somente quando necessário) | Inglês |
| Mensagens de commit e nomes de branches          | Inglês |
| Interface do produto                             | PT-BR  |
| README, documentação, changelog e releases       | PT-BR  |
| Issues e descrições de PR                        | PT-BR  |

Todo texto da interface fica em `src/content`, e não espalhado pelos componentes.

## Ambiente

Veja o README. Depois de `pnpm install`, os hooks do Git são instalados automaticamente e passam a validar mensagens de commit, formatação, lint e higiene do repositório.

## Branches

- `main` está sempre em estado aprovado. Só recebe etapas completas, por PR.
- `stage/<nn>-<slug>`: trabalho de uma etapa, por exemplo `stage/04-live-workout`.
- `feat/…`, `fix/…`, `chore/…`: trabalho paralelo e curto.
- `hotfix/…`: correção em versão já publicada.

## Commits

Formato [Conventional Commits](https://www.conventionalcommits.org/pt-br/), em inglês, no imperativo, com assunto de até 72 caracteres:

```
tipo(escopo): assunto
```

- Tipos: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`, `revert`.
- Escopos: `auth`, `db`, `ds`, `shell`, `exercises`, `routines`, `workout`, `sync`, `history`, `records`, `analytics`, `settings`, `pwa`, `landing`, `security`, `a11y`, `deps`, `deps-dev`, `release`, `repo`, `tooling`.
- O assunto descreve a mudança concreta. Mensagens vagas (`update`, `changes`, `wip`) são recusadas.
- Um commit por tarefa verificável. Nenhum commit pode quebrar lint, tipos ou testes.

Exemplos:

```
feat(auth): implement email verification flow
fix(sync): prevent duplicate set records on retry
test(records): cover retroactive record recalculation
```

## Pull requests

O PR traz o checklist de Definition of Done e as evidências da etapa. Os checks obrigatórios precisam estar verdes antes da integração. A integração é feita por rebase merge, para manter o histórico linear e preservar os commits de cada tarefa.

## Definition of Done

Uma etapa só está concluída quando existem: implementação, critérios de aceite aprovados, testes passando, build de produção, commit, push, tag e GitHub Release com notas em PT-BR.

Antes de fechar uma etapa com interface, também é obrigatória a revisão visual: hierarquia, consistência entre telas, excesso de elementos, repetição de padrões e microinterações sem função.

## Releases

As tags seguem [SemVer](https://semver.org/lang/pt-BR/): `v0.N.0` por etapa, `v1.0.0-beta.N`, `v1.0.0-rc.N` e `v1.0.0`. A release é criada pelo workflow de release, e somente depois de todos os checks passarem. As notas ficam em `docs/releases/<tag>.md`.
