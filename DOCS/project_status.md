# Project Status & Priorities

Consolidated view of outstanding issues, priorities, and recent updates for the Maré ERP codebase.

## Recent Updates
- Fixed `/api/auth/me` to use `withAuth` and Prisma correctly, restoring the session fetch after sign-up.
- Removed the duplicate `/api/auth/signup` route and aligned the empresa setup flow with `/api/empresa`.
- Patched the dashboard header to load the logged-in user when props are absent, and masked CNPJ values in the company selector.
- Added Prisma migration `20250215120000_add_calendar_kanban` for `KanbanStage`/`CalendarEvent` models; run `npx prisma migrate deploy` against the target database.
- Cleaned JSX issues in calendário list view and calendar loading guard, enabling `/calendario` to compile.

## Critical Issues (P0)
- **Auth helper cleanup**: Several routes still import `@/app/lib/verifyAuth` (`app/api/organizacao*`, `app/api/organizacoes*`, `app/api/pedidos/pdf-layout`, `app/api/financeiro/transacoes/[id]`). Either recreate the helper or migrate all to `app/lib/auth`. The same files also depend on `logAuditoria` re-exported ali.
- **`withAuth` naming collision**: In `app/lib/auth.ts` the local constant shadows the `hasPermission` function (`const hasPermission = hasPermission(...)`). Rename the variable before permission checks.
- **Schema vs. code drift**: UI/APIs expect fields missing from Prisma (`Organizacao.adminId`, `Empresa.logoUrl`, `Empresa.endereco`). Decide whether to add the columns (with migrations/seed updates) or strip those references (e.g., header/company selector, organization APIs, PDF layout).
- **Hard-coded tenancy**: Quick-create endpoints (`app/api/clientes/quick-create/route.ts`, `app/api/produtos/quick-create/route.ts`) persist `empresaId: '1'`. `app/api/pedidos/next-number/route.ts` ignores tenant context and lacks auth protection. Update all to read `context.empresaId`.
- **Membro APIs**: `app/api/membros/[id]/route.ts` references `prisma.membro` (model inexistente) e permite somente `GESTOR`. Ajustar para usar `MembroOrganizacao`, respeitar roles e compartilhar middleware com a coleção. Também revisar o DELETE em `app/api/membros/route.ts` para delegar ao handler `[id]`.
- **`Pedido.validadeOrcamento`**: Docs antigos afirmam remoção, porém schema/endpoints ainda utilizam. Definir manter (documentar regras) ou dropar via migração atualizando PDFs/UI.
- **Calendar data availability**: Após aplicar a nova migração, garantir seed/test data para `KanbanStage`/`CalendarEvent` a fim de alimentar `/calendario`.

## High Priority (P1)
- **Company selector flow**: Implementar endpoint autenticado para troca de empresa, reemitindo JWT e sincronizando contexts (Header/DataProvider).
- **HTTP client wrapper**: Criar helper de fetch compartilhado (`app/lib/http.ts`) com parse de JSON, normalização de erros, retries e refresh de auth.
- **Validação robusta**: Adicionar schemas Zod para rotas mutadoras (Financeiro, Estoque, Vendas) e refletir no frontend.
- **Paginação & performance**: Padronizar paginação/sorting nas listas (Vendas, Clientes, Estoque, Financeiro) e expor `page/limit/total` nas APIs.
- **Financeiro gap**: Implementar contas bancárias e fluxo de transferências (`ContaBancaria`, vinculação em `TransacaoFinanceira`, lógica de dupla entrada).
- **Segurança**: Revisar flags do cookie JWT, adicionar rate limiting em endpoints sensíveis e definir estratégia de CSRF.
- **CI pipeline**: Adicionar GitHub Action (ou equivalente) para instalar, lint/test/build, `prisma generate` e smoke tests com Postgres.

## Medium Priority (P2)
- Melhorar logs/telemetria (logs estruturados, request IDs, tratamento consistente de erros).
- Automatizar verificação de dependências (`npm audit`, Renovate/Dependabot).
- Hardenizar Dockerfile/imagem (multi-stage, usuário não-root, healthchecks).
- Planejar backups/monitoramento (rotina `pg_dump`, checks de uptime, agregação de logs).

## Feature Coverage Snapshot
- **Autenticação & Setup**: Login/sign-up funcionam; setup de empresa atualiza `Empresa` via `/api/empresa`. Troca de empresa ainda manual (ver P1).
- **Dashboard**: Layout ok, cards exibem placeholders; precisa ligar métricas reais.
- **Clientes/Produtos**: CRUD e formulários modais ativos; endpoints quick-create precisam correção de tenancy.
- **Vendas**: Listagem/resumo operacionais; UI carece de ações (clonar, PDF, editar) mesmo com APIs disponíveis.
- **Estoque**: CRUD via modal e métricas básicas; reforçar isolamento de tenant e paginação.
- **Financeiro**: Cards + modal de transações prontos; contas bancárias/transferências ainda não implementadas.
- **Calendário/Kanban**: Componentes carregam (calendar, kanban, list). Necessário garantir dados seed após migração.

## Open Questions / Decisions Needed
- Manter ou remover campos ausentes (`Organizacao.adminId`, `Empresa.logoUrl/endereco`, `Pedido.validadeOrcamento`)?
- Fluxo de troca de empresa: reload completo ou apenas invalidar caches? Como sincronizar data contexts?
- Transporte de auth: somente cookies ou aceitar `Authorization` header simultaneamente?
- Permissões do perfil Operador: onde versionar/gerenciar políticas granulares (DB, arquivo, UI)?
- Roadmap Financeiro: como rastrear saldo por conta, suporte multi-moeda?
- Segurança/CSP: mapear assets de terceiros que exigem whitelist.
- Retenção/logs: política de PII e prazo máximo de retenção.

## Immediate Action Items
+ Migrar rotas restantes para `app/lib/auth` e resolver o conflito de `hasPermission`.
+ Alinhar o schema Prisma com as expectativas do código (adicionar colunas ou remover referências).
+ Corrigir endpoints sensíveis à tenancy (`quick-create`, next-number, membros) para usar contexto autenticado.
+ Priorizar os itens de P1 (troca de empresa, wrapper de fetch, validações, finance/segurança).
+ Executar `npx prisma migrate deploy` para aplicar a nova migração de calendário/kanban e garantir dados seed.
