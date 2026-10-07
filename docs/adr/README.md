# Registro de decisões de arquitetura

Cada decisão estrutural fica registrada aqui com contexto, alternativas e consequências. As decisões nascem no [plano de execução](../execution-plan.md) (identificadores `D-nn`) e ganham um registro próprio quando entram em vigor. Uma decisão só muda por um novo registro que a substitua.

| Registro                                         | Decisões do plano      | Tema                                          |
| ------------------------------------------------ | ---------------------- | --------------------------------------------- |
| [0001](0001-language-and-quality-tooling.md)     | D-02, D-16             | Linguagem, tipagem e ferramentas de qualidade |
| [0002](0002-web-framework.md)                    | D-01                   | Framework web                                 |
| [0003](0003-data-platform-and-access.md)         | D-03, D-04, D-05       | Banco, acesso a dados e autorização           |
| [0004](0004-authentication-and-edge-security.md) | D-06, D-22             | Autenticação e segurança de borda             |
| [0005](0005-derived-metrics-units-and-dates.md)  | D-07, D-20, D-21       | Métricas derivadas, unidades e datas          |
| [0006](0006-offline-sync-and-read-cache.md)      | D-08, D-09, D-12       | Offline, sincronização e cache de leitura     |
| [0007](0007-interface-and-design-system.md)      | D-10, D-11, D-13, D-14 | Interface, Design System, gráficos e motion   |
| [0008](0008-testing-and-delivery.md)             | D-15, D-17             | Testes, entrega e observabilidade             |
| [0009](0009-entitlements-and-billing.md)         | D-18                   | Planos, entitlements e billing                |
| [0010](0010-exercise-catalog.md)                 | D-19                   | Catálogo de exercícios                        |

## Formato

Cada registro tem: **Status**, **Contexto**, **Decisão**, **Alternativas consideradas** e **Consequências**.
