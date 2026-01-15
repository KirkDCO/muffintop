# MuffinTop

A self-hosted calorie and nutrition tracker with multi-user support, recipe management, and longitudinal trend analysis.

## Features

- **Food Logging** - Search 400k+ foods from USDA FoodData Central, log meals with customizable portions
- **Nutrient Tracking** - Track 17 nutrients including calories, protein, carbs, fats, fiber, vitamins, and minerals
- **Custom Foods** - Create your own foods with per-serving nutrients (matches nutrition labels)
- **Recipes** - Build recipes from ingredients, automatically calculate nutrition per serving
- **Daily Targets** - Set calorie and nutrient goals, track progress with visual indicators
- **Weight Tracking** - Log body weight, view trends over time
- **Activity Logging** - Record exercise calories to adjust daily budget
- **Trend Charts** - Visualize nutrition and weight trends over weeks/months
- **Multi-User** - Support multiple users with isolated data
- **Recipe Import** - Import recipes from [tblsp](https://github.com/KirkDCO/tblsp) recipe manager

## Tech Stack

- **Backend**: Node.js 20+, Express.js, SQLite (better-sqlite3)
- **Frontend**: React 18, TypeScript, Vite, TanStack Query
- **Data**: USDA FoodData Central (~400k foods)

## Quick Start

```bash
# Clone and install
git clone https://github.com/KirkDCO/muffintop.git
cd muffintop
npm install

# Initialize database
npm run db:init

# Start development servers
npm run dev
```

Open http://localhost:5173 in your browser.

## USDA Food Database

The app includes 24 sample foods for testing. For the full USDA database (~400k foods):

```bash
# Download and import (takes 10-20 minutes)
npm run usda:import

# Or import only foundation foods (~10k whole foods, faster)
npm run usda:import -- --foundation-only
```

## Project Structure

```
muffintop/
├── backend/           # Express API server
│   ├── src/
│   │   ├── api/       # REST endpoints
│   │   ├── services/  # Business logic
│   │   ├── models/    # Zod validation schemas
│   │   └── db/        # Database connections
│   └── db/
│       ├── schema.sql
│       └── migrations/
├── frontend/          # React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── providers/
│   └── tests/e2e/     # Playwright tests
├── shared/            # Shared TypeScript types
│   └── types/
└── scripts/           # Utility scripts
```

## Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev -w backend   # Start backend only
npm run dev -w frontend  # Start frontend only

# Building
npm run build            # Build all packages
npm run build:prod       # Production build

# Database
npm run db:init          # Initialize database schema
npm run db:reset         # Reset database (clears all data)
npm run db:migrate       # Run pending migrations

# Testing
npm test                 # Run all tests
npm run test -w frontend # Run frontend tests
npx playwright test      # Run E2E tests (from frontend dir)

# USDA Import
npm run usda:import      # Download and import USDA data
```

## Configuration

Environment variables (create `.env` in project root):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3002` | Backend server port |
| `NODE_ENV` | `development` | Environment mode |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `USDA_DATABASE_PATH` | `backend/db/usda/fooddata.db` | USDA database location |
| `TBLSP_DB_PATH` | (none) | tblsp database for recipe import |

## API Overview

All endpoints are prefixed with `/api/v1`.

| Endpoint | Description |
|----------|-------------|
| `GET /users` | List all users |
| `POST /users` | Create user |
| `GET /foods/search?q=` | Search foods |
| `GET /foods/:fdcId` | Get food details |
| `GET /users/:id/food-log?date=` | Get daily food log |
| `POST /users/:id/food-log` | Log food entry |
| `GET /users/:id/recipes` | List recipes |
| `POST /users/:id/recipes` | Create recipe |
| `GET /users/:id/targets` | Get daily targets |
| `PUT /users/:id/targets` | Update targets |
| `GET /users/:id/stats/daily` | Daily nutrition stats |
| `GET /users/:id/stats/trends` | Longitudinal trends |

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions including:
- Single-server deployment
- Systemd service configuration
- Docker containerization
- Nginx reverse proxy setup

Quick production start:

```bash
npm run build:prod
npm run db:init
npm run usda:import
NODE_ENV=production npm run start:prod
```

## Screenshots

### Dashboard
Daily food log with nutrient summary and progress indicators.

### Recipe Builder
Create recipes from ingredients with automatic nutrition calculation.

### Trend Charts
Visualize nutrition and weight trends over customizable time periods.

## Development

### Adding a New Nutrient

1. Add to `shared/types/nutrients.ts` NUTRIENT_REGISTRY
2. Add column to `backend/db/schema.sql`
3. Create migration in `backend/db/migrations/`
4. Update USDA import script if needed

### Running E2E Tests

```bash
cd frontend
npx playwright test
npx playwright test --ui  # Interactive mode
```

## License

MIT

## Acknowledgments

- Food data from [USDA FoodData Central](https://fdc.nal.usda.gov/)
- Built with [Claude Code](https://claude.ai/code)
