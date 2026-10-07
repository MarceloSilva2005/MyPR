# Design System do MyPR

Este documento descreve o contrato visual e de interação do produto. Ele acompanha o código: os tokens ficam em `src/ds/tokens.css`, os componentes em `src/ds/` e a referência viva na galeria interna. A decisão de tecnologia está no [ADR 0007](adr/0007-interface-and-design-system.md).

## Princípios

1. **Clareza antes de decoração.** Um elemento que não comunica ação, estado, hierarquia ou dado sai.
2. **Dados em primeiro plano.** Números têm alinhamento tabular, unidade e referência de tempo.
3. **Poucas superfícies.** Seções, linhas finas e espaço separam o conteúdo. Cartões são exceção.
4. **Cor tem função.** O accent marca ação e seleção. Verde, vermelho e âmbar são reservados a sucesso, erro e atenção.
5. **Estado nunca depende só de cor.** Forma, texto ou ícone acompanham a cor em todo estado.
6. **Movimento comunica.** Ele indica estado ou continuidade, nunca bloqueia a entrada e respeita `prefers-reduced-motion`.

## Como ver a galeria

A galeria é uma ferramenta interna e responde 404 em qualquer ambiente que não a habilite.

```bash
pnpm build
ENABLE_DESIGN_GALLERY=true pnpm start
```

- `/dev/system`: todos os componentes e estados, com seletor de tema.
- `/dev/shell`: o shell de navegação. Use `?activeWorkout=1` para ver a barra reduzida de um treino em andamento.

## Tokens

Todo valor visual vem de `src/ds/tokens.css`. Cores com tema são declaradas uma vez, com `light-dark(claro, escuro)`, e os testes leem esse arquivo para verificar contraste.

### Cor

| Token | Uso |
| --- | --- |
| `bg`, `surface`, `surface-hover`, `overlay` | Fundo da página, áreas rebaixadas, estado de passar o mouse e camadas flutuantes. |
| `line` | Divisores e bordas decorativas. |
| `line-control` | Borda de campos de formulário. Atende 3:1, pois é a única pista visual do campo. |
| `fg`, `fg-muted`, `fg-subtle` | Texto principal, secundário e de apoio. Todos atendem 4,5:1 sobre `bg` e `surface`. |
| `accent`, `accent-hover`, `accent-fg` | Preenchimento de ação principal e texto sobre ele. |
| `accent-text`, `accent-subtle` | O mesmo matiz como texto legível e como fundo suave de seleção. |
| `success`, `danger`, `warning` (+ `-subtle`) | Estados. Legíveis como texto e sobre o próprio fundo suave. |
| `danger-solid`, `danger-solid-hover`, `danger-solid-fg` | Ação destrutiva confirmada. |
| `series-1` a `series-5` | Séries de dados, em ordem estável. Sempre acompanhadas de marcador ou rótulo. |

O accent é um azul ultramar. A paleta de séries evita verde, vermelho e âmbar para não colidir com significados de estado, e cada série tem um marcador próprio (círculo, quadrado, losango, triângulo e cruz).

### Tipografia

Geist Sans para texto e Geist Mono apenas para dados técnicos, como o cronômetro. Números usam `tabular-nums`. Escala: `xs` 12, `sm` 14 (corpo do app), `base` 16 (campos no celular, para evitar zoom), `lg` 18, `xl` 20, `2xl` 24 e `3xl` 32. Títulos dentro do app não passam de `xl`.

### Espaço, forma e elevação

- **Espaço:** escala de 4 px. Passos permitidos: 0, 2, 4, 6, 8, 12, 16, 20, 24 e seus múltiplos de layout.
- **Raio:** 4, 6, 8 e 10 px. Formato de pílula apenas em indicadores de estado reais.
- **Elevação:** sombra somente em camadas que flutuam sobre a página (`shadow-float`, `shadow-overlay`). Nada de sombra em blocos de conteúdo.
- **Breakpoints:** 480, 768, 1024 e 1440 px.

### Movimento

| Token | Duração | Uso |
| --- | --- | --- |
| `instant` | 100 ms | Pressionar, hover simples. |
| `fast` | 160 ms | Menus, tooltips, abas. |
| `base` | 220 ms | Diálogos, painéis, entrada de conteúdo. |
| `slow` | 320 ms | Transições de layout maiores. |

Com movimento reduzido, as durações caem para 1 ms e a distância dos deslocamentos vai a zero. O indicador de carregamento passa a pulsar em vez de girar.

## Componentes

| Componente | Arquivo | Quando usar |
| --- | --- | --- |
| Button, ButtonLink | `button.tsx` | `primary` para a ação principal da tela (uma por tela), `tonal` para ênfase que não compete, `secondary` para as demais, `destructive*` para remoção. ButtonLink é navegação; Button é ação. Botão só com ícone exige `aria-label`. |
| TextField, NumberField | `text-field.tsx`, `number-field.tsx` | Rótulo sempre visível. Erro e ajuda ligados ao campo. `NumberField` aceita vírgula decimal e tem tamanho `workout`. |
| Select, ComboBox, ExercisePicker | `select.tsx`, `combo-box.tsx`, `exercise-picker.tsx` | Select para poucas opções; ComboBox quando há busca, sem diferenciar acentos. |
| SegmentedControl, Tabs | `segmented-control.tsx`, `tabs.tsx` | Até cinco opções de uma mesma tela. Para trocar de página, use links. |
| Modal, ConfirmDialog | `modal.tsx` | Diálogo, painel lateral ou folha na base do celular. A confirmação destrutiva não fecha ao clicar fora. |
| ToastProvider, useToast | `toast.tsx` | Confirmação não crítica que some sozinha. Nunca para erro que exige ação. |
| Tooltip | `tooltip.tsx` | Apoio a um controle que já tem nome. Não substitui rótulo. |
| DataTable, DataList | `data-table.tsx`, `data-list.tsx` | Tabela densa no desktop e lista compacta no celular. |
| Metric | `metric.tsx` | Valor, unidade, variação e período juntos. A variação tem ícone e sinal, não só cor. |
| Badge, PRBadge | `badge.tsx`, `pr-badge.tsx` | Estado curto. O PR é objetivo, sem celebração. |
| EmptyState, ErrorState, InlineAlert, Skeleton, Spinner | `feedback.tsx` | Vazio ensina o próximo passo. Erro oferece nova tentativa. Skeleton reserva as dimensões finais. |
| WorkoutSetRow | `workout-set-row.tsx` | Uma série editável, com última performance visível. Alvos de 44 px ou mais. |
| RestTimer | `rest-timer.tsx`, `rest-timer-model.ts` | Guarda o instante final, não um contador, por isso sobrevive a recarregamento. |
| SyncStatus | `sync-status.tsx` | Estado de persistência discreto, com forma própria por estado. |
| ChartFrame, LineChart, BarChart, ActivityStrip | `chart/` | Valores exatos no tooltip, tabela alternativa, navegação por teclado e estados de carregamento, vazio e erro. |

## Acessibilidade

A meta é WCAG 2.2 AA. O que foi implementado e como é verificado:

| Critério | Implementação | Verificação |
| --- | --- | --- |
| Contraste (1.4.3, 1.4.11) | Todos os pares de texto a 4,5:1 e controles e séries a 3:1, nos dois temas. | Testes de token e axe em todas as telas, claro e escuro. |
| Alternativa a arrastar (2.5.7) | A reordenação terá controles de teclado e de toque (etapa E3). | Planejado. |
| Alvos de toque (2.5.8) | 44 px ou mais no celular e nos controles do treino. | Revisão visual. |
| Foco visível e não obscurecido (2.4.7, 2.4.11) | Contorno de 2 px em todo elemento focável e `scroll-padding` para cabeçalhos fixos. | E2E de teclado e axe. |
| Teclado (2.1.1) | Gráficos, listas, diálogos e menus operáveis só com teclado. Região de tabela rolável é focável. | E2E de teclado. |
| Rótulos e erros (3.3.1, 3.3.2) | Rótulo persistente; erro anunciado e ligado ao campo. | E2E e axe. |
| Movimento | `prefers-reduced-motion` respeitado globalmente. | Tokens e E2E com movimento reduzido. |
| Gráficos | Resumo textual, valor exato anunciado e tabela alternativa. | Testes de componente e E2E. |

## Salvaguardas automáticas

`pnpm check:guards` falha o CI quando o código sai do sistema:

- cor literal ou paleta padrão do Tailwind fora de `tokens.css`;
- valor arbitrário de cor, sombra ou raio;
- efeito de vidro (`backdrop-*`) e gradiente decorativo;
- sombra fora dos tokens de camada flutuante e raio maior que o permitido;
- pílula fora de indicadores de estado e movimento fora dos tokens;
- espaçamento fora da escala de 4 px;
- emoji e frases genéricas ou promocionais.

Uma exceção pontual exige a marca `guard-allow` na linha, com justificativa no comentário.

## Revisão visual por etapa

Antes de fechar uma etapa com interface, procura-se, nesta ordem: **design genérico**, **inconsistências entre telas**, **excesso de elementos**, **padrões visuais repetitivos** e **microinterações** sem função ou fora dos tokens de movimento. A revisão usa capturas em 1440, 820 e 390 px, nos temas claro e escuro, e o Apêndice C do Documento Mestre.

### Registro da etapa E1

Defeitos encontrados na revisão e corrigidos antes da release:

| Achado | Correção |
| --- | --- |
| Avisos persistentes com fundo colorido saturado, quatro blocos competindo por atenção. | Fundo neutro, com o tom apenas no ícone e numa linha fina lateral. |
| Descanso concluído exibia o texto em fonte grande e quebrava em duas linhas. | O tempo `0:00` continua grande; o texto de estado vai numa linha discreta. |
| Rótulos do eixo vertical do gráfico de barras cortados. | A largura do eixo passa a seguir o maior rótulo. |
| Variação das métricas quebrava no meio do valor. | Valor e unidade não quebram; só o contexto desce de linha. |
| Barra lateral do tablet cortava "Configurações" e exibia um botão transbordando. | Largura de 96 px e ação "Iniciar treino" apenas na barra expandida. |
| Dois botões primários na mesma tela. | Nova variante `tonal` para a ação global da barra lateral. |
| Texto do campo de busca de exercício cortado no celular. | Texto curto, com a explicação em uma linha de apoio. |

## Decisões e limites

- **Toast próprio.** O componente de toast do React Aria ainda é marcado como instável, então o MyPR mantém uma implementação pequena, com região viva educada e pausa ao passar o mouse ou focar.
- **Galeria como rota.** Em vez de Storybook, a galeria é uma rota habilitada por variável de ambiente. Ela alimenta os testes visuais e de acessibilidade.
- **Linhas de base visuais em Linux.** As capturas de referência são geradas pela CI, onde as fontes são reproduzíveis. O workflow `Visual baselines` as regenera sob demanda.
- **Orçamento de laboratório em vez de Lighthouse CI.** CLS e LCP são medidos pelo Playwright nas rotas principais, e o JavaScript de primeira carga tem limite por rota (`pnpm check:bundle`). O Lighthouse CI entra quando as páginas tiverem conteúdo real, na etapa E6.
