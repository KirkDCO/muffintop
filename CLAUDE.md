# MuffinTop Development Guidelines

## Overview

MuffinTop is a self-hosted calorie and nutrition tracker with multi-user support, recipe management, and longitudinal trend analysis.

## Tech Stack

- **Backend**: TypeScript 5.6+, Node.js 20+, Express.js 4.x, better-sqlite3
- **Frontend**: React 18.x, TypeScript, Vite 5.x, TanStack Query
- **Database**: SQLite (main app data + separate USDA food database)
- **Testing**: Vitest (unit), Playwright (E2E)

## Project Structure

```text
muffintop/
├── backend/
│   ├── src/
│   │   ├── api/           # Express route handlers
│   │   ├── services/      # Business logic layer
│   │   ├── models/        # Zod validation schemas
│   │   ├── db/            # Database connection utilities
│   │   └── middleware/    # Express middleware
│   ├── db/
│   │   ├── schema.sql     # Main database schema
│   │   ├── migrations/    # Schema migrations
│   │   └── usda/          # USDA food database (gitignored)
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page-level components
│   │   ├── hooks/         # Custom React hooks (data fetching)
│   │   ├── providers/     # React context providers
│   │   └── services/      # API client
│   └── tests/
├── shared/
│   └── types/             # Shared TypeScript types between frontend/backend
├── scripts/               # Utility scripts (USDA import, etc.)
└── specs/                 # Feature specifications
```

## Commands

```bash
# Development
npm run dev              # Start frontend + backend
npm test                 # Run all tests
npm run lint             # Lint all packages

# Database
npm run db:init          # Initialize schema
npm run db:reset         # Reset database
npm run usda:import      # Import USDA food data

# Build
npm run build            # Build all packages
npm run build:prod       # Production build
```

## Code Conventions

### Backend
- Services contain business logic, API routes handle HTTP concerns
- Use Zod schemas in `models/` for request validation
- Database queries use better-sqlite3 synchronous API
- All nutrient values stored per 100g (USDA) or per serving (custom foods)

### Frontend
- Use TanStack Query hooks for all data fetching
- Components in `components/` are reusable; `pages/` are route-specific
- Shared types imported from `@muffintop/shared/types`
- Inline styles used for component-specific CSS

### Shared Types
- All API types defined in `shared/types/`
- Nutrient keys defined in `nutrients.ts` with NUTRIENT_REGISTRY
- Target directions ('min'/'max') determine progress bar coloring

## Key Patterns

### Adding a New Nutrient
1. Add to `shared/types/nutrients.ts` NUTRIENT_REGISTRY
2. Add column to `backend/db/schema.sql` (food, custom_food, recipe, food_log tables)
3. Update USDA import if needed
4. Run `npm run db:reset && npm run usda:import`

### Adding a New API Endpoint
1. Add route handler in `backend/src/api/`
2. Add service logic in `backend/src/services/`
3. Add Zod schema in `backend/src/models/`
4. Add types to `shared/types/`
5. Add hook in `frontend/src/hooks/`

### Target Directions
- `'max'` targets (calories, sodium, sugar): over=bad, under=good
- `'min'` targets (protein, fiber, vitamins): over=good, under=bad
- Colors: blue=good, orange=bad (colorblind-friendly)

## Database Notes

- Main app database: `backend/db/muffintop.db`
- USDA food database: `backend/db/usda/fooddata.db` (separate, read-only)
- Migrations in `backend/db/migrations/` (manually applied)
- FTS5 used for food search

## Recent Features

- Event logging for tracking life events on trend charts
- Direction-aware nutrient targets (min/max)
- Colorblind-friendly trend chart fills (blue/orange)
- Recipe import from tblsp
