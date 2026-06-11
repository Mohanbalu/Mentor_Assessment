# Production Deployment Guide: AWS EC2, PM2, and Nginx

This guide outlines steps for compiling and launching the **Assessment & Recruitment Platform** securely inside an AWS EC2 instance powered by an Ubuntu kernel, using PM2 for Node resilience and Nginx as a reverse proxy.

---

## 1. Environment System Configuration

Configure your production environment variables. Create a `.env` file in the project's root backend directory:

```env
# Server Port Configuration
PORT=3000

# PostgreSQL RDS Connection Config
DB_HOST=platform-db-rds.ch4p29.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=assessment_platform
DB_USER=master_admin
DB_PASSWORD=SecureMasterPasswordString101!

# AWS Core Services Integration Auth
AWS_REGION=us-east-1
S3_BUCKET=innovate-recruitment-assets-prod
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Security & Tokens
JWT_SECRET=super_high_entropy_secret_hash_code_99182355
JWT_REFRESH_SECRET=refresh_entropy_token_security_code_110293
CRYPTO_SALT_ROUNDS=12
```

---

## 2. Nginx Reverse Proxy Server Configuration

Configure Nginx to handle SSL and proxy requests to your backend application running on port 3000. Create a configuration file:

```nginx
# File path: /etc/nginx/sites-available/platform.conf

server {
    listen 80;
    listen [::]:80;
    server_name assessment.company.com api.assessment.company.com;

    # HTTPS Redirect configuration
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.assessment.company.com;

    # SSL Key & Chain References (Obtained from Certbot Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.assessment.company.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.assessment.company.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    access_log /var/log/nginx/platform_api_access.log;
    error_log /var/log/nginx/platform_api_error.log;

    location / {
        # Proxy connection points mapping port 3000
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Protect against buffer overflows
        client_max_body_size 15M;
        client_body_buffer_size 128k;
    }
}
```

Enable the Nginx configuration and reload the service:
```bash
sudo ln -s /etc/nginx/sites-available/platform.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 3. PM2 Ecosystem Process Manager Configuration

To manage Node/Express processes, run PM2. Save the configuration below as `ecosystem.config.cjs` in the repository root directory:

```javascript
// File name: ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "assessment-api-service",
      script: "./server/src/app.ts",
      interpreter: "node",
      interpreter_args: "--import tsx", // Enables running TypeScript files natively in PM2
      instances: "max",                 // Balance across CPU cores
      exec_mode: "cluster",             // Run in cluster mode
      autorestart: true,
      watch: false,                     // Avoid performance overhead in production
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};
```

To run your PM2 applications:
```bash
# Start backend in cluster mode
pm2 start ecosystem.config.cjs

# Keep processes surviving server reboots
pm2 save
pm2 startup
```

---

## 4. Code Packaging & AWS Setup Summary

To deploy your server and files onto AWS EC2:

1. **Install Node.js & Tooling**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs build-essential git nginx
   sudo npm install -y -g pm2 tsx
   ```
2. **Clone the Codebase**:
   ```bash
   git clone https://github.com/your-org/recruitment-platform.git /var/www/assessment-platform
   cd /var/www/assessment-platform
   npm install
   ```
3. **Database Migration Sweep**:
   Ensure you run database schema configurations matching the schema detailed in `/docs/schema.sql`.
4. **SSL Provisioning**:
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d api.assessment.company.com
   ```
5. **Verify Telemetry Status**:
   ```bash
   pm2 list
   pm2 logs
   ```
  The system is now fully live and securely configured.
