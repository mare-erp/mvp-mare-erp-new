# PostgreSQL Setup – Debian Server (Same Host as App)

Tested on Debian 12. Adjust versions/paths as needed.

## 1. Install PostgreSQL 15

```bash
sudo apt update
sudo apt install -y postgresql-15 postgresql-client-15 postgresql-contrib
```

## 2. Create Database and User

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE mareerp_prod;
CREATE USER mareuser WITH PASSWORD 'appMng@88';
ALTER ROLE mareuser SET client_encoding TO 'UTF8';
ALTER ROLE mareuser SET default_transaction_isolation TO 'read committed';
ALTER ROLE mareuser SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE mareerp_prod TO mareuser;
```

Exit `psql` with `\q`.

## 3. Configure PostgreSQL Access

Edit `/etc/postgresql/15/main/postgresql.conf`:

```
listen_addresses = 'localhost'
```

Edit `/etc/postgresql/15/main/pg_hba.conf` and ensure the local line allows password auth:

```
local   all             mareuser                               md5
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

## 4. Configure Application Environment

In the project root, append to `.env` (or `.env.production`):

```
DATABASE_URL="postgresql://mareuser:strong-password@localhost:5432/mareerp_prod?schema=public"
```

Replace `strong-password` with the password chosen earlier.

## 5. Initialize Prisma Schema

Install dependencies (if not already):

```bash
npm install
```

Generate Prisma client and apply migrations:

```bash
npx prisma migrate deploy
# or, for fresh setup with sample data:
npx prisma migrate deploy
npx tsx scripts/seed.ts
```

## 6. Run the Application

```bash
npm run build   # optional production build
npm run start   # or npm run dev for development
```

## 7. Useful Administration Commands

```bash
# Access PostgreSQL console as mareuser
psql -h localhost -U mareuser -d mareerp_prod

# View databases
\l

# View tables
\dt

# Tail PostgreSQL logs
sudo journalctl -u postgresql -f
```

## 8. Backups (Optional)

```bash
pg_dump -h localhost -U mareuser mareerp_prod > mareerp_prod_$(date +%F).sql
```
