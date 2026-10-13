# Verificação de segurança: OWASP ASVS 5.0, nível 2

Este documento mapeia, requisito por requisito, como o MyPR atende ao [OWASP Application Security Verification Standard 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0) nos níveis 1 e 2, com a evidência de cada resposta. A referência é o plano de execução (§5.3 e tarefa T2.8). Os identificadores seguem o texto oficial, publicado sob licença CC BY-SA 4.0; consulte-o para a redação completa de cada requisito.

- Versão avaliada: `v0.3.0` (etapa E2). Revisão completa prevista para a E9.
- Escopo: aplicação web, servidor (Next.js na Vercel) e banco (Supabase). O que é responsabilidade do provedor aparece como "Provedor/implantação" e deve ser conferido na criação dos projetos e na primeira implantação.
- Atualize este arquivo sempre que uma mudança alterar a resposta de um requisito.

## Resumo

253 requisitos dos níveis 1 e 2.

| Situação | Quantidade |
| --- | --- |
| Atende | 129 |
| Parcial | 8 |
| Planejado | 20 |
| Provedor/implantação | 24 |
| Não se aplica | 71 |
| Lacuna | 1 |

Legenda: **Atende** tem evidência no código, nos testes ou na configuração versionada. **Parcial** atende em parte, e a observação diz o que falta. **Planejado** tem etapa definida no plano. **Provedor/implantação** depende da configuração do Supabase, da Vercel ou da Cloudflare. **Não se aplica** traz o motivo. **Lacuna** não está atendido nem planejado e depende de decisão do titular.

## Decisões de segurança

### Autenticação

- Um único caminho: e-mail e senha no Supabase Auth, com verificação de e-mail obrigatória antes do primeiro acesso e recuperação por link. Não há login social, magic link, SMS nem multifator na V1.
- Senhas: de 8 a 72 bytes (limite do bcrypt do provedor), sem regras de composição, recusando o nome do produto, o início do e-mail e palavras do nome de exibição (`src/domain/password.ts`). A checagem contra senhas vazadas depende do plano Pro do Supabase.
- Links enviados por e-mail valem 10 minutos e uma única vez. Abrir o link não faz nada: a pessoa confirma num botão, para que verificadores de link dos provedores de e-mail não consumam o token.
- Ações sensíveis (trocar a senha, encerrar outras sessões) confirmam a senha atual numa sessão temporária recém-criada (`src/server/reauth.ts`).
- Respostas públicas são idênticas para contas existentes e inexistentes: cadastro, login e recuperação.

### Sessões

- Token de acesso válido por 1 hora; renovação com rotação de token (`supabase/config.toml`). Cookies `HttpOnly`, `SameSite=Lax` e, em produção, `Secure` com prefixo `__Host-`.
- A sessão é confirmada no servidor de autenticação a cada requisição, então uma sessão encerrada em outro dispositivo deixa de valer na navegação seguinte.
- Política proposta para os projetos hospedados (plano Pro): encerrar por inatividade após 30 dias e exigir novo login após 90 dias. Justificativa: o produto é usado no celular durante o treino, os dados são de baixo risco financeiro, e logins frequentes atrapalham o registro. Ações sensíveis já exigem a senha atual.
- Sessões simultâneas: sem limite. Em Configurações a pessoa encerra as sessões nos outros dispositivos; trocar a senha também as encerra.

### Autorização

- Três camadas (decisão D-05): o proxy exige sessão em `/app`; o servidor deriva a identidade do token, nunca do formulário; o banco aplica RLS forçada com `owner_id = auth.uid()` em toda tabela privada.
- Colunas que a pessoa pode alterar são concedidas uma a uma; o restante só muda por migração.
- O teste-meta (`supabase/tests/meta.test.ts`) falha se alguma tabela em `public` não tiver RLS forçada, não tiver política, der acesso a visitantes ou não tiver `owner_id`. Também falha se uma visão contornar a RLS ou se uma função com privilégio elevado não estiver revisada.

### Defesas contra automação

Limites aplicados no Postgres, por janela fixa, com chaves HMAC que não guardam IP nem e-mail (`src/server/rate-limit.ts`):

| Ação | Limite |
| --- | --- |
| Login, por endereço | 20 a cada 5 minutos |
| Login, por e-mail | 10 a cada 15 minutos |
| Login com falha, por e-mail ou endereço | a partir de 3 em 15 minutos, exige o Turnstile |
| Cadastro, por endereço | 5 por hora |
| E-mails de confirmação e recuperação, por endereço | 5 a cada 15 minutos |
| E-mails de confirmação e recuperação, por destinatário | 3 por hora |
| Confirmação de senha em ações sensíveis, por conta | 5 a cada 15 minutos |

O cadastro e a recuperação sempre exigem o Cloudflare Turnstile, validado no servidor e vinculado à ação. O provedor de autenticação aplica seus próprios limites. Se o limitador falhar, a requisição segue (os limites do provedor continuam valendo); se a verificação da Cloudflare falhar, a requisição é recusada.

Funções custosas hoje: envio de e-mails, login (hash de senha) e verificação humana. A sincronização de treinos (E4) e o Analytics (E6) entram nesta lista quando existirem.

### Criptografia

| Uso | Algoritmo | Chave ou origem |
| --- | --- | --- |
| Chaves de limitação de taxa | HMAC-SHA-256 | `RATE_LIMIT_SECRET`, pelo menos 32 caracteres |
| Nonce da CSP | 128 bits de `crypto.getRandomValues` | gerado por requisição |
| Senhas | bcrypt | Supabase Auth |
| Tokens de sessão | assinatura definida pelo projeto Supabase (preferir chaves assimétricas) | Supabase Auth |
| Transporte | TLS 1.2 ou 1.3 | Vercel e Supabase |

Política de chaves: segredos ficam apenas nas variáveis de ambiente cifradas da Vercel e do GitHub Actions, nunca no repositório (varredura do gitleaks no CI). `RATE_LIMIT_SECRET` é trocado uma vez por ano ou imediatamente em caso de suspeita; a troca só zera os contadores em andamento. As chaves do Turnstile e do Supabase são trocadas pelos painéis dos provedores, com a mesma regra. As chaves de teste do Turnstile são recusadas quando `APP_ENV=production`.

### Comunicações

| Origem | Destino | Finalidade | Autenticação |
| --- | --- | --- | --- |
| Navegador | a própria aplicação | páginas e ações | cookie de sessão |
| Navegador | `challenges.cloudflare.com` | Turnstile, só nas telas de acesso | nenhuma |
| Servidor | API do Supabase (`SUPABASE_URL`) | dados e autenticação | chave publicável e token da pessoa |
| Servidor | `challenges.cloudflare.com/turnstile/v0/siteverify` | validar o Turnstile | `TURNSTILE_SECRET_KEY` |
| Supabase Auth | provedor de e-mail transacional | e-mails de conta | configurado no projeto Supabase |

### Dados

| Nível | Dados | Requisitos |
| --- | --- | --- |
| Credenciais | senha, tokens de sessão e de link | nunca registrados, nunca na URL (exceto o token de link, de uso único), só em cookies `HttpOnly` |
| Pessoais | e-mail, nome de exibição, preferências, fuso horário | acesso só da própria conta (RLS), fora do armazenamento do navegador, exportáveis e apagáveis (E7) |
| Treino | sessões, séries, rotinas (a partir da E3) | acesso só da própria conta; durante o treino há uma cópia no IndexedDB do aparelho, apagada ao sair (E4) |
| Técnicos | contadores de limitação | chaves HMAC sem dado pessoal, expiram em um dia |

### Dependências

Dependabot abre atualizações semanais; a auditoria de dependências de produção bloqueia o CI em severidade alta. Prazos: crítica em até 7 dias, alta em até 14, média em até 30, baixa na próxima atualização regular. Riscos aceitos ficam em `docs/security/accepted-risks.md`.

## Pendências

Requisitos que dependem do titular, do provedor ou da implantação:

- **V2.1.1** (Parcial): As regras estão nos esquemas Zod (`src/schemas`) e nas restrições das migrações. Um documento consolidado de regras de dados vem com a E9.
- **V2.1.2** (Parcial): Mesma situação do V2.1.1; combinações relevantes hoje são poucas (passo do onboarding, fuso horário).
- **V4.1.2** (Provedor/implantação): O redirecionamento de HTTP para HTTPS é feito pela Vercel. Verificar ao configurar o domínio.
- **V4.1.3** (Provedor/implantação): O endereço do cliente vem de `x-real-ip`, que a Vercel sobrescreve. Verificar na primeira implantação.
- **V4.2.1** (Provedor/implantação): Delimitação de mensagens HTTP feita pela plataforma (Vercel).
- **V6.2.4** (Provedor/implantação): A checagem contra senhas comuns e vazadas é a proteção de senhas vazadas do Supabase, disponível no plano Pro. Ativar na criação dos projetos; o ambiente local não a oferece.
- **V6.2.9** (Parcial): O provedor usa bcrypt, que limita a senha a 72 bytes. Senhas de 64 caracteres são aceitas se tiverem até 72 bytes; muitos acentos reduzem o limite.
- **V6.2.12** (Provedor/implantação): Ver V6.2.4.
- **V6.3.3** (Lacuna): Não há autenticação multifator. Decisão pendente do titular; ver `docs/security/accepted-risks.md`.
- **V6.5.2** (Provedor/implantação): Tokens de link guardados pelo provedor de autenticação.
- **V6.5.3** (Provedor/implantação): Tokens gerados pelo provedor de autenticação.
- **V7.1.1** (Parcial): Política em "Sessões": token de acesso de 1 hora, renovação com rotação, inatividade de 30 dias e duração máxima de 90 dias. Os dois últimos exigem o plano Pro do Supabase; configurar na criação dos projetos.
- **V7.2.3** (Provedor/implantação): Tokens de renovação gerados pelo provedor.
- **V7.3.1** (Provedor/implantação): Ver V7.1.1.
- **V7.3.2** (Provedor/implantação): Ver V7.1.1.
- **V7.4.5** (Provedor/implantação): Não há painel administrativo no produto; administradores encerram sessões pelo painel do Supabase.
- **V7.5.2** (Parcial): É possível encerrar as outras sessões com a senha atual. Ver a lista de sessões ativas fica para Configurações (E7).
- **V9.1.2** (Provedor/implantação): Algoritmos de assinatura definidos pelo provedor; preferir chaves assimétricas na criação dos projetos.
- **V9.2.2** (Provedor/implantação): Só tokens de acesso do provedor são aceitos como sessão.
- **V9.2.3** (Provedor/implantação): Público (`aud`) verificado pelo provedor.
- **V9.2.4** (Provedor/implantação): Ver V9.2.3.
- **V11.4.2** (Provedor/implantação): Senhas guardadas com bcrypt pelo provedor.
- **V11.6.1** (Provedor/implantação): Assinatura de tokens feita pelo provedor.
- **V12.1.1** (Provedor/implantação): TLS 1.2 e 1.3 configurados pela Vercel e pelo Supabase.
- **V12.1.2** (Provedor/implantação): Ver V12.1.1.
- **V12.2.2** (Provedor/implantação): Certificados públicos emitidos pela Vercel.
- **V12.3.4** (Provedor/implantação): Certificados confiáveis do provedor.
- **V13.2.5** (Parcial): A lista de destinos é garantida pelo código, sem um bloqueio de rede na plataforma.
- **V13.3.1** (Provedor/implantação): Segredos guardados nas variáveis de ambiente cifradas da Vercel e do GitHub Actions.
- **V14.2.4** (Parcial): Retenção e exclusão chegam com a E7, e o registro de eventos com a E6.
- **V15.3.4** (Provedor/implantação): Ver V4.1.3.
- **V16.3.1** (Parcial): O provedor registra entradas e falhas de autenticação; o registro da aplicação chega na E6.
- **V16.4.2** (Provedor/implantação): Registros do provedor protegidos pelo próprio provedor.

## Requisitos

### V1 — Codificação e sanitização

| Requisito | Nível | Situação | Evidência ou observação |
| --- | --- | --- | --- |
| V1.1.1 | 2 | Atende | O framework decodifica parâmetros e formulários uma única vez; a validação com Zod vem depois (`src/schemas`). |
| V1.1.2 | 2 | Atende | O React escapa a saída na renderização; consultas ao banco são parametrizadas pelo PostgREST. |
| V1.2.1 | 1 | Atende | Toda saída HTML passa pelo React. O único `dangerouslySetInnerHTML` é o script de tema, uma string fixa (`src/ds/theme.ts`). |
| V1.2.2 | 1 | Atende | URLs são montadas com `URL` e `URLSearchParams` (`src/proxy.ts`, `src/lib/redirect.ts`); só caminhos internos são aceitos. |
| V1.2.3 | 1 | Atende | Não há JavaScript gerado com dados; respostas JSON usam `Response.json` e o protocolo do React. |
| V1.2.4 | 1 | Atende | Acesso a dados pelo cliente Supabase (consultas parametrizadas) e funções SQL com parâmetros tipados. |
| V1.2.5 | 1 | Não se aplica | A aplicação não executa comandos do sistema operacional. |
| V1.2.6 | 2 | Não se aplica | Sem LDAP. |
| V1.2.7 | 2 | Não se aplica | Sem XPath. |
| V1.2.8 | 2 | Não se aplica | Sem LaTeX. |
| V1.2.9 | 2 | Atende | Nenhuma expressão regular é montada com entrada do usuário; a busca compara texto normalizado (`src/lib/text.ts`). |
| V1.3.1 | 1 | Não se aplica | Não há entrada de HTML rico. |
| V1.3.2 | 1 | Atende | Sem `eval` ou execução dinâmica; a CSP de produção não permite `unsafe-eval` (`src/lib/csp.ts`, testes). |
| V1.3.3 | 2 | Atende | Entradas têm tamanho e conjunto de valores limitados no servidor (Zod) e no banco (restrições `check`). |
| V1.3.4 | 2 | Não se aplica | Não há envio de SVG pelo usuário. |
| V1.3.5 | 2 | Não se aplica | Não há Markdown, CSS ou templates enviados pelo usuário; notas serão texto puro (E4). |
| V1.3.6 | 2 | Atende | O servidor só chama endereços fixos: a API do Supabase configurada e o `siteverify` da Cloudflare. Nada vem do usuário. |
| V1.3.7 | 2 | Atende | Os modelos de e-mail são arquivos fixos (`supabase/templates`); dados entram só pelas variáveis do provedor. |
| V1.3.8 | 2 | Não se aplica | Sem JNDI. |
| V1.3.9 | 2 | Não se aplica | Sem memcache. |
| V1.3.10 | 2 | Atende | Não há strings de formatação interpretadas a partir de entrada. |
| V1.3.11 | 2 | Atende | E-mails são enviados pelo provedor de autenticação para endereços validados (`src/schemas/auth.ts`). |
| V1.4.1 | 2 | Não se aplica | Runtime gerenciado (JavaScript); sem manipulação manual de memória. |
| V1.4.2 | 2 | Atende | Valores numéricos têm faixas validadas no servidor e no banco (por exemplo, descanso, incremento de carga). |
| V1.4.3 | 2 | Não se aplica | Runtime gerenciado; sem ponteiros. |
| V1.5.1 | 1 | Não se aplica | A aplicação não processa XML. |
| V1.5.2 | 2 | Atende | Só JSON é desserializado, sem tipos definidos pelo cliente. A importação de dados (E7) valida versão e esquema antes de usar. |

### V2 — Validação e regras de negócio

| Requisito | Nível | Situação | Evidência ou observação |
| --- | --- | --- | --- |
| V2.1.1 | 1 | Parcial | As regras estão nos esquemas Zod (`src/schemas`) e nas restrições das migrações. Um documento consolidado de regras de dados vem com a E9. |
| V2.1.2 | 2 | Parcial | Mesma situação do V2.1.1; combinações relevantes hoje são poucas (passo do onboarding, fuso horário). |
| V2.1.3 | 2 | Atende | Limites por pessoa e globais documentados na seção "Defesas contra automação" deste arquivo. |
| V2.2.1 | 1 | Atende | Listas de valores permitidos (enums) e faixas no Zod e em restrições `check` do banco. |
| V2.2.2 | 1 | Atende | A validação acontece no servidor (Server Actions) e no banco; a do navegador é só conforto. |
| V2.2.3 | 2 | Atende | O banco recusa combinações inválidas (por exemplo, fuso horário inexistente, passo fora da faixa); testes em `supabase/tests/profiles.test.ts`. |
| V2.3.1 | 1 | Atende | O passo do onboarding fica no servidor; a recuperação exige o link, que cria a sessão, antes de aceitar a nova senha. |
| V2.3.2 | 2 | Atende | Limites aplicados conforme `RATE_RULES` (`src/server/rate-limit.ts`). |
| V2.3.3 | 2 | Planejado | As operações atuais alteram uma linha cada. A sincronização do treino (E4) roda em uma transação única no banco. |
| V2.3.4 | 2 | Não se aplica | Não há recursos de quantidade limitada. |
| V2.4.1 | 2 | Atende | Limitação de taxa em Postgres e Turnstile nas rotas públicas (ver "Defesas contra automação"). |

### V3 — Segurança do front-end web

| Requisito | Nível | Situação | Evidência ou observação |
| --- | --- | --- | --- |
| V3.2.1 | 1 | Atende | Respostas com `Content-Type` correto, `X-Content-Type-Options: nosniff` e CSP restritiva. |
| V3.2.2 | 1 | Atende | Texto é renderizado pelo React como texto, nunca como HTML. |
| V3.3.1 | 1 | Atende | Em produção os cookies de sessão são `Secure` e usam `__Host-`; o cookie limitado a uma página usa `__Secure-` (`src/lib/cookies.ts`, testes). |
| V3.3.2 | 2 | Atende | Cookies com `SameSite=Lax`, suficiente porque mutações só ocorrem por POST com verificação de origem. |
| V3.3.3 | 2 | Atende | Prefixo `__Host-` nos cookies de sessão em produção. |
| V3.3.4 | 2 | Atende | Cookies `HttpOnly`; o navegador nunca recebe o token fora do cookie (a aplicação é BFF, decisão D-04). |
| V3.4.1 | 1 | Atende | `Strict-Transport-Security: max-age=63072000; includeSubDomains` em todas as respostas (`next.config.ts`). |
| V3.4.2 | 1 | Atende | A aplicação não emite cabeçalhos CORS; o navegador só conversa com a mesma origem. |
| V3.4.3 | 2 | Atende | CSP com nonce por requisição e `strict-dynamic` (`src/proxy.ts`, ADR 0004, E2E). |
| V3.4.4 | 2 | Atende | `nosniff` em todas as respostas (E2E de cabeçalhos). |
| V3.4.5 | 2 | Atende | `Referrer-Policy: strict-origin-when-cross-origin`. |
| V3.4.6 | 2 | Atende | `frame-ancestors 'none'` e `X-Frame-Options: DENY`. |
| V3.5.1 | 1 | Atende | Server Actions recusam requisições cuja origem difere do host (proteção nativa do Next.js); não há rotas de mutação fora delas. |
| V3.5.2 | 1 | Atende | Não se depende de preflight; ver V3.5.1. |
| V3.5.3 | 1 | Atende | Mutações só por POST. O link do e-mail abre uma página que só age ao pressionar o botão. |
| V3.5.4 | 2 | Atende | A aplicação ocupa uma origem própria; o Supabase fica em outro host e não é chamado pelo navegador. |
| V3.5.5 | 2 | Não se aplica | A aplicação não escuta `postMessage`; o Turnstile usa o canal internamente. |
| V3.7.1 | 2 | Atende | Só tecnologias web atuais e mantidas. |
| V3.7.2 | 2 | Atende | Redirecionamentos só para caminhos internos de uma lista permitida (`src/lib/redirect.ts`, testes). |

### V4 — API e serviços web

| Requisito | Nível | Situação | Evidência ou observação |
| --- | --- | --- | --- |
| V4.1.1 | 1 | Atende | O Next.js define `Content-Type` com `charset=utf-8`. |
| V4.1.2 | 2 | Provedor/implantação | O redirecionamento de HTTP para HTTPS é feito pela Vercel. Verificar ao configurar o domínio. |
| V4.1.3 | 2 | Provedor/implantação | O endereço do cliente vem de `x-real-ip`, que a Vercel sobrescreve. Verificar na primeira implantação. |
| V4.2.1 | 2 | Provedor/implantação | Delimitação de mensagens HTTP feita pela plataforma (Vercel). |
| V4.3.1 | 2 | Não se aplica | Não há GraphQL exposto: a API do banco expõe só o esquema `public` e é usada apenas pelo servidor, com `max_rows` de 1000. |
| V4.3.2 | 2 | Não se aplica | Não há GraphQL exposto. |
| V4.4.1 | 1 | Não se aplica | Não há WebSocket (Realtime desligado). |
| V4.4.2 | 2 | Não se aplica | Não há WebSocket. |
| V4.4.3 | 2 | Não se aplica | Não há WebSocket. |
| V4.4.4 | 2 | Não se aplica | Não há WebSocket. |

### V5 — Arquivos

| Requisito | Nível | Situação | Evidência ou observação |
| --- | --- | --- | --- |
| V5.1.1 | 2 | Planejado | A importação de dados (E7) documenta tipo, extensão e tamanho máximo do arquivo. |
| V5.2.1 | 1 | Planejado | Limite de tamanho na importação (E7). |
| V5.2.2 | 1 | Planejado | Validação de extensão e conteúdo na importação (E7). |
| V5.2.3 | 2 | Não se aplica | A aplicação não aceita arquivos compactados. |
| V5.3.1 | 1 | Não se aplica | Arquivos enviados não são armazenados nem servidos. |
| V5.3.2 | 1 | Não se aplica | Não há operações de arquivo com nomes do usuário. |
| V5.4.1 | 2 | Planejado | A exportação (E7) define o nome do arquivo no `Content-Disposition`. |
| V5.4.2 | 2 | Planejado | Ver V5.4.1. |
| V5.4.3 | 2 | Não se aplica | O arquivo importado é JSON validado e nunca é servido a outras pessoas. |

### V6 — Autenticação

| Requisito | Nível | Situação | Evidência ou observação |
| --- | --- | --- | --- |
| V6.1.1 | 1 | Atende | Defesas documentadas em "Defesas contra automação". |
| V6.1.2 | 2 | Atende | Lista de palavras de contexto em `src/domain/password.ts`: o nome do produto, o início do e-mail e o nome de exibição. |
| V6.1.3 | 2 | Atende | Há um único caminho de autenticação: e-mail e senha, com recuperação por link. Ver "Autenticação". |
| V6.2.1 | 1 | Atende | Mínimo de 8 caracteres (`supabase/config.toml`, `src/schemas/auth.ts`); o texto da tela incentiva frases longas. |
| V6.2.2 | 1 | Atende | Configurações › Conta › Alterar senha (E2E). |
| V6.2.3 | 1 | Atende | A troca exige a senha atual e a nova (E2E). |
| V6.2.4 | 1 | Provedor/implantação | A checagem contra senhas comuns e vazadas é a proteção de senhas vazadas do Supabase, disponível no plano Pro. Ativar na criação dos projetos; o ambiente local não a oferece. |
| V6.2.5 | 1 | Atende | Sem regras de composição. |
| V6.2.6 | 1 | Atende | Campos `type=password` com opção acessível de mostrar (`src/ds/password-field.tsx`). |
| V6.2.7 | 1 | Atende | Colar e gerenciadores de senha permitidos (`autocomplete` adequado, nada bloqueado). |
| V6.2.8 | 1 | Atende | A senha é enviada exatamente como digitada, sem `trim` (teste em `src/schemas/auth.test.ts`). |
| V6.2.9 | 2 | Parcial | O provedor usa bcrypt, que limita a senha a 72 bytes. Senhas de 64 caracteres são aceitas se tiverem até 72 bytes; muitos acentos reduzem o limite. |
| V6.2.10 | 2 | Atende | Não há troca periódica obrigatória. |
| V6.2.11 | 2 | Atende | Senhas com palavras de contexto são recusadas no cadastro, na troca e na recuperação. |
| V6.2.12 | 2 | Provedor/implantação | Ver V6.2.4. |
| V6.3.1 | 1 | Atende | Limitação de taxa por e-mail e endereço, Turnstile após falhas e mensagens neutras (E2E). |
| V6.3.2 | 1 | Atende | Não existem contas padrão. |
| V6.3.3 | 2 | Lacuna | Não há autenticação multifator. Decisão pendente do titular; ver `docs/security/accepted-risks.md`. |
| V6.3.4 | 2 | Atende | Não há caminhos de autenticação além dos documentados. |
| V6.4.1 | 1 | Atende | Links de confirmação e recuperação gerados pelo provedor, de uso único e válidos por 10 minutos. |
| V6.4.2 | 1 | Atende | Sem dicas de senha ou perguntas secretas. |
| V6.4.3 | 2 | Atende | A recuperação usa link enviado ao e-mail; não há multifator para ser contornado. |
| V6.4.4 | 2 | Não se aplica | Não há multifator. |
| V6.5.1 | 2 | Atende | Links de e-mail funcionam uma vez (E2E "um link de confirmação já usado é recusado"). |
| V6.5.2 | 2 | Provedor/implantação | Tokens de link guardados pelo provedor de autenticação. |
| V6.5.3 | 2 | Provedor/implantação | Tokens gerados pelo provedor de autenticação. |
| V6.5.4 | 2 | Atende | Os tokens de link têm muito mais que 20 bits de entropia. |
| V6.5.5 | 2 | Atende | Links e códigos valem 10 minutos (`otp_expiry = 600`). |
| V6.6.1 | 2 | Não se aplica | Sem SMS ou telefone. |
| V6.6.2 | 2 | Atende | O link carrega o tipo de uso e é verificado para esse tipo (`confirmEmailLink`). |
| V6.6.3 | 2 | Atende | Limites por endereço e destinatário nos envios; tokens longos; tokens malformados são recusados sem consultar o provedor. |
| V6.8.1 | 2 | Não se aplica | Um único provedor de identidade. |
| V6.8.2 | 2 | Atende | A sessão é confirmada no servidor de autenticação a cada requisição (`getUser` em `src/proxy.ts`). |
| V6.8.3 | 2 | Não se aplica | Sem SAML. |
| V6.8.4 | 2 | Atende | Ações sensíveis confirmam a senha numa sessão recém-criada (`src/server/reauth.ts`). |

### V7 — Gestão de sessão

| Requisito | Nível | Situação | Evidência ou observação |
| --- | --- | --- | --- |
| V7.1.1 | 2 | Parcial | Política em "Sessões": token de acesso de 1 hora, renovação com rotação, inatividade de 30 dias e duração máxima de 90 dias. Os dois últimos exigem o plano Pro do Supabase; configurar na criação dos projetos. |
| V7.1.2 | 2 | Atende | Sessões simultâneas sem limite, documentado em "Sessões"; a pessoa pode encerrar as outras. |
| V7.1.3 | 2 | Não se aplica | Sem identidade federada. |
| V7.2.1 | 1 | Atende | Verificação de sessão no servidor (`src/proxy.ts`, `src/server/session.ts`). |
| V7.2.2 | 1 | Atende | Tokens gerados a cada sessão; nenhuma chave estática identifica pessoas. |
| V7.2.3 | 1 | Provedor/implantação | Tokens de renovação gerados pelo provedor. |
| V7.2.4 | 1 | Atende | Cada login cria nova sessão; a sessão de confirmação de senha é encerrada após o uso. |
| V7.3.1 | 2 | Provedor/implantação | Ver V7.1.1. |
| V7.3.2 | 2 | Provedor/implantação | Ver V7.1.1. |
| V7.4.1 | 1 | Atende | Sair revoga a sessão no provedor e a sessão encerrada deixa de valer na próxima requisição (E2E com dois dispositivos). |
| V7.4.2 | 1 | Planejado | A exclusão de conta (E7) remove a conta e, com ela, todas as sessões. |
| V7.4.3 | 2 | Atende | Após trocar a senha, as outras sessões são sempre encerradas (E2E); na recuperação o provedor faz o mesmo. |
| V7.4.4 | 2 | Atende | "Sair" na barra lateral e no menu "Mais" de todas as páginas logadas (E2E). |
| V7.4.5 | 2 | Provedor/implantação | Não há painel administrativo no produto; administradores encerram sessões pelo painel do Supabase. |
| V7.5.1 | 2 | Atende | A troca de senha exige a senha atual. Não há troca de e-mail na V1; quando existir (E7), seguirá a mesma regra. |
| V7.5.2 | 2 | Parcial | É possível encerrar as outras sessões com a senha atual. Ver a lista de sessões ativas fica para Configurações (E7). |
| V7.6.1 | 2 | Não se aplica | Sem identidade federada. |
| V7.6.2 | 2 | Atende | Sessões só nascem de ação explícita: login ou botão na página do link. |

### V8 — Autorização

| Requisito | Nível | Situação | Evidência ou observação |
| --- | --- | --- | --- |
| V8.1.1 | 1 | Atende | Regras na seção "Autorização" e no ADR 0003: cada linha privada pertence a uma conta (`owner_id`) e o banco aplica isso. |
| V8.1.2 | 2 | Atende | Colunas que a pessoa pode alterar são concedidas uma a uma (`grant update (...)`). |
| V8.2.1 | 1 | Atende | Só funções revisadas ficam expostas; o teste-meta falha para qualquer outra (`supabase/tests/meta.test.ts`). |
| V8.2.2 | 1 | Atende | RLS forçada em toda tabela privada, com testes negativos entre as personas A e B. |
| V8.2.3 | 2 | Atende | Testes provam que `owner_id` e datas não podem ser alterados (`supabase/tests/profiles.test.ts`). |
| V8.3.1 | 1 | Atende | Autorização no servidor e no banco; a interface nunca é a barreira. |
| V8.4.1 | 2 | Atende | Isolamento por conta testado com duas personas em cada tabela. |

### V9 — Tokens autocontidos

| Requisito | Nível | Situação | Evidência ou observação |
| --- | --- | --- | --- |
| V9.1.1 | 1 | Atende | O token é validado pelo servidor de autenticação antes de ser aceito. |
| V9.1.2 | 1 | Provedor/implantação | Algoritmos de assinatura definidos pelo provedor; preferir chaves assimétricas na criação dos projetos. |
| V9.1.3 | 1 | Atende | As chaves vêm do projeto configurado em `SUPABASE_URL`, nunca do token. |
| V9.2.1 | 1 | Atende | Expiração verificada pelo servidor de autenticação. |
| V9.2.2 | 2 | Provedor/implantação | Só tokens de acesso do provedor são aceitos como sessão. |
| V9.2.3 | 2 | Provedor/implantação | Público (`aud`) verificado pelo provedor. |
| V9.2.4 | 2 | Provedor/implantação | Ver V9.2.3. |

### V10 — OAuth e OIDC

Não se aplica (29 requisitos, de V10.1.1 a V10.7.3). A aplicação não atua como cliente, servidor de autorização nem servidor de recursos OAuth ou OIDC. O login social está fora da V1 (§5.1).

### V11 — Criptografia

| Requisito | Nível | Situação | Evidência ou observação |
| --- | --- | --- | --- |
| V11.1.1 | 2 | Atende | Política de chaves na seção "Criptografia". |
| V11.1.2 | 2 | Atende | Inventário na seção "Criptografia". |
| V11.2.1 | 2 | Atende | Só bibliotecas padrão: `node:crypto`, Web Crypto e as do provedor. |
| V11.2.2 | 2 | Atende | O algoritmo de cada uso está em um único ponto do código e pode ser trocado sem alterar o restante. |
| V11.2.3 | 2 | Atende | HMAC-SHA-256 com segredo de pelo menos 256 bits e nonce de 128 bits. |
| V11.3.1 | 1 | Não se aplica | A aplicação não cifra dados por conta própria. |
| V11.3.2 | 1 | Não se aplica | Ver V11.3.1. |
| V11.3.3 | 2 | Não se aplica | Ver V11.3.1. |
| V11.4.1 | 1 | Atende | SHA-256 é o único hash usado pela aplicação. |
| V11.4.2 | 2 | Provedor/implantação | Senhas guardadas com bcrypt pelo provedor. |
| V11.4.3 | 2 | Atende | SHA-256 nas chaves de limitação de taxa. |
| V11.4.4 | 2 | Não se aplica | Nenhuma chave é derivada de senha. |
| V11.5.1 | 2 | Atende | Nonces com `crypto.getRandomValues` (128 bits); demais segredos gerados pelo provedor. |
| V11.6.1 | 2 | Provedor/implantação | Assinatura de tokens feita pelo provedor. |

### V12 — Comunicação segura

| Requisito | Nível | Situação | Evidência ou observação |
| --- | --- | --- | --- |
| V12.1.1 | 1 | Provedor/implantação | TLS 1.2 e 1.3 configurados pela Vercel e pelo Supabase. |
| V12.1.2 | 2 | Provedor/implantação | Ver V12.1.1. |
| V12.1.3 | 2 | Não se aplica | Sem mTLS. |
| V12.2.1 | 1 | Atende | HTTPS com HSTS e `upgrade-insecure-requests` na CSP de produção. |
| V12.2.2 | 1 | Provedor/implantação | Certificados públicos emitidos pela Vercel. |
| V12.3.1 | 2 | Atende | Conexões de saída por HTTPS (Supabase e Cloudflare). O ambiente local usa HTTP só na máquina de desenvolvimento. |
| V12.3.2 | 2 | Atende | O `fetch` do Node.js valida certificados por padrão; nada desliga essa verificação. |
| V12.3.3 | 2 | Atende | Aplicação e banco conversam por HTTPS em produção. |
| V12.3.4 | 2 | Provedor/implantação | Certificados confiáveis do provedor. |

### V13 — Configuração

| Requisito | Nível | Situação | Evidência ou observação |
| --- | --- | --- | --- |
| V13.1.1 | 2 | Atende | Comunicações documentadas na seção "Comunicações". |
| V13.2.1 | 2 | Atende | Aplicação → Supabase com chave publicável e token da pessoa; aplicação → Cloudflare com segredo próprio. |
| V13.2.2 | 2 | Atende | A aplicação usa a chave publicável com RLS; a chave de serviço não é usada em nenhuma rota. |
| V13.2.3 | 2 | Atende | Sem credenciais padrão fora do ambiente local descartável. |
| V13.2.4 | 2 | Atende | Lista de destinos permitidos: CSP do navegador (`connect-src 'self'`, Turnstile em `frame-src`) e, no servidor, só os dois endereços fixos. |
| V13.2.5 | 2 | Parcial | A lista de destinos é garantida pelo código, sem um bloqueio de rede na plataforma. |
| V13.3.1 | 2 | Provedor/implantação | Segredos guardados nas variáveis de ambiente cifradas da Vercel e do GitHub Actions. |
| V13.3.2 | 2 | Atende | Só o servidor lê segredos; nada é exposto ao navegador (nenhuma variável `NEXT_PUBLIC_`). |
| V13.4.1 | 1 | Atende | A implantação publica só o build; o repositório não é servido. |
| V13.4.2 | 2 | Atende | Produção sem modo de depuração; a galeria interna fica desligada (`ENABLE_DESIGN_GALLERY`). |
| V13.4.3 | 2 | Atende | Não há listagem de diretórios. |
| V13.4.4 | 2 | Atende | TRACE não é atendido: o servidor responde erro genérico sem refletir a requisição, e a borda da Vercel responde 405. |
| V13.4.5 | 2 | Atende | Sem documentação interna exposta; `/api/health` informa só estado, versão e ambiente. |

### V14 — Proteção de dados

| Requisito | Nível | Situação | Evidência ou observação |
| --- | --- | --- | --- |
| V14.1.1 | 2 | Atende | Classificação na seção "Dados". |
| V14.1.2 | 2 | Atende | Requisitos por nível na seção "Dados". |
| V14.2.1 | 1 | Atende | Dados sensíveis vão no corpo. O e-mail pendente usa cookie, não a URL. Só o token do link do e-mail usa a URL, por natureza, e vale uma vez. |
| V14.2.2 | 2 | Atende | Páginas são privadas e não armazenáveis (`Cache-Control: private, no-store`). |
| V14.2.3 | 2 | Atende | Não há rastreadores. O Turnstile recebe o endereço IP apenas nas telas de acesso. |
| V14.2.4 | 2 | Parcial | Retenção e exclusão chegam com a E7, e o registro de eventos com a E6. |
| V14.3.1 | 1 | Planejado | Hoje nada sensível fica no navegador. Com o treino offline (E4), o banco local do treino será limpo ao sair. |
| V14.3.2 | 2 | Atende | `Cache-Control: no-store` nas respostas dinâmicas. |
| V14.3.3 | 2 | Atende | O `localStorage` guarda só o tema. |

### V15 — Codificação segura e arquitetura

| Requisito | Nível | Situação | Evidência ou observação |
| --- | --- | --- | --- |
| V15.1.1 | 1 | Atende | Prazos na seção "Dependências"; Dependabot e auditoria no CI. |
| V15.1.2 | 2 | Planejado | Inventário de componentes (SBOM) gerado no CI a partir da E9. |
| V15.1.3 | 2 | Atende | Funções custosas listadas em "Defesas contra automação". |
| V15.2.1 | 1 | Atende | Auditoria de dependências bloqueante no CI para produção. |
| V15.2.2 | 2 | Atende | Limites de taxa nas funções custosas. |
| V15.2.3 | 2 | Atende | Código de teste fora do build; galeria interna desligada em produção. |
| V15.3.1 | 1 | Atende | Cada consulta lê só a conta da pessoa; a interface recebe apenas o próprio perfil. |
| V15.3.2 | 2 | Atende | A chamada à Cloudflare recusa redirecionamentos (`redirect: "error"`). |
| V15.3.3 | 2 | Atende | Campos aceitos são escolhidos campo a campo nas ações; o banco concede atualização só nas colunas permitidas. |
| V15.3.4 | 2 | Provedor/implantação | Ver V4.1.3. |
| V15.3.5 | 2 | Atende | TypeScript estrito, Zod com tipos explícitos e comparações estritas. |
| V15.3.6 | 2 | Atende | Entradas viram objetos novos pelo Zod; não há mesclagem recursiva de dados do cliente. |
| V15.3.7 | 2 | Atende | Cada ação lê campos nomeados do corpo; consulta e corpo nunca se misturam. |

### V16 — Registro de eventos e tratamento de erros

| Requisito | Nível | Situação | Evidência ou observação |
| --- | --- | --- | --- |
| V16.1.1 | 2 | Planejado | Inventário de registros com o Sentry (E6). |
| V16.2.1 | 2 | Planejado | E6. |
| V16.2.2 | 2 | Planejado | E6; horários já são gravados em UTC. |
| V16.2.3 | 2 | Planejado | E6. |
| V16.2.4 | 2 | Planejado | E6. |
| V16.2.5 | 2 | Planejado | E6; senhas e tokens nunca são registrados. |
| V16.3.1 | 2 | Parcial | O provedor registra entradas e falhas de autenticação; o registro da aplicação chega na E6. |
| V16.3.2 | 2 | Planejado | E6. |
| V16.3.3 | 2 | Planejado | E6. |
| V16.3.4 | 2 | Planejado | E6. |
| V16.4.1 | 2 | Planejado | E6. |
| V16.4.2 | 2 | Provedor/implantação | Registros do provedor protegidos pelo próprio provedor. |
| V16.4.3 | 2 | Planejado | Envio ao Sentry (E6). |
| V16.5.1 | 2 | Atende | Mensagens genéricas, sem detalhes internos (testes de `src/features/auth`). |
| V16.5.2 | 2 | Atende | Falhas de serviços externos degradam com segurança: o limitador libera e a verificação humana recusa. |
| V16.5.3 | 2 | Atende | Validação recusa por padrão; nenhuma ação prossegue após erro de validação. |

### V17 — WebRTC

Não se aplica (7 requisitos, de V17.1.1 a V17.3.2). Não há WebRTC no produto.
