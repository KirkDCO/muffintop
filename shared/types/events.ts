/**
 * User event types for health event tracking
 */

export interface UserEvent {
  id: number;
  eventDate: string;
  description: string;
  color: string;
  /** 1-10 rating for rated events; null/undefined for discrete events */
  rating?: number | null;
  createdAt: string;
}

export interface CreateEventInput {
  eventDate: string;
  description: string;
  color: string;
  /** Provide a 1-10 rating to log a rated event (also upserts the series metadata) */
  rating?: number | null;
}

export interface EventQueryParams {
  startDate?: string;
  endDate?: string;
}
