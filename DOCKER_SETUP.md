# Docker Setup Guide

This guide will help you set up and run the entire e-commerce application using Docker.

## Prerequisites

- Docker Desktop installed (or Docker Engine + Docker Compose)
- At least 4GB of available RAM
- Ports 3000, 5000, and 27017 available

## Quick Start

1. **Clone the repository** (if not already done)

2. **Create environment file**

   Create a `.env` file in the root directory with the following variables:

   ```env
   # Backend Environment Variables
   PORT=5000
   NODE_ENV=production

   # MongoDB Configuration
   # For Docker: mongodb://mongodb:27017/bottle-ecommerce
   MONGODB_URL_DEVELOPMENT=mongodb://mongodb:27017/bottle-ecommerce

   # JWT Secret (change this to a secure random string in production)
   JWT_SECRET=your-secret-key-change-in-production

   # SMTP Configuration for Email (Nodemailer)
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # Frontend Environment Variables
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. **Build and start all services**

   ```bash
   docker-compose up -d --build
   ```

4. **Access the application**

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - MongoDB: localhost:27017

## Docker Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Stop and remove volumes (clean slate)
```bash
docker-compose down -v
```

### Access container shell
```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# MongoDB
docker-compose exec mongodb mongosh
```

## Services

### MongoDB
- **Container**: `ecommerce-mongodb`
- **Port**: 27017
- **Data**: Persisted in Docker volume `mongodb_data`
- **Health Check**: Enabled

### Backend API
- **Container**: `ecommerce-backend`
- **Port**: 5000
- **Health**: Depends on MongoDB being healthy
- **API Endpoint**: http://localhost:5000/api

### Frontend
- **Container**: `ecommerce-frontend`
- **Port**: 3000
- **URL**: http://localhost:3000
- **Depends on**: Backend service

## Development vs Production

### Development Mode

For development with hot-reload, you can modify `docker-compose.yml`:

1. Remove volume mounts for production builds
2. Use `npm run dev` instead of `npm start` in Dockerfile
3. Mount source code as volumes for live updates

### Production Mode

The current setup is optimized for production:
- Multi-stage builds for smaller images
- Standalone Next.js output
- Production dependencies only
- Health checks enabled

## Troubleshooting

### Port already in use
If ports are already in use, modify the port mappings in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change host port
```

### MongoDB connection issues
- Ensure MongoDB container is healthy: `docker-compose ps`
- Check MongoDB logs: `docker-compose logs mongodb`
- Verify connection string in `.env` file

### Frontend can't reach backend
- Ensure `NEXT_PUBLIC_API_URL` is set correctly
- Check that backend is running: `docker-compose ps`
- Verify network connectivity: `docker-compose exec frontend ping backend`

### Build failures
- Clear Docker cache: `docker-compose build --no-cache`
- Check Docker logs for specific errors
- Ensure all dependencies are listed in `package.json`

## Environment Variables

### Required Variables
- `JWT_SECRET`: Secret key for JWT token signing
- `MONGODB_URL_DEVELOPMENT`: MongoDB connection string
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`: Email configuration

### Optional Variables
- `PORT`: Backend port (default: 5000)
- `NODE_ENV`: Environment mode (default: production)
- `NEXT_PUBLIC_API_URL`: Frontend API endpoint (default: http://localhost:5000/api)

## Data Persistence

MongoDB data is persisted in a Docker volume named `mongodb_data`. To backup:

```bash
# Create backup
docker-compose exec mongodb mongodump --out /data/backup

# Restore backup
docker-compose exec mongodb mongorestore /data/backup
```

## Security Notes

1. **Change JWT_SECRET** to a strong random string in production
2. **Use environment variables** for sensitive data, never commit `.env` files
3. **Configure firewall** rules for exposed ports
4. **Use HTTPS** in production (consider adding nginx reverse proxy)
5. **Secure MongoDB** with authentication in production

## Next Steps

- Set up SSL/TLS certificates
- Configure reverse proxy (nginx/traefik)
- Set up monitoring and logging
- Configure automated backups
- Set up CI/CD pipeline

