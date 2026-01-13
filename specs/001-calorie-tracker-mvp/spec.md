# Feature Specification: Calorie Tracker MVP

**Feature Branch**: `001-calorie-tracker-mvp`
**Created**: 2026-01-13
**Status**: Draft
**Input**: Full MVP for FeedBag calorie and nutrient tracking application

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Log Daily Food Intake (Priority: P1)

As a user, I want to log the foods I eat throughout the day so that I can track my
calorie and nutrient consumption against my daily targets.

**Why this priority**: This is the core functionality of the application. Without
food logging, no other features (graphs, trends, recipes) provide value. Users need
to record what they eat before any analysis is possible.

**Independent Test**: Can be fully tested by a user logging a day's worth of meals
and seeing their total calories and nutrients. Delivers immediate value by providing
awareness of daily intake.

**Acceptance Scenarios**:

1. **Given** a logged-in user with daily calorie targets set, **When** they search
   for "banana" and log one medium banana for breakfast, **Then** the system records
   the entry with date, meal, food item, portion, and calculated nutrients.

2. **Given** a user has logged several food items today, **When** they view their
   daily summary, **Then** they see total calories, protein, carbohydrates, and
   added sugar consumed, plus remaining allowance for each.

3. **Given** a user made a logging mistake, **When** they edit or delete a food
   entry, **Then** the daily totals update immediately to reflect the change.

4. **Given** a user wants to log a frequently eaten food, **When** they view recent
   entries, **Then** they can quickly re-log the same item without searching again.

---

### User Story 2 - Search and Browse Foods (Priority: P2)

As a user, I want to search a comprehensive food database so that I can find accurate
nutritional information for the foods I eat.

**Why this priority**: Users cannot log foods without finding them first. The food
database is the foundation that makes logging possible and accurate.

**Independent Test**: Can be tested by searching for common foods (apple, chicken
breast, bread) and verifying that nutritional data appears. Delivers value by
providing access to reliable nutrient information.

**Acceptance Scenarios**:

1. **Given** the USDA FoodData Central database is loaded, **When** a user searches
   for "chicken breast", **Then** they see matching results with calorie, protein,
   carbohydrate, and added sugar values per standard serving.

2. **Given** a search returns multiple results, **When** the user views the list,
   **Then** results are ordered by relevance with clear serving size information.

3. **Given** a user selects a food item, **When** they view its details, **Then**
   they see complete nutritional breakdown and can adjust portion size before logging.

4. **Given** a food item has multiple serving size options, **When** the user logs
   it, **Then** they can select from common portions (1 cup, 100g, 1 medium, etc.).

---

### User Story 3 - Create Custom Recipes (Priority: P3)

As a user, I want to create recipes by combining foods from the database so that I
can log home-cooked meals with accurate nutritional calculations.

**Why this priority**: Most users eat home-prepared meals that don't exist in the
database. Recipe creation enables accurate tracking of real eating habits rather
than just packaged foods.

**Independent Test**: Can be tested by creating a simple recipe (e.g., oatmeal with
banana and honey), saving it, and verifying the calculated totals. Delivers value
by enabling tracking of home cooking.

**Acceptance Scenarios**:

1. **Given** a user wants to create a recipe, **When** they add multiple food items
   with quantities, **Then** the system calculates total nutrients per serving based
   on the number of servings specified.

2. **Given** a user has created a recipe, **When** they save it with a name, **Then**
   it appears in their personal recipe list for future logging.

3. **Given** a saved recipe exists, **When** the user logs it as a meal, **Then**
   the nutrients are added to their daily totals based on portions consumed.

4. **Given** a user needs to modify a recipe, **When** they edit ingredients or
   quantities, **Then** the nutritional values recalculate automatically.

5. **Given** a user has recipes in the tblsp project, **When** they import a recipe
   from tblsp, **Then** the system displays the ingredients and prompts them to
   confirm or adjust quantities before saving.

6. **Given** an imported tblsp recipe, **When** the user modifies it in FeedBag,
   **Then** the changes remain local to FeedBag and do not affect tblsp.

---

### User Story 4 - Set and Track Daily Targets (Priority: P4)

As a user, I want to set daily calorie and nutrient targets based on my goals and
activity level so that I can see how my intake compares to my needs.

**Why this priority**: Targets give context to logged data. Without knowing if
2000 calories is over or under budget, raw numbers have limited meaning.

**Independent Test**: Can be tested by setting targets and viewing a single day's
progress bar or percentage. Delivers value by providing goal-oriented feedback.

**Acceptance Scenarios**:

1. **Given** a new user, **When** they set up their profile, **Then** they can enter
   baseline calorie needs and adjust for activity level.

2. **Given** targets are configured, **When** the user views daily intake, **Then**
   they see progress toward each target (calories, protein, carbs, added sugar).

3. **Given** a user's activity varies, **When** they enter an activity calorie value
   for the day (simple numeric input), **Then** their total expenditure updates to
   show basal + activity calories for intake vs expenditure comparison.

4. **Given** a user wants to track macros, **When** they set protein or carb targets,
   **Then** these display alongside calorie tracking.

---

### User Story 5 - View Daily Intake Graph (Priority: P5)

As a user, I want to see a graph comparing my daily intake to my targets so that I
can visualize my progress at a glance.

**Why this priority**: Visual representation makes data actionable. A graph showing
"over target" is faster to interpret than reading numbers.

**Independent Test**: Can be tested by viewing a graph for a single day with logged
data and targets. Delivers value through visual feedback on daily habits.

**Acceptance Scenarios**:

1. **Given** a user has logged food and has targets set, **When** they view the
   daily graph, **Then** they see actual intake vs target for selected nutrients.

2. **Given** a user views the daily graph, **When** they select different nutrients
   (calories, protein, carbs, sugar), **Then** the graph updates to show the
   selected metrics.

3. **Given** intake exceeds targets, **When** the user views the graph, **Then**
   the over-target amount is visually distinct (e.g., different color).

---

### User Story 6 - View Longitudinal Trends (Priority: P6)

As a user, I want to see graphs of my intake and body metrics over time so that I
can identify patterns and track progress toward long-term goals.

**Why this priority**: Long-term trends reveal whether habits are sustainable and
effective. Single-day views miss the bigger picture.

**Independent Test**: Can be tested by viewing a week or month of data plotted over
time. Delivers value through pattern recognition and progress tracking.

**Acceptance Scenarios**:

1. **Given** a user has logged data over multiple days, **When** they view the
   trends graph, **Then** they see intake plotted over a selectable date range.

2. **Given** the trends graph is displayed, **When** the user adjusts the date
   range (week, month, custom), **Then** the graph updates accordingly.

3. **Given** a user tracks body weight, **When** they view trends, **Then** they
   can overlay weight data with calorie intake on the same timeline.

4. **Given** the user has target values, **When** viewing trends, **Then** they
   can toggle a target line indicator on the graph.

---

### User Story 7 - Track Body Metrics (Priority: P7)

As a user, I want to log body measurements like weight so that I can correlate my
intake with physical changes over time.

**Why this priority**: Body metrics provide outcome data. Calorie tracking alone
doesn't show if the approach is working without measuring results.

**Independent Test**: Can be tested by logging weight for several days and viewing
the data on a graph. Delivers value by connecting intake to outcomes.

**Acceptance Scenarios**:

1. **Given** a user wants to track weight, **When** they log a measurement, **Then**
   it is recorded with date and value.

2. **Given** multiple weight entries exist, **When** the user views their metrics,
   **Then** they see current value and trend direction.

3. **Given** a user tracks weight over time, **When** they view longitudinal graphs,
   **Then** weight can be displayed alongside nutrient intake.

---

### User Story 8 - Multi-User Support (Priority: P8)

As a household member, I want my own account so that my food logs, recipes, and
targets are separate from other users on the same server.

**Why this priority**: The system is designed for LAN hosting with multiple users.
Data isolation is essential for privacy and usability.

**Independent Test**: Can be tested by creating two users and verifying each sees
only their own data. Delivers value through privacy and personalization.

**Acceptance Scenarios**:

1. **Given** the application is running on the LAN, **When** a new user registers,
   **Then** they get their own account with separate data storage.

2. **Given** multiple users exist, **When** User A logs food, **Then** User B
   cannot see User A's food log, recipes, or body metrics.

3. **Given** a user is logged in, **When** they create a custom recipe, **Then**
   it is visible only to them (not shared with other users).

4. **Given** a user wants to log out, **When** they end their session, **Then**
   the next user cannot access the previous user's data.

5. **Given** the application shows a user list, **When** a user selects their name,
   **Then** they are identified as the active user and can access their personal data.

---

### Edge Cases

- What happens when a user searches for a food not in the database? System displays
  "no results" with option to create a custom food entry.
- How does the system handle foods with missing nutrient data? Display available
  data with clear indication that some values are unavailable.
- What happens when a user logs a recipe that was later deleted? Historical entries
  retain the nutritional values from time of logging.
- How does the system handle timezone differences for daily totals? Server timezone
  is used for all users; day boundaries are midnight-to-midnight in server local time.
- What happens if the USDA database update changes nutrient values? Historical logs
  retain original values; only new logs use updated data.
- How does the system handle very large portion sizes? Accept any reasonable portion
  with confirmation for unusually large amounts (>10x standard serving).

## Requirements *(mandatory)*

### Functional Requirements

**Food Database**
- **FR-001**: System MUST provide a searchable database of foods with nutritional
  information sourced from USDA FoodData Central.
- **FR-002**: System MUST display calories, protein, carbohydrates, and added sugar
  for each food item at minimum.
- **FR-003**: System MUST support multiple serving size options per food item.
- **FR-004**: System MUST allow users to create custom food entries not in the
  database.

**Food Logging**
- **FR-005**: Users MUST be able to log food items with date, meal category, and
  portion size.
- **FR-006**: System MUST calculate daily nutrient totals from logged food entries.
- **FR-007**: Users MUST be able to edit and delete their food log entries.
- **FR-008**: System MUST provide quick access to foods logged in the last 7 days
  for easy re-logging.

**Recipe Creation**
- **FR-009**: Users MUST be able to create recipes by combining database foods with
  quantities.
- **FR-010**: System MUST calculate recipe nutrients based on ingredient nutrients
  and number of servings.
- **FR-011**: Users MUST be able to save, edit, and delete their personal recipes.
- **FR-012**: System MUST support one-way import of recipes and ingredient lists
  from the tblsp project database for caloric calculation purposes.
- **FR-012a**: When importing a tblsp recipe, the system MUST prompt the user to
  confirm or adjust ingredient quantities, as recipes may not be followed exactly.
- **FR-012b**: Imported recipes become independent FeedBag recipes; changes do not
  sync back to tblsp.

**Targets and Progress**
- **FR-013**: Users MUST be able to set basal daily calorie expenditure and enter
  daily activity calories (simple numeric values) to calculate total expenditure
  for intake vs expenditure comparison.
- **FR-014**: Users MUST be able to set targets for protein, carbohydrates, and
  added sugar.
- **FR-015**: System MUST display progress toward daily targets.

**Visualization**
- **FR-016**: System MUST provide daily graphs comparing actual intake to targets.
- **FR-017**: System MUST provide longitudinal graphs showing intake over
  configurable date ranges.
- **FR-018**: Graphs MUST be interactive with ability to select metrics, date
  ranges, and toggle target indicators.
- **FR-019**: System MUST allow overlaying multiple metrics on trend graphs (e.g.,
  weight and calories).

**Body Metrics**
- **FR-020**: Users MUST be able to log body weight with date.
- **FR-021**: System MUST display body metric trends over time.
- **FR-022**: System MUST correlate body metrics with intake data in visualizations.

**Multi-User**
- **FR-023**: System MUST support multiple user accounts with isolated data.
- **FR-024**: System MUST provide user selection to identify the active user; no
  password or PIN required for MVP (trusted household LAN assumption).
- **FR-025**: System MUST be accessible over LAN from multiple devices.
- **FR-026**: User-created recipes and custom foods MUST be private to each user.
- **FR-027**: Users MUST be able to delete their own account, which permanently
  purges all associated data (food logs, recipes, custom foods, body metrics, targets).

### Key Entities

- **User**: Account holder with profile, targets, and authentication credentials.
  Owns food logs, recipes, and body metrics.
- **Food**: Nutritional item from database or custom-created. Has name, serving
  sizes, and nutrient values (calories, protein, carbohydrates, added sugar).
- **FoodLog**: Record of food consumption. Links user, food, date, meal category,
  and portion. Stores calculated nutrients at time of logging.
- **Recipe**: User-created combination of foods. Has name, ingredients with
  quantities, serving count, and calculated nutrients per serving.
- **DailyTarget**: User's nutrient goals and expenditure settings. Includes basal
  calorie expenditure, daily activity calories (numeric input), and macro targets
  (protein, carbs, sugar). Enables intake vs expenditure comparison.
- **BodyMetric**: User's physical measurement. For MVP, limited to weight only
  (date and value in user's preferred unit). Data model should support adding
  additional metric types in future.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can log a food item in under 30 seconds after opening the app.
- **SC-002**: Food search returns relevant results for 95% of common food queries.
- **SC-003**: Users can create and save a 5-ingredient recipe in under 2 minutes.
- **SC-004**: Daily summary loads and displays within 2 seconds.
- **SC-005**: System supports at least 10 concurrent users on a typical home LAN.
- **SC-006**: Users can view 90 days of trend data without noticeable delay.
- **SC-007**: Nutrient calculations match expected values within 1% tolerance when
  verified against manual calculations.
- **SC-008**: 90% of users can complete their first food log without help or
  documentation.
- **SC-009**: Users rate the graphing interface as "easy to understand" in usability
  testing.
- **SC-010**: No user can access another user's data through any interface.

## Clarifications

### Session 2026-01-13

- Q: What authentication method should be used? → A: User selection only (no PIN/password) for MVP; trusted household LAN environment
- Q: What body metrics should be tracked? → A: Weight only for MVP; additional metrics (body fat %, measurements) may be added as future feature requests
- Q: Can users delete their account and data? → A: Yes, users can delete their account and all associated data is permanently purged
- Q: How should timezones be handled for daily totals? → A: Server timezone for all users (simplest, consistent)
- Q: Which USDA FoodData Central datasets to import? → A: Foundation, SR Legacy, and Branded Foods (comprehensive coverage)
- Q: What format does tblsp use for recipes? → A: SQLite database; full source code available in ~/Projects/tblsp
- Q: How should activity adjustment work? → A: Simple numeric calorie input (basal expenditure + activity calories); no activity type/duration tracking needed
- Q: How many recent foods to show for quick re-log? → A: Foods logged in the last 7 days
- Q: Is there an admin role? → A: No admin role for MVP; all users are equal

## Assumptions

- USDA FoodData Central datasets (Foundation, SR Legacy, Branded Foods) will be
  imported in a batch process, not real-time API calls, for performance and offline
  capability.
- The tblsp project stores recipes in SQLite; full source code is available for
  reference. Integration is one-way (import only) with user confirmation of
  quantities during import. Database path is environment-specific (development:
  ~/Projects/tblsp, production: server-configured path).
- Users have basic familiarity with calorie counting concepts (calories, macros).
- The LAN environment is trusted; user selection (no password/PIN) is sufficient
  for MVP. Authentication can be added as a future enhancement if needed.
- Daily targets are static per user; automatic adjustment based on progress is a
  future enhancement.
- Meal categories (breakfast, lunch, dinner, snack) are predefined, not customizable
  in MVP.
- No admin role; all users have equal permissions. First user is created through
  normal registration flow.
