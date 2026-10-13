# Modelo de ameaças

Modelo curto no formato STRIDE, mantido junto com o mapeamento ASVS (`docs/security/asvs.md`). Criado na E2 (`v0.3.0`) e revisado a cada etapa que acrescente dados ou superfícies novas; a revisão completa está prevista para a E9.

## O que protegemos

- Credenciais e sessões das contas.
- Dados pessoais: e-mail, nome de exibição, preferências e fuso horário.
- Dados de treino (a partir da E3): rotinas, sessões, séries, recordes. Não são dados de saúde no sentido clínico, mas revelam rotina e hábitos.
- Disponibilidade do registro de treino durante a sessão na academia.

## Componentes e fronteiras de confiança

```
Navegador ──HTTPS──▶ Aplicação Next.js (Vercel) ──HTTPS──▶ Supabase (Auth + Postgres com RLS)
    │                       │
    └──▶ Cloudflare Turnstile └──HTTPS──▶ Cloudflare siteverify
```

1. **Navegador → aplicação.** Tudo que vem do navegador é não confiável. O navegador nunca fala com o banco (decisão D-04).
2. **Aplicação → Supabase.** A aplicação usa a chave publicável e o token da pessoa; o banco decide o que cada conta vê (RLS). A chave de serviço não é usada por nenhuma rota.
3. **Supabase → e-mail.** Links de conta saem do provedor de autenticação para a caixa da pessoa.
4. **Terceiros no navegador.** Só o Turnstile, nas telas de acesso.

## Ameaças e controles

| Categoria | Ameaça | Controles | Evidência |
| --- | --- | --- | --- |
| Falsificação (S) | Tentativas de senha em massa ou reaproveitamento de senhas vazadas | Limites por e-mail e endereço, Turnstile após 3 falhas, mensagens neutras; checagem de senhas vazadas no plano Pro | `src/server/rate-limit.ts`, `e2e/auth.spec.ts` |
| Falsificação (S) | Sessão roubada continua válida após a pessoa sair | Sessão confirmada no servidor a cada requisição; sair e trocar a senha revogam as sessões | `src/proxy.ts`, `e2e/account.spec.ts` |
| Falsificação (S) | Link de e-mail consumido por terceiros ou reutilizado | Link de uso único, válido por 10 minutos, que só age ao pressionar um botão | `src/app/(auth)/auth/confirm`, `e2e/auth.spec.ts` |
| Falsificação (S) | Envio de formulário a partir de outro site (CSRF) | Server Actions verificam a origem; cookies `SameSite=Lax`; mutações só por POST | Next.js, `src/lib/cookies.ts` |
| Adulteração (T) | Alterar `owner_id`, datas ou colunas não editáveis | Concessão de atualização coluna a coluna; RLS com `with check` | `supabase/tests/profiles.test.ts` |
| Adulteração (T) | Injeção de script na página (XSS) | React escapa a saída; CSP com nonce e `strict-dynamic`; nenhum HTML vindo do usuário | `src/lib/csp.ts`, `e2e/auth.spec.ts` |
| Adulteração (T) | Redirecionamento para site malicioso após o login | Destino só da lista de caminhos internos | `src/lib/redirect.ts` |
| Repúdio (R) | Ação da conta sem rastro | O provedor registra eventos de autenticação; registro da aplicação chega com o Sentry (E6); correções de treino terão log próprio (E5) | plano, §6 |
| Divulgação (I) | Uma conta lê dados de outra (IDOR) | RLS forçada em toda tabela privada; teste-meta; testes negativos com duas personas | `supabase/tests/` |
| Divulgação (I) | Descobrir se um e-mail tem conta (enumeração) | Respostas idênticas no cadastro, no login e na recuperação | `e2e/auth.spec.ts` |
| Divulgação (I) | Vazamento de detalhes internos em erros | Mensagens genéricas; nenhum código ou nome de provedor na interface | `src/features/auth/errors.ts` |
| Divulgação (I) | Página embutida em outro site (clickjacking) | `frame-ancestors 'none'` e `X-Frame-Options: DENY` | `src/lib/csp.ts`, `next.config.ts` |
| Divulgação (I) | Segredos no repositório ou no navegador | Segredos só em variáveis de ambiente do servidor; gitleaks no CI; nenhuma variável pública | `.env.example`, `ci.yml` |
| Negação de serviço (D) | Esgotar envios de e-mail ou o limite de outra pessoa | Limites por destinatário e endereço com chaves HMAC que só o servidor calcula | `supabase/tests/rate-limits.test.ts` |
| Negação de serviço (D) | Limites do provedor compartilhados por todas as pessoas, porque o servidor fala com o Supabase em nome de todas | Limitação própria antes de chegar ao provedor; conferir a configuração de limites por IP do projeto hospedado | `docs/security/accepted-risks.md` |
| Elevação de privilégio (E) | Função do banco com privilégio elevado chamada pela API | Teste-meta recusa funções elevadas não revisadas; as duas existentes validam entradas e só tocam a própria tabela | `supabase/tests/meta.test.ts` |
| Elevação de privilégio (E) | Acesso de visitante a tabelas | Nenhuma concessão implícita; teste-meta recusa qualquer acesso de `anon` | `supabase/migrations/20261013120000_base_conventions.sql` |

## Riscos em aberto

- Sem autenticação multifator (ASVS V6.3.3). Decisão pendente do titular.
- Checagem de senhas vazadas, prazo de inatividade e duração máxima da sessão dependem do plano Pro do Supabase.
- Registro de eventos de segurança da aplicação chega na E6.

Os detalhes e as decisões de aceite ficam em `docs/security/accepted-risks.md`.
