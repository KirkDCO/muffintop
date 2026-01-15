import { PortionSelector } from './PortionSelector';

interface IngredientRowProps {
  foodName: string;
  fdcId?: number;
  quantityGrams: number;
  displayQuantity?: string;
  onPortionChange?: (grams: number, displayQuantity: string) => void;
  onRemove: () => void;
}

export function IngredientRow({
  foodName,
  fdcId,
  quantityGrams,
  displayQuantity,
  onPortionChange,
  onRemove,
}: IngredientRowProps) {
  return (
    <div className="ingredient-row">
      <div className="ingredient-info">
        <span className="ingredient-name">{foodName}</span>
      </div>
      <div className="ingredient-controls">
        {fdcId && onPortionChange ? (
          <PortionSelector
            fdcId={fdcId}
            initialGrams={quantityGrams}
            initialDisplay={displayQuantity}
            onChange={onPortionChange}
          />
        ) : (
          <>
            <input
              type="number"
              value={quantityGrams}
              onChange={(e) =>
                onPortionChange?.(Math.max(0, parseFloat(e.target.value) || 0), displayQuantity || '')
              }
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
          max-width: 200px;
        }
        .ingredient-name {
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
