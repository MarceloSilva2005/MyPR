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

### Sem autenticação multifator (ASVS V6.3.3)

| Campo | Valor |
| --- | --- |
| Situação | **Decisão pendente do titular.** Não está aceito. |
| Requisito | O nível 2 do ASVS 5.0 pede multifator (ou combinação de fatores) para acessar a aplicação. |
| Estado atual | Só e-mail e senha. O plano não previa multifator na V1. |
| Opções | (a) Oferecer TOTP opcional pelo Supabase Auth numa etapa futura, com códigos de recuperação. (b) Aceitar o risco para a V1, justificado pelo tipo de dado (treino, sem dado financeiro ou clínico) e pelos controles já presentes. |
| Registrado em | 13/10/2026 |
| Revisão | Antes do beta. |

### Recursos de segurança do plano Pro do Supabase

| Campo | Valor |
| --- | --- |
| Situação | Pendente da criação dos projetos (P-03). |
| O que depende do plano | Checagem de senhas vazadas (ASVS V6.2.4 e V6.2.12), encerramento por inatividade e duração máxima da sessão (V7.3.1 e V7.3.2). |
| Configuração proposta | Senhas vazadas ativada; inatividade de 30 dias; duração máxima de 90 dias. Justificativa em `docs/security/asvs.md`, seção "Sessões". |
| Enquanto isso | Senhas com palavras de contexto são recusadas; ações sensíveis exigem a senha atual; sair e trocar a senha revogam as sessões. |
| Registrado em | 13/10/2026 |
| Revisão | Na criação dos projetos `staging` e `production`. |

### Limites do provedor de autenticação compartilhados

| Campo | Valor |
| --- | --- |
| Situação | Mitigado; conferir na criação dos projetos. |
| Risco | O servidor fala com o Supabase em nome de todas as pessoas. Se o projeto hospedado limitar por endereço IP, todas dividem o mesmo limite, e uma pessoa mal-intencionada pode esgotá-lo. |
| Mitigação | Limitação própria por e-mail e por endereço real da pessoa antes de chegar ao provedor; Turnstile no cadastro, na recuperação e após falhas de login. |
| Ação pendente | Conferir os limites do Auth no projeto hospedado e, se possível, repassar o endereço real da pessoa ao provedor. |
| Registrado em | 13/10/2026 |
| Revisão | Na criação dos projetos. |

### Senhas limitadas a 72 bytes (ASVS V6.2.9)

| Campo | Valor |
| --- | --- |
| Situação | Aceito. |
| Motivo | O Supabase Auth usa bcrypt, que considera só os primeiros 72 bytes. A aplicação recusa senhas maiores, em vez de truncá-las em silêncio. |
| Efeito | Senhas de 64 caracteres sem acento são aceitas; com muitos caracteres acentuados, o limite efetivo fica abaixo de 64. |
| Registrado em | 13/10/2026 |
| Revisão | Se o provedor passar a oferecer outro algoritmo de senha. |

### Turnstile, de terceiro, nas telas de acesso

| Campo | Valor |
| --- | --- |
| Situação | Aceito. |
| Risco | Nas telas de cadastro, recuperação e login após falhas, o navegador carrega um script da Cloudflare, que recebe o endereço IP e sinais do navegador. |
| Mitigação | Carregado só nessas telas e só quando aparecem; nenhuma outra página carrega script de terceiros. A política de privacidade (E8) informa o uso. |
| Registrado em | 13/10/2026 |
| Revisão | Na redação da política de privacidade (E8). |
