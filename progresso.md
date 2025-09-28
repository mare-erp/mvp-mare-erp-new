# Log de Progresso - Refatoração Maré ERP

Este arquivo documenta as atualizações e modificações realizadas no código da aplicação.

## 28/09/2025

- Início da análise e refatoração da aplicação para o modelo de multi-empresa.
- Criação deste arquivo de log de progresso.
- **Refatoração da Gestão de Estado da Empresa:**
  - Criado o `CompanyContext` para gerenciar a organização e a empresa selecionada.
  - Criada a rota de API `/api/organizacao/current` para buscar os dados da organização do usuário.
  - Refatorado o `DashboardLayout` para usar o `CompanyProvider` e injetar os dados no `Header`.
  - O `DataContext` foi renomeado para `DashboardDataProvider` e refatorado para consumir o `CompanyContext`, tornando-o sensível à mudança de empresa.
- **Unificação da Autenticação e Refatoração das Rotas de API:**
  - Consolidada toda a lógica de autenticação no `app/lib/auth.ts`, utilizando a HOC `withAuth`.
  - Removido o arquivo duplicado `app/lib/verifyAuth.ts`.
  - Removida a rota de API duplicada `app/api/produtos/route.ts`.
  - A rota `/api/clientes` foi refatorada para usar `withAuth`.
  - A rota `/api/estoque/produtos` foi refatorada para usar `withAuth`.
  - A rota `/api/membros` foi refatorada para usar `withAuth` e para operar no nível da `Organizacao`.
  - A rota `/api/pedidos` foi refatorada para usar `withAuth`.
- **Reversão e Restauração da Ligação Pedido-Usuário:**
  - O conceito de `vendedorId` foi removido e depois restaurado como `usuarioId` no modelo `Pedido` para manter o rastreamento de quem criou o pedido.
  - **Status Atual:** A aplicação da mudança no banco de dados está bloqueada, aguardando a execução do comando de reset pelo usuário.

