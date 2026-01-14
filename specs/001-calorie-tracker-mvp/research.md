# Research: Calorie Tracker MVP

**Date**: 2026-01-13
**Phase**: 0 - Technology Research

## Technology Decisions

### 1. Backend Framework

**Decision**: Express.js 4.x with TypeScript

**Rationale**:
- Matches tblsp architecture exactly, enabling code reuse and familiar patterns
- Proven stable for LAN-hosted applications
- Simple routing for REST APIs
- Excellent TypeScript support

**Alternatives Considered**:
- Fastify: Faster, but adds learning curve; Express sufficient for 10 users
- Hono: Modern, but less ecosystem maturity
- NestJS: Over-engineered for this scope

### 2. Database

**Decision**: SQLite with better-sqlite3

**Rationale**:
- Zero-configuration deployment (single file)
- Proven with tblsp for similar data volumes
- FTS5 full-text search for food queries
- Synchronous API (better-sqlite3) simplifies code
- Handles 3M+ food items with proper indexing

**Alternatives Considered**:
- PostgreSQL: More scalable but requires server setup; overkill for LAN app
- MySQL: Similar to PostgreSQL concerns
- LevelDB: No SQL, harder to query relationally

### 3. Frontend Framework

**Decision**: React 18.x with Vite 5.x

**Rationale**:
- Matches tblsp exactly
- TanStack Query for server state management
- Vite provides fast development experience
- Large ecosystem for charting libraries

**Alternatives Considered**:
- Vue: Viable but would diverge from tblsp
- Svelte: Smaller ecosystem for charting
- HTMX: Simpler but less interactive graph capability

### 4. Charting Library

**Decision**: Recharts (or Chart.js with react-chartjs-2)

**Rationale**:
- React-native integration
- Supports bar charts (daily intake vs target)
- Supports line charts (longitudinal trends)
- Responsive and interactive
- Good documentation

**Alternatives Considered**:
- D3.js: Too low-level for this use case
- Plotly: Heavier bundle size
- Victory: Good but Recharts more popular

### 5. Testing Framework

**Decision**: Vitest + Playwright

**Rationale**:
- Vitest: Fast, Vite-native, Jest-compatible API
- Playwright: Cross-browser E2E testing
- Matches tblsp testing setup

**Alternatives Considered**:
- Jest: Slower than Vitest, no Vite integration
- Cypress: Heavier than Playwright

### 6. Validation

**Decision**: Zod

**Rationale**:
- TypeScript-first schema validation
- Runtime type checking for API requests
- Matches tblsp approach

**Alternatives Considered**:
- Yup: Less TypeScript integration
- io-ts: More complex API

## USDA FoodData Central Integration

### Dataset Selection

**Decision**: Import Foundation, SR Legacy, and Branded Foods (CSV format)

**Size Estimates**:
| Dataset | Compressed | Uncompressed |
|---------|------------|--------------|
| Foundation | 3.4 MB | 29 MB |
| SR Legacy | 6.7 MB | 54 MB |
| Branded Foods | 427 MB | 2.9 GB |
| **Total** | ~437 MB | ~3 GB |

**Rationale**:
- Foundation: High-quality analytical data for common foods
- SR Legacy: Historical USDA data, comprehensive coverage
- Branded Foods: Commercial products with UPC codes

### Key USDA Tables to Import

| Table | Purpose | Key Fields |
|-------|---------|------------|
| food | Main food records | fdc_id, description, data_type |
| nutrient | Nutrient definitions | id, name, unit_name |
| food_nutrient | Food-nutrient values | fdc_id, nutrient_id, amount |
| food_portion | Serving sizes | fdc_id, gram_weight, portion_description |
| branded_food | Brand info (optional) | brand_owner, serving_size |

### Import Strategy

1. Download CSV files from USDA website
2. Create optimized SQLite schema with indexes
3. Bulk import using SQLite CLI with transaction batching
4. Create FTS5 virtual table for food search
5. Validate row counts and referential integrity

### Nutrient Mapping

Target nutrients (from spec) and their USDA nutrient IDs:

| Nutrient | USDA ID | Unit |
|----------|---------|------|
| Energy (calories) | 1008 | kcal |
| Protein | 1003 | g |
| Carbohydrate | 1005 | g |
| Sugars, added | 1235 | g |

Note: "Added sugar" (1235) may not be available for all foods. Fall back to
"Sugars, total" (2000) with UI indication when added sugar unavailable.

## tblsp Integration

### Database Schema Analysis

tblsp uses SQLite with the following relevant tables:

```sql
recipe (id, title, ingredients_raw, instructions, ...)
ingredient (id, recipe_id, name, quantity, original_text, position)
```

### Import Approach

**Decision**: Read-only SQLite connection to tblsp database (path configured via environment variable)

**Mapping**:
- `recipe.title` → MuffinTop recipe name
- `ingredient.name` → Search MuffinTop food database
- `ingredient.quantity` → Parse and convert to grams (user confirmation required)
- `ingredient.original_text` → Display for user reference

**Challenges**:
1. Ingredient names may not match USDA exactly (fuzzy search needed)
2. Quantities in tblsp are text ("1 cup", "2 tbsp") - need parsing
3. User must confirm/adjust each ingredient mapping

### Implementation

```typescript
// Pseudo-code for tblsp import
async function importFromTblsp(recipeId: number) {
  const tblspDbPath = process.env.TBLSP_DATABASE_PATH;
  if (!tblspDbPath) throw new Error('TBLSP_DATABASE_PATH not configured');
  const tblspDb = new Database(tblspDbPath, { readonly: true });
  const recipe = tblspDb.prepare('SELECT * FROM recipe WHERE id = ?').get(recipeId);
  const ingredients = tblspDb.prepare('SELECT * FROM ingredient WHERE recipe_id = ?').all(recipeId);

  return {
    name: recipe.title,
    ingredients: ingredients.map(ing => ({
      originalText: ing.original_text,
      parsedQuantity: parseQuantity(ing.quantity), // "1 cup" → { amount: 1, unit: "cup" }
      suggestedFoods: await searchFoods(ing.name), // MuffinTop search
      needsConfirmation: true
    }))
  };
}
```

## Performance Considerations

### Food Search

- FTS5 full-text search on food description
- Index on data_type for filtering by dataset
- Limit results to 50 items with relevance ranking
- Consider caching popular searches

### Daily Summary Calculation

- Aggregate food_log entries by date with SQL
- Pre-calculate recipe nutrients on save (denormalized)
- Index on (user_id, log_date) for fast daily queries

### Graph Rendering

- Server returns aggregated daily totals
- Frontend renders with Recharts (client-side)
- Pagination for >90 days of data

## Security Considerations

### User Isolation (Constitution Principle V)

- All user-owned tables include `user_id` foreign key
- API middleware extracts user_id from session/selection
- All queries filter by user_id
- No cross-user data access possible at query level

### Data Validation

- Zod schemas validate all API inputs
- Parameterized queries prevent SQL injection
- Rate limiting not required for LAN (trusted environment)

## Open Questions Resolved

| Question | Resolution |
|----------|------------|
| Backend framework? | Express.js (matches tblsp) |
| Database? | SQLite with better-sqlite3 |
| USDA data format? | CSV (easier import than JSON) |
| Charting library? | Recharts (React-native, good docs) |
| tblsp integration method? | Read-only SQLite connection |
| Added sugar handling? | Use nutrient 1235, fallback to 2000 |

## References

- [USDA FoodData Central Downloads](https://fdc.nal.usda.gov/download-datasets)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
- [Recharts Documentation](https://recharts.org/)
- [tblsp Schema](~/Projects/tblsp/backend/db/schema.sql)
