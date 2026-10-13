# 0004. Autenticação e segurança de borda

- Status: aceita
- Data: 07/10/2026
- Decisões do plano: D-06, D-22

## Contexto

O produto é uma aplicação web pública com dados pessoais de hábitos de treino. A referência de verificação é o OWASP ASVS 5.0, nível 2.

## Decisão

- Autenticação por e-mail e senha no Supabase Auth, com verificação de e-mail obrigatória antes do acesso à área privada.
- Cookies `httpOnly` por `@supabase/ssr`, rotação de refresh token e reautenticação para ações sensíveis.
- CAPTCHA no cadastro, na recuperação de senha e após falhas de login. Respostas públicas neutras, sem enumeração de contas.
- Redirecionamento pós-login apenas para caminhos internos de uma lista permitida.
- CSP restritiva com nonce, HSTS, `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy` e `X-Content-Type-Options`.
- Mutações exigem `Content-Type: application/json` e validam `Origin` e `Sec-Fetch-Site`.
- Limitação de taxa por usuário e IP em endpoints públicos e de sincronização, implementada no Postgres, salvo medição que justifique outro componente.

## Alternativas consideradas

- Auth.js ou Better Auth: mais controle, mais código sensível sob nossa responsabilidade.
- Login social na V1: adiado para o backlog.

## Consequências

- A entregabilidade de e-mail depende de domínio próprio com SPF, DKIM e DMARC antes do beta.
- Nonce exige renderização dinâmica; a página pública estática usaria política por hashes. A validação é a tarefa T2.3.

## Resultado da validação (T2.3, 13/10/2026)

A política por hashes não se sustenta: o Next.js insere em cada página scripts inline com os dados de renderização, diferentes por rota e por build, e a integridade de sub-recursos experimental cobre apenas arquivos externos. Manter a página pública estática exigiria `'unsafe-inline'` em `script-src`, o que anula a proteção.

Decisão: **todas as páginas são renderizadas por requisição com nonce**. O proxy gera 128 bits aleatórios por requisição e envia a política; o layout raiz lê o nonce e o aplica ao script de tema e à meta `csp-nonce`, de onde o React Aria lê o valor para os estilos que injeta. `style-src-attr 'unsafe-inline'` permanece porque o posicionamento de popovers e a geometria dos gráficos usam atributos `style`; atributo de estilo não executa código.

Custo: a página pública deixa de ser servida do cache da CDN. O tempo de resposta passa a ser medido na E6, com o resto do orçamento de desempenho. O orçamento de JavaScript continua o mesmo e passou a ser medido pelos manifestos do build, já que não há mais HTML pré-renderizado.
