/**
 * BodyMetric entity types
 */

export type WeightUnit = 'kg' | 'lb';
export type WeightTrend = 'up' | 'down' | 'stable';

export interface WeightEntry {
  id: number;
  metricDate: string;
  weightValue: number;
  weightUnit: WeightUnit;
  createdAt: string;
}

export interface CreateWeightInput {
  metricDate: string;
  weightValue: number;
  weightUnit: WeightUnit;
}

export interface WeightHistory {
  entries: WeightEntry[];
  latestValue: number | null;
  latestUnit: WeightUnit | null;
  trend: WeightTrend | null;
}

export interface WeightQueryParams {
  startDate?: string;
  endDate?: string;
}
