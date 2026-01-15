# LibreAudio PRO

LibreAudio PRO is an open-source directory platform for publishing, moderating, and discovering radios, podcasts, and free audio content using PHP 8, MySQL, and Docker. Content is shared through external links (Google Drive, Dropbox, etc.).

## Features

- 🎵 **Public Content Directory**: Browse approved radios and podcasts
- 🔐 **User Authentication**: Register and login system with role-based access
- 👥 **User Roles**: Admin and regular user roles with different permissions
- ✅ **Content Moderation**: Admin panel for reviewing and approving submissions
- 📝 **Content Submission**: Users can submit content with external URLs
- 🔗 **External Links Only**: No file uploads - content is hosted externally
- 🐳 **Docker-Ready**: Complete Docker setup for easy deployment
- 🛡️ **Security**: CSRF protection, password hashing, input validation

## Technology Stack

- **Framework**: CakePHP 4.5
- **PHP**: 8.1
- **Database**: MySQL 8.0
- **Web Server**: Nginx (Alpine)
- **Container**: Docker & Docker Compose

## Prerequisites

- Docker
- Docker Compose
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/luisitoys12/LibreAudio-PRO.git
cd LibreAudio-PRO
```

### 2. Run the Bootstrap Script

```bash
chmod +x bootstrap.sh
./bootstrap.sh
```

This script will:
- Create necessary directories
- Start Docker containers
- Install Composer dependencies
- Run database migrations
- Seed initial admin user

### 3. Access the Application

- **Application**: http://localhost:8080
- **Default Admin**: admin@libreaudiopro.com / admin123
- **Default User**: user@libreaudiopro.com / user123

## Manual Setup

If you prefer manual setup:

### 1. Start Docker Containers

```bash
docker compose up -d
```

### 2. Install Dependencies

```bash
docker compose exec php composer install
```

### 3. Run Migrations

```bash
docker compose exec php bin/cake migrations migrate
```

### 4. Seed Database

```bash
docker compose exec php bin/cake migrations seed
```

## Project Structure

```
LibreAudio-PRO/
├── config/                 # Configuration files
│   ├── Migrations/        # Database migrations
│   ├── Seeds/             # Database seed files
│   ├── app_local.php      # Application configuration
│   ├── bootstrap.php      # Bootstrap logic
│   └── routes.php         # Route definitions
├── docker/                # Docker configuration
│   ├── nginx/            # Nginx configuration
│   └── php/              # PHP Dockerfile
├── src/                  # Application source code
│   ├── Controller/       # Controllers
│   │   ├── Admin/       # Admin controllers
│   │   ├── AppController.php
│   │   ├── ContentController.php
│   │   └── UsersController.php
│   ├── Model/           # Models
│   │   ├── Entity/      # Entity classes
│   │   └── Table/       # Table classes
│   └── Application.php  # Application class
├── templates/           # View templates
│   ├── Admin/          # Admin templates
│   ├── Content/        # Content templates
│   ├── Users/          # User templates
│   └── layout/         # Layout files
├── webroot/            # Public web files
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript
│   └── index.php      # Entry point
├── docker compose.yml  # Docker Compose configuration
├── bootstrap.sh        # Setup script
└── README.md          # This file
```

## User Roles

### Admin
- Access to admin panel
- Review pending content submissions
- Approve or reject content
- Delete content
- View all statistics

### Regular User
- Register and login
- Submit content for review
- View own submissions
- Browse approved content

## Content Workflow

1. **Submission**: Users submit content with external URLs
2. **Review**: Content appears in admin moderation panel with "pending" status
3. **Moderation**: Admin reviews and approves or rejects
4. **Publication**: Approved content appears in public listing

## Docker Services

### PHP (php:8.1-fpm)
- PHP-FPM with required extensions
- Composer pre-installed
- Runs application code

### Nginx (nginx:alpine)
- Serves application
- Proxies requests to PHP-FPM
- Port: 8080

### MySQL (mysql:8.0)
- Database server
- Port: 3306 (exposed)
- Database: libreaudiopro

## Development

### Run CakePHP Commands

```bash
# Access PHP container
docker compose exec php bash

# Run migrations
bin/cake migrations migrate

# Create a new migration
bin/cake bake migration CreateTableName

# Clear cache
bin/cake cache clear_all
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f php
docker compose logs -f nginx
docker compose logs -f mysql
```

### Database Access

```bash
# MySQL CLI
docker compose exec mysql mysql -u libreaudiopro -plibreaudiopro_pass libreaudiopro
```

## Production Deployment

### 1. Update Security Settings

Edit `.env` and update:
- `SECURITY_SALT` - Generate a new random salt
- `DEBUG` - Set to `false`

### 2. Update Database Credentials

In `docker compose.yml`, change:
- MySQL root password
- Database password
- Database name (optional)

### 3. Update Admin Credentials

After deployment, change the default admin password.

### 4. Configure Domain

Update `docker compose.yml` nginx port mapping or use a reverse proxy.

### 5. Enable HTTPS

Use a reverse proxy like Traefik or Nginx with Let's Encrypt certificates.

## Security Considerations

- ✅ Passwords are hashed using bcrypt
- ✅ CSRF protection enabled
- ✅ Input validation on all forms
- ✅ SQL injection prevention (ORM)
- ✅ XSS protection (auto-escaping in templates)
- ✅ Role-based authorization
- ⚠️ Change default credentials in production
- ⚠️ Use HTTPS in production
- ⚠️ Keep dependencies updated

## Common Issues

### Port Already in Use

If port 8080 or 3306 is already in use, edit `docker compose.yml` to use different ports.

### Permission Issues

```bash
chmod -R 777 tmp logs
```

### Database Connection Issues

Check that MySQL container is running:
```bash
docker compose ps
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions, please use the GitHub issue tracker.

## Credits

Built with:
- [CakePHP](https://cakephp.org/)
- [Docker](https://www.docker.com/)
- [Nginx](https://nginx.org/)
- [MySQL](https://www.mysql.com/)

---

**LibreAudio PRO** - Democratizing access to free audio content 🎵
