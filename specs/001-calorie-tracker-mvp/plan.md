# Implementation Plan: Calorie Tracker MVP

**Branch**: `001-calorie-tracker-mvp` | **Date**: 2026-01-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-calorie-tracker-mvp/spec.md`

## Summary

FeedBag is a multi-user calorie and nutrient tracking application for LAN deployment.
Users can search USDA FoodData Central for foods, log daily intake, create recipes
(including import from tblsp), set expenditure targets, and visualize intake vs
expenditure over time. The MVP focuses on simplicity with user selection (no auth)
and weight-only body metrics.

Technical approach: TypeScript/Node.js full-stack application using Express.js
backend with SQLite database, React frontend with Vite, mirroring the proven
architecture of the tblsp recipe manager for consistency and code reuse potential.

## Technical Context

**Language/Version**: TypeScript 5.6+ on Node.js 20+
**Primary Dependencies**: Express.js 4.x (backend), React 18.x (frontend), Vite 5.x (build)
**Storage**: SQLite with better-sqlite3 (same as tblsp)
**Testing**: Vitest for unit/integration tests, Playwright for E2E
**Target Platform**: LAN-hosted Linux/macOS/Windows server, accessed via web browser
**Project Type**: Web application (backend + frontend)
**Performance Goals**: <2s page load, <30s food logging flow, 10 concurrent users
**Constraints**: ~3GB storage for full USDA Branded Foods dataset, server timezone
**Scale/Scope**: 10 concurrent household users, ~3M food items (USDA datasets)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. API-First Design | ✅ PASS | REST API contracts defined in /contracts/ before UI |
| II. Data Integrity | ✅ PASS | Consistent units (g, mg, kcal), nutrient calc from source data, historical log preservation |
| III. Tests Required | ✅ PASS | Vitest for unit/integration, contract tests for API, Playwright for E2E |
| IV. Simplicity & YAGNI | ✅ PASS | User selection (no auth), weight-only metrics, predefined meal categories |
| V. Multi-User Security | ✅ PASS | User isolation via user_id foreign keys, API validates ownership |

**Gate Result**: All principles satisfied. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-calorie-tracker-mvp/
├── plan.md              # This file
├── research.md          # Phase 0 output - technology decisions
├── data-model.md        # Phase 1 output - entity definitions
├── quickstart.md        # Phase 1 output - developer setup guide
├── contracts/           # Phase 1 output - OpenAPI specs
│   └── api-v1.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/             # Express route handlers
│   ├── models/          # Database models and types
│   ├── services/        # Business logic (nutrient calc, search, import)
│   ├── db/              # Database connection, migrations
│   ├── middleware/      # Express middleware (user context, error handling)
│   └── utils/           # Utilities (USDA import, tblsp adapter)
├── db/
│   ├── schema.sql       # FeedBag schema
│   └── usda/            # USDA data files (gitignored)
└── tests/
    ├── unit/
    ├── integration/
    └── contract/

frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page layouts (Dashboard, FoodLog, Recipes, Trends)
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API client
│   └── providers/       # Context providers (user, theme)
└── tests/
    ├── unit/
    └── e2e/

shared/
└── types/               # Shared TypeScript interfaces

scripts/
├── import-usda.ts       # USDA data import script
└── import-tblsp.ts      # tblsp recipe import utility
```

**Structure Decision**: Web application structure (backend + frontend) selected to
match tblsp architecture. This enables potential code sharing and familiar patterns
for the developer. Single shared types package for API contract consistency.

## Complexity Tracking

> No Constitution Check violations requiring justification.

| Decision | Rationale | Simpler Alternative Considered |
|----------|-----------|-------------------------------|
| Separate backend/frontend | Matches tblsp architecture, enables API-first | Monolith - rejected for API-first principle |
| SQLite for 3M+ foods | Proven with tblsp, no server dependency | PostgreSQL - rejected for simplicity |
| Full Branded Foods dataset | Comprehensive food coverage per spec | Foundation + SR only - rejected for user experience |
