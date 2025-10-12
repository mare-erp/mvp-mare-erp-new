# Fixing Now

## Critical auth blockers
- Restore the missing auth helper: multiple routes still import `@/app/lib/verifyAuth`, which does not exist (`app/api/auth/me/route.ts:2`, `app/api/organizacoes/route.ts:3`, `app/api/organizacoes/[id]/empresas/route.ts:3`, `app/api/financeiro/transacoes/[id]/route.ts:4`, `app/api/pedidos/pdf-layout/route.ts:2`, etc.). Either recreate the helper or migrate every caller to `app/lib/auth.ts`, otherwise these endpoints crash on first request.
- Fix the naming collision in `withAuth`: `app/lib/auth.ts:244` declares `const hasPermission = hasPermission(...)`, shadowing the imported function and throwing at runtime. Rename the local variable (e.g. `const allowed = hasPermission(...)`) before checking permissions.
- Finish wiring `verifyAuth`: `app/api/organizacao/current/route.ts:3-8` imports a non-existent `verifyAuth` export and also imports `prisma` as default. Either export a helper from `app/lib/auth.ts` or update the route to use `withAuth`, and change the import to `{ prisma }`.

## Schema / Prisma alignment
- Remove or add the expected columns before shipping: code assumes `Organizacao.adminId`, `Empresa.logoUrl`, `Empresa.endereco` and similar fields, but `prisma/schema.prisma:128-155` and `:97-108` do not define them. Affected calls include `app/api/auth/signup/route.ts:40-44`, `app/api/organizacoes/route.ts:22-44`, `app/api/organizacoes/[id]/empresas/route.ts:40-43`, `app/api/pedidos/[id]/pdf/route.ts:32-44`, and the typed definitions in `app/lib/definitions.ts:12-24`. Decide whether to extend the schema or strip these references so Prisma Client matches the code.
- `DOCS` and UI components (e.g. `app/components/CompanySelector.tsx:10-121`) rely on `logoUrl`, so align the data model or update the UI/documentation accordingly.

## API defects to unblock flows
- `app/api/auth/me/route.ts:2-6` still uses the missing `verifyAuth` helper and never imports `prisma`, so the first query (`prisma.usuario.findUnique`) throws. Import `{ prisma }` and swap to the working auth middleware.
- `app/api/auth/signup/route.ts:40-44` (duplicate of `sign-up`) writes to `Organizacao.adminId`, which is absent. Pick one implementation, fix the schema reference, and remove the redundant route folder to avoid path conflicts with `/api/auth/sign-up`.
- `app/api/organizacoes/route.ts:37-90` and `app/api/organizacoes/[id]/empresas/route.ts:37-133` select/return `logoUrl` and `endereco`; these fields will be `undefined` until the schema work above is completed. Keep the payloads in sync with the database.
- Quick-create endpoints hard-code tenant context: `app/api/clientes/quick-create/route.ts:43-48` and `app/api/produtos/quick-create/route.ts:25-30` still persist `empresaId: '1'`. Replace those literals with the authenticated tenant ID, otherwise data leaks across organisations.
- `app/api/membros/[id]/route.ts:27-40` references `prisma.membro`/`membro.empresaId`, but only `MembroOrganizacao` exists. Update the model, enforce organisation-level authorization (allow `ADMIN` too), and re-use `withAuth` instead of manual cookie parsing.
- The collection route `app/api/membros/route.ts:61-96` tries to delete an ID by splitting the base path, overlapping with the `[id]` handler. Drop or refactor this DELETE to avoid inconsistent behaviour.
- `app/api/pedidos/next-number/route.ts:4-18` is unauthenticated and fetches the global max `numeroPedido`, ignoring tenancy. Wrap it with `withAuth` and filter by `context.empresaId` so sequences stay per company.
- `app/api/organizacao/route.ts:3-55` and `app/api/organizacao/[id]/empresas/route.ts:3-72` still depend on the missing `verifyAuth` helper; migrate them to the supported middleware.
- PDF routes (`app/api/pedidos/pdf-layout/route.ts:2-144` and `app/api/pedidos/[id]/pdf/route.ts:32-198`) use the missing `withAuth` import and expect schema fields not currently present. Adjust imports and payload shaping after the schema decision.
- Registration flow broken:
  - ✅ `/api/auth/me` now uses `withAuth` from `app/lib/auth` and imports `{ prisma }`, restoring the session lookup after sign-up (`app/api/auth/me/route.ts`).
  - ✅ Removed the duplicate `/api/auth/signup/route.ts` that referenced the non-existent `Organizacao.adminId`; `/api/auth/sign-up` is the single supported endpoint.
- Setup empresa PUT:
  - ✅ `app/(auth)/setup-empresa/page.tsx` now submits to `/api/empresa` for both create and update flows, matching the existing token-aware handler and resolving the 404s during company setup.

## Frontend issues
- `app/(dashboard)/clientes/components/ClientForm.tsx:107` has an extra double quote inside the `onClick` attribute, which breaks compilation. Remove the stray `"` so the Cancel button builds.
- The dashboard still renders static placeholder metrics (`app/(dashboard)/page.tsx:31-57`). Update or gate the README/installation checklist until real data wiring is restored.

## Housekeeping
- `npm run lint` currently fails because dependencies (Next CLI) are missing; run `npm install` (or document the requirement) before enabling linting in CI.
- Re-run documentation updates once the fixes above land so `README.md:48-55` and `DOCS/CORREÇÕES_IMPLEMENTADAS.md:27-32` stop advertising flows that are blocked today.
