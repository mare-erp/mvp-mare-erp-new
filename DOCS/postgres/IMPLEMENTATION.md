# PostgreSQL Implementation Notes (Local VPS Instance)

## 1. Compatibility Check

- **ORM Layer**: The application uses Prisma (`app/lib/prisma.ts`) with `DATABASE_URL` loaded from environment variables, so it can target any reachable PostgreSQL instance; there is no hard dependency on Docker or container-specific hostnames.
- **Runtime**: All API handlers rely on Prisma’s client; no direct calls to `docker` or `docker-compose` exist in the runtime code. The Docker instructions in the root README are purely for convenience.
- **Migration Flow**: `package.json` defines `postinstall: prisma generate`, and the repository already contains the full migration history (`prisma/migrations/*`). Running `npx prisma migrate deploy` against a local PostgreSQL service is sufficient to create the schema.
- **Environment Variables**: Ensure `DATABASE_URL` points at the local VPS instance (e.g. `postgresql://mareuser:strong-password@127.0.0.1:5432/mareerp_prod`). Avoid leaving conflicting system-level variables, as highlighted in `DOCS/progresso.md`.

**Conclusion**: The current app is technically ready to run against a locally hosted PostgreSQL server on the same VPS, provided the schema mismatches identified elsewhere are resolved (see “Known Gaps” below).

## 2. Recommended Setup Flow (Debian/Windows)

1. Provision PostgreSQL on the VPS using the OS-specific guides:
   - Debian-based servers: `DOCS/postgres/SETUP.md`
   - Windows Server: `DOCS/postgres/WINDOWS_SETUP.md`
2. Populate `.env` (or system environment) with the final `DATABASE_URL`.
3. From the project root:
   ```bash
   npm install               # installs application + Prisma runtime
   npx prisma migrate deploy # applies migrations to the local instance
   npx tsx scripts/seed.ts   # optional seed data for testing
   npm run dev               # or npm run start after build
   ```
4. Smoke-test connectivity:
   ```bash
   npx prisma db pull   # should succeed, confirming DB accessibility
   npm run lint         # optional, once dependencies are installed
   ```

## 3. Operational Notes

- **Backups**: Use `pg_dump`/`pg_restore` on the VPS. Sample commands are included in the OS setup docs.
- **Monitoring**: Enable PostgreSQL logging (`journalctl` on Debian, Event Viewer on Windows) and consider exposing metrics if needed.
- **Resource Planning**: The app loads Prisma with `log: ['query']` in development; for production, consider adjusting logging to reduce noise.
- **Environment Segregation**: Use separate databases for staging vs production, each with its own `DATABASE_URL`.

## 4. Known Gaps Before Production Use

These issues should be fixed to ensure full functionality after switching to the local PostgreSQL instance:

- **Schema vs Code Mismatch**: The code references columns like `Organizacao.adminId`, `Empresa.logoUrl`, and `Empresa.endereco`, but the Prisma schema does not define them yet (see `DOCS/_FIXING_NOW.md`). Add the fields via Prisma migration or remove their usage.
- **Auth Helper**: Multiple routes still import `@/app/lib/verifyAuth`, which is missing. Reintroduce the helper or migrate all handlers to `app/lib/auth.ts`; otherwise requests will fail.
- **Tenant-Specific APIs**: Some shortcuts (`app/api/clientes/quick-create/route.ts`, `app/api/produtos/quick-create/route.ts`, `app/api/pedidos/next-number/route.ts`) ignore the authenticated company. Update them to use `context.empresaId` to prevent cross-company data leakage.
- **Duplicate Signup Route**: Both `/api/auth/signup` and `/api/auth/sign-up` exist; consolidate them and ensure the remaining implementation no longer writes to non-existent columns.
- **Data Integrity Checks**: After aligning schema and auth, run `npx prisma migrate deploy` again to confirm the new migrations succeed against the VPS instance.

Document the resolution of these gaps in `DOCS/_FIXING_NOW.md` (already created) and update the README once the environment is confirmed stable.
