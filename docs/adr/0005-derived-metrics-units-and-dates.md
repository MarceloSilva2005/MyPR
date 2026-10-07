# 0005. Métricas derivadas, unidades e datas

- Status: aceita
- Data: 07/10/2026
- Decisões do plano: D-07, D-20, D-21

## Contexto

As séries brutas são a fonte de verdade. Volume, 1RM estimado e cadeia de recordes precisam estar corretos mesmo após edição retroativa, e a detecção de recorde durante o treino precisa funcionar sem rede.

## Decisão

- **Métricas sob demanda.** As fórmulas são definidas em `src/domain` (TypeScript) e projetadas em views SQL com `security_invoker` para agregação. Uma suíte de paridade com testes de propriedade garante que TypeScript e SQL concordem. A detecção de recorde durante o treino roda no cliente.
- **Gatilho de materialização.** Só se materializa se o p95 de Recordes ou Analytics passar de 150 ms com 50 mil séries.
- **Carga em kg.** Armazenada em `numeric(9,4)`; kg/lb altera apenas a apresentação. Entradas em lb são convertidas sem arredondar.
- **Datas.** `timestamptz` em UTC mais o fuso IANA gravado na sessão. O dia do treino e a semana são calculados no fuso da sessão. Biblioteca `date-fns` com `@date-fns/tz`.

## Alternativas consideradas

- Colunas materializadas com triggers: mantêm duas fontes de verdade e exigem reprocessamento.
- Cálculo apenas no cliente: não serve à agregação nem a páginas renderizadas no servidor.
- Armazenar valor e unidade originais: compara recordes com conversões ambíguas.
- `Temporal`: suporte ainda irregular entre navegadores.

## Consequências

- A fórmula existe em dois lugares. O custo é pago com testes de paridade obrigatórios no CI (risco R-06).
- Ruído de arredondamento ao reexibir libras é coberto por testes de ida e volta.
