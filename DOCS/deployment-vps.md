# VPS Deployment Guide (Nginx + Local PostgreSQL)

This document summarizes the steps to deploy Maré ERP on a Linux VPS using a local PostgreSQL instance and Nginx reverse proxy. It also covers DNS configuration for `mareerp.com.br` or a subdomain such as `app.mareerp.com.br`.

---

## 1. Prepare the VPS

1. **Create a non-root user (recommended)**
   ```bash
   sudo adduser mare
   sudo usermod -aG sudo mare
   su - mare
   ```
2. **Install basic tooling**
   ```bash
   sudo apt update
   sudo apt install -y git curl build-essential nginx
   ```
3. **Install Node.js (LTS)** using `nvm` or NodeSource. Example with NodeSource:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   node -v   # confirm
   npm -v
   ```

---

## 2. Clone the Project

Choose a working directory such as `/var/www/mare-erp`:

```bash
sudo mkdir -p /var/www/mare-erp
sudo chown -R $USER:$USER /var/www/mare-erp
cd /var/www/mare-erp

# clone the repository (replace URL with your fork/private repository if needed)
git clone https://github.com/mare-erp/mvp-mare-erp-new.git .
```

> Tip: keep the repo under `/var/www/<project>` so Nginx and systemd configs point consistently.

---

## 3. Configure Environment Variables

Copy the provided `.env` templates and adjust for production:

```bash
cp .env .env.production
nano .env.production      # set DATABASE_URL, JWT_SECRET, EMAIL settings, etc.
```

Ensure `DATABASE_URL` points to the local PostgreSQL instance (see Section 4). For local development builds run `cp .env .env.local` if needed.

---

## 4. PostgreSQL Setup (Local on VPS)

Follow the detailed steps in:
- `DOCS/postgres/SETUP.md` (Debian/Ubuntu servers)
- `DOCS/postgres/WINDOWS_SETUP.md` (for Windows hosts)

Quick summary:
```bash
sudo apt install -y postgresql-15 postgresql-client-15
sudo -u postgres psql
```
Inside `psql`:
```sql
-- Create role and database owned by the app user
CREATE USER mareuser WITH PASSWORD 'strong-password';
CREATE DATABASE mareerp_prod WITH OWNER mareuser;

-- Ensure the default schema allows the user to create tables
GRANT ALL ON SCHEMA public TO mareuser;
ALTER SCHEMA public OWNER TO mareuser;
\q
```
Update `DATABASE_URL`:
```
DATABASE_URL="postgresql://mareuser:strong-password@localhost:5432/mareerp_prod?schema=public"
```
Run migrations and seed (optional):
```bash
npm install
npx prisma migrate deploy
# optional demo data
echo "Run seed if desired" && npx tsx scripts/seed.ts
```

---

## 5. Build & Run the App

### Systemd (recommended)
Create `sudo nano /etc/systemd/system/mare-erp.service` (requires sudo):
```ini
[Unit]
Description=Maré ERP
After=network.target

[Service]
Type=simple
User=mare
WorkingDirectory=/var/www/mare-erp/mvp-mare-erp-new
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start
Restart=always

[Install]
WantedBy=multi-user.target
```
Then start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable mare-erp
sudo systemctl start mare-erp
sudo systemctl status mare-erp
```

### PM2 Alternative
```bash
npm install -g pm2
pm2 start npm --name "mare-erp" -- start
pm2 save
pm2 startup systemd
```

---

## 6. Nginx Reverse Proxy

Use the dedicated guide `DOCS/nginx-setup.md` for full details. Core steps:

1. Create `sudo nano /etc/nginx/sites-available/mare-erp/mvp-mare-erp-new` with proxy rules pointing to `http://127.0.0.1:3000`.
2. Enable the site and reload Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/mare-erp /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```
3. Optional: obtain HTTPS certificates via Certbot (`sudo certbot --nginx -d app.mareerp.com.br`).

Remember to update `server_name` in the Nginx config to the domain/subdomain you intend to use.

---

## 7. DNS Configuration (registro.br)

### Pointing `mareerp.com.br` or `app.mareerp.com.br`
1. Log into https://registro.br and open the DNS settings for your domain.
2. Add/modify **A records** pointing to the VPS public IP:
   - `@`  → `x.x.x.x` (for the root domain `mareerp.com.br`, optional if you only use subdomain)
   - `app` → `x.x.x.x` (for `app.mareerp.com.br`)
3. If using WWW redirection, add `www` A record or CNAME (`www` → `@`).
4. After DNS propagates (can take up to 24h, usually faster), ensure your Nginx `server_name` matches the records (`server_name app.mareerp.com.br;`).
5. Run Certbot for TLS once DNS resolves to the server.

> Tip: if you prefer to host the main site elsewhere, keep only the `app` record on this VPS and point the root domain to another service or `parking` page.

---

## 8. Post-Deployment Checklist
- `sudo systemctl status mare-erp` shows `active (running)`.
- `curl -I http://127.0.0.1:3000` returns 200.
- `curl -I https://app.mareerp.com.br` (after DNS/TLS) returns 200 and correct headers.
- Database backups configured (see `DOCS/postgres/IMPLEMENTATION.md` for operational notes).
- Firewall (UFW) allows only required ports (80/443/22).
- Monitor logs: `journalctl -u mare-erp -f`, `sudo tail -f /var/log/nginx/error.log`.

This setup runs the app on a dedicated VPS with Nginx handling HTTPS and a local PostgreSQL instance powering the multi-tenant data. Adjust paths and users as needed for your environment.
