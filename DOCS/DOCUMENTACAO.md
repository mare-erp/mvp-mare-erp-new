# Documentação Maré ERP

Este documento é o guia central e a fonte da verdade para a arquitetura, conceitos de negócio, fluxos de dados e funcionalidades do sistema Maré ERP. Ele foi projetado para ser um projeto vivo, claro e completo, garantindo a construção de um software robusto e escalável.
Este documento é o guia central e a **fonte da verdade** para a arquitetura, conceitos de negócio, fluxos de dados e funcionalidades do sistema Maré ERP. Ele foi projetado para ser um projeto vivo, claro e completo, garantindo a construção de um software robusto, escalável e de fácil manutenção.

## 1. Visão Geral e Conceitos de Negócio

O Maré ERP é um sistema de gestão multi-empresa (multi-tenant) projetado para centralizar e simplificar as operações de pequenas e médias empresas. A arquitetura é construída sobre uma hierarquia clara de entidades de negócio.
O Maré ERP é um sistema de gestão **multi-empresa (multi-tenant)** projetado para centralizar e simplificar as operações de pequenas e médias empresas. A arquitetura é construída sobre uma hierarquia clara de entidades de negócio.

- **Organização:** A entidade principal que agrupa empresas e usuários. É o nível mais alto de acesso.
- **Empresa:** Uma entidade de negócio (com CNPJ) que pertence a uma `Organizacao`. A maioria dos dados (clientes, produtos, pedidos) é vinculada a uma empresa.
- **Organização:** A entidade principal que agrupa empresas e usuários. É o nível mais alto de acesso. Uma organização representa o cliente que assina o serviço.
- **Empresa:** Uma entidade de negócio (com CNPJ) que pertence a uma `Organizacao`. A maioria dos dados (clientes, produtos, pedidos) é vinculada a uma empresa. Cada empresa funciona como um "inquilino" (tenant) isolado dentro da organização.
- **Usuário/Membro:** Usuários que pertencem a uma organização e têm acesso às suas empresas. A relação é gerenciada pela tabela `MembroOrganizacao`.
- **Multi-Empresa:** O sistema permite que um usuário transite entre diferentes empresas de sua organização através de um seletor no cabeçalho. Também é possível ter uma visão consolidada de dados de todas as empresas.
- **Vendedor:** Não é um modelo de dados separado. O "Vendedor" de um pedido é o `Usuario` que o criou. A ligação é feita pelo campo `usuarioId` no modelo `Pedido`.

### Relações Fundamentais
- Um `Usuario` pode ser membro de várias `Organizacoes`.
- Uma `Organizacao` pode ter vários `Usuarios` (através da tabela `MembroOrganizacao`).
- Uma `Organizacao` pode ter várias `Empresas`.
- Cada `Cliente`, `Produto`, `Pedido` e `TransacaoFinanceira` pertence a uma única `Empresa`. Este vínculo (`empresaId`) é a chave para o isolamento dos dados (tenancy).
- Um `Pedido` é criado por um `Usuario` específico, estabelecendo um vínculo direto (`usuarioId`) para rastreabilidade.
- Um `Pedido` é criado por um `Usuario` específico (o vendedor), estabelecendo um vínculo direto (`usuarioId`) para rastreabilidade e filtros.

## 2. Estrutura do Projeto Detalhada

O projeto utiliza o App Router do Next.js, que favorece uma organização baseada em funcionalidades e rotas.
O projeto utiliza o **App Router** do Next.js, que favorece uma organização baseada em funcionalidades e rotas.

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
 
## 3. Arquitetura e Fluxo de Dados (O Mapa Global)

## 3. Arquitetura e Fluxo de Dados
O sistema é uma aplicação Next.js full-stack, onde o mesmo projeto contém o Frontend (React) e o Backend (API Routes).

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
### 3.1. As Três Camadas

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
1.  **Frontend (Camada de Apresentação)**
    - **O quê:** Tudo que o usuário vê e interage no navegador.
    - **Tecnologias:** React, Next.js (App Router), Tailwind CSS.
    - **Responsabilidades:**
        - Renderizar a interface do usuário (UI).
        - Gerenciar o estado da UI (modais abertos, dados de formulários, filtros selecionados).
        - Lidar com eventos do usuário (cliques, digitação).
        - Fazer requisições HTTP para o Backend (API) para buscar ou enviar dados.
        - Apresentar estados de carregamento (skeletons) e de erro.
    - **Onde vive:** Principalmente nos arquivos `page.tsx` e `components/` dentro de `app/(dashboard)/`.

2.  **Backend (Camada de Lógica e Negócio)**
    - **O quê:** O "cérebro" do sistema que roda no servidor.
    - **Tecnologias:** Next.js (Route Handlers), Zod.
    - **Responsabilidades:**
        - Receber requisições do Frontend.
        - **Autenticação e Autorização:** Verificar se o usuário está logado e se tem permissão para realizar a ação (usando o HOC `withAuth`).
        - **Validação:** Garantir que os dados recebidos são válidos e seguros (usando Zod).
        - **Regras de Negócio:** Executar a lógica principal (ex: calcular total de um pedido, dar baixa em estoque).
        - Orquestrar a comunicação com o Banco de Dados.
    - **Onde vive:** Nos arquivos `route.ts` dentro de `app/api/`.

3.  **Banco de Dados (Camada de Persistência)**
    - **O quê:** Onde os dados são armazenados de forma permanente.
    - **Tecnologias:** PostgreSQL, Prisma (ORM).
    - **Responsabilidades:**
        - Armazenar os dados de forma segura e estruturada.
        - Garantir a integridade dos dados através de relações e restrições.
        - Executar as consultas (queries) solicitadas pelo Backend.
    - **Onde vive:** A estrutura é definida no `prisma/schema.prisma`. O acesso é feito exclusivamente pelo Backend através do Prisma Client.

### 3.2. Fluxo de uma Interação Completa (Exemplo: Criar um Cliente)

Para entender como as camadas se interligam, vamos seguir o fluxo de criação de um novo cliente:

1.  **[FRONTEND]** O usuário clica em "Novo Cliente" na página `/clientes`. Um modal (componente React) é aberto.
2.  **[FRONTEND]** O usuário preenche o formulário e clica em "Salvar".
3.  **[FRONTEND]** A função `handleSubmit` no componente do modal é acionada. Ela monta um objeto `payload` com os dados do formulário.
4.  **[FRONTEND]** A função `fetch` é chamada: `fetch('/api/clientes', { method: 'POST', body: JSON.stringify(payload) })`.
5.  **[BACKEND]** A requisição `POST` chega ao endpoint `app/api/clientes/route.ts`.
6.  **[BACKEND]** O HOC `withAuth` intercepta a requisição:
    - Lê o token JWT do cookie `auth-token`.
    - Valida o token e extrai o `TokenPayload` (`userId`, `organizacaoId`, `empresaId`).
    - Verifica se o usuário tem acesso à organização e à empresa.
    - Se tudo estiver OK, injeta o `AuthContext` e chama o `postHandler`.
7.  **[BACKEND]** Dentro do `postHandler`:
    - O `clienteSchema` (Zod) valida o `body` da requisição. Se for inválido, retorna um erro 400.
    - A lógica de negócio é executada (ex: verificar se o CPF/CNPJ já existe).
    - O Prisma é chamado para criar o cliente: `prisma.cliente.create({ data: { ...payload, empresaId: context.empresaId } })`.
8.  **[BANCO DE DADOS]** O Prisma traduz a chamada para uma query SQL `INSERT INTO "Cliente" (...) VALUES (...)` e a envia para o PostgreSQL.
9.  **[BANCO DE DADOS]** O PostgreSQL insere o novo registro e retorna o sucesso da operação.
10. **[BACKEND]** O Prisma recebe a confirmação e retorna o objeto do novo cliente para o `postHandler`.
11. **[BACKEND]** O `postHandler` envia uma resposta JSON com status `201 Created` e o objeto do novo cliente.
12. **[FRONTEND]** A `Promise` do `fetch` é resolvida. O código verifica se `response.ok` é `true`.
13. **[FRONTEND]** O modal é fechado e a lista de clientes é atualizada (chamando `refetchClientes` ou uma função similar), mostrando o novo cliente na tabela.

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
