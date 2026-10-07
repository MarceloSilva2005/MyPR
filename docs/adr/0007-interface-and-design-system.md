# 0007. Interface, Design System, gráficos e motion

- Status: aceita
- Data: 07/10/2026
- Decisões do plano: D-10, D-11, D-13, D-14

## Contexto

O produto precisa parecer um SaaS profissional e consistente, sem aparência de template. Há requisitos de acessibilidade WCAG 2.2 AA, incluindo alternativa por teclado para reordenar listas.

## Decisão

- **Componentes:** React Aria Components, sem estilo próprio, estilizados com Tailwind CSS v4 sobre tokens do MyPR. Sem conjunto de componentes prontos.
- **Ícones:** Lucide, sempre acompanhados de texto nas ações primárias.
- **Tipografia:** Geist Sans variável para o texto e Geist Mono apenas para dados técnicos, com números tabulares.
- **Formulários:** esquemas Zod compartilhados; React Hook Form onde há listas dinâmicas (editor de rotina e treino); validação do React Aria e Server Actions nos demais.
- **Gráficos:** `d3-scale`, `d3-shape` e `d3-array` com componentes SVG próprios, navegação por teclado, tabela alternativa e carregamento sob demanda.
- **Motion:** tokens em CSS, `prefers-reduced-motion` respeitado globalmente. Uma biblioteca de animação só entra se a E1 comprovar necessidade.
- **Salvaguardas automáticas:** verificações de tokens, anti-padrões visuais e copy.

## Alternativas consideradas

- Radix ou Base UI: sem reordenação acessível e ComboBox com o mesmo nível de suporte.
- shadcn/ui: gera exatamente o visual de template que o projeto quer evitar.
- Recharts, visx, ECharts, uPlot: menos controle sobre o visual e a acessibilidade, ou mais peso.

## Consequências

- Mais código inicial para os gráficos; a V1 tem apenas três tipos.
- Duas formas de validar formulários, unificadas por um contrato de erro único na camada `ds/form`.

## Atualização na etapa E1 (07/10/2026)

- **Toast próprio.** O toast do React Aria ainda é marcado como instável, então o MyPR usa uma implementação pequena e acessível (região viva educada, pausa ao focar ou passar o mouse, no máximo três notificações). Será reavaliado quando a API do React Aria for estabilizada.
- **API de seleção.** `Select` e `ComboBox` usam `value` e `onChange`, pois `selectedKey` e `onSelectionChange` estão obsoletos na versão adotada.
- **Provedores por área.** Os provedores do React Aria (localização, roteador e toasts) são montados nas áreas `/app` e `/dev`, não no layout raiz, para que a página pública estática não carregue código de interface do app.
- **Carregamento sob demanda.** A folha "Mais" do celular só é baixada quando aberta.
- **Orçamento.** O JavaScript de primeira carga, comprimido, tem limite por rota (`/` em 145 kB e `/app` em 175 kB). Cerca de 120 kB dele é o próprio React e o runtime do Next.
- **Paleta de séries.** A distância mínima entre séries e o contraste contra o fundo são verificados em teste, nos dois temas.
- Detalhes do contrato visual em [docs/design-system.md](../design-system.md).
