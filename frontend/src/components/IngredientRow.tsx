import { useState, useEffect } from 'react';
import { PortionSelector } from './PortionSelector';

interface IngredientRowProps {
  foodName: string;
  fdcId?: number;
  customFoodId?: number;
  ingredientRecipeId?: number;
  quantityGrams: number; // For USDA: grams. For custom foods/recipes: servings.
  displayQuantity?: string;
  onPortionChange?: (value: number, displayQuantity: string) => void;
  onRemove: () => void;
}

export function IngredientRow({
  foodName,
  fdcId,
  customFoodId,
  ingredientRecipeId,
  quantityGrams,
  displayQuantity,
  onPortionChange,
  onRemove,
}: IngredientRowProps) {
  // Local state for the grams input to allow clearing before entering new values
  const [localGrams, setLocalGrams] = useState(String(quantityGrams));

  // Sync local state when prop changes (e.g., from parent updates)
  useEffect(() => {
    setLocalGrams(String(quantityGrams));
  }, [quantityGrams]);

  // Show PortionSelector for USDA foods, custom foods, or recipes with onPortionChange
  const showPortionSelector = (fdcId || customFoodId || ingredientRecipeId) && onPortionChange;

  return (
    <div className="ingredient-row">
      <div className="ingredient-info">
        <span className="ingredient-name">{foodName}</span>
      </div>
      <div className="ingredient-controls">
        {showPortionSelector ? (
          <PortionSelector
            fdcId={fdcId}
            customFoodId={customFoodId}
            ingredientRecipeId={ingredientRecipeId}
            initialValue={quantityGrams}
            initialDisplay={displayQuantity}
            onChange={onPortionChange}
          />
        ) : (
          <>
            <input
              type="number"
              value={localGrams}
              onChange={(e) => setLocalGrams(e.target.value)}
              onBlur={() => {
                const val = Math.max(0, parseFloat(localGrams) || 0);
                setLocalGrams(String(val));
                onPortionChange?.(val, displayQuantity || '');
              }}
              min="0"
              step="1"
              className="grams-input"
              placeholder="grams"
            />
            <span className="unit">g</span>
          </>
        )}
        <button className="remove-btn" onClick={onRemove} title="Remove ingredient">
          ×
        </button>
      </div>

      <style>{`
        .ingredient-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border: 1px solid #333;
          border-radius: 4px;
          gap: 1rem;
        }
        .ingredient-info {
          flex: 1;
          min-width: 0;
        }
        .ingredient-name {
          display: block;
        }
        .ingredient-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }
        .grams-input {
          width: 70px;
          padding: 0.4rem;
          text-align: right;
        }
        .unit {
          color: #888;
          font-size: 0.9rem;
        }
        .remove-btn {
          background: transparent;
          border: 1px solid #555;
          color: #f66;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          line-height: 1;
        }
        .remove-btn:hover {
          background: #411;
          border-color: #f66;
        }
      `}</style>
    </div>
  );
}
