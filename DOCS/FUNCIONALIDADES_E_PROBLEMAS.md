# Maré ERP — Funcionalidades e Problemas Atuais

## Front-End

- Tecnologias
  - Next.js (App Router) com páginas em `app/*` e client components (`'use client'`).
  - Tailwind CSS; componentes reutilizáveis em `app/components/ui/*`.

- Funcionalidades
  - Autenticação: telas de Login e Sign-up, com redirecionamento para setup inicial da empresa.
    - Páginas: `app/(auth)/login/page.tsx`, `app/(auth)/sign-up/page.tsx`, `app/(auth)/setup-empresa/page.tsx`.
  - Dashboard e navegação: layouts e navegação por módulos.
    - Páginas/Layout: `app/(dashboard)/layout.tsx`, `app/(dashboard)/page.tsx`, `app/(dashboard)/components/*`.
  - Vendas: listagem com filtros (período, vendedor), métricas, modais de criação/edição, clonar e gerar PDF.
    - Páginas/Componentes: `app/(dashboard)/vendas/page.tsx`, `app/(dashboard)/vendas/components/pedidoModal.tsx`.
  - Clientes: listagem com busca, CRUD e validações.
    - Páginas/Componentes: `app/(dashboard)/clientes/page.tsx`, `app/(dashboard)/clientes/novo/page.tsx`, `app/(dashboard)/clientes/components/ClientForm.tsx`.
  - Estoque: cadastro/edição de produtos e métricas básicas.
    - Páginas/Componentes: `app/(dashboard)/estoque/page.tsx`, `app/(dashboard)/estoque/components/ProdutoModal.tsx`.
  - Financeiro: cards de resumo (entradas, saídas, saldo, vencimentos) e listagem com filtros; modal de transação.
    - Páginas/Componentes: `app/(dashboard)/financeiro/page.tsx`, `app/(dashboard)/financeiro/components/TransacaoModal.tsx`.

- Pontos Pendentes/Problemas (Front-End)
  - Seletor de Empresa: implementação robusta pendente; refatorações anteriores causaram erros e foram revertidas.
    - Risco: seletor visual divergir do `empresaId` efetivo do token.
  - Vendas: filtros de data e integração com resumo foram corrigidos e funcionam; recomenda-se adicionar testes para evitar regressões.

- Próximas Ações (Front-End)
  - Consolidar seletor de empresa integrado ao fluxo de login e contexto de dados (sincronizado com token).
  - Adicionar testes de UI/integração para Vendas e Financeiro.
  - Refinar UX de modais e estados vazios; tratar erros de rede de forma consistente.

## Back-End

- Tecnologias/Arquitetura
  - Rotas API do Next.js em `app/api/*`.
  - Prisma ORM com PostgreSQL; schema em `prisma/schema.prisma`.
  - Autenticação JWT; validação e proteção via helper `withAuth` em `app/lib/auth.ts`.
  - Zod e bcrypt para validação e senhas.

- Domínio e Multi-tenant
  - Organização > Empresa > (Clientes, Produtos, Pedidos, Transações).
  - Isolamento por `empresaId` extraído do token e aplicado nos filtros Prisma.

- Endpoints por Módulo (principais)
  - Autenticação: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/sign-up`.
  - Organização/Empresas: `/api/organizacao`, `/api/organizacao/current`, `/api/organizacoes`, `/api/organizacoes/[id]/empresas`, `/api/empresa`, `/api/empresa/current`.
  - Vendas: `/api/vendas`, `/api/vendas/summary`, `/api/vendas/[id]`, `/api/vendas/[id]/pdf`, `/api/vendas/[id]/clone`.
  - Clientes: `/api/clientes`, `/api/clientes/[id]`, `/api/clientes/quick-create`.
  - Estoque: `/api/estoque/produtos`, `/api/estoque/produtos/[id]`, `/api/estoque/metricas`.
  - Financeiro: `/api/financeiro/dashboard-data`, `/api/financeiro/transacoes`, `/api/financeiro/transacoes/[id]`.
  - Usuários/Membros: `/api/usuarios`, `/api/usuarios/[id]`, `/api/membros`, `/api/membros/[id]`.

- Problemas e Inconsistências (Back-End)
  - Divergência de schema/documentação: campo `validadeOrcamento` ainda existe em `Pedido`.
    - Evidências: `prisma/schema.prisma:244` e `prisma/migrations/20250928221916_add_validade_orcamento_to_pedido/migration.sql`.
    - Decisão necessária: manter ou remover; alinhar schema, migrações, APIs e documentos.
  - Financeiro — contas bancárias/transferências: endpoints e lógica ainda não implementados; requer modelo `ContaBancaria` e vínculo `contaBancariaId` em `TransacaoFinanceira` (confirmar/ajustar schema) com transações atômicas.
  - Incidentes prévios em filtros de data de Vendas: já corrigidos em `/api/vendas` e `/api/vendas/summary` (inclusão de `dataFim` e filtros no `where`).
  - Conflito `DATABASE_URL` em dev: variável de ambiente do sistema sobrepondo `.env`, causando `PrismaClientInitializationError`.

- Próximas Ações (Back-End)
  - Definir e aplicar migração para resolver `validadeOrcamento` (remoção ou padronização), atualizando APIs e geradores de PDF.
  - Implementar módulo de contas bancárias e transferência com consistência transacional.
  - Adicionar testes de API para Vendas (filtros e resumo) e Financeiro.
  - Revisar inicialização de ambiente para evitar conflitos de `DATABASE_URL`.

## Outro

- Codificação de caracteres
  - Há arquivos Markdown com acentuação corrompida no Windows; padronizar UTF‑8 (sem BOM) e ajustar configurações do editor.

- Referências Úteis
  - README: `README.md`
  - Documentação Geral: `DOCUMENTACAO.md`
  - Correções e histórico: `CORREÇÕES_IMPLEMENTADAS.md`, `progresso.md`
  - Schema Prisma: `prisma/schema.prisma`

- Observação
  - Se desejar, posso alinhar o schema Prisma e corrigir a codificação dos `.md` em seguida.
