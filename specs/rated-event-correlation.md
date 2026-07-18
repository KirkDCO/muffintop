# Rated Events & Continuous Correlation Analysis

## Overview

MuffinTop's event system currently supports only **discrete** events — a life event on a date
(description + color) plotted on trend charts and analyzed by comparing pre-event nutrient windows
against random baselines (Cohen's d). This feature adds a second, complementary kind of event:

**Rated events** — a named series (e.g. "Mood", "Sleep quality", "Joint pain") that the user scores
on a **1–10 scale each day**. Instead of a before/after comparison, rated events are analyzed with
**continuous correlation** to surface which foods and nutrient levels track with the daily rating.

The centerpiece of the analysis is an exploratory **2D lag×window correlation grid**: for every metric
it computes how the rating correlates with intake averaged over a sliding window, across a range of
time lags — visualized as a heatmap so the user can spot *when* and *over what span* a dietary factor
relates to how they felt.

## Goals

- Let a user define rated series and log a 1–10 rating per day (one per series per day).
- Compute Pearson and Spearman correlations (with p-values and sample size) between daily ratings and
  daily nutrient / intake levels, including **water, caffeine, and alcohol**.
- Explore **time-lagged and windowed** relationships via a lag×window grid, not just same-day.
- Compare **food choices**: mean rating on days a food was eaten vs. not (Cohen's d).
- Guard against over-interpretation: FDR correction, minimum-sample flagging, calorie-confounder
  normalization, and direction-aware wording.
- Optionally overlay a rated series on the trend chart.

## Non-Goals

- Confirmatory / causal inference. The grid is **hypothesis-generating**; results are exploratory.
- Automatic correction for serial correlation of ratings (surfaced as a caveat only).
- Lag/window-aware food-presence comparison (v1 uses the rating day; noted as future work).
- Sub-daily ratings or multiple ratings per series per day.

## Concepts & Terminology

| Term | Meaning |
|------|---------|
| Rated series | A named 1–10 metric the user tracks daily (e.g. "Mood"). Identified by `description`. |
| Rating | An integer 1–10 for a series on a given date. |
| Direction | Whether 10 means "good" (`higher_better`) or "bad" (`higher_worse`) — for interpretation only. |
| Lag (L) | Days between the rating day and the most-recent day of the averaging window (0–7). |
| Window (W) | Number of days averaged (1–7). |
| Cell (L, W) | Averages the metric over days `[d − L − (W−1) … d − L]` for rating day `d`. |
| Paired day | A rating day whose cell window has at least one day of logged data. |

The grid unifies two intuitions: the **W=1 row** isolates single-day lagged effects; the **L=0 column**
captures cumulative windows ending on the rating day; **L≥1** uses intake strictly *before* the rating,
reducing reverse-causality ("my mood changed what I ate that day").

## Data Model

Ratings reuse the existing `user_event` table via a nullable `rating` column (discrete events keep
`rating = NULL`). Per-series metadata lives in a new `rated_event_series` table.

**Migration** `backend/db/migrations/006_add_rated_events.sql` (no `BEGIN`/`COMMIT` — the migration
runner wraps each file in its own transaction):

```sql
ALTER TABLE user_event ADD COLUMN rating INTEGER;   -- nullable; NULL = discrete event

CREATE TABLE IF NOT EXISTS rated_event_series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  description TEXT NOT NULL,                          -- series name; matches user_event.description
  direction TEXT NOT NULL DEFAULT 'higher_better',   -- 'higher_better' | 'higher_worse'
  color TEXT NOT NULL DEFAULT '#ff6b6b',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, description)
);
```

The 1–10 range and the direction enum are enforced at the Zod layer (SQLite cannot alter CHECK
constraints later). `backend/db/schema.sql` is updated with the same column and table for fresh installs.

The existing `UNIQUE(user_id, event_date, description)` constraint on `user_event` already enforces one
rating per series per day.

## API Contracts

All routes are user-scoped under `/users/:userId`.

### Rated series CRUD

| Method | Path | Body / Result |
|--------|------|---------------|
| `GET` | `/rated-series` | → `RatedEventSeries[]` |
| `POST` | `/rated-series` | `{ description, direction, color }` → upsert (by user+description) → `RatedEventSeries` |
| `DELETE` | `/rated-series/:description` | 204 (removes series metadata; ratings in `user_event` are untouched) |

### Rating entry

Reuses the existing event endpoints; `POST /users/:userId/events` accepts an optional
`rating` (1–10). A rating implies a rated series and upserts a `rated_event_series` row.

### Correlation analysis

`POST /users/:userId/analysis/event-correlation`

Request:
```ts
interface EventCorrelationRequest {
  eventDescription: string;   // rated series name
  startDate: string;          // YYYY-MM-DD
  endDate: string;
  maxLag: number;             // grid x-axis 0..maxLag (default 7)
  maxWindow: number;          // grid y-axis 1..maxWindow (default 7)
  metrics: AnalysisMetricKey[];   // NutrientKey | IntakeType (incl. water/caffeine/alcohol)
  normalizePerKcal: boolean;  // nutrient-density mode (nutrients only)
}
```

Response:
```ts
interface CorrelationCell {
  lag: number; window: number; n: number;
  pearson: number; pearsonP: number; qValue: number;   // q = BH-FDR across this metric's grid
  spearman: number; spearmanP: number;
}
interface MetricCorrelationGrid {
  key: AnalysisMetricKey; displayName: string; unit: string;
  meanRating: number; meanValue: number;
  best: CorrelationCell;      // strongest |pearson| among cells with n >= minNThreshold
  cells: CorrelationCell[];   // full grid, row-major (lag 0..maxLag × window 1..maxWindow)
}
interface FoodRatingComparison {
  foodName: string; daysWith: number; daysWithout: number;
  meanRatingWith: number; meanRatingWithout: number;
  ratingDifference: number; effectSize: number;         // Cohen's d
}
interface EventCorrelationResponse {
  direction: RatingDirection;
  ratingCount: number; pairedDayCount: number; ratingDates: string[];
  normalizedPerKcal: boolean; minNThreshold: number;    // 10; UI flags n below this
  metrics: MetricCorrelationGrid[];
  foodComparisons: FoodRatingComparison[];              // same-day (lag 0, window 1)
}
```

Shared types live in `shared/types/rated-series.ts` (series metadata) and
`shared/types/event-analysis.ts` (correlation types). `RatedEventDataPoint` and an optional
`ratedEventData` field are added to `shared/types/stats.ts` for the chart overlay.

## Statistics

New self-contained, unit-tested module `backend/src/services/statistics.ts` (no correlation math exists
today):

| Function | Notes |
|----------|-------|
| `pearson(x, y)` | Standard product-moment correlation. |
| `rank(values)` | Fractional ranks with average-of-ties. |
| `spearman(x, y)` | Pearson on ranks. |
| `correlationPValue(r, n)` | Two-sided Student-t, df = n−2, via regularized incomplete beta (`betai`/`betacf`/`lgamma`). |
| `benjaminiHochberg(pValues[])` | Returns q-values aligned to input order. |
| `cohensD(a, b)` | Pooled-SD standardized mean difference. |

**Guards:** `n < 3` or zero variance ⇒ `r = 0, p = 1`. FDR is applied **per metric across its own grid**
(the cells overlap in day-sets and form a smooth, positively-dependent surface, under which BH remains
valid). `minNThreshold = 10`; the `best` cell is chosen among cells meeting it.

## Analysis Algorithm

`backend/src/services/event-correlation-service.ts`:

1. Load rated days for the series in range (`rating IS NOT NULL`), building `date → rating`; load the
   series `direction` (default `higher_better`).
2. Query daily nutrient totals (`food_log` grouped by `log_date`, via `nutrientKeyToColumn`) and intake
   totals (`intake_log`) over the range covering all lag+window lookbacks. When `normalizePerKcal`, also
   fetch `calories` and express nutrient metrics as `nutrient / calories × 1000` (calories and intake
   types stay absolute).
3. For each metric and each cell `(L, W)`: average the metric over `[d−L−(W−1) … d−L]` for each rating
   day (counting only days with logged data); build paired `(rating, value)` arrays; compute
   `pearson`, `spearman`, their p-values, and `n`.
4. Apply Benjamini–Hochberg across the metric's cells → per-cell `qValue`; select `best`.
5. **Food comparison (same-day):** for each rating day collect foods eaten on `d`
   (`COALESCE(f.description, cf.name, r.name, logged_food_name)`); split ratings into eaten/not; compute
   means + Cohen's d; include foods with `daysWith ≥ 2` and `daysWithout ≥ 2`; sort by `|d|`.
6. Return the response with `minNThreshold = 10`.

## User Interface

### Logging (`frontend/src/components/EventLogger.tsx`)

A "Daily rating (1–10)" mode adds: a series `<select>` of existing rated series (plus "＋ New series"
capturing name, **direction**, and color) and a rating control (`<input type="range" min=1 max=10>`
showing the value, styled after `ActivityInput`). Submitting sends `rating` on the create payload and
upserts the series.

### Analysis page (`frontend/src/pages/EventAnalysis.tsx`)

A top-level toggle switches between **Discrete comparison** (existing) and **Rated correlation** (new).
Rated config: series dropdown, date range, **Per-1000 kcal** checkbox, and a metric grid.

- **Summary table** — one row per metric: best `(lag, window)`, Pearson r (with p and q), Spearman ρ,
  and n. Rows with `q < 0.05` are bolded; rows with `n < minNThreshold` are greyed/flagged. Wording is
  **direction-aware** (e.g. `higher_worse` → "more sugar ↔ worse Mood"). Exploratory,
  multiple-comparison, and reverse-causality caveats are shown prominently.
- **Per-metric heatmap (drill-down)** — clicking a metric opens its grid: **x = lag 0–7, y = window
  1–7**, cell color = Pearson r on a diverging blue↔orange scale centered at 0 (reusing the existing
  colorblind-friendly palette), rendered as a plain CSS grid of colored cells (no charting library).
  Hover shows lag, window, r, p, q, n; cells with `n < minNThreshold` are hatched/de-emphasized. An
  optional scatter (rating vs. value) is shown for the metric's best cell.
- **Food-rating comparison table** — food, days with/without, mean rating each, difference, Cohen's d,
  with a "Show all" expander (mirrors the existing food-frequency table).

### Trend chart overlay (`frontend/src/components/TrendChart.tsx`)

A "Rated overlay" `<select>` (none + each rated series) beside the Events checkbox. The chosen series is
passed through `useTrendStats` → the `ratedEvent` query param; `ratedEventData` is merged by date and
drawn as a `<Line>` on a **secondary right Y-axis with domain [1, 10]** (series color) plus a legend
entry. Discrete event markers are unaffected.

### Hooks

- `useRatedSeries()` / `useUpsertRatedSeries()` / `useDeleteRatedSeries()` — series CRUD.
- `useEventCorrelation()` — mutation to the correlation endpoint.
- `useTrendStats` gains an optional `ratedEvent` param (added to the query key).

## Statistical Caveats (surfaced in the UI)

- **Exploratory.** Scanning ~56 cells × many metrics tests many hypotheses; FDR is applied but the grid
  is for spotting **coherent regions**, not trusting isolated hot cells.
- **Reverse causality.** Same-day (L=0) correlations cannot separate "food affected the rating" from
  "the rating changed the eating"; prefer L≥1 for directional claims.
- **Serial correlation.** Ratings often persist day-to-day, inflating apparent significance; this is
  noted but not corrected.
- **Calorie confounder.** High-calorie days raise most nutrients together; the per-1000-kcal option
  helps isolate composition effects.
- **Sample size.** `n` shrinks toward the high-lag/high-window corner; low-n cells are de-emphasized.

## Edge Cases

| Case | Behavior |
|------|----------|
| Series with < 3 rated days | Cells return r=0, p=1; no crash. |
| Zero-variance metric or rating | r=0, p=1. |
| Rating day with no food logged | Excluded from that cell's paired data. |
| High-L/high-W corner with `n < 10` | Computed but hatched/flagged; excluded from `best` selection. |
| Series with no `rated_event_series` row | Defaults to `higher_better`. |
| Per-kcal on intake/calories metrics | Left absolute (normalization applies to nutrients only). |

## Testing

1. **Build:** `npm run build` (shared → backend → frontend) with no type errors.
2. **Unit** — `backend/tests/statistics.test.ts` (Vitest): `pearson`/`spearman` vs known vectors
   (perfect ±1, a textbook set), `correlationPValue` vs a reference r/n within tolerance,
   `benjaminiHochberg` vs a worked example, `cohensD` on a simple two-group case. `npm test`.
3. **Manual E2E** (user restarts the `muffintop` service after build):
   - Create a "Mood" series (`higher_better`); log ~2–3 weeks of varied ratings with varied intake,
     including a deliberate 2-day-delayed effect on one metric.
   - Run the correlation: verify the summary table (best lag/window, r, p, q, n, direction-aware text),
     open a metric heatmap and confirm the surface, hover tooltip, low-n hatching, and that the bright
     region lands at the injected lag. Toggle **Per-1000 kcal** and confirm values change.
   - Confirm **water** is selectable and correlates; confirm the food comparison and scatter render.
   - On the dashboard chart, select the "Mood" overlay: confirm the 1–10 line on the right axis, that it
     toggles off cleanly, and that discrete markers are unaffected.

## Affected Files

**Backend:** `db/migrations/006_add_rated_events.sql` (new), `db/schema.sql`,
`src/services/statistics.ts` (new), `src/services/event-correlation-service.ts` (new),
`src/services/rated-series-service.ts` (new), `src/services/event-service.ts`,
`src/services/stats-service.ts`, `src/models/event-correlation.ts` (new),
`src/models/rated-series.ts` (new), `src/models/user-event.ts`,
`src/api/event-correlation.ts` (new), `src/api/rated-series.ts` (new), `src/api/stats.ts`,
`src/api/index.ts`, `tests/statistics.test.ts` (new).

**Shared:** `types/rated-series.ts` (new), `types/events.ts`, `types/event-analysis.ts`, `types/stats.ts`.

**Frontend:** `components/EventLogger.tsx`, `components/TrendChart.tsx`, `pages/EventAnalysis.tsx`,
`hooks/useRatedSeries.ts` (new), `hooks/useEventCorrelation.ts` (new), `hooks/useTrendStats.ts`.

## Future Enhancements

- Lag/window-aware food-presence comparison (mirror the grid for food choices).
- Partial correlation controlling for total calories, as a rigorous complement to per-kcal normalization.
- Effective-sample-size / block-bootstrap correction for serial correlation.
- Multi-series comparison and rating-vs-rating correlation.
- Reminder / backfill UX for daily rating entry.
