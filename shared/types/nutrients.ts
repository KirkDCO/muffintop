/**
 * Nutrient types and registry
 * Single source of truth for all nutrient definitions
 */

/**
 * All supported nutrient keys
 */
export type NutrientKey =
  | 'calories'
  | 'protein'
  | 'carbs'
  | 'fiber'
  | 'addedSugar'
  | 'totalSugar'
  | 'totalFat'
  | 'saturatedFat'
  | 'transFat'
  | 'cholesterol'
  | 'sodium'
  | 'potassium'
  | 'calcium'
  | 'iron'
  | 'vitaminA'
  | 'vitaminC'
  | 'vitaminD';

/**
 * Definition for a single nutrient
 */
export interface NutrientDefinition {
  key: NutrientKey;
  usdaId: number;
  dbColumn: string;
  displayName: string;
  unit: string;
  shortName: string;
}

/**
 * Central registry of all nutrients
 * Maps nutrient keys to their full definitions
 */
export const NUTRIENT_REGISTRY: Record<NutrientKey, NutrientDefinition> = {
  calories: {
    key: 'calories',
    usdaId: 1008,
    dbColumn: 'calories',
    displayName: 'Calories',
    unit: 'kcal',
    shortName: 'Cal',
  },
  protein: {
    key: 'protein',
    usdaId: 1003,
    dbColumn: 'protein',
    displayName: 'Protein',
    unit: 'g',
    shortName: 'P',
  },
  carbs: {
    key: 'carbs',
    usdaId: 1005,
    dbColumn: 'carbs',
    displayName: 'Carbohydrates',
    unit: 'g',
    shortName: 'C',
  },
  fiber: {
    key: 'fiber',
    usdaId: 1079,
    dbColumn: 'fiber',
    displayName: 'Fiber',
    unit: 'g',
    shortName: 'Fib',
  },
  addedSugar: {
    key: 'addedSugar',
    usdaId: 1235,
    dbColumn: 'added_sugar',
    displayName: 'Added Sugar',
    unit: 'g',
    shortName: 'AS',
  },
  totalSugar: {
    key: 'totalSugar',
    usdaId: 2000,
    dbColumn: 'total_sugar',
    displayName: 'Total Sugar',
    unit: 'g',
    shortName: 'TS',
  },
  totalFat: {
    key: 'totalFat',
    usdaId: 1004,
    dbColumn: 'total_fat',
    displayName: 'Total Fat',
    unit: 'g',
    shortName: 'F',
  },
  saturatedFat: {
    key: 'saturatedFat',
    usdaId: 1258,
    dbColumn: 'saturated_fat',
    displayName: 'Saturated Fat',
    unit: 'g',
    shortName: 'SF',
  },
  transFat: {
    key: 'transFat',
    usdaId: 1257,
    dbColumn: 'trans_fat',
    displayName: 'Trans Fat',
    unit: 'g',
    shortName: 'TF',
  },
  cholesterol: {
    key: 'cholesterol',
    usdaId: 1253,
    dbColumn: 'cholesterol',
    displayName: 'Cholesterol',
    unit: 'mg',
    shortName: 'Chol',
  },
  sodium: {
    key: 'sodium',
    usdaId: 1093,
    dbColumn: 'sodium',
    displayName: 'Sodium',
    unit: 'mg',
    shortName: 'Na',
  },
  potassium: {
    key: 'potassium',
    usdaId: 1092,
    dbColumn: 'potassium',
    displayName: 'Potassium',
    unit: 'mg',
    shortName: 'K',
  },
  calcium: {
    key: 'calcium',
    usdaId: 1087,
    dbColumn: 'calcium',
    displayName: 'Calcium',
    unit: 'mg',
    shortName: 'Ca',
  },
  iron: {
    key: 'iron',
    usdaId: 1089,
    dbColumn: 'iron',
    displayName: 'Iron',
    unit: 'mg',
    shortName: 'Fe',
  },
  vitaminA: {
    key: 'vitaminA',
    usdaId: 1106,
    dbColumn: 'vitamin_a',
    displayName: 'Vitamin A',
    unit: 'mcg',
    shortName: 'Vit A',
  },
  vitaminC: {
    key: 'vitaminC',
    usdaId: 1162,
    dbColumn: 'vitamin_c',
    displayName: 'Vitamin C',
    unit: 'mg',
    shortName: 'Vit C',
  },
  vitaminD: {
    key: 'vitaminD',
    usdaId: 1114,
    dbColumn: 'vitamin_d',
    displayName: 'Vitamin D',
    unit: 'mcg',
    shortName: 'Vit D',
  },
};

/**
 * All nutrient keys as an array (useful for iteration)
 */
export const ALL_NUTRIENT_KEYS = Object.keys(NUTRIENT_REGISTRY) as NutrientKey[];

/**
 * Type for storing nutrient values
 * All nutrients are nullable since data may not be available
 */
export type NutrientValues = Record<NutrientKey, number | null>;

/**
 * Default visible nutrients for new users
 */
export const DEFAULT_VISIBLE_NUTRIENTS: NutrientKey[] = [
  'calories',
  'protein',
  'carbs',
  'totalFat',
  'saturatedFat',
  'fiber',
  'addedSugar',
];

/**
 * Helper to create an empty NutrientValues object with all nulls
 */
export function createEmptyNutrientValues(): NutrientValues {
  const values = {} as NutrientValues;
  for (const key of ALL_NUTRIENT_KEYS) {
    values[key] = null;
  }
  return values;
}

/**
 * Helper to get nutrient database columns for SQL queries
 */
export function getNutrientDbColumns(): string[] {
  return ALL_NUTRIENT_KEYS.map((k) => NUTRIENT_REGISTRY[k].dbColumn);
}

/**
 * Helper to get nutrient column list as SQL string
 */
export function getNutrientColumnsSql(): string {
  return getNutrientDbColumns().join(', ');
}
