# Política de segurança

## Como relatar uma vulnerabilidade

Não abra uma issue pública para falhas de segurança.

Use o relato privado do GitHub: na aba **Security** do repositório, escolha **Report a vulnerability**. O relato fica visível apenas para os mantenedores.

Inclua, sempre que possível:

- uma descrição do problema e do impacto;
- os passos para reproduzir;
- a versão ou o commit afetado;
- qualquer sugestão de correção.

## Prazos

Buscamos confirmar o recebimento em até 7 dias e informar o andamento da análise a cada etapa relevante. Quando a falha for confirmada, a correção é priorizada acima de qualquer trabalho de funcionalidade.

## Escopo

Enquanto o projeto estiver em pré-lançamento, apenas a branch `main` recebe correções de segurança.

São especialmente relevantes: acesso a dados de outro usuário, falhas de autenticação ou de gestão de sessão, exposição de segredos e perda silenciosa de dados de treino.

## Dados e segredos

Nenhum segredo é versionado neste repositório. O repositório usa verificação de segredos e proteção contra o envio de credenciais. Se você encontrar uma credencial exposta, relate pelo canal acima.
