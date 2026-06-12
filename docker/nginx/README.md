# Nginx Reverse Proxy Setup

This directory contains Nginx configuration files for the Smart Dashboard application.

## Files

- `nginx.conf` - Production configuration with SSL/HTTPS support
- `nginx.dev.conf` - Development configuration (HTTP only)

## Development Setup (Local)

The development configuration is already active in `docker-compose.yml`:

```bash
# Start all services with nginx
docker compose up -d

# Access the application
# Frontend: http://localhost (port 80)
# Direct Frontend: http://localhost:3000
# Direct Backend API: http://localhost:5000
```

All requests to `http://localhost/api/*` will be proxied to the backend, and all other requests go to the frontend.

## Production Setup (with SSL)

### Prerequisites

1. A domain name pointing to your server's IP address
2. Ports 80 and 443 open on your firewall
3. Docker and Docker Compose installed

### Quick Setup

Run the SSL setup script:

```bash
./setup-ssl.sh yourdomain.com your@email.com
```

This script will:
- Create necessary directories
- Update nginx configuration with your domain
- Generate secure passwords
- Obtain SSL certificates from Let's Encrypt
- Start all services with HTTPS enabled

### Manual Setup

1. **Update nginx configuration**

   Edit `docker/nginx/nginx.conf` and replace `yourdomain.com` with your actual domain.

2. **Create environment file**

   ```bash
   cat > .env << EOF
   DOMAIN=yourdomain.com
   MONGO_USER=admin
   MONGO_PASSWORD=$(openssl rand -base64 32)
   JWT_SECRET=$(openssl rand -base64 64)
   EOF
   ```

3. **Create certificate directories**

   ```bash
   mkdir -p certbot/conf certbot/www
   ```

4. **Obtain SSL certificate**

   ```bash
   # Start nginx first
   docker compose -f docker-compose.prod.yml up -d nginx

   # Get certificate
   docker compose -f docker-compose.prod.yml run --rm certbot certonly \
     --webroot \
     --webroot-path=/var/www/certbot \
     --email your@email.com \
     --agree-tos \
     --no-eff-email \
     -d yourdomain.com \
     -d www.yourdomain.com
   ```

5. **Start all services**

   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

## Certificate Renewal

Certificates are automatically renewed by the certbot container every 12 hours.

To manually renew:

```bash
docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml restart nginx
```

## Nginx Configuration Details

### Development (nginx.dev.conf)

- Listens on port 80 (HTTP)
- No SSL/TLS encryption
- Proxies `/api/*` to backend:5000
- Proxies all other requests to frontend:3000

### Production (nginx.conf)

- Redirects HTTP (port 80) to HTTPS (port 443)
- SSL/TLS encryption enabled
- Security headers configured
- HTTP/2 support
- Proxies `/api/*` to backend:5000
- Proxies all other requests to frontend:3000

## Troubleshooting

### Certificate Issues

Check certbot logs:
```bash
docker compose -f docker-compose.prod.yml logs certbot
```

### Nginx Issues

Check nginx logs:
```bash
docker compose -f docker-compose.prod.yml logs nginx
```

Test nginx configuration:
```bash
docker compose -f docker-compose.prod.yml exec nginx nginx -t
```

### Port Conflicts

If port 80 or 443 is already in use:
```bash
# Check what's using the port
sudo lsof -i :80
sudo lsof -i :443

# Stop the conflicting service
sudo systemctl stop apache2  # or nginx, or whatever is running
```

## Security Best Practices

1. **Keep certificates updated** - Certbot handles this automatically
2. **Use strong passwords** - Generated automatically by setup script
3. **Enable firewall** - Only allow ports 80, 443, and SSH
4. **Regular updates** - Keep Docker images updated
5. **Monitor logs** - Check for suspicious activity

## Architecture

```
Internet
    ↓
Nginx (Port 80/443)
    ├─→ /api/* → Backend (Port 5000)
    └─→ /* → Frontend (Port 3000)
```

## Environment Variables

Production environment variables (in `.env`):

- `DOMAIN` - Your domain name
- `MONGO_USER` - MongoDB username
- `MONGO_PASSWORD` - MongoDB password
- `JWT_SECRET` - JWT signing secret

## Support

For issues or questions, check:
- Nginx documentation: https://nginx.org/en/docs/
- Let's Encrypt documentation: https://letsencrypt.org/docs/
- Docker Compose documentation: https://docs.docker.com/compose/
