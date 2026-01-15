# MuffinTop Deployment Guide

## Quick Start (Single Server)

The simplest deployment serves both the API and frontend from the Express backend.

### 1. Build the Application

```bash
# Install dependencies and build everything
npm ci
npm run build:prod
```

This creates:
- `backend/dist/` - Compiled backend
- `frontend/dist/` - Built frontend static files

### 2. Configure Environment

Create a `.env` file in the project root:

```bash
# Server port
PORT=3002

# CORS origin (set to your domain, or * for single-server deployment)
CORS_ORIGIN=*

# Node environment
NODE_ENV=production
```

### 3. Initialize the Database

```bash
# Create main database with schema
npm run db:init

# Download and import USDA food data (~400k foods, ~1.5GB download)
# This takes 10-20 minutes depending on connection speed
npm run usda:import

# Options for usda:import:
#   --foundation-only     Only import ~10k whole foods (faster, smaller)
#   --skip-download       Skip download, use existing CSV files
#   --branded-limit N     Limit branded foods to N items

# Optional: seed with test user for demo
npx tsx scripts/create-test-data.ts
```

**Note**: The app works without USDA import using 24 sample foods. Run the import for the full food database.

### 4. Run the Server

```bash
npm run start:prod
```

The app will be available at `http://your-server:3002`

---

## Production Deployment Options

### Option A: Systemd Service (Linux)

Create `/etc/systemd/system/muffintop.service`:

```ini
[Unit]
Description=MuffinTop Calorie Tracker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/muffintop
EnvironmentFile=/opt/muffintop/.env
ExecStart=/usr/bin/node backend/dist/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable muffintop
sudo systemctl start muffintop
```

### Option B: Docker

Create `Dockerfile` in project root:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/

# Install dependencies
RUN npm ci --omit=dev

# Copy source
COPY . .

# Build
RUN npm run build:prod

# Expose port
EXPOSE 3002

# Set environment
ENV NODE_ENV=production
ENV PORT=3002

# Run
CMD ["node", "backend/dist/index.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  muffintop:
    build: .
    ports:
      - "3002:3002"
    volumes:
      - ./backend/db:/app/backend/db
    environment:
      - NODE_ENV=production
      - PORT=3002
    restart: unless-stopped
```

Run with:

```bash
docker-compose up -d
```

### Option C: Reverse Proxy (nginx)

If running behind nginx, configure a site:

```nginx
server {
    listen 80;
    server_name muffintop.example.com;

    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /opt/muffintop/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Database Backup

The SQLite database is stored at `backend/db/muffintop.db`. To backup:

```bash
# Simple file copy (stop server first for consistency)
cp backend/db/muffintop.db backup/muffintop-$(date +%Y%m%d).db

# Or use SQLite backup command (works while running)
sqlite3 backend/db/muffintop.db ".backup 'backup/muffintop.db'"
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3002` | Server port |
| `NODE_ENV` | `development` | Environment (`production` for optimizations) |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `USDA_DATABASE_PATH` | `backend/db/usda/fooddata.db` | Path to USDA food database |
| `TBLSP_DATABASE_PATH` | (none) | Path to tblsp database for recipe import |

---

## Updating

```bash
cd /opt/muffintop
git pull
npm ci
npm run build:prod
npm run db:migrate  # Apply any new migrations
sudo systemctl restart muffintop
```

---

## Troubleshooting

**Database locked errors**: Ensure only one instance is running. SQLite doesn't handle concurrent writes well.

**CORS errors**: Check `CORS_ORIGIN` matches your frontend URL exactly.

**Port already in use**: Check for existing processes: `lsof -i :3002`

**Missing USDA data**: Run `npm run usda:import` to populate the food database.
