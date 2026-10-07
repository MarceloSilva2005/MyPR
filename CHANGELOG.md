# Histórico de mudanças

Todas as mudanças relevantes do MyPR são registradas aqui. O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento segue o [SemVer](https://semver.org/lang/pt-BR/). As notas completas de cada versão estão em `docs/releases/`.

## [Não lançado]

## [0.1.0] - 2026-10-07

Fundação do projeto (etapa E0). Pré-lançamento. Notas completas em [docs/releases/v0.1.0.md](docs/releases/v0.1.0.md).

### Adicionado

- Repositório novo, sem histórico do projeto anterior.
- Aplicação Next.js mínima com página provisória, leitura validada de ambiente, endpoint de saúde e controle de indexação em tempo de execução.
- TypeScript estrito, ESLint com regras de camadas, Prettier, detecção de código morto, Vitest, commitlint e hooks locais.
- Verificação de higiene do repositório.
- Integração contínua, varredura de segredos, auditoria de dependências e workflow de release.
- README, guia de contribuição, política de segurança, registros de decisão de arquitetura e plano de execução.

### Corrigido

- Cabeçalho `noindex` fixado no build, agora definido a cada requisição.
- Regra de camadas que não detectava violações em arquivos TypeScript.
- Varredura de segredos incapaz de cobrir o primeiro push, agora complementada por execuções completas manuais e semanais.

[Não lançado]: https://github.com/MarceloSilva2005/MyPR/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/MarceloSilva2005/MyPR/releases/tag/v0.1.0
