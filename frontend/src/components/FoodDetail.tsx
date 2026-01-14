import { useState } from 'react';
import { useFoodDetail } from '../hooks/useFoodSearch';
import { useNutrients } from '../providers/NutrientProvider';
import type { FoodPortion, NutrientValues } from '@muffintop/shared/types';

interface FoodDetailProps {
  fdcId: number;
  onLog?: (portionGrams: number, portionAmount: number) => void;
  onClose?: () => void;
}

export function FoodDetail({ fdcId, onLog, onClose }: FoodDetailProps) {
  const { visibleNutrients, getNutrientDef } = useNutrients();
  const { data: food, isLoading, error } = useFoodDetail(fdcId);
  const [selectedPortion, setSelectedPortion] = useState<FoodPortion | null>(null);
  const [customGrams, setCustomGrams] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  if (isLoading) return <div>Loading food details...</div>;
  if (error || !food) return <div>Failed to load food details</div>;

  const formatNumber = (val: number | null) => (val !== null ? val.toFixed(1) : '—');

  const calculateNutrients = (grams: number): Partial<NutrientValues> => {
    const factor = grams / 100;
    const result: Partial<NutrientValues> = {};
    for (const key of visibleNutrients) {
      const base = food.nutrients[key];
      result[key] = base !== null ? base * factor : null;
    }
    return result;
  };

  const portionGrams = selectedPortion
    ? selectedPortion.gramWeight * quantity
    : parseFloat(customGrams) * quantity || 0;

  const calculated = calculateNutrients(portionGrams);

  const handleLog = () => {
    if (portionGrams > 0 && onLog) {
      onLog(portionGrams, quantity);
    }
  };

  return (
    <div className="food-detail">
      <div className="detail-header">
        <h3>{food.description}</h3>
        {food.brandOwner && <p className="brand">{food.brandOwner}</p>}
        {onClose && (
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="base-nutrients">
        <h4>Per 100g:</h4>
        <div className="nutrients-grid">
          {visibleNutrients.map((key) => {
            const def = getNutrientDef(key);
            return (
              <span key={key}>
                {def.displayName}: {formatNumber(food.nutrients[key])}
                {def.unit}
              </span>
            );
          })}
        </div>
      </div>

      <div className="portion-selector">
        <h4>Select Portion:</h4>

        {food.portions.length > 0 && (
          <div className="portion-options">
            {food.portions.map((portion) => (
              <label key={portion.id} className="portion-option">
                <input
                  type="radio"
                  name="portion"
                  checked={selectedPortion?.id === portion.id}
                  onChange={() => {
                    setSelectedPortion(portion);
                    setCustomGrams('');
                  }}
                />
                {portion.description} ({portion.gramWeight}g)
              </label>
            ))}
          </div>
        )}

        <label className="portion-option">
          <input
            type="radio"
            name="portion"
            checked={selectedPortion === null}
            onChange={() => setSelectedPortion(null)}
          />
          Custom grams:
          <input
            type="number"
            value={customGrams}
            onChange={(e) => {
              setCustomGrams(e.target.value);
              setSelectedPortion(null);
            }}
            placeholder="100"
            min="0"
            step="1"
            className="custom-grams-input"
          />
        </label>

        <div className="quantity-row">
          <label>
            Quantity:
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
              min="0.1"
              step="0.5"
              className="quantity-input"
            />
          </label>
        </div>
      </div>

      {portionGrams > 0 && (
        <div className="calculated-nutrients">
          <h4>For {portionGrams.toFixed(0)}g:</h4>
          <div className="nutrients-grid highlight">
            {visibleNutrients.map((key) => {
              const def = getNutrientDef(key);
              return (
                <span key={key}>
                  {def.displayName}: {formatNumber(calculated[key] ?? null)}
                  {def.unit}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {onLog && (
        <button className="log-button" onClick={handleLog} disabled={portionGrams <= 0}>
          Log This Food
        </button>
      )}

      <style>{`
        .food-detail {
          padding: 1.5rem;
          border: 1px solid #444;
          border-radius: 8px;
          max-width: 500px;
        }
        .detail-header {
          position: relative;
          margin-bottom: 1rem;
        }
        .detail-header h3 {
          margin: 0 2rem 0 0;
        }
        .brand {
          color: #888;
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }
        .close-button {
          position: absolute;
          top: 0;
          right: 0;
          background: transparent;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
        }
        .base-nutrients, .calculated-nutrients, .portion-selector {
          margin-bottom: 1rem;
        }
        h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          color: #888;
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
        .portion-options {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .portion-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .custom-grams-input {
          width: 80px;
          margin-left: 0.5rem;
        }
        .quantity-row {
          margin-top: 1rem;
        }
        .quantity-input {
          width: 80px;
          margin-left: 0.5rem;
        }
        .log-button {
          width: 100%;
          padding: 1rem;
          font-size: 1rem;
          background-color: #646cff;
          color: white;
          border: none;
          margin-top: 1rem;
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
