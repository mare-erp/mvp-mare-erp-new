# Documentação Maré ERP

Este documento é o guia central e a fonte da verdade para a arquitetura, conceitos de negócio, fluxos de dados e funcionalidades do sistema Maré ERP. Ele foi projetado para ser um projeto vivo, claro e completo, garantindo a construção de um software robusto e escalável.

## 1. Visão Geral e Conceitos de Negócio

O Maré ERP é um sistema de gestão multi-empresa (multi-tenant) projetado para centralizar e simplificar as operações de pequenas e médias empresas. A arquitetura é construída sobre uma hierarquia clara de entidades de negócio.

- **Organização:** A entidade principal que agrupa empresas e usuários. É o nível mais alto de acesso.
- **Empresa:** Uma entidade de negócio (com CNPJ) que pertence a uma `Organizacao`. A maioria dos dados (clientes, produtos, pedidos) é vinculada a uma empresa.
- **Usuário/Membro:** Usuários que pertencem a uma organização e têm acesso às suas empresas. A relação é gerenciada pela tabela `MembroOrganizacao`.
- **Multi-Empresa:** O sistema permite que um usuário transite entre diferentes empresas de sua organização através de um seletor no cabeçalho. Também é possível ter uma visão consolidada de dados de todas as empresas.

### Relações Fundamentais
- Um `Usuario` pode ser membro de várias `Organizacoes`.
- Uma `Organizacao` pode ter vários `Usuarios` (através da tabela `MembroOrganizacao`).
- Uma `Organizacao` pode ter várias `Empresas`.
- Cada `Cliente`, `Produto`, `Pedido` e `TransacaoFinanceira` pertence a uma única `Empresa`. Este vínculo (`empresaId`) é a chave para o isolamento dos dados (tenancy).
- Um `Pedido` é criado por um `Usuario` específico, estabelecendo um vínculo direto (`usuarioId`) para rastreabilidade.

## 2. Estrutura do Projeto Detalhada

O projeto utiliza o App Router do Next.js, que favorece uma organização baseada em funcionalidades e rotas.

- `app/`: Código principal da aplicação Next.js (App Router).
  - `(auth)/`: Grupo de rotas para páginas de autenticação (login, cadastro, etc.). Não afeta a URL.
  - `(dashboard)/`: Grupo de rotas para as páginas do painel principal, que compartilham o mesmo layout (`layout.tsx`).
    - `layout.tsx`: Layout principal do dashboard, que inclui a `Sidebar` e o `Header`.
    - `page.tsx`: Página inicial do dashboard.
    - `clientes/`, `estoque/`, etc.: Sub-rotas para cada módulo do sistema.
  - `api/`: Rotas de API do backend, seguindo a estrutura de pastas para definir os endpoints.
  - `components/`: Componentes React reutilizáveis em toda a aplicação.
    - `ui/`: Componentes de UI genéricos (Botão, Input, etc.).
  - `contexts/`: Contextos React para gerenciamento de estado compartilhado no lado do cliente.
    - `CompanyContext.tsx`: **(Descontinuado/Refatorado)**. A lógica de gerenciamento de empresa foi centralizada.
    - `DataContexts.tsx`: Fornece dados globais para o dashboard (como lista de clientes e produtos para modais) e reage à mudança de empresa selecionada.
  - `lib/`: Funções e utilitários.
    - `auth.ts`: **Arquivo Crítico.** Lógica central de autenticação, autorização, permissões e o HOC `withAuth`.
    - `prisma.ts`: Instância e exportação do cliente Prisma.
- `prisma/`:
  - `schema.prisma`: Definição de todo o modelo de dados do banco de dados.
  - `migrations/`: Pasta com o histórico de alterações do esquema do banco de dados.
- `scripts/`:
  - `seed.ts`: Script para popular o banco de dados com dados de teste.
- `public/`: Arquivos estáticos (imagens, logos, etc.).
- `progresso.md`: Log de atualizações e refatorações.
- `DOCUMENTACAO.md`: Este arquivo.

## 3. Arquitetura e Fluxo de Dados

### 3.1. Arquitetura Frontend
- **Componentização:** O sistema utiliza uma mistura de Server Components e Client Components (`'use client'`).
  - **Server Components:** Usados para páginas que buscam dados iniciais e não possuem alta interatividade (ex: layout principal, páginas estáticas).
  - **Client Components:** Usados para todas as páginas que necessitam de estado, hooks (como `useState`, `useEffect`), e manipulação de eventos (ex: páginas de Vendas, Financeiro, Estoque, e todos os modais).
- **Gerenciamento de Estado:**
  - **Estado Local:** `useState` e `useReducer` são usados para gerenciar o estado específico de cada componente (ex: dados de um formulário, estado de um modal).
  - **Estado Compartilhado:** O `DataContexts` (`app/contexts/DataContexts.tsx`) é utilizado para prover dados que são necessários em múltiplos componentes do dashboard, como a lista de clientes e produtos. Isso evita a necessidade de buscar os mesmos dados repetidamente em diferentes modais. O provedor é inicializado no `layout.tsx` do dashboard.
- **Fluxo de Dados no Frontend:**
  1. Uma página (Client Component) é renderizada.
  2. O hook `useEffect` dispara uma função de busca de dados (`fetchData`).
  3. O estado de `isLoading` é definido como `true`, exibindo um componente de **Skeleton State** para melhorar a UX.
  4. A função `fetch` faz uma chamada para a API interna correspondente (ex: `/api/vendas`).
  5. Ao receber a resposta, os dados são armazenados no estado do componente (ex: `setPedidos(data)`).
  6. `isLoading` se torna `false`, e o componente é re-renderizado com os dados reais.

### 3.2. Arquitetura Backend (API)
- **Route Handlers:** As APIs são construídas usando Route Handlers do Next.js dentro do diretório `app/api/`. Cada rota exporta funções que correspondem aos métodos HTTP (`GET`, `POST`, `PUT`, `DELETE`).
- **Padrão de Autenticação:** Todas as rotas de API são protegidas pelo High-Order Component (HOC) `withAuth` do arquivo `app/lib/auth.ts`. Isso centraliza e padroniza a segurança.
- **Fluxo de uma Requisição à API:**
  1. Uma requisição chega a um endpoint (ex: `GET /api/pedidos`).
  2. O HOC `withAuth` intercepta a requisição.
  3. **`withAuth`** executa as seguintes verificações:
     - Valida o token JWT (do cookie ou do header `Authorization`).
     - Verifica se o usuário (`userId` do token) pertence à organização (`organizacaoId` do token).
     - Se a opção `requireCompany` for `true`, verifica se a empresa (`empresaId` do token) pertence à organização.
     - Se houver falha, retorna um erro 401 (Unauthorized) ou 403 (Forbidden).
  4. Se a autenticação for bem-sucedida, `withAuth` injeta o `AuthContext` (contendo `userId`, `organizacaoId`, `empresaId`, `role`) no handler da rota.
  5. O **handler da rota** executa a lógica de negócio:
     - Valida os dados de entrada (payload ou query params) usando **Zod**.
     - Utiliza o `empresaId` do `AuthContext` para filtrar todas as consultas ao banco de dados com o **Prisma**, garantindo o isolamento dos dados (tenancy).
     - Executa as operações no banco (leitura, escrita, etc.).
     - Retorna a resposta em formato JSON com o status HTTP apropriado.

## 3. Dependências Principais

- **Next.js:** Framework principal da aplicação (frontend e backend).
- **React:** Biblioteca para construção da interface de usuário.
- **Prisma:** ORM para interação com o banco de dados PostgreSQL.
- **Tailwind CSS:** Framework de CSS para estilização.
- **Lucide React:** Biblioteca de ícones.
- **Zod:** Validação de schemas e tipos de dados.
- **jsonwebtoken & bcryptjs:** Para geração/verificação de tokens de autenticação e hashing de senhas.

## 4. Modelo de Dados (Prisma Schema)

O `schema.prisma` é a fonte da verdade para a estrutura do banco de dados. As relações são projetadas para garantir a integridade e o isolamento dos dados.

- **`Organizacao`**: Contém `id` e `nome`. Relaciona-se com `Empresa` e `MembroOrganizacao`.
- **`Empresa`**: Contém dados da empresa (nome, CNPJ, etc.) e pertence a uma `Organizacao`.
- **`Usuario`**: Dados do usuário (nome, email, etc.).
- **`MembroOrganizacao`**: Tabela de junção que conecta `Usuario` e `Organizacao`, definindo o papel (`role`) do usuário na organização.
- **`Pedido`**: Representa um pedido de venda ou orçamento.
  - `empresaId`: Garante que o pedido pertence a uma empresa.
  - `usuarioId`: Relaciona-se ao `Usuario` que o criou (vendedor).
  - `clienteId`: Relaciona-se ao `Cliente` para quem o pedido foi feito.
- A maioria dos outros modelos (ex: `Cliente`, `Produto`, `TransacaoFinanceira`) possui uma relação direta com `Empresa`.

## 5. Autenticação e Permissões

- **Fluxo de Autenticação:**
  1. O usuário envia email/senha para a rota `/api/auth/login`.
  2. O backend verifica as credenciais.
  3. Se válidas, um **token JWT** é gerado contendo o `TokenPayload` (`userId`, `organizacaoId`, `empresaId` selecionada, `role`).
  4. O token é retornado para o cliente e armazenado em um cookie (`auth-token`).
  5. Em todas as requisições subsequentes para a API, o frontend envia o token (via cookie, que é automático, ou via header `Authorization: Bearer <token>`).
- **Autorização (`withAuth`):** O HOC `withAuth` é o guardião de todas as APIs. Ele não apenas valida o token, mas também verifica se o usuário tem permissão para acessar os recursos da organização e da empresa solicitada, usando as funções `verifyOrganizationAccess` e `verifyCompanyAccess`.
- **Papéis (Roles) na Organização:**
  - `ADMIN`: Acesso total à organização. Pode gerenciar empresas, membros e todas as configurações. É o "dono" da assinatura.
  - `GESTOR`: Acesso amplo, pode gerenciar a maioria dos recursos da(s) empresa(s) a que tem acesso, incluindo convidar novos membros. Não pode alterar o `ADMIN`.
  - `OPERADOR`: Acesso limitado a funcionalidades específicas (ex: criar um pedido, dar baixa em uma conta). As permissões exatas devem ser configuráveis.
  - `VISUALIZADOR`: Acesso somente leitura a informações selecionadas.
- **Controle de Acesso:**
  - **Nível de Rota:** O `withAuth` protege o acesso à rota como um todo.
  - **Nível de Dados:** Dentro de cada handler, o uso do `empresaId` vindo do `AuthContext` em todas as cláusulas `where` do Prisma é **mandatório** para garantir que um usuário de uma empresa não acesse dados de outra.
  - **Sugestão:** Implementar um sistema de permissões mais granular para o `OPERADOR`, onde o `ADMIN` possa definir explicitamente quais módulos e ações (criar, ler, atualizar, deletar) cada operador pode executar.

## 6. Filtros e Busca nas APIs

As rotas de API de listagem (`GET`) foram padronizadas para aceitar os seguintes query parameters:

- **`empresaId`**:
  - **(Descontinuado para uso externo)** O `empresaId` agora é primariamente obtido do token JWT, garantindo que o usuário só acesse dados da empresa em que está "logado" no seletor do header. A API usa o `empresaId` do `AuthContext`.
  - Se nenhum `empresaId` é fornecido, a API retorna dados de **todas** as empresas da organização do usuário.
- **`search`**: Em rotas como `/api/estoque/produtos`, permite uma busca textual em campos relevantes (nome, SKU, etc.).
- **`page` e `limit`**: Para paginação dos resultados.
- **Outros filtros específicos:** Rotas podem ter filtros adicionais, como `status` na API de pedidos.

## 7. Escopo do Projeto (Necessário vs. Sugestões)

Esta seção ajuda a diferenciar o que é essencial para o funcionamento básico (MVP) do que são melhorias futuras.

### Essencial (MVP)
- **Autenticação e Multi-Empresa:** Login, cadastro, e a capacidade de um `ADMIN` criar sua organização e empresas.
- **CRUD Básico de Módulos Principais:**
  - **Clientes:** Criar, listar, editar e excluir clientes.
  - **Produtos/Serviços:** Criar, listar, editar e excluir itens.
  - **Vendas:** Criar um pedido/orçamento, adicionando itens e associando a um cliente. Listar os pedidos.
- **Gestão de Equipe:** `ADMIN` ou `GESTOR` poder convidar e remover usuários da organização.
- **Módulo Financeiro Básico:** CRUD de transações (contas a pagar/receber).

### Sugestões (Melhorias Futuras)
- **Dashboard com KPIs e Gráficos:** Como detalhado no "Mapa de Funcionalidades".
- **Módulo Financeiro Completo:** Fluxo de caixa, recorrências, conciliação.
- **Permissões Granulares:** Sistema de perfis de permissão para `OPERADOR`.
- **Relatórios:** Geração de relatórios customizáveis (vendas por período, clientes mais valiosos, etc.).
- **Integrações:** Conexão com outras ferramentas.
- **Logs de Auditoria:** Uma interface para visualizar os logs que já estão sendo salvos no banco de dados.
- **Notificações:** Sistema de notificações em tempo real (ex: para estoque baixo ou novos pedidos) usando WebSockets ou Server-Sent Events.

## 8. Mapa de Funcionalidades (Detalhado)

*(Esta seção pode ser mesclada com a anterior ou mantida separada para maior detalhe)*

### Módulo: Vendas (`/vendas`)
- **Propósito:** Gerenciar todo o ciclo de vida de vendas.
- **Funcionalidades Atuais:** Listagem e criação de pedidos. Filtro por usuário.
- **Sugestões de Melhoria:**
  - **Funil de Vendas (Kanban):** Visualização em colunas para `status` do pedido.
  - **Edição e Clonagem de Pedidos:** Implementar a funcionalidade no frontend. (PUT /api/vendas/[id])
  - **Geração de PDF:** Geração de PDF do pedido/orçamento com layout profissional.

... (manter os outros módulos como estavam, pois já estão bem detalhados)

## 9. Rotas de API (`app/api`)

| Rota | Método | Descrição | Autenticação |
|---|---|---|---|
| `/api/organizacao/current` | `GET` | Retorna a organização do usuário logado e suas empresas. | `withAuth` |
| `/api/clientes` | `GET`, `POST` | Gerencia o CRUD de clientes. | `withAuth` |
| `/api/estoque/produtos` | `GET`, `POST` | Gerencia o CRUD de produtos. | `withAuth` |
| `/api/membros` | `GET`, `POST` | Gerencia os membros da organização. | `withAuth` |
| `/api/pedidos` | `GET`, `POST` | Gerencia o CRUD de pedidos. | `withAuth` |
| ... | ... | ... | ... |
