/**
 * Intake tracking types (water, caffeine)
 */

import type { TargetDirection } from './targets.js';

export type IntakeType = 'water' | 'caffeine' | 'alcohol';
export const INTAKE_TYPES = ['water', 'caffeine', 'alcohol'] as const;
export type WaterUnit = 'ml' | 'fl_oz';

export interface IntakeEntry {
  id: number;
  logDate: string;
  intakeType: IntakeType;
  amount: number;
  createdAt: string;
}

export interface CreateIntakeInput {
  logDate: string;
  intakeType: IntakeType;
  amount: number;
}

export interface IntakeTarget {
  value: number;
  direction: TargetDirection;
}

export interface IntakeResponse {
  entries: IntakeEntry[];
  total: number;
}

// Conversion constants
export const ML_PER_FLOZ = 29.5735;

export function mlToFlOz(ml: number): number {
  return ml / ML_PER_FLOZ;
}

export function flOzToMl(flOz: number): number {
  return flOz * ML_PER_FLOZ;
}

// Default target directions
export const DEFAULT_INTAKE_DIRECTIONS: Record<IntakeType, TargetDirection> = {
  water: 'min',
  caffeine: 'max',
  alcohol: 'max',
};
