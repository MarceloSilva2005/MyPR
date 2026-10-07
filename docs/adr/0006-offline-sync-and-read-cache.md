# 0006. Offline, sincronização e cache de leitura

- Status: aceita
- Data: 07/10/2026
- Decisões do plano: D-08, D-09, D-12

## Contexto

Perder um treino por falha de rede, recarregamento ou fechamento do navegador é inaceitável. Não é necessário replicar a plataforma inteira no dispositivo.

## Decisão

- **Escopo offline restrito à sessão ativa**, ao catálogo, às rotinas e à última performance em cache.
- **IndexedDB com Dexie**, gravando cada alteração imediatamente. Identificadores gerados no cliente (UUIDv7).
- **Sincronização por snapshot da sessão**, em fila, com concorrência otimista por `revision` e endpoint idempotente. Em conflito, o servidor guarda a versão recebida e o usuário escolhe qual manter; a descartada fica recuperável por 30 dias.
- **Service Worker com Serwist** (ou compilado à parte, se o plugin não suportar o bundler): pré-cache de ativos versionados e do shell, navegação com rede primeiro, API nunca em cache, atualização só quando não há treino ativo.
- **TanStack Query** para dados interativos de leitura, com persistência em IndexedDB para rotinas, catálogo e primeira página do histórico. Filtros vivem na URL.
- O descanso guarda o instante final, e não um contador, para sobreviver a recarregamentos e abas em segundo plano.

## Alternativas consideradas

- Replicação offline completa ou CRDTs: custo e risco desproporcionais para a V1.
- Log de operações finas: mais difícil de tornar idempotente e de testar.
- Service Worker manual: mais controle, mais risco.

## Consequências

- Limites assumidos: criar ou editar rotinas e configurações exige conexão; não há notificação push de fim de descanso; navegadores que removem armazenamento de sites não instalados exigem `storage.persist()` e aviso ao usuário.
- A compatibilidade do Service Worker com o bundler será validada em um spike no início da E4 (risco R-02).
