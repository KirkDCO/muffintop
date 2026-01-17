import { useState } from 'react';
import { useCustomFood } from '../hooks/useCustomFoods';
import { useNutrients } from '../providers/NutrientProvider';
import type { NutrientValues } from '@muffintop/shared/types';

interface CustomFoodDetailProps {
  customFoodId: number;
  currentUserId?: number;
  onLog?: (servings: number, portionDescription?: string) => void;
  onEdit?: () => void;
  onClose?: () => void;
}

export function CustomFoodDetail({
  customFoodId,
  currentUserId,
  onLog,
  onEdit,
  onClose,
}: CustomFoodDetailProps) {
  const { visibleNutrients, getNutrientDef } = useNutrients();
  const { data: customFood, isLoading, error } = useCustomFood(customFoodId);
  const [servingsToLog, setServingsToLog] = useState<string>('1');
  const [selectedPortionId, setSelectedPortionId] = useState<string>('servings');

  const isOwner = currentUserId !== undefined && customFood?.userId === currentUserId;

  if (isLoading) return <div>Loading custom food...</div>;
  if (error || !customFood) return <div>Failed to load custom food</div>;

  const formatNumber = (val: number | null) => (val !== null ? val.toFixed(1) : '—');

  // Build portion options
  const portionOptions = [
    { id: 'servings', label: 'servings', multiplier: 1 },
    ...(customFood.portions?.map((p) => ({
      id: String(p.id),
      label: p.description,
      multiplier: p.servingMultiplier,
    })) ?? []),
  ];

  // Get current portion multiplier
  const selectedPortion = portionOptions.find((p) => p.id === selectedPortionId);
  const servingsNum = parseFloat(servingsToLog) || 0;
  const effectiveServings = servingsNum * (selectedPortion?.multiplier ?? 1);

  // Calculate nutrients for selected servings (nutrients are per 1 serving)
  const calculateForServings = (servings: number): Partial<NutrientValues> => {
    const result: Partial<NutrientValues> = {};
    for (const key of visibleNutrients) {
      const perServing = customFood.nutrients[key];
      result[key] = perServing !== null ? perServing * servings : null;
    }
    return result;
  };

  const perServing = customFood.nutrients;
  const forSelectedServings = calculateForServings(effectiveServings);

  const handleLog = () => {
    if (effectiveServings > 0 && onLog) {
      const portionDesc =
        selectedPortionId === 'servings'
          ? `${servingsNum} serving${servingsNum !== 1 ? 's' : ''}`
          : `${servingsNum} ${selectedPortion?.label}`;
      onLog(effectiveServings, portionDesc);
    }
  };

  return (
    <div className="custom-food-detail">
      <div className="detail-header">
        <div className="title-row">
          <div>
            <div className="title-with-badge">
              <h3>{customFood.name}</h3>
              {customFood.isShared && <span className="shared-badge">Shared</span>}
            </div>
            {customFood.servingGrams && (
              <p className="serving-info">{customFood.servingGrams}g per serving</p>
            )}
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

      {customFood.portions && customFood.portions.length > 0 && (
        <div className="portions-section">
          <h4>Available Portions:</h4>
          <ul className="portion-list">
            {customFood.portions.map((p) => (
              <li key={p.id}>
                {p.description}
                {p.servingMultiplier !== 1 && ` (${p.servingMultiplier} servings)`}
                {p.gramWeight && ` - ${p.gramWeight}g`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {onLog && (
        <div className="log-section">
          <div className="amount-selector">
            <label>
              Amount:
              <input
                type="number"
                value={servingsToLog}
                onChange={(e) => setServingsToLog(e.target.value)}
                onBlur={() => {
                  const val = parseFloat(servingsToLog) || 0.1;
                  setServingsToLog(String(Math.max(0.1, val)));
                }}
                min="0.1"
                step="0.5"
                className="amount-input"
              />
            </label>
            <select
              value={selectedPortionId}
              onChange={(e) => setSelectedPortionId(e.target.value)}
              className="portion-select"
            >
              {portionOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {effectiveServings > 0 && (
            <div className="calculated-nutrients">
              <h4>
                Total ({effectiveServings.toFixed(1)} serving{effectiveServings !== 1 ? 's' : ''}):
              </h4>
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

          <button className="log-button" onClick={handleLog} disabled={effectiveServings <= 0}>
            Log This Food
          </button>
        </div>
      )}

      <style>{`
        .custom-food-detail {
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
        .serving-info {
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
        .nutrients-section, .portions-section, .log-section {
          margin-bottom: 1rem;
        }
        h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          color: #888;
        }
        .portion-list {
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 0.9rem;
          color: #aaa;
        }
        .portion-list li {
          padding: 0.3rem 0;
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
        .amount-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .amount-selector label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .amount-input {
          width: 80px;
          padding: 0.5rem;
        }
        .portion-select {
          padding: 0.5rem;
          min-width: 120px;
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
