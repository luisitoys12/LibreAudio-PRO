# Deployment Guide

This guide covers deploying LibreAudio PRO to production.

## Pre-deployment Checklist

- [ ] Update `SECURITY_SALT` in `.env` with a strong random value
- [ ] Set `DEBUG=false` in `.env`
- [ ] Change default admin password
- [ ] Update database credentials in `docker-compose.yml`
- [ ] Configure domain/SSL certificates
- [ ] Review and update Nginx configuration
- [ ] Set up backups for MySQL data
- [ ] Configure log rotation
- [ ] Set up monitoring/alerts

## Production Environment Setup

### 1. Security Configuration

Generate a new security salt:
```bash
php -r "echo bin2hex(random_bytes(32)) . PHP_EOL;"
```

Update `.env`:
```env
SECURITY_SALT=your_generated_salt_here
DEBUG=false
```

### 2. Database Configuration

Update `docker-compose.yml` with production credentials:
```yaml
mysql:
  environment:
    MYSQL_ROOT_PASSWORD: strong_root_password_here
    MYSQL_PASSWORD: strong_password_here
```

### 3. SSL/HTTPS Setup

Option A: Use Traefik as reverse proxy
Option B: Use Certbot with Nginx
Option C: Use Cloudflare

Example Nginx SSL configuration:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    
    # ... rest of configuration
}
```

### 4. Performance Optimization

Enable OPcache in PHP:
```dockerfile
RUN docker-php-ext-install opcache
```

Configure caching in `config/app_local.php`:
```php
'Cache' => [
    'default' => [
        'className' => 'Redis',
        'host' => 'redis',
        'port' => 6379,
    ],
],
```

### 5. Backup Strategy

Database backup script:
```bash
#!/bin/bash
docker compose exec mysql mysqldump -u root -p[password] libreaudiopro > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 6. Monitoring

Health check endpoint: `https://yourdomain.com/health`

Set up monitoring with tools like:
- Uptime Robot
- Pingdom
- New Relic
- Datadog

### 7. Logging

Configure log rotation in `/etc/logrotate.d/libreaudiopro`:
```
/path/to/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 0640 www-data www-data
}
```

### 8. Deployment Steps

1. Clone repository on production server
2. Update configuration files
3. Build and start containers:
   ```bash
   docker compose up -d --build
   ```
4. Run migrations:
   ```bash
   docker compose exec php bin/cake migrations migrate
   ```
5. Clear cache:
   ```bash
   docker compose exec php bin/cake cache clear_all
   ```
6. Test application
7. Change default admin password

### 9. Post-deployment

- Test all functionality
- Monitor logs for errors
- Verify SSL certificate
- Test backup restoration
- Document any custom configurations

## Updating Production

1. Pull latest changes
2. Build new containers:
   ```bash
   docker compose build
   ```
3. Stop old containers:
   ```bash
   docker compose down
   ```
4. Start new containers:
   ```bash
   docker compose up -d
   ```
5. Run migrations:
   ```bash
   docker compose exec php bin/cake migrations migrate
   ```
6. Clear cache:
   ```bash
   docker compose exec php bin/cake cache clear_all
   ```

## Rollback Procedure

1. Keep previous Docker images
2. Restore database from backup
3. Revert to previous container version:
   ```bash
   docker compose down
   git checkout <previous-commit>
   docker compose up -d
   ```

## Troubleshooting

### Container won't start
```bash
docker compose logs [service-name]
```

### Database connection issues
- Check MySQL container is running
- Verify credentials in `.env`
- Check network connectivity

### Permission issues
```bash
docker compose exec php chmod -R 777 tmp logs
```

### Clear all caches
```bash
docker compose exec php bin/cake cache clear_all
```

## Support

For production support, create an issue on GitHub with:
- Environment details
- Error logs
- Steps to reproduce

---

**Important**: Always test deployment procedures in a staging environment first!
