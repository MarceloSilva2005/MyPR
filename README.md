# MyPR

Plataforma de acompanhamento de performance para musculação. Planeje rotinas, registre treinos com poucas ações, acompanhe sobrecarga progressiva e veja recordes pessoais e tendências com base em dados, não em impressão.

> MyPR: sua performance, registrada com precisão.

## Estado do projeto

O MyPR está em desenvolvimento e ainda não tem versão pública. Todas as versões `0.x` são pré-lançamentos e podem mudar sem aviso. A versão `1.0.0` será publicada somente depois de todos os critérios de qualidade do projeto serem atendidos.

O trabalho é dividido em etapas, e cada etapa termina com testes aprovados, commit, tag e uma release no GitHub.

| Etapa | Escopo                                        | Versão   | Situação  |
| ----- | --------------------------------------------- | -------- | --------- |
| E0    | Fundação do repositório, ferramentas e CI     | `v0.1.0` | Em curso  |
| E1    | Design System, navegação e estados            | `v0.2.0` | Planejada |
| E2    | Dados, autenticação e autorização             | `v0.3.0` | Planejada |
| E3    | Exercícios e rotinas                          | `v0.4.0` | Planejada |
| E4    | Treino ao vivo, persistência e retomada       | `v0.5.0` | Planejada |
| E5    | Histórico, recordes e progressão              | `v0.6.0` | Planejada |
| E6    | Dashboard e analytics                         | `v0.7.0` | Planejada |
| E7    | Configurações, importação, exportação e PWA   | `v0.8.0` | Planejada |
| E8    | Página pública, termos, planos e entitlements | `v0.9.0` | Planejada |
| E9    | Beta: auditoria de qualidade                  | `v1.0.0-beta.N` | Planejada |
| E10   | Candidato a lançamento: somente correções     | `v1.0.0-rc.N`   | Planejada |
| E11   | Lançamento público                            | `v1.0.0` | Planejada |

O detalhamento de cada etapa está em [docs/execution-plan.md](docs/execution-plan.md).

## O que o produto se propõe a fazer

- Registrar séries de carga e repetições durante o treino, com a última performance sempre visível.
- Sugerir progressão de carga com a justificativa explícita. O sistema recomenda, a pessoa decide.
- Detectar recordes de carga, de 1RM estimado e de volume, com fórmulas documentadas.
- Mostrar volume, frequência e tendência por exercício e por período.
- Manter o treino em andamento seguro contra recarregamentos, fechamento do navegador e falhas de conexão.
- Permitir exportar e importar os próprios dados.

## Como executar

Requisitos:

- Node.js 24 (versão em `.nvmrc`)
- pnpm 12

```bash
pnpm install
pnpm dev
```

A aplicação sobe em `http://localhost:3000`. As variáveis de ambiente estão descritas em `.env.example`.

### Scripts

| Comando             | Finalidade                                       |
| ------------------- | ------------------------------------------------ |
| `pnpm dev`          | Servidor de desenvolvimento                      |
| `pnpm build`        | Build de produção                                |
| `pnpm start`        | Servidor de produção (após o build)              |
| `pnpm lint`         | Análise estática e regras de camadas             |
| `pnpm typecheck`    | Verificação de tipos                             |
| `pnpm test`         | Testes de unidade e integração                   |
| `pnpm knip`         | Detecção de código e dependências sem uso        |
| `pnpm format:check` | Verificação de formatação                        |
| `pnpm check:guards` | Verificação de higiene do repositório            |

## Documentação

- [Plano de execução](docs/execution-plan.md): decisões técnicas, arquitetura, estratégia Git e etapas.
- [Decisões de arquitetura](docs/adr/README.md): registro das decisões e das alternativas consideradas.
- [Guia de contribuição](CONTRIBUTING.md)
- [Política de segurança](SECURITY.md)
- [Histórico de mudanças](CHANGELOG.md)

## Autores

- [MarceloSilva2005](https://github.com/MarceloSilva2005)
- [Felipe1dev](https://github.com/Felipe1dev)

## Direitos

Copyright 2026 MarceloSilva2005 e Felipe1dev. Todos os direitos reservados.

O código está público para consulta. Nenhuma licença de uso, cópia, modificação ou distribuição é concedida até que uma licença seja publicada neste repositório.
