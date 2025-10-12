# PostgreSQL Setup – Windows Server (Same Host as App)

Tested with Windows Server 2022. Adjust paths/versions if needed.

## 1. Install PostgreSQL 15

1. Download the Windows installer from https://www.postgresql.org/download/windows/.
2. Run the installer, select components (include pgAdmin and command-line tools if desired).
3. Set the superuser password (store it securely) and install PostgreSQL to a known path, e.g. `C:\Program Files\PostgreSQL\15`.

## 2. Create Database and App User

Open “SQL Shell (psql)” or PowerShell and run:

```psql
CREATE DATABASE mareerp_prod;
CREATE USER mareuser WITH PASSWORD 'appMng@88';
ALTER ROLE mareuser SET client_encoding TO 'UTF8';
ALTER ROLE mareuser SET default_transaction_isolation TO 'read committed';
ALTER ROLE mareuser SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE mareerp_prod TO mareuser;
\q
```

Replace `appMng@88` with a secure password.

## 3. Configure Authentication (Optional)

If the application runs on the same host, PostgreSQL’s default local settings (MD5) usually suffice. To adjust:

1. Edit `C:\Program Files\PostgreSQL\15\data\pg_hba.conf`.
2. Ensure the `host` line for IPv4 looks like:
   ```
   host    all    mareuser    127.0.0.1/32    md5
   ```
3. Restart PostgreSQL via “Services” (PostgreSQL 15 service) or PowerShell:
   ```powershell
   net stop postgresql-x64-15
   net start postgresql-x64-15
   ```

## 4. Configure Application Environment

Create or update `.env` in the project root:

```
DATABASE_URL="postgresql://mareuser:strong-password@localhost:5432/mareerp_prod?schema=public"
```

Optionally, at the system level:

```powershell
[Environment]::SetEnvironmentVariable("DATABASE_URL", "postgresql://mareuser:strong-password@localhost:5432/mareerp_prod?schema=public", "Machine")
```

Restart the terminal or service to pick up the new variable.

## 5. Initialize Prisma Schema

From the project directory:

```powershell
npm install
npx prisma migrate deploy
# For seeded data:
npx tsx scripts/seed.ts
```

## 6. Run the Application

```powershell
npm run build  # optional for production
npm run start  # or npm run dev during development
```

Ensure Windows Firewall allows port 5432 locally if the app and DB run in separate processes.

## 7. Useful Commands

```powershell
# psql console
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U mareuser -d mareerp_prod -h localhost

# View databases / tables
\l
\dt

# Backups
"C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" -U mareuser -h localhost mareerp_prod > C:\backups\mareerp_prod_$(Get-Date -Format yyyyMMdd).sql
```
