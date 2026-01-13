<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 → 1.0.0 (initial ratification)

  Modified principles: N/A (initial version)

  Added sections:
  - Core Principles (5): API-First Design, Data Integrity, Tests Required,
    Simplicity & YAGNI, Multi-User Security
  - Technology Stack section
  - Development Workflow section
  - Governance section

  Removed sections: N/A (initial version)

  Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ compatible (Constitution Check aligns)
  - .specify/templates/spec-template.md: ✅ compatible (requirements structure aligns)
  - .specify/templates/tasks-template.md: ✅ compatible (test phases align)

  Follow-up TODOs: None
-->

# FeedBag Constitution

A TypeScript/Node.js calorie and nutrient tracking application enabling users to
log daily intake, create recipes from a nutritional database, and visualize
consumption patterns over time. Designed for LAN-hosted deployment.

## Core Principles

### I. API-First Design

All functionality MUST be exposed through well-defined REST API endpoints before
any UI implementation begins.

- API contracts MUST be documented with request/response schemas
- Breaking changes MUST increment the API version (e.g., `/api/v1/` → `/api/v2/`)
- Endpoints MUST return consistent JSON structures with appropriate HTTP status codes
- Error responses MUST include machine-readable error codes and human-readable messages

**Rationale**: As a LAN-hosted service supporting multiple users, clear API
boundaries enable future client diversity (web, mobile, CLI) and simplify testing.

### II. Data Integrity

Nutritional calculations and user tracking data MUST be accurate and verifiable.

- All nutrient values MUST use consistent units (grams, milligrams, kilocalories)
- Recipe calculations MUST be derived from constituent food nutrient data
- Database imports (e.g., USDA FoodData Central) MUST validate data completeness
- User data MUST NOT be modified or deleted without explicit user action
- Calculations MUST be reproducible given the same inputs

**Rationale**: Users rely on this data for health decisions. Inaccurate calorie or
nutrient tracking undermines the application's core value.

### III. Tests Required

All new functionality MUST have accompanying tests before merge.

- API endpoints MUST have contract tests validating request/response schemas
- Nutrient calculation logic MUST have unit tests with known input/output pairs
- Integration tests MUST cover user workflows (logging food, creating recipes)
- Tests MAY be written alongside implementation (TDD not strictly required)
- Test coverage SHOULD focus on critical paths over percentage targets

**Rationale**: The application performs calculations affecting health decisions.
Tests ensure correctness and prevent regressions during feature development.

### IV. Simplicity & YAGNI

Start with the simplest solution that meets current requirements.

- New abstractions MUST solve a demonstrated problem, not a hypothetical one
- Configuration options MUST address real user needs before being added
- Database schema MUST support current features; optimize only when measured
- Third-party dependencies MUST provide clear value over simple implementations
- Premature optimization MUST be avoided; profile before optimizing

**Rationale**: Complexity accumulates quickly. Each addition increases maintenance
burden and makes the codebase harder to understand and modify.

### V. Multi-User Security

User data MUST be isolated and protected in the multi-user LAN environment.

- Users MUST only access their own tracking data and custom recipes
- Authentication MUST be required for all data-modifying operations
- Shared nutritional database MUST be read-only for regular users
- Session management MUST prevent unauthorized access
- API endpoints MUST validate user ownership before returning or modifying data

**Rationale**: Multiple household members will share this LAN-hosted service.
Each user's health data and dietary information is personal and private.

## Technology Stack

**Runtime**: Node.js with TypeScript
**Framework**: To be determined during implementation planning
**Database**: To be determined (must support nutrient data import and user isolation)
**Testing**: Jest or Vitest for unit/integration tests
**Data Source**: USDA FoodData Central for baseline nutritional database

## Development Workflow

### Code Changes

- All changes MUST pass existing tests before merge
- New features MUST include tests covering the happy path and key error cases
- API changes MUST update corresponding contract documentation
- Database migrations MUST be reversible where feasible

### Review Process

- Changes affecting nutrient calculations MUST be reviewed for correctness
- Security-related changes MUST be reviewed for user data isolation
- Breaking API changes MUST be documented with migration guidance

## Governance

This constitution establishes the non-negotiable principles for FeedBag
development. All implementation decisions MUST align with these principles.

### Amendment Process

1. Proposed changes MUST be documented with rationale
2. Changes affecting core principles require careful consideration of impact
3. Version increments follow semantic versioning:
   - MAJOR: Principle removals or incompatible redefinitions
   - MINOR: New principles or significant expansions
   - PATCH: Clarifications and non-semantic refinements

### Compliance

- Pull requests SHOULD reference applicable principles when relevant
- Implementation plans MUST include a Constitution Check section
- Deviations from principles MUST be explicitly justified and documented

**Version**: 1.0.0 | **Ratified**: 2026-01-13 | **Last Amended**: 2026-01-13
