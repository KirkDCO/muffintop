# Data Model: Calorie Tracker MVP

**Date**: 2026-01-13
**Phase**: 1 - Design

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│    User     │       │    FoodLog      │       │    Food     │
├─────────────┤       ├─────────────────┤       ├─────────────┤
│ id (PK)     │──────<│ user_id (FK)    │       │ fdc_id (PK) │
│ name        │       │ food_id (FK)    │>──────│ description │
│ created_at  │       │ recipe_id (FK)  │       │ data_type   │
└─────────────┘       │ log_date        │       │ calories    │
      │               │ meal_category   │       │ protein     │
      │               │ portion_amount  │       │ carbs       │
      │               │ portion_unit    │       │ added_sugar │
      │               │ calories        │       └─────────────┘
      │               │ protein         │              │
      │               │ carbs           │              │
      │               │ added_sugar     │       ┌──────┴──────┐
      │               │ created_at      │       │ FoodPortion │
      │               └─────────────────┘       ├─────────────┤
      │                      │                  │ id (PK)     │
      │               ┌──────┴──────┐           │ fdc_id (FK) │
      │               │   Recipe    │           │ gram_weight │
      │               ├─────────────┤           │ description │
      │               │ id (PK)     │           │ amount      │
      ├──────────────<│ user_id (FK)│           └─────────────┘
      │               │ name        │
      │               │ servings    │
      │               │ calories    │
      │               │ protein     │
      │               │ carbs       │
      │               │ added_sugar │
      │               │ created_at  │
      │               └─────────────┘
      │                      │
      │               ┌──────┴──────────┐
      │               │RecipeIngredient │
      │               ├─────────────────┤
      │               │ id (PK)         │
      │               │ recipe_id (FK)  │
      │               │ food_id (FK)    │
      │               │ quantity_grams  │
      │               │ display_qty     │
      │               │ display_unit    │
      │               └─────────────────┘
      │
      │               ┌─────────────────┐
      ├──────────────<│  DailyTarget    │
      │               ├─────────────────┤
      │               │ id (PK)         │
      │               │ user_id (FK)    │
      │               │ basal_calories  │
      │               │ protein_target  │
      │               │ carbs_target    │
      │               │ sugar_target    │
      │               │ created_at      │
      │               └─────────────────┘
      │
      │               ┌─────────────────┐
      ├──────────────<│ ActivityLog     │
      │               ├─────────────────┤
      │               │ id (PK)         │
      │               │ user_id (FK)    │
      │               │ log_date        │
      │               │ activity_cals   │
      │               │ created_at      │
      │               └─────────────────┘
      │
      │               ┌─────────────────┐
      └──────────────<│  BodyMetric     │
                      ├─────────────────┤
                      │ id (PK)         │
                      │ user_id (FK)    │
                      │ metric_date     │
                      │ weight_value    │
                      │ weight_unit     │
                      │ created_at      │
                      └─────────────────┘
```

## Entity Definitions

### User

Account holder in the FeedBag system.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique identifier |
| name | TEXT | NOT NULL, UNIQUE | Display name for user selection |
| created_at | TEXT | NOT NULL, DEFAULT now | ISO 8601 timestamp |

**Notes**:
- No password/PIN for MVP (trusted LAN, user selection only)
- Unique name constraint prevents duplicate users

### Food (USDA Data)

Nutritional item from USDA FoodData Central. Read-only reference data.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| fdc_id | INTEGER | PK | USDA unique identifier |
| description | TEXT | NOT NULL | Food name/description |
| data_type | TEXT | NOT NULL | 'foundation', 'sr_legacy', 'branded' |
| brand_owner | TEXT | NULL | Brand name (branded foods only) |
| calories | REAL | NULL | kcal per 100g |
| protein | REAL | NULL | grams per 100g |
| carbs | REAL | NULL | grams per 100g |
| added_sugar | REAL | NULL | grams per 100g (may be NULL) |

**Notes**:
- Nutrients denormalized for query performance
- Values are per 100g (USDA standard)
- FTS5 index on description for search

### FoodPortion

Serving size options for a food item. Read-only reference data.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique identifier |
| fdc_id | INTEGER | FK → Food | Parent food |
| gram_weight | REAL | NOT NULL | Weight in grams |
| description | TEXT | NOT NULL | "1 cup", "1 medium", etc. |
| amount | REAL | NOT NULL | Numeric portion (1, 0.5, etc.) |

### CustomFood

User-created food not in USDA database.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique identifier |
| user_id | INTEGER | FK → User, NOT NULL | Owner |
| name | TEXT | NOT NULL | Food name |
| calories | REAL | NOT NULL | kcal per 100g |
| protein | REAL | NOT NULL | grams per 100g |
| carbs | REAL | NOT NULL | grams per 100g |
| added_sugar | REAL | NOT NULL | grams per 100g |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp |

**Notes**:
- Private to user (user_id isolation)
- Same per-100g basis as USDA foods

### FoodLog

Record of food consumption.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique identifier |
| user_id | INTEGER | FK → User, NOT NULL | Owner |
| food_id | INTEGER | FK → Food, NULL | USDA food (if applicable) |
| custom_food_id | INTEGER | FK → CustomFood, NULL | Custom food (if applicable) |
| recipe_id | INTEGER | FK → Recipe, NULL | Recipe (if applicable) |
| log_date | TEXT | NOT NULL | ISO 8601 date (YYYY-MM-DD) |
| meal_category | TEXT | NOT NULL | 'breakfast', 'lunch', 'dinner', 'snack' |
| portion_amount | REAL | NOT NULL | Number of portions |
| portion_grams | REAL | NOT NULL | Total grams consumed |
| calories | REAL | NOT NULL | Calculated kcal (snapshot) |
| protein | REAL | NOT NULL | Calculated grams (snapshot) |
| carbs | REAL | NOT NULL | Calculated grams (snapshot) |
| added_sugar | REAL | NULL | Calculated grams (snapshot) |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp |

**Notes**:
- Exactly one of food_id, custom_food_id, or recipe_id must be set
- Nutrients calculated and stored at log time (historical preservation)
- Indexed on (user_id, log_date) for daily queries

### Recipe

User-created combination of foods.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique identifier |
| user_id | INTEGER | FK → User, NOT NULL | Owner |
| name | TEXT | NOT NULL | Recipe name |
| servings | INTEGER | NOT NULL, DEFAULT 1 | Number of servings |
| calories | REAL | NOT NULL | Total kcal (calculated) |
| protein | REAL | NOT NULL | Total grams (calculated) |
| carbs | REAL | NOT NULL | Total grams (calculated) |
| added_sugar | REAL | NULL | Total grams (calculated) |
| tblsp_recipe_id | INTEGER | NULL | Source tblsp recipe (if imported) |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp |
| updated_at | TEXT | NOT NULL | ISO 8601 timestamp |

**Notes**:
- Private to user
- Nutrients are totals for entire recipe (divide by servings for per-serving)
- tblsp_recipe_id tracks import source (informational only)

### RecipeIngredient

Ingredient in a recipe.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique identifier |
| recipe_id | INTEGER | FK → Recipe, NOT NULL | Parent recipe |
| food_id | INTEGER | FK → Food, NULL | USDA food |
| custom_food_id | INTEGER | FK → CustomFood, NULL | Custom food |
| quantity_grams | REAL | NOT NULL | Amount in grams |
| display_quantity | TEXT | NULL | "1 cup", "2 tbsp" (for display) |
| position | INTEGER | NOT NULL | Order in recipe |

**Notes**:
- Exactly one of food_id or custom_food_id must be set
- quantity_grams is authoritative for calculations

### DailyTarget

User's nutrient goals and basal expenditure.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique identifier |
| user_id | INTEGER | FK → User, NOT NULL, UNIQUE | Owner (one per user) |
| basal_calories | INTEGER | NOT NULL | Daily basal expenditure (kcal) |
| protein_target | INTEGER | NULL | Daily protein goal (grams) |
| carbs_target | INTEGER | NULL | Daily carbs goal (grams) |
| sugar_target | INTEGER | NULL | Daily added sugar limit (grams) |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp |
| updated_at | TEXT | NOT NULL | ISO 8601 timestamp |

**Notes**:
- One record per user (UNIQUE constraint)
- Macro targets optional (NULL = not tracking)

### ActivityLog

Daily activity calorie expenditure.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique identifier |
| user_id | INTEGER | FK → User, NOT NULL | Owner |
| log_date | TEXT | NOT NULL | ISO 8601 date (YYYY-MM-DD) |
| activity_calories | INTEGER | NOT NULL | Activity expenditure (kcal) |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp |

**Notes**:
- One entry per user per day (UNIQUE on user_id + log_date)
- Simple numeric input per spec (no activity types)
- Total expenditure = basal_calories + activity_calories

### BodyMetric

User's physical measurements (weight only for MVP).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique identifier |
| user_id | INTEGER | FK → User, NOT NULL | Owner |
| metric_date | TEXT | NOT NULL | ISO 8601 date (YYYY-MM-DD) |
| weight_value | REAL | NOT NULL | Weight measurement |
| weight_unit | TEXT | NOT NULL | 'kg' or 'lb' |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp |

**Notes**:
- One weight entry per user per day (UNIQUE on user_id + metric_date)
- Store in user's preferred unit; convert for display as needed
- Schema supports future metric types via new columns

## Indexes

```sql
-- Food search
CREATE VIRTUAL TABLE food_fts USING fts5(description, content='food', content_rowid='fdc_id');
CREATE INDEX idx_food_data_type ON food(data_type);

-- Food log queries
CREATE INDEX idx_food_log_user_date ON food_log(user_id, log_date);
CREATE INDEX idx_food_log_created ON food_log(created_at DESC);

-- Recipe queries
CREATE INDEX idx_recipe_user ON recipe(user_id);
CREATE INDEX idx_recipe_ingredient_recipe ON recipe_ingredient(recipe_id);

-- Activity and metrics
CREATE UNIQUE INDEX idx_activity_user_date ON activity_log(user_id, log_date);
CREATE UNIQUE INDEX idx_body_metric_user_date ON body_metric(user_id, metric_date);
```

## Validation Rules

### Food Logging
- `log_date` must be valid ISO 8601 date
- `meal_category` must be one of: 'breakfast', 'lunch', 'dinner', 'snack'
- `portion_amount` must be > 0
- Exactly one of food_id, custom_food_id, or recipe_id must be non-NULL

### Recipe Creation
- `name` must be non-empty, max 200 characters
- `servings` must be >= 1
- At least one ingredient required
- Each ingredient must have quantity_grams > 0

### Targets
- `basal_calories` must be between 500 and 10000
- Macro targets (if set) must be >= 0

### Body Metrics
- `weight_value` must be between 20 and 1000 (supports kg or lb)
- `weight_unit` must be 'kg' or 'lb'

## State Transitions

### User Lifecycle
```
Created → Active → Deleted (cascade deletes all user data)
```

### Food Log Entry
```
Created → [Edited] → Deleted
```
No soft delete - entries are permanently removed.

### Recipe Lifecycle
```
Created → [Edited] → Deleted (cascade deletes ingredients)
```
Historical food logs retain calculated nutrients even if recipe deleted.

## Computed Values

### Daily Summary (calculated on-demand)
```sql
SELECT
  log_date,
  SUM(calories) as total_calories,
  SUM(protein) as total_protein,
  SUM(carbs) as total_carbs,
  SUM(added_sugar) as total_sugar
FROM food_log
WHERE user_id = ? AND log_date = ?
GROUP BY log_date
```

### Intake vs Expenditure
```
total_expenditure = basal_calories + activity_calories
calorie_balance = total_intake - total_expenditure
```

### Recipe Nutrients (calculated on save)
```
recipe.calories = SUM(ingredient.quantity_grams / 100 * food.calories)
recipe.protein = SUM(ingredient.quantity_grams / 100 * food.protein)
...
```
