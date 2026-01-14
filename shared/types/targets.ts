/**
 * DailyTarget and ActivityLog entity types
 */

export interface DailyTarget {
  id: number;
  basalCalories: number;
  proteinTarget: number | null;
  carbsTarget: number | null;
  sugarTarget: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyTargetInput {
  basalCalories: number;
  proteinTarget?: number | null;
  carbsTarget?: number | null;
  sugarTarget?: number | null;
}

export interface UpdateDailyTargetInput extends CreateDailyTargetInput {}

export interface ActivityEntry {
  id: number;
  logDate: string;
  activityCalories: number;
  createdAt: string;
}

export interface CreateActivityInput {
  logDate: string;
  activityCalories: number;
}

export interface ActivityQueryParams {
  date?: string;
  startDate?: string;
  endDate?: string;
}
