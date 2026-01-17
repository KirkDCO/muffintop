import { useState } from 'react';
import { useRecipe } from '../hooks/useRecipes';
import { useNutrients } from '../providers/NutrientProvider';
import type { NutrientValues } from '@muffintop/shared/types';

interface RecipeDetailProps {
  recipeId: number;
  currentUserId?: number;
  onLog?: (servings: number, portionDescription: string) => void;
  onEdit?: () => void;
  onClose?: () => void;
}

export function RecipeDetail({ recipeId, currentUserId, onLog, onEdit, onClose }: RecipeDetailProps) {
  const { visibleNutrients, getNutrientDef } = useNutrients();
  const { data: recipe, isLoading, error } = useRecipe(recipeId);
  const [servingsToLog, setServingsToLog] = useState<number>(1);

  const isOwner = currentUserId !== undefined && recipe?.userId === currentUserId;

  if (isLoading) return <div>Loading recipe...</div>;
  if (error || !recipe) return <div>Failed to load recipe</div>;

  const formatNumber = (val: number | null) => (val !== null ? val.toFixed(1) : '—');

  // Calculate nutrients per serving
  const calculatePerServing = (): Partial<NutrientValues> => {
    const factor = 1 / recipe.servings;
    const result: Partial<NutrientValues> = {};
    for (const key of visibleNutrients) {
      const total = recipe.nutrients[key];
      result[key] = total !== null ? total * factor : null;
    }
    return result;
  };

  // Calculate nutrients for selected servings
  const calculateForServings = (servings: number): Partial<NutrientValues> => {
    const factor = servings / recipe.servings;
    const result: Partial<NutrientValues> = {};
    for (const key of visibleNutrients) {
      const total = recipe.nutrients[key];
      result[key] = total !== null ? total * factor : null;
    }
    return result;
  };

  const perServing = calculatePerServing();
  const forSelectedServings = calculateForServings(servingsToLog);

  const handleLog = () => {
    if (servingsToLog > 0 && onLog) {
      const portionDesc = `${servingsToLog} serving${servingsToLog !== 1 ? 's' : ''}`;
      onLog(servingsToLog, portionDesc);
    }
  };

  return (
    <div className="recipe-detail">
      <div className="detail-header">
        <div className="title-row">
          <div>
            <div className="title-with-badge">
              <h3>{recipe.name}</h3>
              {recipe.isShared && <span className="shared-badge">Shared</span>}
            </div>
            <p className="servings-info">{recipe.servings} total servings</p>
          </div>
          <div className="header-actions">
            {isOwner && onEdit && (
              <button className="edit-button" onClick={onEdit}>
                Edit
              </button>
            )}
            {onClose && (
              <button className="close-button" onClick={onClose}>
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="ingredients-section">
        <h4>Ingredients</h4>
        <ul className="ingredient-list">
          {recipe.ingredients.map((ing) => (
            <li key={ing.id}>
              <span className="ing-name">{ing.foodName}</span>
              <span className="ing-qty">
                {ing.quantityGrams}g
                {ing.displayQuantity && ` (${ing.displayQuantity})`}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="nutrients-section">
        <h4>Per Serving:</h4>
        <div className="nutrients-grid">
          {visibleNutrients.map((key) => {
            const def = getNutrientDef(key);
            return (
              <span key={key}>
                {def.displayName}: {formatNumber(perServing[key] ?? null)}
                {def.unit}
              </span>
            );
          })}
        </div>
      </div>

      {onLog && (
        <div className="log-section">
          <div className="servings-selector">
            <label>
              Servings to log:
              <input
                type="number"
                value={servingsToLog}
                onChange={(e) => setServingsToLog(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                min="0.1"
                step="0.5"
                className="servings-input"
              />
            </label>
          </div>

          {servingsToLog > 0 && (
            <div className="calculated-nutrients">
              <h4>For {servingsToLog} serving{servingsToLog !== 1 ? 's' : ''}:</h4>
              <div className="nutrients-grid highlight">
                {visibleNutrients.map((key) => {
                  const def = getNutrientDef(key);
                  return (
                    <span key={key}>
                      {def.displayName}: {formatNumber(forSelectedServings[key] ?? null)}
                      {def.unit}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <button className="log-button" onClick={handleLog} disabled={servingsToLog <= 0}>
            Log This Recipe
          </button>
        </div>
      )}

      <style>{`
        .recipe-detail {
          padding: 1.5rem;
          border: 1px solid #444;
          border-radius: 8px;
          max-width: 500px;
        }
        .detail-header {
          margin-bottom: 1rem;
        }
        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .title-with-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .detail-header h3 {
          margin: 0;
        }
        .shared-badge {
          font-size: 0.7rem;
          padding: 0.15rem 0.4rem;
          background: #2a4a2a;
          color: #8c8;
          border-radius: 3px;
        }
        .servings-info {
          color: #888;
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .edit-button {
          padding: 0.4rem 0.75rem;
          font-size: 0.85rem;
          background: #333;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          color: #ccc;
        }
        .edit-button:hover {
          background: #444;
        }
        .close-button {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        .ingredients-section, .nutrients-section, .log-section {
          margin-bottom: 1rem;
        }
        h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          color: #888;
        }
        .ingredient-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .ingredient-list li {
          display: flex;
          justify-content: space-between;
          padding: 0.4rem 0;
          border-bottom: 1px solid #333;
        }
        .ingredient-list li:last-child {
          border-bottom: none;
        }
        .ing-name {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-right: 1rem;
        }
        .ing-qty {
          color: #888;
          flex-shrink: 0;
        }
        .nutrients-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }
        .nutrients-grid.highlight {
          background: #333;
          padding: 0.75rem;
          border-radius: 4px;
        }
        .servings-selector {
          margin-bottom: 1rem;
        }
        .servings-selector label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .servings-input {
          width: 80px;
          padding: 0.5rem;
        }
        .calculated-nutrients {
          margin-bottom: 1rem;
        }
        .log-button {
          width: 100%;
          padding: 1rem;
          font-size: 1rem;
          background-color: #646cff;
          color: white;
          border: none;
          cursor: pointer;
        }
        .log-button:hover:not(:disabled) {
          background-color: #535bf2;
        }
        .log-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
