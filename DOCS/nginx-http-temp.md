# Temporary HTTP-only Nginx Config (before DNS/SSL)

Use this while DNS is propagating or before running Certbot. Replace the HTTPS server block in `sudo vim /etc/nginx/sites-available/mare-erp` with the following:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Steps:
1. Save the file and reload Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```
2. Access `http://<VPS_IP>` or `http://vps62065.publiccloud.com.br` to test the app.
3. Once DNS records point to the VPS, restore the HTTPS server block and run Certbot:
   ```bash
   sudo certbot --nginx -d mareerp.com.br -d www.mareerp.com.br -d app.mareerp.com.br
   ```
4. Verify HTTPS:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   curl -I https://app.mareerp.com.br
   ```
