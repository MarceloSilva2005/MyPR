# 0009. Planos, entitlements e billing

- Status: aceita
- Data: 07/10/2026
- Decisões do plano: D-18

## Contexto

A oferta comercial ainda não está definida, mas a arquitetura precisa nascer preparada para planos sem espalhar condicionais pela interface.

## Decisão

- Tabelas `plans` e `user_entitlements`, registro de funcionalidades em código e uma única função `can(user, feature)` no servidor.
- O billing fica em módulo isolado (`src/billing`), criado somente depois do gate G-02 (oferta comercial definida). Provedor a decidir nesse momento.
- Enquanto não houver oferta, o lançamento libera todos os recursos.
- Exportação completa dos próprios dados e conclusão de um treino já iniciado nunca dependem de plano.

## Alternativas consideradas

- Condicionais de plano na interface: difíceis de auditar e de remover.
- Billing já na V1: custo sem decisão comercial que o sustente.

## Consequências

- A decisão de provedor de pagamento fica explicitamente adiada e registrada como pendência.
