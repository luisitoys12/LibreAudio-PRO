#!/usr/bin/env bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}LibreAudio PRO - Bootstrap Script${NC}"
echo "======================================"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Docker
if ! command_exists docker; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check for Docker Compose
if ! command_exists docker-compose; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p tmp/cache/models tmp/cache/persistent tmp/cache/views tmp/sessions tmp/tests logs
mkdir -p webroot/css webroot/js webroot/img

# Set permissions
chmod -R 777 tmp logs

echo -e "${GREEN}✓ Directories created${NC}"

# Start Docker containers
echo "Starting Docker containers..."
docker-compose up -d

echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Install Composer dependencies
echo "Installing Composer dependencies..."
docker-compose exec -T php composer install --no-interaction --prefer-dist

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Run database migrations
echo "Running database migrations..."
docker-compose exec -T php bin/cake migrations migrate

echo -e "${GREEN}✓ Migrations completed${NC}"

# Create seed data
echo "Creating seed data..."
docker-compose exec -T php bin/cake migrations seed

echo -e "${GREEN}✓ Seed data created${NC}"

echo ""
echo -e "${GREEN}======================================"
echo "Bootstrap completed successfully!"
echo "======================================${NC}"
echo ""
echo "Application is running at: http://localhost:8080"
echo ""
echo "Default admin credentials:"
echo "  Email: admin@libreaudiopro.com"
echo "  Password: admin123"
echo ""
echo "Useful commands:"
echo "  docker-compose up -d     # Start containers"
echo "  docker-compose down      # Stop containers"
echo "  docker-compose logs -f   # View logs"
echo ""
