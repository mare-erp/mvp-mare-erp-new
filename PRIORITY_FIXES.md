# Maré ERP — Priority Fixes Plan

This action plan lists prioritized fixes and improvements across Front-End, Back-End, Security, and Infrastructure to stabilize and evolve the current app. Priorities: P0 = critical/urgent, P1 = high, P2 = medium.

## Front-End

- P0 — Company Selector: Single source of truth
  - What: Make the selected company deterministic and synced with the auth cookie/JWT.
  - Why: Current selector attempts caused runtime/compile errors and were reverted; risk of UI and token mismatch.
  - How:
    - Add a dedicated API to “switch company” that re-issues the JWT with new `empresaId` and sets the cookie.
    - In the header selector, call the switch endpoint, then invalidate/reload data contexts.
    - Ensure all data providers read the active company from server/session when mounting.
  - References: app/(dashboard)/components/Header.tsx, app/contexts/DataContexts.tsx, app/lib/auth.ts

- P0 — Robust error handling and fetch wrapper
  - What: Centralize fetch with JSON parsing, error normalization, retries for 429/5xx, and auth refresh handling.
  - Why: Inconsistent error states; silent failures make UX brittle.
  - How: Create `app/lib/http.ts` with `apiFetch` that sets credentials, parses errors, and supports abort signals; adopt everywhere.

- P0 — Date filters correctness (Vendas)
  - What: Guarantee inclusive end-of-day filtering and correct ISO formatting from inputs.
  - Why: Previously returned empty data due to end date handling; recently fixed but fragile.
  - How: Normalize to UTC midnight boundaries client-side; keep server inclusive `<= endOfDay` logic; add tests.
  - References: app/(dashboard)/vendas/page.tsx, app/api/vendas/summary/route.ts, app/api/vendas/route.ts

- P1 — Pagination, sorting, and empty states for lists
  - What: Apply consistent pagination/sorting to Vendas, Clientes, Estoque, Financeiro.
  - Why: Prevent oversized payloads and long render lists; improve UX.
  - How: Add page/limit/sort params to APIs; client adds table controls and shows empty/loading states uniformly.

- P1 — Form validation and UX consistency
  - What: Client-side Zod schemas mirroring server validation; standard error display; keyboard/focus management in modals.
  - Why: Prevent invalid payloads and improve accessibility.
  - How: Share validation schemas or generate types; standardize input components for errors.

- P1 — Performance hygiene
  - What: Memoization for derived values, stable callbacks, and list virtualization where needed.
  - Why: Smooth UI under larger datasets.

## Back-End

- P0 — Tenant isolation guarantees
  - What: Enforce `empresaId` filtering in every query for company-scoped resources.
  - Why: Prevent cross-tenant data access.
  - How: Audit handlers with static search, add helper guards, and centralize common `where: { empresaId }` patterns.
  - References: app/lib/auth.ts (withAuth), app/api/**/*

- P0 — Prisma schema alignment: `validadeOrcamento`
  - What: Resolve the conflict about presence/absence of `Pedido.validadeOrcamento`.
  - Why: Docs claim removal, but schema/migration still include it.
  - How: Decide to keep or remove. If remove: write a migration to drop column and update code paths; if keep: update docs and ensure endpoints handle it correctly.
  - Evidence: prisma/schema.prisma:244, prisma/migrations/20250928221916_add_validade_orcamento_to_pedido/migration.sql

- P0 — Financeiro: Accounts and transfers
  - What: Implement Bank Accounts CRUD and Transfers endpoint, and link transactions to accounts.
  - Why: Core finance workflow missing; blocks accurate balances.
  - How: Confirm/add models (`ContaBancaria`, `contaBancariaId` on `TransacaoFinanceira`); implement `/api/financeiro/contas` and `/api/financeiro/transferencias` with atomic Prisma transactions; update modal/UI.

- P0 — Input validation and authorization
  - What: Enforce Zod validation for POST/PUT/PATCH/DELETE and check org/role permissions.
  - Why: Prevent bad data and unauthorized actions.
  - How: Per-route schemas; map roles (ADMIN/GESTOR/OPERADOR/VISUALIZADOR) to allowed actions; fail with 403/422.

- P1 — Pagination and query performance
  - What: Default `limit` and indexed filters for list endpoints.
  - Why: Avoid full-table scans and slow APIs.
  - How: Add composite indexes for common filters (empresaId + status/date), use `take/skip`, return `X-Total-Count`.

- P1 — Observability and stability
  - What: Structured logs, request IDs, error boundaries per handler.
  - Why: Faster debugging and triage.
  - How: Add a small logging util; return sanitized messages to clients; keep stack traces in logs.

## Security

- P0 — Session cookie hardening
  - What: Ensure JWT cookie flags: `HttpOnly`, `Secure` (prod), `SameSite=Lax` or `Strict`, proper `Path` and `Max-Age`.
  - Why: Mitigate XSS/cookie theft and CSRF.
  - How: Review cookie set in app/lib/auth.ts; adjust for env and HTTPS; document behavior.

- P0 — Rate limiting and brute-force protection
  - What: Add per-IP/user limits on `/api/auth/login`, and sensitive endpoints.
  - Why: Prevent credential stuffing and abuse.
  - How: Simple in-memory or KV-based limiter (e.g., token bucket); return 429 and log.

- P0 — CSRF protections for cookie-auth writes
  - What: Add CSRF token for state-changing routes if cookies are used cross-site.
  - Why: Prevent cross-site request forgery.
  - How: Issue CSRF token via cookie/meta and require header `X-CSRF-Token` for mutating requests; validate in withAuth guard.

- P0 — JWT lifecycle
  - What: Short-lived access tokens, optional refresh tokens, and revocation on logout.
  - Why: Limit blast radius of token leakage.
  - How: Include `exp`, store `jti` and revoke list (DB or cache), rotate on refresh.

- P1 — Secrets and logging hygiene
  - What: No secrets or tokens in logs; mask PII; centralized error reporting.
  - How: Scrub logs, add allowlist of fields; hook into a logger or APM.

- P1 — Security headers and CORS
  - What: Apply HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and a CSP; keep CORS strict.
  - How: Configure in `middleware.ts` for all routes; only allow same-origin unless explicitly needed.

- P1 — Dependency health
  - What: Routine `npm audit`, update vulnerable packages, and pin critical versions.
  - How: Add CI job and Renovate/Dependabot.

## Infrastructure

- P0 — Environment management and migrations
  - What: Eliminate `DATABASE_URL` conflicts; reliable migrations per environment.
  - Why: Prevents `PrismaClientInitializationError` and drift.
  - How: Use `.env.local` for dev; remove machine-level `DATABASE_URL`; in prod run `prisma migrate deploy` on startup.
  - References: progresso.md, prisma/schema.prisma

- P0 — CI pipeline (typecheck, lint, test, build)
  - What: Ensure every PR runs: install, build, Prisma generate, unit/API tests, and (optionally) e2e smoke.
  - Why: Catch regressions early.
  - How: Add GitHub Actions (or equivalent) with Node 18+, Postgres service, `prisma migrate dev` (test DB), and test scripts.

- P1 — Container hardening and image size
  - What: Multi-stage Dockerfile producing minimal runtime; non-root user; proper `NODE_ENV` and cache.
  - How: Use `next build` + standalone output; run `node server.js`/`next start` as non-root; add healthcheck.
  - References: Dockerfile, docker-compose.yml

- P1 — Backups, monitoring, and logs
  - What: Nightly Postgres backups and restore docs; basic uptime/metrics; structured logs aggregation.
  - How: `pg_dump` + retention in object storage; uptime checks; export metrics or integrate with hosted monitoring; centralize logs.

- P1 — Runtime reverse proxy and TLS
  - What: Terminate TLS, enable gzip/br, basic rate limit and request size limits.
  - How: Nginx/Caddy with hardened defaults; forward headers to Next app.

## Cross-Cutting Tests (Recommended)

- API tests for Vendas filters (date inclusivity, vendedor filter, pagination) and Financeiro CRUD.
- Auth flow tests (login, switch company, logout) including cookie flag assertions.
- PDF generation smoke (returns 200, content-type/application/pdf).
- Regression tests for Clientes/Estoque basic CRUD and search queries.

## Milestone Proposal (4–6 weeks)

- Week 1: P0 Front (selector, fetch wrapper, date filters) + P0 Infra env/migrations.
- Week 2: P0 Back (schema alignment) + P0 Security (cookie flags, rate limit, CSRF baseline).
- Week 3–4: P0 Financeiro accounts/transfers + API/UI; add core tests.
- Week 5–6: P1 pagination/perf, logging/observability, container hardening, CI complete.

## Open Questions

- Pedido.validadeOrcamento
  - Keep or remove? If keep, what business rules (default, validation, UI exposure)? If remove, any legacy data to migrate?
- Company switch UX
  - Should switching company force a full page reload or soft refresh of data contexts only? Any cross-company cached data to invalidate?
- Auth token transport
  - Strictly cookie-based or also allow `Authorization: Bearer`? If both, which has precedence and how to avoid ambiguity?
- Roles and permissions granularity
  - Are custom per-module permissions needed for OPERADOR beyond role defaults? Where should policies be stored/configured?
- Financeiro accounts model
  - Minimum fields for `ContaBancaria`? Do we track running balance or derive from transactions only? Currency support needed?
- Security headers and CSP
  - Any third-party scripts/fonts that require specific CSP allowances?
- Data retention and logs
  - What PII may be logged under compliance constraints? Retention periods?
- PDF layout and numbering
  - Final template and localization rules? Numbering strategy for `numeroPedido` across companies (global vs per-company sequences)?

If you want, I can start by implementing the P0 items right away (selector + cookie hardening + schema alignment + env fixes).
