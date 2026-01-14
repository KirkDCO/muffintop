/**
 * User entity types
 */

import type { NutrientKey } from './nutrients.js';

export interface User {
  id: number;
  name: string;
  createdAt: string; // ISO 8601
}

export interface UserWithPreferences extends User {
  visibleNutrients: NutrientKey[];
}

export interface CreateUserInput {
  name: string;
  visibleNutrients?: NutrientKey[];
}

export interface UpdateNutrientPreferencesInput {
  visibleNutrients: NutrientKey[];
}

export interface NutrientPreferences {
  userId: number;
  visibleNutrients: NutrientKey[];
  createdAt: string;
  updatedAt: string;
}
