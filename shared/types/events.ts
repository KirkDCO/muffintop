/**
 * User event types for health event tracking
 */

export interface UserEvent {
  id: number;
  eventDate: string;
  description: string;
  color: string;
  createdAt: string;
}

export interface CreateEventInput {
  eventDate: string;
  description: string;
  color: string;
}

export interface EventQueryParams {
  startDate?: string;
  endDate?: string;
}
