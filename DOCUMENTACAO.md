# Documentação Maré ERP

Este arquivo serve como um guia central para a arquitetura, conceitos de negócio e funcionalidades do sistema Maré ERP.

## 1. Visão Geral e Conceitos de Negócio

- **Organização:** A entidade principal que agrupa empresas e usuários. É o nível mais alto de acesso.
- **Empresa:** Uma entidade de negócio (com CNPJ) que pertence a uma `Organizacao`. A maioria dos dados (clientes, produtos, pedidos) é vinculada a uma empresa.
- **Usuário/Membro:** Usuários que pertencem a uma organização e têm acesso às suas empresas. A relação é gerenciada pela tabela `MembroOrganizacao`.
- **Multi-Empresa:** O sistema permite que um usuário transite entre diferentes empresas de sua organização através de um seletor no cabeçalho. Também é possível ter uma visão consolidada de dados de todas as empresas.

## 2. Estrutura do Projeto Detalhada

- `app/`: Código principal da aplicação Next.js (App Router).
  - `(auth)/`: Grupo de rotas para páginas de autenticação (login, cadastro, etc.). Não afeta a URL.
  - `(dashboard)/`: Grupo de rotas para as páginas do painel principal, que compartilham o mesmo layout (`layout.tsx`).
    - `layout.tsx`: Layout principal do dashboard, que inclui a `Sidebar` e o `Header`.
    - `page.tsx`: Página inicial do dashboard.
    - `clientes/`, `estoque/`, etc.: Sub-rotas para cada módulo do sistema.
  - `api/`: Rotas de API do backend, seguindo a estrutura de pastas para definir os endpoints.
  - `components/`: Componentes React reutilizáveis em toda a aplicação.
    - `ui/`: Componentes de UI genéricos (Botão, Input, etc.).
  - `contexts/`: Contextos React para gerenciamento de estado global.
    - `CompanyContext.tsx`: Gerencia a organização do usuário, a lista de empresas e a empresa selecionada.
    - `DashboardDataProvider.tsx`: Fornece os dados principais para as páginas do dashboard (clientes, produtos, etc.), reagindo à mudança de empresa selecionada.
  - `lib/`: Funções e utilitários.
    - `auth.ts`: Lógica central de autenticação, permissões e o HOC `withAuth`.
    - `prisma.ts`: Instância e exportação do cliente Prisma.
- `prisma/`:
  - `schema.prisma`: Definição de todo o modelo de dados do banco de dados.
  - `migrations/`: Pasta com o histórico de alterações do esquema do banco de dados.
- `scripts/`:
  - `seed.ts`: Script para popular o banco de dados com dados de teste.
- `public/`: Arquivos estáticos (imagens, logos, etc.).
- `progresso.md`: Log de atualizações e refatorações.
- `DOCUMENTACAO.md`: Este arquivo.

## 3. Modelo de Dados (Prisma Schema)

- **`Organizacao`**: Contém `id` e `nome`. Relaciona-se com `Empresa` e `MembroOrganizacao`.
- **`Empresa`**: Contém dados da empresa (nome, CNPJ, etc.) e pertence a uma `Organizacao`.
- **`Usuario`**: Dados do usuário (nome, email, etc.).
- **`MembroOrganizacao`**: Tabela de junção que conecta `Usuario` e `Organizacao`, definindo o papel (`role`) do usuário na organização.
- **`Pedido`**: Representa um pedido de venda ou orçamento. Possui um campo `usuarioId` que o relaciona ao `Usuario` que o criou.
- A maioria dos outros modelos (ex: `Cliente`, `Produto`, `TransacaoFinanceira`) possui uma relação direta com `Empresa`.

## 4. Autenticação e Permissões

- **Autenticação:** A lógica é centralizada no arquivo `app/lib/auth.ts`. As rotas de API são protegidas usando a High-Order Component (HOC) `withAuth`.
- **Papéis (Roles) na Organização:**
  - `ADMIN`: Acesso total à organização.
  - `GESTOR`: Pode gerenciar a maioria dos recursos, incluindo convidar novos membros.
  - `OPERADOR`: Acesso a funcionalidades específicas (a ser definido em mais detalhes).
  - `VISUALIZADOR`: Acesso somente leitura.
- **Controle de Acesso:** O middleware `withAuth` verifica o token JWT do usuário, valida seu acesso à organização e injeta um `context` com os dados de autenticação (userId, organizacaoId, role) no handler da rota.

## 5. Mapa de Funcionalidades e Sugestões

Esta seção descreve os principais módulos da aplicação, suas funcionalidades e sugestões de melhorias.

### Módulo: Dashboard (`/dashboard`)
- **Propósito:** Fornecer uma visão geral e consolidada das informações mais importantes da(s) empresa(s).
- **Funcionalidades Atuais:** Página principal do dashboard (atualmente vazia).
- **Sugestões de Melhoria:**
  - **Layout:** Usar um grid system (ex: CSS Grid) para organizar os cards e gráficos de forma responsiva.
  - **Cards de KPI (Key Performance Indicator):**
    - **Vendas do Mês:** `SUM(pedido.valorTotal) WHERE status = 'VENDIDO' AND dataPedido no mês atual`.
    - **Orçamentos em Aberto:** `COUNT(pedido.id) WHERE status = 'ORCAMENTO'`.
    - **Contas a Receber (Vencido):** `SUM(transacao.valor) WHERE tipo = 'RECEITA' AND status = 'ATRASADA'`.
    - **Contas a Pagar (Hoje):** `SUM(transacao.valor) WHERE tipo = 'DESPESA' AND dataVencimento = hoje`.
    - **Estoque Baixo:** `COUNT(produto.id) WHERE quantidadeEstoque <= estoqueMinimo`.
  - **Gráficos:**
    - **Vendas por Período:** Gráfico de linhas mostrando o total de vendas por dia/semana/mês.
    - **Top 5 Clientes:** Gráfico de barras com os 5 clientes que mais compraram.
    - **Top 5 Produtos:** Gráfico de pizza com os 5 produtos mais vendidos.
  - **Feed de Atividades:**
    - Uma lista em tempo real (ou com polling) das últimas ações importantes: `Pedido X criado`, `Cliente Y cadastrado`, `Produto Z com estoque baixo`.

### Módulo: Vendas (`/vendas`)
- **Propósito:** Gerenciar todo o ciclo de vida de vendas, desde o orçamento até a conclusão do pedido.
- **Funcionalidades Atuais:** Listagem e criação de pedidos.
- **Sugestões de Melhoria:**
  - **Página de Listagem:**
    - **Filtros Avançados:** Adicionar filtros por cliente, status, período e valor.
    - **Busca Rápida:** Implementar um campo de busca que pesquise pelo número do pedido ou nome do cliente.
    - **Ações Rápidas:** Adicionar botões na listagem para `Clonar Pedido`, `Gerar PDF` e `Marcar como Vendido`.
  - **Página de Criação/Edição:**
    - **Componente de Itens:** Melhorar a interface de adição de itens ao pedido, permitindo buscar produtos do estoque com autocomplete.
    - **Cálculo Automático:** Garantir que o valor total seja recalculado automaticamente ao adicionar/remover/editar itens.
    - **Salvar como Rascunho:** Permitir que um orçamento seja salvo como rascunho antes de ter todos os dados preenchidos.
  - **Visualização Kanban:**
    - Criar uma rota `/vendas/funil` que mostre os pedidos em colunas (Orçamento, Negociação, Vendido, Recusado), permitindo arrastar e soltar para mudar o status.

### Módulo: Clientes (`/clientes`)
- **Propósito:** Gerenciar a base de clientes da empresa.
- **Funcionalidades Atuais:** Listagem e criação de clientes.
- **Sugestões de Melhoria:**
  - **Página de Detalhes do Cliente:**
    - **Layout em Abas:** Separar as informações em abas: `Dados Cadastrais`, `Histórico de Pedidos`, `Financeiro (Contas a Receber)`.
    - **Mapa de Endereço:** Integrar com uma API de mapas (Google Maps, OpenStreetMap) para mostrar a localização do cliente.
  - **Formulário de Cliente:**
    - **Busca de CEP:** Integrar com uma API (ex: ViaCEP) para preencher automaticamente os campos de endereço ao digitar o CEP.
  - **Importação/Exportação:**
    - **Template de Importação:** Fornecer um arquivo de modelo (CSV/Excel) para o usuário preencher e importar.
    - **Validação de Dados:** Durante a importação, validar os dados e mostrar um relatório de erros ao final.

### Módulo: Estoque (`/estoque`)
- **Propósito:** Controlar os produtos e serviços, bem como suas quantidades e movimentações.
- **Funcionalidades Atuais:** Listagem e criação de produtos.
- **Sugestões de Melhoria:**
  - **Página de Detalhes do Produto:**
    - Incluir um card com o histórico de preços do produto.
    - Mostrar um gráfico com a evolução da quantidade em estoque ao longo do tempo.
  - **Movimentação Manual:**
    - Criar um modal ou página dedicada para `Entrada`, `Saída` e `Ajuste` de estoque.
    - O campo `observacao` na `MovimentacaoEstoque` é importante para justificar os ajustes.
  - **Composição de Produtos:**
    - Criar uma interface para gerenciar o modelo `ComponenteProduto`, permitindo definir que um "Produto A" é composto por "2x Produto B" e "1x Produto C".
    - Ao dar saída no estoque do "Produto A", o sistema deveria automaticamente dar baixa no estoque de seus componentes.

### Módulo: Financeiro (`/financeiro`)
- **Propósito:** Gerenciar as transações financeiras, contas a pagar e a receber.
- **Funcionalidades Atuais:** Listagem e criação de transações.
- **Sugestões de Melhoria:**
  - **Visão Geral:**
    - Criar uma página inicial para o financeiro com um resumo do saldo das contas, e gráficos de receitas vs. despesas.
  - **Contas a Pagar/Receber:**
    - Implementar a baixa de pagamentos em lote (selecionar várias contas e marcá-las como pagas).
    - Adicionar a funcionalidade de juros e multas para contas atrasadas.
  - **Categorias:**
    - Permitir que o usuário crie e gerencie categorias de transações (ex: "Material de Escritório", "Salários", "Venda de Produto"). Isso permitirá relatórios mais detalhados.

### Módulo: Configurações (`/configuracoes`)
- **Propósito:** Permitir a customização e gerenciamento da organização, empresas e usuários.
- **Funcionalidades Atuais:** Páginas para gerenciar a empresa e a equipe (membros).
- **Sugestões de Melhoria:**
  - **Gestão de Permissões:**
    - Criar uma matriz de permissões (tabela com módulos nas linhas e ações nas colunas: `criar`, `visualizar`, `editar`, `excluir`).
    - Permitir que o `ADMIN` crie perfis de permissão (ex: "Financeiro", "Vendas") e atribua esses perfis aos usuários `OPERADOR`.
  - **Dados da Empresa:**
    - Permitir o upload do logo da empresa, que seria usado no `CompanySelector` e nos PDFs.
  - **Integrações:**
    - Criar uma área para gerenciar integrações com outras ferramentas (ex: gateways de pagamento, plataformas de e-commerce).

## 6. Rotas de API (`app/api`)

| Rota | Método | Descrição | Autenticação |
|---|---|---|---|
| `/api/organizacao/current` | `GET` | Retorna a organização do usuário logado e suas empresas. | `withAuth` |
| `/api/clientes` | `GET`, `POST` | Gerencia o CRUD de clientes. | `withAuth` |
| `/api/estoque/produtos` | `GET`, `POST` | Gerencia o CRUD de produtos. | `withAuth` |
| `/api/membros` | `GET`, `POST` | Gerencia os membros da organização. | `withAuth` |
| `/api/pedidos` | `GET`, `POST` | Gerencia o CRUD de pedidos. | `withAuth` |
| ... | ... | ... | ... |
