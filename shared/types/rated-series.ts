/**
 * Rated event series metadata.
 *
 * A rated series is a named 1-10 metric the user scores each day (e.g. "Mood").
 * Ratings themselves live in `user_event` (rating column); this holds per-series
 * metadata used for interpretation and display.
 */

export type RatingDirection = 'higher_better' | 'higher_worse';

export interface RatedEventSeries {
  id: number;
  description: string;
  direction: RatingDirection;
  color: string;
  createdAt: string;
}

export interface UpsertRatedSeriesInput {
  description: string;
  direction: RatingDirection;
  color: string;
}
