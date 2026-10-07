# 0010. Catálogo de exercícios

- Status: aceita
- Data: 07/10/2026
- Decisões do plano: D-19

## Contexto

O catálogo oficial é compartilhado e somente leitura para usuários. O histórico não pode quebrar quando um exercício é renomeado, arquivado ou ganha novos aliases.

## Decisão

- Catálogo curado em PT-BR, entre 150 e 200 itens iniciais, mantido em arquivo versionado e carregado por migração idempotente.
- Cada exercício tem `slug` estável e um UUID determinístico derivado do `slug`, idêntico em todos os ambientes.
- Aliases ficam em metadados. A busca ignora acentos e caixa.
- Sessões guardam o nome do exercício como snapshot, de modo que renomear não altera o histórico.
- O conteúdo é próprio, sem copiar bases de terceiros.

## Alternativas consideradas

- Importar uma base pública: licenças e qualidade de tradução incertas.
- Começar com catálogo vazio: piora a ativação do usuário.

## Consequências

- Há trabalho editorial. A estratégia é cobrir os movimentos mais comuns primeiro e ampliar por novas migrações.
