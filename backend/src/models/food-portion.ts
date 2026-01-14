/**
 * Food portion model types
 * Read-only reference data from USDA
 */

export interface FoodPortionRow {
  id: number;
  fdc_id: number;
  gram_weight: number;
  description: string;
  amount: number;
}
