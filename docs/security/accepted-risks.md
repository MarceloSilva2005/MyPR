# Riscos aceitos

Registro de achados conhecidos que não bloqueiam uma entrega, com justificativa e condição de revisão. Todo item tem data de revisão; um item sem correção disponível é reavaliado a cada atualização de dependências.

## Política de auditoria de dependências

- O CI **bloqueia** a integração quando a auditoria das dependências de **produção** encontra vulnerabilidade de severidade alta ou crítica.
- A auditoria das dependências de **desenvolvimento** roda e é reportada, mas não bloqueia, pois essas dependências não chegam ao ambiente de execução. Achados de severidade alta ou crítica entram neste registro.

## Itens em aberto

### GHSA-vfj7-8cjw-p6xm: `braces` (negação de serviço por padrões muito aninhados)

| Campo               | Valor                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| Severidade          | Alta                                                                                           |
| Versões afetadas    | `braces` até 3.0.3 (sem versão corrigida na data do registro)                                  |
| Como chega ao projeto | Somente por dependências de desenvolvimento: `eslint-plugin-boundaries` e `@next/eslint-plugin-next` |
| Exposição           | Nenhuma em produção. Os padrões de glob usados vêm de arquivos de configuração do repositório, nunca de entrada de usuário. |
| Registrado em       | 07/10/2026                                                                                     |
| Revisão             | A cada atualização de dependências, ou quando uma versão corrigida for publicada               |
