# Nginx Setup for Maré ERP (Reverse Proxy)

## 1. Prerequisites
- VPS running Debian/Ubuntu (adjust paths for other distros).
- Node.js app already running (e.g. `npm run start` or via PM2/systemd) on port `3000`.
- Nginx installed: `sudo apt update && sudo apt install -y nginx`.

## 2. Create Upstream Service (Optional)
If you plan to run the app via systemd/PM2, ensure the service listens on a known port (default 3000). Example systemd unit:

```ini
[Unit]
Description=Maré ERP
After=network.target

[Service]
WorkingDirectory=/var/www/mare-erp
ExecStart=/usr/bin/npm run start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Enable/start with:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mare-erp
sudo systemctl start mare-erp
```

## 3. Nginx Server Block
Create `/etc/nginx/sites-available/mare-erp`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;

    # Redirect HTTP to HTTPS (uncomment when TLS enabled)
    # return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name example.com www.example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers (optional hardening)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=()" always;

    # Proxy to Next.js app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching (optional)
    location ~* \.(?:css|js|jpg|jpeg|gif|png|svg|ico|webp)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 7d;
        access_log off;
        add_header Cache-Control "public, max-age=604800, immutable";
    }

    # Optional: limit body size for uploads
    client_max_body_size 10m;
}
```

Activate the site:

```bash
sudo ln -s /etc/nginx/sites-available/mare-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 4. HTTPS (Let’s Encrypt)
Use Certbot to obtain certificates:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

Certbot will update the server block with the proper `ssl_certificate` paths and configure HTTP→HTTPS redirects automatically.

## 5. PM2 Alternative (Optional)

```bash
npm install -g pm2
pm2 start npm --name "mare-erp" -- start
pm2 save
pm2 startup systemd
```

Ensure the same port (3000) is used and Nginx proxies to it.

## 6. Health Check & Logs
- App logs (systemd): `journalctl -u mare-erp -f`
- Nginx access/error logs: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- After deployments, reload Nginx: `sudo systemctl reload nginx`

## 7. Hardening Tips
- Enable fail2ban/UFW as needed.
- Restrict `proxy_buffering` if using SSE/WebSockets (already no buffering via `proxy_cache_bypass`).
- Use environment variables (`DATABASE_URL`, `JWT_SECRET`, etc.) via systemd or `.env` in the app directory.
