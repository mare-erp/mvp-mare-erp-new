# Plano de Correções e Melhorias

## 1. Funcionalidade do Calendário

**Problema:**
*   "Tela preta" ao acessar o calendário.
*   "8 erros no calendário" (detalhes específicos dos erros ainda não fornecidos).

**Plano de Correção:**
1.  **Reexaminar Componentes:** Inspecionar `app/(dashboard)/calendario/page.tsx` e seus componentes relacionados (`ListView.tsx`, `CalendarView.tsx`, `KanbanView.tsx`, `Toolbar.tsx`, `EventDialog.tsx`) para identificar quaisquer problemas óbvios de sintaxe, lógica ou renderização.
2.  **Solicitar Detalhes dos Erros:** Pedir ao usuário logs de console, mensagens de erro específicas ou passos para reproduzir os "8 erros" mencionados, a fim de diagnosticar a causa raiz.
3.  **Verificar/Implementar ErrorBoundary:** Confirmar se o componente `ErrorBoundary` (localizado em `app/components/ErrorBoundary.tsx`) está corretamente implementado e envolvendo a visualização principal do calendário em `app/(dashboard)/calendario/page.tsx`. Isso garantirá que erros de tempo de execução sejam capturados e uma interface de fallback amigável seja exibida, evitando a "tela preta".
4.  **Revisar Sintaxe de `ListView.tsx`:** Fazer uma revisão cuidadosa da sintaxe JSX em `ListView.tsx` para garantir que não haja erros ocultos ou reintroduzidos que possam causar falhas na renderização.

## 2. Funcionalidade de Vendas

**Problema:**
*   A página de vendas "fica somente em Carregando...".

**Plano de Correção:**
1.  **Inspecionar `app/(dashboard)/vendas/page.tsx`:** Analisar a função `fetchData` e suas dependências para garantir que todas as chamadas de API estão sendo feitas corretamente e que os estados de carregamento e erro estão sendo gerenciados adequadamente.
2.  **Verificar Endpoints da API:** Confirmar se os endpoints `/api/vendas/summary` e `/api/vendas` estão respondendo com dados válidos e sem erros. Isso pode ser feito verificando os logs do servidor ou usando ferramentas de desenvolvedor no navegador.
3.  **Inspeção de Rede no Navegador:** Sugerir ao usuário que verifique a aba "Rede" (Network) nas ferramentas de desenvolvedor do navegador para identificar se há requisições falhando, retornando erros HTTP ou demorando muito para responder.
4.  **Gerenciamento do Estado de Carregamento:** Assegurar que a variável de estado `isLoading` está sendo definida como `false` no bloco `finally` da função `fetchData`, garantindo que o estado de carregamento seja encerrado mesmo em caso de erro.
5.  **Tratamento de Erros:** Verificar se quaisquer erros durante a busca de dados estão sendo capturados e exibidos de forma clara na interface do usuário.

## 3. Upgrades nas Sub-funcionalidades de Vendas (Métricas)

**Problema:**
*   As métricas de LTV, top 5 produtos, taxa de conversão, lead time da venda e top 5 vendedores ainda não estão implementadas.

**Plano de Implementação:**
1.  **Definição de Endpoints da API:** Criar um novo endpoint (ex: `app/api/vendas/metrics/route.ts`) para calcular e retornar as métricas solicitadas.
    *   **LTV (Lifetime Value):** Agregação do `valorTotal` de `Pedido`s com `status: VENDIDO` por `Cliente`.
    *   **Top 5 Produtos:** Agregação do `subtotal` de `ItemPedido`s por `Produto`, filtrando por `Pedido`s `VENDIDO`s e período.
    *   **Taxa de Conversão:** Cálculo baseado na contagem de `Pedido`s com `status: VENDIDO` e `status: ORCAMENTO`.
    *   **Top 5 Vendedores:** Agregação do `valorTotal` de `Pedido`s com `status: VENDIDO` por `Usuario`.
    *   **Lead Time da Venda:** Requer análise mais aprofundada do modelo `HistoricoPedido` para rastrear mudanças de status com timestamps. Se o modelo atual não for suficiente, será proposta uma alteração de esquema.
2.  **Integração no Frontend (`VendasPage.tsx`):**
    *   Adicionar chamadas para o novo endpoint de métricas na função `fetchData`.
    *   Criar uma nova seção na interface do usuário para exibir essas métricas, utilizando `StatCard`s para valores únicos e listas/tabelas para os top produtos e vendedores.
    *   Garantir que os filtros de data e vendedor se apliquem corretamente às novas métricas.
