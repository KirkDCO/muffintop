# Tasks: Calorie Tracker MVP

**Input**: Design documents from `/specs/001-calorie-tracker-mvp/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api-v1.yaml, research.md, quickstart.md

**Tests**: Included per Constitution Principle III (Tests Required)

**Organization**: Tasks grouped by user story for independent implementation and testing

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`
- **Shared**: `shared/types/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create monorepo structure with backend/, frontend/, shared/, scripts/ directories
- [x] T002 Initialize backend Node.js project with TypeScript in backend/package.json
- [x] T003 Initialize frontend React/Vite project with TypeScript in frontend/package.json
- [x] T004 Initialize shared types package in shared/package.json
- [x] T005 [P] Configure ESLint and Prettier for backend in backend/eslint.config.js
- [x] T006 [P] Configure ESLint and Prettier for frontend in frontend/eslint.config.js
- [x] T007 [P] Configure Vitest for backend in backend/vitest.config.ts
- [x] T008 [P] Configure Vitest for frontend in frontend/vitest.config.ts
- [x] T009 [P] Configure Playwright for E2E tests in frontend/playwright.config.ts
- [x] T010 Create environment configuration files (backend/.env.example, frontend/.env.example)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Schema

- [x] T011 Create FeedBag database schema in backend/db/schema.sql per data-model.md
- [x] T012 Implement database connection module in backend/src/db/connection.ts
- [x] T013 Create database initialization script in backend/src/db/init.ts
- [x] T014 Create USDA data import script in scripts/import-usda.ts
- [x] T015 Create npm scripts for db:init, db:reset, usda:import in backend/package.json

### Shared Types

- [x] T016 [P] Define User type in shared/types/user.ts
- [x] T017 [P] Define Food and FoodPortion types in shared/types/food.ts
- [x] T018 [P] Define FoodLog type in shared/types/food-log.ts
- [x] T019 [P] Define Recipe and RecipeIngredient types in shared/types/recipe.ts
- [x] T020 [P] Define DailyTarget and ActivityLog types in shared/types/targets.ts
- [x] T021 [P] Define BodyMetric type in shared/types/metrics.ts
- [x] T022 [P] Define API response types (Error, ValidationError) in shared/types/api.ts
- [x] T023 Export all types from shared/types/index.ts

### Backend Infrastructure

- [x] T024 Setup Express app with middleware in backend/src/app.ts
- [x] T025 [P] Create error handling middleware in backend/src/middleware/error-handler.ts
- [x] T026 [P] Create user context middleware in backend/src/middleware/user-context.ts
- [x] T027 [P] Create request validation middleware using Zod in backend/src/middleware/validate.ts
- [x] T028 Configure CORS for LAN access in backend/src/app.ts
- [x] T029 Create API router structure in backend/src/api/index.ts
- [x] T030 Create server entry point in backend/src/index.ts

### Frontend Infrastructure

- [x] T031 Setup React app structure in frontend/src/main.tsx
- [x] T032 [P] Create API client service in frontend/src/services/api.ts
- [x] T033 [P] Create UserProvider context in frontend/src/providers/UserProvider.tsx
- [x] T034 Setup TanStack Query provider in frontend/src/providers/QueryProvider.tsx
- [x] T035 Create app routing structure in frontend/src/App.tsx
- [x] T036 [P] Create base layout component in frontend/src/components/Layout.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 8 - Multi-User Support (Priority: P8 but REQUIRED FIRST)

**Goal**: Enable user selection so all other stories have user context

**Independent Test**: Create two users, verify each can be selected and has isolated context

**Note**: Although P8 in business priority, user management is technically required before other stories

### Tests for User Story 8

- [x] T037 [P] [US8] Contract test for GET/POST /users in backend/tests/contract/users.test.ts
- [x] T038 [P] [US8] Contract test for DELETE /users/:id in backend/tests/contract/users.test.ts

### Implementation for User Story 8

- [x] T039 [P] [US8] Create User model in backend/src/models/user.ts
- [x] T040 [US8] Implement UserService (list, create, delete) in backend/src/services/user-service.ts
- [x] T041 [US8] Implement /users routes in backend/src/api/users.ts
- [x] T042 [US8] Create UserSelector component in frontend/src/components/UserSelector.tsx
- [x] T043 [US8] Create user selection page in frontend/src/pages/SelectUser.tsx
- [x] T044 [US8] Implement useUsers hook in frontend/src/hooks/useUsers.ts
- [x] T045 [US8] Add user deletion with cascade in backend/src/services/user-service.ts

**Checkpoint**: Users can be created, selected, and deleted. User context flows through app.

---

## Phase 4: User Story 2 - Search and Browse Foods (Priority: P2)

**Goal**: Enable searching USDA food database to find nutritional information

**Independent Test**: Search for "chicken breast", verify results show nutrients per serving

**Note**: Required before US1 (logging) since users need to find foods first

### Tests for User Story 2

- [ ] T046 [P] [US2] Contract test for GET /foods/search in backend/tests/contract/foods.test.ts
- [ ] T047 [P] [US2] Contract test for GET /foods/:fdcId in backend/tests/contract/foods.test.ts
- [ ] T048 [P] [US2] Unit test for food search service in backend/tests/unit/food-service.test.ts

### Implementation for User Story 2

- [ ] T049 [P] [US2] Create Food model in backend/src/models/food.ts
- [ ] T050 [P] [US2] Create FoodPortion model in backend/src/models/food-portion.ts
- [ ] T051 [US2] Implement FoodService (search with FTS5, getById) in backend/src/services/food-service.ts
- [ ] T052 [US2] Implement /foods routes in backend/src/api/foods.ts
- [ ] T053 [US2] Create FoodSearch component in frontend/src/components/FoodSearch.tsx
- [ ] T054 [US2] Create FoodCard component in frontend/src/components/FoodCard.tsx
- [ ] T055 [US2] Create FoodDetail component with portions in frontend/src/components/FoodDetail.tsx
- [ ] T056 [US2] Implement useFoodSearch hook in frontend/src/hooks/useFoodSearch.ts
- [ ] T057 [US2] Create foods browse page in frontend/src/pages/Foods.tsx

**Checkpoint**: Users can search foods and view nutritional details with portion options

---

## Phase 5: User Story 1 - Log Daily Food Intake (Priority: P1) 🎯 MVP

**Goal**: Log foods eaten, view daily summary with nutrient totals

**Independent Test**: Log banana for breakfast, verify daily totals show correct calories

### Tests for User Story 1

- [ ] T058 [P] [US1] Contract test for GET/POST /users/:id/food-log in backend/tests/contract/food-log.test.ts
- [ ] T059 [P] [US1] Contract test for PUT/DELETE /users/:id/food-log/:id in backend/tests/contract/food-log.test.ts
- [ ] T060 [P] [US1] Contract test for GET /users/:id/food-log/recent in backend/tests/contract/food-log.test.ts
- [ ] T061 [P] [US1] Unit test for nutrient calculation in backend/tests/unit/nutrient-calc.test.ts

### Implementation for User Story 1

- [ ] T062 [P] [US1] Create FoodLog model in backend/src/models/food-log.ts
- [ ] T063 [US1] Implement FoodLogService (create, update, delete, getByDate) in backend/src/services/food-log-service.ts
- [ ] T064 [US1] Implement nutrient calculation utility in backend/src/utils/nutrient-calc.ts
- [ ] T065 [US1] Implement recent foods query (last 7 days) in backend/src/services/food-log-service.ts
- [ ] T066 [US1] Implement /users/:id/food-log routes in backend/src/api/food-log.ts
- [ ] T067 [US1] Create FoodLogEntry component in frontend/src/components/FoodLogEntry.tsx
- [ ] T068 [US1] Create LogFoodModal component in frontend/src/components/LogFoodModal.tsx
- [ ] T069 [US1] Create DailySummary component in frontend/src/components/DailySummary.tsx
- [ ] T070 [US1] Create RecentFoods component in frontend/src/components/RecentFoods.tsx
- [ ] T071 [US1] Implement useFoodLog hook in frontend/src/hooks/useFoodLog.ts
- [ ] T072 [US1] Create Dashboard page with daily log in frontend/src/pages/Dashboard.tsx
- [ ] T073 [US1] Add edit/delete functionality to FoodLogEntry component

**Checkpoint**: Users can log food, view daily summary, edit/delete entries, re-log recent foods

---

## Phase 6: User Story 4 - Set and Track Daily Targets (Priority: P4)

**Goal**: Set basal expenditure and nutrient targets, see progress

**Independent Test**: Set 2000 cal target, log 1500 cal, verify progress shows 75%

### Tests for User Story 4

- [ ] T074 [P] [US4] Contract test for GET/PUT /users/:id/targets in backend/tests/contract/targets.test.ts
- [ ] T075 [P] [US4] Contract test for GET/POST /users/:id/activity in backend/tests/contract/activity.test.ts

### Implementation for User Story 4

- [ ] T076 [P] [US4] Create DailyTarget model in backend/src/models/daily-target.ts
- [ ] T077 [P] [US4] Create ActivityLog model in backend/src/models/activity-log.ts
- [ ] T078 [US4] Implement TargetService (get, upsert) in backend/src/services/target-service.ts
- [ ] T079 [US4] Implement ActivityService (log, getByDate) in backend/src/services/activity-service.ts
- [ ] T080 [US4] Implement /users/:id/targets routes in backend/src/api/targets.ts
- [ ] T081 [US4] Implement /users/:id/activity routes in backend/src/api/activity.ts
- [ ] T082 [US4] Create TargetSetup component in frontend/src/components/TargetSetup.tsx
- [ ] T083 [US4] Create ActivityInput component in frontend/src/components/ActivityInput.tsx
- [ ] T084 [US4] Create ProgressIndicator component in frontend/src/components/ProgressIndicator.tsx
- [ ] T085 [US4] Implement useTargets hook in frontend/src/hooks/useTargets.ts
- [ ] T086 [US4] Create Settings page with targets in frontend/src/pages/Settings.tsx
- [ ] T087 [US4] Integrate progress indicators into Dashboard

**Checkpoint**: Users can set targets, log activity, see intake vs expenditure progress

---

## Phase 7: User Story 3 - Create Custom Recipes (Priority: P3)

**Goal**: Create recipes from foods, calculate nutrients per serving

**Independent Test**: Create 2-serving oatmeal recipe, verify per-serving nutrients are half of total

### Tests for User Story 3

- [ ] T088 [P] [US3] Contract test for GET/POST /users/:id/recipes in backend/tests/contract/recipes.test.ts
- [ ] T089 [P] [US3] Contract test for GET/PUT/DELETE /users/:id/recipes/:id in backend/tests/contract/recipes.test.ts
- [ ] T090 [P] [US3] Contract test for tblsp import endpoints in backend/tests/contract/recipes-import.test.ts
- [ ] T091 [P] [US3] Unit test for recipe nutrient calculation in backend/tests/unit/recipe-calc.test.ts

### Implementation for User Story 3

- [ ] T092 [P] [US3] Create Recipe model in backend/src/models/recipe.ts
- [ ] T093 [P] [US3] Create RecipeIngredient model in backend/src/models/recipe-ingredient.ts
- [ ] T094 [US3] Implement RecipeService (CRUD, calculate nutrients) in backend/src/services/recipe-service.ts
- [ ] T095 [US3] Implement tblsp import adapter in backend/src/utils/tblsp-adapter.ts
- [ ] T096 [US3] Implement /users/:id/recipes routes in backend/src/api/recipes.ts
- [ ] T097 [US3] Implement /users/:id/recipes/import/tblsp routes in backend/src/api/recipes.ts
- [ ] T098 [US3] Create RecipeBuilder component in frontend/src/components/RecipeBuilder.tsx
- [ ] T099 [US3] Create IngredientRow component in frontend/src/components/IngredientRow.tsx
- [ ] T100 [US3] Create RecipeList component in frontend/src/components/RecipeList.tsx
- [ ] T101 [US3] Create TblspImport component in frontend/src/components/TblspImport.tsx
- [ ] T102 [US3] Implement useRecipes hook in frontend/src/hooks/useRecipes.ts
- [ ] T103 [US3] Create Recipes page in frontend/src/pages/Recipes.tsx
- [ ] T104 [US3] Enable logging recipes from Dashboard (integrate with US1)

**Checkpoint**: Users can create/edit recipes, import from tblsp, log recipes as meals

---

## Phase 8: User Story 2 Extended - Custom Foods (Priority: P2b)

**Goal**: Allow users to create custom food entries not in USDA database

**Independent Test**: Create custom food "Homemade granola", search finds it, can log it

### Tests for User Story 2b

- [ ] T105 [P] [US2] Contract test for /users/:id/custom-foods in backend/tests/contract/custom-foods.test.ts

### Implementation for User Story 2b

- [ ] T106 [US2] Create CustomFood model in backend/src/models/custom-food.ts
- [ ] T107 [US2] Implement CustomFoodService in backend/src/services/custom-food-service.ts
- [ ] T108 [US2] Implement /users/:id/custom-foods routes in backend/src/api/custom-foods.ts
- [ ] T109 [US2] Create CustomFoodForm component in frontend/src/components/CustomFoodForm.tsx
- [ ] T110 [US2] Integrate custom foods into FoodSearch results
- [ ] T111 [US2] Enable logging custom foods (integrate with US1)

**Checkpoint**: Users can create custom foods and log them alongside USDA foods

---

## Phase 9: User Story 5 - View Daily Intake Graph (Priority: P5)

**Goal**: Visualize daily intake vs targets in a graph

**Independent Test**: View daily graph, see bar chart with calories/protein/carbs/sugar vs targets

### Tests for User Story 5

- [ ] T112 [P] [US5] Contract test for GET /users/:id/stats/daily in backend/tests/contract/stats.test.ts
- [ ] T113 [P] [US5] Unit test for daily summary aggregation in backend/tests/unit/stats-service.test.ts

### Implementation for User Story 5

- [ ] T114 [US5] Implement StatsService (getDailySummary) in backend/src/services/stats-service.ts
- [ ] T115 [US5] Implement /users/:id/stats/daily route in backend/src/api/stats.ts
- [ ] T116 [US5] Install Recharts dependency in frontend/package.json
- [ ] T117 [US5] Create DailyChart component in frontend/src/components/DailyChart.tsx
- [ ] T118 [US5] Create NutrientSelector component in frontend/src/components/NutrientSelector.tsx
- [ ] T119 [US5] Implement useDailyStats hook in frontend/src/hooks/useDailyStats.ts
- [ ] T120 [US5] Integrate DailyChart into Dashboard page

**Checkpoint**: Users see visual graph of daily intake vs targets on Dashboard

---

## Phase 10: User Story 7 - Track Body Metrics (Priority: P7)

**Goal**: Log weight measurements and view current value with trend

**Independent Test**: Log weight for 3 days, verify trend direction shown

### Tests for User Story 7

- [ ] T121 [P] [US7] Contract test for GET/POST /users/:id/metrics/weight in backend/tests/contract/metrics.test.ts

### Implementation for User Story 7

- [ ] T122 [US7] Create BodyMetric model in backend/src/models/body-metric.ts
- [ ] T123 [US7] Implement MetricService (logWeight, getHistory, getTrend) in backend/src/services/metric-service.ts
- [ ] T124 [US7] Implement /users/:id/metrics/weight routes in backend/src/api/metrics.ts
- [ ] T125 [US7] Create WeightLogger component in frontend/src/components/WeightLogger.tsx
- [ ] T126 [US7] Create WeightTrend component in frontend/src/components/WeightTrend.tsx
- [ ] T127 [US7] Implement useWeightMetrics hook in frontend/src/hooks/useWeightMetrics.ts
- [ ] T128 [US7] Add weight tracking section to Dashboard or Settings

**Checkpoint**: Users can log weight and see current value with trend indicator

---

## Phase 11: User Story 6 - View Longitudinal Trends (Priority: P6)

**Goal**: View intake and weight over time with date range selection

**Independent Test**: View 30-day trend, verify line chart shows daily calories with target line

### Tests for User Story 6

- [ ] T129 [P] [US6] Contract test for GET /users/:id/stats/trends in backend/tests/contract/stats.test.ts
- [ ] T130 [P] [US6] Unit test for trend aggregation in backend/tests/unit/stats-service.test.ts

### Implementation for User Story 6

- [ ] T131 [US6] Extend StatsService with getTrends (date range, multiple metrics) in backend/src/services/stats-service.ts
- [ ] T132 [US6] Implement /users/:id/stats/trends route in backend/src/api/stats.ts
- [ ] T133 [US6] Create TrendChart component in frontend/src/components/TrendChart.tsx
- [ ] T134 [US6] Create DateRangeSelector component in frontend/src/components/DateRangeSelector.tsx
- [ ] T135 [US6] Create MetricOverlay component (toggle weight on calorie chart) in frontend/src/components/MetricOverlay.tsx
- [ ] T136 [US6] Implement useTrendStats hook in frontend/src/hooks/useTrendStats.ts
- [ ] T137 [US6] Create Trends page in frontend/src/pages/Trends.tsx

**Checkpoint**: Users can view historical trends with configurable date range and metric overlay

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting multiple user stories

- [ ] T138 [P] Add loading states to all data-fetching components
- [ ] T139 [P] Add error boundaries and user-friendly error messages
- [ ] T140 [P] Implement responsive design for mobile browsers
- [ ] T141 Add keyboard navigation and accessibility attributes
- [ ] T142 Performance optimization: add indexes verification, query optimization
- [ ] T143 Create production build scripts in package.json (root level)
- [ ] T144 Run and validate quickstart.md documentation
- [ ] T145 [P] E2E test: Complete food logging flow in frontend/tests/e2e/food-log.spec.ts
- [ ] T146 [P] E2E test: Recipe creation flow in frontend/tests/e2e/recipes.spec.ts
- [ ] T147 [P] E2E test: Multi-user isolation in frontend/tests/e2e/multi-user.spec.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phase 3 (US8 Users)**: Depends on Phase 2 - BLOCKS stories needing user context
- **Phase 4 (US2 Food Search)**: Depends on Phase 3 - needed before logging
- **Phase 5 (US1 Food Log)**: Depends on Phase 4 - core MVP functionality
- **Phase 6 (US4 Targets)**: Depends on Phase 3 - can parallel with US1/US2
- **Phase 7 (US3 Recipes)**: Depends on Phase 4 - needs food search
- **Phase 8 (US2b Custom Foods)**: Depends on Phase 4 - extends food search
- **Phase 9 (US5 Daily Graph)**: Depends on Phase 5 - needs food log data
- **Phase 10 (US7 Body Metrics)**: Depends on Phase 3 - can parallel after users
- **Phase 11 (US6 Trends)**: Depends on Phase 5 + Phase 10 - needs historical data
- **Phase 12 (Polish)**: Depends on all desired user stories

### User Story Dependencies

```
US8 (Users) ─────┬──► US2 (Food Search) ──► US1 (Food Log) ──► US5 (Daily Graph)
                 │                     │                  │
                 │                     └──► US3 (Recipes) ┘
                 │                     │
                 │                     └──► US2b (Custom Foods)
                 │
                 ├──► US4 (Targets) ────────────────────────┐
                 │                                          │
                 └──► US7 (Body Metrics) ──────────────────►└──► US6 (Trends)
```

### Parallel Opportunities

**After Phase 2 (Foundational)**:
- US8 must complete first (provides user context)

**After US8 (Users)**:
- US4 (Targets) and US7 (Body Metrics) can start in parallel
- US2 (Food Search) can start

**After US2 (Food Search)**:
- US1 (Food Log), US3 (Recipes), US2b (Custom Foods) can start in parallel

**Within Each Story**:
- Contract tests can run in parallel [P]
- Models can be created in parallel [P]
- Frontend components can be built in parallel after backend routes

---

## Implementation Strategy

### MVP First (Recommended)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US8 (Users)
4. Complete Phase 4: US2 (Food Search)
5. Complete Phase 5: US1 (Food Log)
6. **STOP and VALIDATE**: Full food logging works end-to-end
7. Deploy MVP for testing

### Incremental Delivery

| Milestone | Stories Complete | Value Delivered |
|-----------|-----------------|-----------------|
| MVP | US8, US2, US1 | Log foods, view daily totals |
| +Targets | +US4 | Track progress vs goals |
| +Recipes | +US3, US2b | Log homemade meals |
| +Graphs | +US5 | Visual daily feedback |
| +Trends | +US7, US6 | Long-term tracking |
| Complete | All | Full feature set |

---

## Notes

- Total tasks: 147
- Tasks per story: US1=16, US2=12+7, US3=17, US4=14, US5=9, US6=9, US7=8, US8=9
- [P] tasks can run in parallel
- Constitution requires tests - included for all stories
- Commit after each task or logical group
- Run tests before moving to next story
