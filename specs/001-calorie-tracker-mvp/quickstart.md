# Quickstart Guide: MuffinTop Calorie Tracker

**Date**: 2026-01-14
**Phase**: Complete - All user stories implemented

## Prerequisites

- Node.js 20+ (`node --version`)
- npm 9+ (`npm --version`)
- ~4GB disk space (for USDA data)
- Access to tblsp database (optional, for recipe import)

## Quick Setup (Recommended)

```bash
# Clone repository (if not already done)
cd ~/Projects/muffintop

# One-command setup: install deps, init DB, import USDA, build
npm run setup

# Start development servers
npm run dev
```

Access the application at: `http://localhost:5173`

## Manual Project Setup

### 1. Clone and Install Dependencies

```bash
# Clone repository (if not already done)
cd ~/Projects/muffintop

# Install all workspace dependencies
npm install
```

### 2. Environment Configuration

**Backend** (`backend/.env`):
```env
PORT=3002
NODE_ENV=development
DATABASE_PATH=./db/muffintop.db
USDA_DATABASE_PATH=./db/usda/fooddata.db
TBLSP_DATABASE_PATH=~/Projects/tblsp/backend/db/recipes.db
CORS_ORIGIN=http://localhost:5173
```

**Note**: `TBLSP_DATABASE_PATH` varies by environment:
- Development: `~/Projects/tblsp/backend/db/recipes.db`
- Production: Configure to match server tblsp installation path

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3002/api/v1
```

### 3. Database Initialization

```bash
cd backend

# Initialize MuffinTop schema
npm run db:init

# Download and import USDA data (one-time, ~10 minutes)
npm run usda:download
npm run usda:import

# Verify database
npm run db:verify
```

### 4. Start Development Servers

```bash
# Terminal 1 - Backend (port 3002)
cd backend && npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend && npm run dev
```

Access the application at: `http://localhost:5173`

## Directory Structure

```
muffintop/
├── backend/
│   ├── src/
│   │   ├── api/           # Route handlers
│   │   ├── models/        # TypeScript types
│   │   ├── services/      # Business logic
│   │   ├── db/            # Database utilities
│   │   ├── middleware/    # Express middleware
│   │   └── utils/         # Import scripts
│   ├── db/
│   │   ├── schema.sql     # MuffinTop schema
│   │   ├── muffintop.db     # User data (gitignored)
│   │   └── usda/          # USDA data (gitignored)
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page layouts
│   │   ├── hooks/         # React hooks
│   │   ├── services/      # API client
│   │   └── providers/     # Context providers
│   └── tests/
├── shared/
│   └── types/             # Shared interfaces
└── scripts/               # Utility scripts
```

## Available Commands

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled code |
| `npm test` | Run unit tests |
| `npm run test:watch` | Watch mode |
| `npm run db:init` | Initialize schema |
| `npm run db:reset` | Drop and recreate |
| `npm run usda:download` | Download USDA CSV files |
| `npm run usda:import` | Import USDA data |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript check |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm test` | Run component tests |
| `npm run test:e2e` | Playwright E2E |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript check |

## API Overview

Base URL: `http://localhost:3002/api/v1`

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users |
| POST | `/users` | Create user |
| DELETE | `/users/:id` | Delete user |
| GET | `/foods/search?q=` | Search foods |
| GET | `/foods/:fdcId` | Food details |
| GET | `/users/:id/food-log` | Get food log |
| POST | `/users/:id/food-log` | Log food |
| PUT | `/users/:id/food-log/:entryId` | Update log entry |
| DELETE | `/users/:id/food-log/:entryId` | Delete log entry |
| GET | `/users/:id/recipes` | List recipes |
| POST | `/users/:id/recipes` | Create recipe |
| PUT | `/users/:id/recipes/:recipeId` | Update recipe |
| DELETE | `/users/:id/recipes/:recipeId` | Delete recipe |
| GET | `/users/:id/custom-foods` | List custom foods |
| POST | `/users/:id/custom-foods` | Create custom food |
| GET | `/users/:id/targets` | Get nutrient targets |
| PUT | `/users/:id/targets` | Update targets |
| GET | `/users/:id/activity` | Get activity log |
| POST | `/users/:id/activity` | Log activity calories |
| GET | `/users/:id/metrics/weight` | Get weight history |
| POST | `/users/:id/metrics/weight` | Log weight |
| GET | `/users/:id/events` | Get user events |
| POST | `/users/:id/events` | Create event |
| DELETE | `/users/:id/events/:id` | Delete event |
| GET | `/users/:id/stats/daily` | Daily nutrient summary |
| GET | `/users/:id/stats/trends` | Longitudinal trend data |

See `specs/001-calorie-tracker-mvp/contracts/api-v1.yaml` for full OpenAPI spec.

## Development Workflow

### Adding a New API Endpoint

1. Define route in `backend/src/api/<resource>.ts`
2. Add service logic in `backend/src/services/<resource>.ts`
3. Add types to `shared/types/`
4. Write contract test in `backend/tests/contract/`
5. Update OpenAPI spec in `specs/.../contracts/api-v1.yaml`

### Adding a New Frontend Page

1. Create page component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Create hooks for data fetching in `frontend/src/hooks/`
4. Write component tests in `frontend/tests/`

### Running Tests

```bash
# Backend unit tests
cd backend && npm test

# Frontend component tests
cd frontend && npm test

# E2E tests (requires both servers running)
cd frontend && npm run test:e2e

# All tests
npm run test:all  # from root
```

## USDA Data Import Details

The USDA import process:

1. **Download** (~500MB compressed):
   - Foundation Foods CSV
   - SR Legacy CSV
   - Branded Foods CSV

2. **Extract** to `backend/db/usda/csv/`

3. **Import** to SQLite:
   - Creates `backend/db/usda/fooddata.db`
   - ~3M food records
   - FTS5 index for search

4. **Verify**:
   - Row counts match expected
   - Sample queries return results

```bash
# Full process
npm run usda:download && npm run usda:import

# Or step by step
npm run usda:download
npm run usda:extract
npm run usda:import
npm run usda:verify
```

## tblsp Integration

To enable recipe import from tblsp:

1. Ensure tblsp database exists and has recipes
2. Set `TBLSP_DATABASE_PATH` in backend `.env` to the correct path:
   - Development: `~/Projects/tblsp/backend/db/recipes.db`
   - Production: Path to tblsp installation on server (e.g., `/opt/tblsp/backend/db/recipes.db`)
3. Restart backend server

```bash
# Verify tblsp connection
npm run tblsp:verify
```

**Note**: tblsp does not need to be running for import to work - MuffinTop reads directly from the SQLite database file.

Import flow:
1. GET `/users/:id/recipes/import/tblsp` - List available recipes
2. GET `/users/:id/recipes/import/tblsp/:id/preview` - Get ingredient suggestions
3. POST `/users/:id/recipes/import/tblsp` - Import with confirmed mappings

## Production Deployment

### Environment Configuration

Create `backend/.env.production` with server-specific paths:

```env
PORT=3002
NODE_ENV=production
DATABASE_PATH=/path/to/muffintop/db/muffintop.db
USDA_DATABASE_PATH=/path/to/muffintop/db/usda/fooddata.db
TBLSP_DATABASE_PATH=/path/to/tblsp/backend/db/recipes.db
CORS_ORIGIN=http://<server-ip>:3002
```

**Important**: Update paths to match your server's installation locations:
- `DATABASE_PATH`: Where MuffinTop stores user data
- `USDA_DATABASE_PATH`: Where USDA food data is stored
- `TBLSP_DATABASE_PATH`: Path to tblsp's SQLite database on the server

### Build and Deploy

```bash
# Build both projects
cd backend && npm run build
cd ../frontend && npm run build

# Copy frontend build to backend static
cp -r frontend/dist backend/public

# Copy .env.production to .env
cp backend/.env.production backend/.env

# Initialize databases (if not already done)
cd backend
npm run db:init
npm run usda:import  # If USDA data not yet imported

# Start production server
NODE_ENV=production npm start
```

Access at: `http://<server-ip>:3002`

## Troubleshooting

### USDA import fails
- Check disk space (~4GB needed)
- Verify CSV files downloaded completely
- Check `backend/db/usda/` permissions

### tblsp connection fails
- Verify tblsp database path exists
- Check file permissions
- Ensure tblsp not actively writing

### Food search slow
- Run `npm run db:analyze` to update indexes
- Check FTS5 index integrity

### Frontend can't connect to backend
- Verify CORS_ORIGIN matches frontend URL
- Check both servers are running
- Verify API URL in frontend `.env`

## Related Documentation

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Data Model](./data-model.md)
- [API Contract](./contracts/api-v1.yaml)
- [Research Notes](./research.md)
