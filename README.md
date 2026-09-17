# MyPR

PWA mobile-first para registrar treinos de academia, séries, repetições e cargas, com acompanhamento visual de volume, evolução de desempenho e recordes pessoais ao longo das semanas e meses.

## Executar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. O aplicativo funciona sem conta e persiste os dados no IndexedDB do navegador.

Na primeira abertura, o MyPR cria um pequeno histórico de demonstração para que gráficos e comparações possam ser explorados imediatamente. Ele pode ser restaurado pelo Perfil.

## Conta e sincronização

1. Crie um projeto no Supabase.
2. Execute `supabase/schema.sql` no SQL Editor.
3. Ative Google e/ou Magic Link em Authentication.
4. Copie `.env.example` para `.env.local` e preencha as duas variáveis.
5. Cadastre a URL local e o domínio de produção entre os Redirect URLs permitidos.

Sem essas variáveis, o modo local continua funcional e a interface informa que o backup em nuvem ainda não está configurado.

## Verificação

```bash
npm run typecheck
npm run test
npm run lint
npm run build
```

## Deploy

O projeto está pronto para importação na Vercel. Configure as mesmas variáveis do Supabase no ambiente de produção antes de publicar.
