# 05-AWS-Setup.md

## 1. AWS Account Infrastructure Initialization

### 1.1. IAM User Configuration & Security Best Practices
* **Zero Root Usage**: Never use root account credentials for application tasks or administrative operations.
* **Administrative User Configuration**:
  1. Access the IAM Administration Panel.
  2. Create a new group called `Admins` and assign the `AdministratorAccess` policy.
  3. Create an IAM user for administration, download the credentials safely, and assign the user to the `Admins` group.
* **MFA (Multi-Factor Authentication)**: Enable hardware-based or application-based MFA validation across all IAM users.

---

## 2. Server Configuration & Setup (AWS EC2)

### 2.1. Instance Selection
* **Candidate Sizing for MVP**: Deploy a `t3.micro` scalable instance (2 vCPUs, 1GB RAM) wrapped inside the AWS Free Tier.
* **Operating System Selection**: Choose **Ubuntu Server 24.04 LTS (HVM)**, utilizing SSD volume storage types.

### 2.2. Network Security Configurations (Security Groups)
Configure security groups with strict traffic rules:

| Direction | Port Target | Source Address | Protocol Purpose |
| :--- | :--- | :--- | :--- |
| **Inbound** | `22` | Admin IPs exclusively | Secure SSH command admin |
| **Inbound** | `80` | `0.0.0.0/0` | HTTP redirects |
| **Inbound** | `443` | `0.0.0.0/0` | HTTPS application traffic |
| **Outbound** | `All` | `0.0.0.0/0` | Outbound package downloads |

### 2.3. System Proxy Setup (Nginx Server Configuration)
Configure Nginx as a reverse proxy on the EC2 instance to forward incoming traffic on port 443 to the FastAPI application:

```nginx
# File path: /etc/nginx/sites-available/fastapi_backend
server {
    listen 80;
    server_name api.mentorship-platform.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.mentorship-platform.com;

    ssl_certificate /etc/letsencrypt/live/api.mentorship-platform.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.mentorship-platform.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2.4. FastAPI Deployment Process (Systemd Service Setup)
Deploy the FastAPI application using Gunicorn/Uvicorn, managed as a system-level service to ensure automatic restarts on failure:

```ini
# File path: /etc/systemd/system/fastapi_application.service
[Unit]
Description=FastAPI Service Production Engine
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/app
ExecStart=/home/ubuntu/app/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
Environment=DATABASE_URL=postgresql://db_user:secure_password@database-rds-instance.rds.amazonaws.com:5432/platform_db

[Install]
WantedBy=multi-user.target
```

---

## 3. Managed Relational Database Setup (AWS RDS)

### 3.1. Database Engine Properties
* **Engine**: PostgreSQL Core engine, version 16+.
* **Instance**: `db.t4g.micro` (featuring 2 vCPUs, 1GB RAM) with 20GB of allocated storage.

### 3.2. Automated Backups & Maintenance
* Enable **Automated Backups** with a 7-day retention period.
* Configure backup windows during low-traffic hours (e.g., 03:00 UTC).

---

## 4. Static Storage Setup (AWS S3)

### 4.1. S3 Bucket Structure
Create a dedicated bucket for the application (e.g., `mentorship-platform-assets-prod`):
* `/candidate-resumes/`: Private directory path storing uploaded PDFs.
* `/exported-reports/`: Private folder directory housing compiled assessment PDFs.

---

## 5. Frontend Hosting Services (AWS Amplify)

### 5.1. Hosting Setup
* Connect Amplify to the project's GitHub repository.
* Configure Build settings to compile the SPA and deploy outputs directly:
  ```yaml
  version: 1
  frontend:
    phases:
      preBuild:
        commands:
          - npm install
      build:
        commands:
          - npm run build
    artifacts:
      baseDirectory: dist
      files:
        - '**/*'
    cache:
      paths:
        - node_modules/**/*
  ```

---

## 6. Domains & SSL Management (Route53 & Let's Encrypt)
* **IP Allocation**: Assign an Elastic IP to the EC2 instance.
* **DNS Setup**: Route53 maps domain records:
  * `mentorship-platform.com` -> AWS Amplify App.
  * `api.mentorship-platform.com` -> Elastic IP targeting the EC2 backend instance.
* **SSL Certificates**: Request and renew SSL certificates automatically using Certbot with Let's Encrypt.

---

## 7. Cost Optimization & Scaling Strategy
* **AWS Free Tier Coverage**:
  * Utilizes `t3.micro` and `db.t4g.micro` within free tier limits.
  * Deploys custom frontends inside AWS Amplify's free tier levels.
* **Vertical Scaling Setup**: Transition from a single instance model to a multi-instance configuration backed by an Application Load Balancer (ALB) once testing volumes exceed 5,000 active candidates.

---

## 8. Disaster Recovery Configuration (Backup & Restore)
* **Automated RDS Restore Pipeline**:
  `AWS Backup` snapshots enable point-in-time recovery to a brand new RDS cluster.
* **Fast Redeployment**:
  Maintain codebase configs and provisioning scripts inside Git repositories to enable quick server rebuilds in alternative AWS regions if needed.

---

## 9. Production Readiness Checklist

* [ ] Disable root logins and verify MFA across all core IAM developer profiles.
* [ ] Verify that Security Groups restrict SSH access (port 22) to designated administrative IP addresses only.
* [ ] Confirm PostgreSQL database credentials are managed as environment variables and not hardcoded.
* [ ] Ensure public access is blocked for sensitive directories in the S3 bucket.
* [ ] Run Certbot dry-runs to verify automatic renewal of Let's Encrypt SSL certificates.
* [ ] Configure healthcheck endpoints for continuous service monitoring.
