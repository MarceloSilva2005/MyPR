# 0003. Banco, acesso a dados e autorização

- Status: aceita
- Data: 07/10/2026
- Decisões do plano: D-03, D-04, D-05

## Contexto

Os dados são relacionais e agregados com frequência. O isolamento entre usuários precisa ser verificável e não pode depender da interface. O projeto anterior usava tecnologias semelhantes; esta decisão foi tomada de forma independente dele.

## Decisão

- PostgreSQL gerenciado pelo Supabase, na região de São Paulo, com migrações SQL versionadas no repositório.
- O navegador nunca acessa o banco diretamente. Server Components, Server Actions e Route Handlers acessam o banco com o token do próprio usuário, mantendo a RLS sempre ativa.
- A chave de serviço existe apenas em um módulo exclusivo do servidor, com lista fechada de quem pode importá-lo (exclusão de conta e expurgo agendado).
- Autorização em três camadas: proxy de rotas, identidade derivada do token validado no servidor e RLS em todas as tabelas privadas (`owner_id = (select auth.uid())`, com `FORCE ROW LEVEL SECURITY`).
- Chaves estrangeiras compostas `(owner_id, id)` impedem que um registro referencie dados de outra conta.
- Um teste de banco falha se qualquer tabela do esquema público não tiver RLS e política.

## Alternativas consideradas

- Neon com Drizzle e Better Auth: autenticação sob nosso código, ao custo de implementar e manter fluxos sensíveis.
- Firebase ou Convex: modelo menos adequado a agregações relacionais e à RLS como camada independente.
- PostgREST direto do navegador: menos código, mas amplia a superfície exposta e impede uma CSP restritiva.

## Consequências

- Dependência do serviço de autenticação do provedor. Mitigação: o esquema de domínio liga-se à conta por uma única coluna, e há procedimento de saída documentado quando necessário.
- Projetos gratuitos podem ser pausados por inatividade e não têm recuperação pontual; produção usa plano pago.
