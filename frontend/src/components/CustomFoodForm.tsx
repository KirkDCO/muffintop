import { useState } from 'react';
import type { CreateCustomFoodInput, CreateCustomFoodPortionInput, CustomFood } from '@muffintop/shared/types';

interface CustomFoodFormProps {
  initialData?: CustomFood;
  onSave: (input: CreateCustomFoodInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface PortionDraft {
  description: string;
  servingMultiplier: number;
  gramWeight: string;
}

export function CustomFoodForm({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
}: CustomFoodFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [servingGrams, setServingGrams] = useState(initialData?.servingGrams?.toString() ?? '');
  const [isShared, setIsShared] = useState(initialData?.isShared ?? false);

  // Nutrients - big 4 required
  const [calories, setCalories] = useState(initialData?.nutrients.calories?.toString() ?? '');
  const [protein, setProtein] = useState(initialData?.nutrients.protein?.toString() ?? '');
  const [carbs, setCarbs] = useState(initialData?.nutrients.carbs?.toString() ?? '');
  const [totalFat, setTotalFat] = useState(initialData?.nutrients.totalFat?.toString() ?? '');

  // Optional nutrients
  const [fiber, setFiber] = useState(initialData?.nutrients.fiber?.toString() ?? '');
  const [addedSugar, setAddedSugar] = useState(initialData?.nutrients.addedSugar?.toString() ?? '');
  const [totalSugar, setTotalSugar] = useState(initialData?.nutrients.totalSugar?.toString() ?? '');
  const [saturatedFat, setSaturatedFat] = useState(initialData?.nutrients.saturatedFat?.toString() ?? '');
  const [sodium, setSodium] = useState(initialData?.nutrients.sodium?.toString() ?? '');

  // Portions
  const [portions, setPortions] = useState<PortionDraft[]>(
    initialData?.portions?.map((p) => ({
      description: p.description,
      servingMultiplier: p.servingMultiplier,
      gramWeight: p.gramWeight?.toString() ?? '',
    })) ?? []
  );
  const [showAddPortion, setShowAddPortion] = useState(false);
  const [newPortionDesc, setNewPortionDesc] = useState('');
  const [newPortionMultiplier, setNewPortionMultiplier] = useState('1');
  const [newPortionGrams, setNewPortionGrams] = useState('');

  const handleAddPortion = () => {
    if (!newPortionDesc.trim()) return;
    setPortions([
      ...portions,
      {
        description: newPortionDesc.trim(),
        servingMultiplier: parseFloat(newPortionMultiplier) || 1,
        gramWeight: newPortionGrams,
      },
    ]);
    setNewPortionDesc('');
    setNewPortionMultiplier('1');
    setNewPortionGrams('');
    setShowAddPortion(false);
  };

  const handleRemovePortion = (index: number) => {
    setPortions(portions.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const cal = parseFloat(calories);
    const pro = parseFloat(protein);
    const carb = parseFloat(carbs);
    const fat = parseFloat(totalFat);

    if (!name.trim() || isNaN(cal) || isNaN(pro) || isNaN(carb) || isNaN(fat)) {
      return;
    }

    const input: CreateCustomFoodInput = {
      name: name.trim(),
      servingGrams: servingGrams ? parseFloat(servingGrams) : undefined,
      isShared,
      nutrients: {
        calories: cal,
        protein: pro,
        carbs: carb,
        totalFat: fat,
        fiber: fiber ? parseFloat(fiber) : undefined,
        addedSugar: addedSugar ? parseFloat(addedSugar) : undefined,
        totalSugar: totalSugar ? parseFloat(totalSugar) : undefined,
        saturatedFat: saturatedFat ? parseFloat(saturatedFat) : undefined,
        sodium: sodium ? parseFloat(sodium) : undefined,
      },
      portions: portions.length > 0
        ? portions.map((p): CreateCustomFoodPortionInput => ({
            description: p.description,
            servingMultiplier: p.servingMultiplier,
            gramWeight: p.gramWeight ? parseFloat(p.gramWeight) : undefined,
          }))
        : undefined,
    };

    onSave(input);
  };

  const isValid =
    name.trim().length > 0 &&
    !isNaN(parseFloat(calories)) &&
    !isNaN(parseFloat(protein)) &&
    !isNaN(parseFloat(carbs)) &&
    !isNaN(parseFloat(totalFat));

  return (
    <div className="custom-food-form">
      <div className="form-section">
        <h4>Basic Info</h4>
        <div className="form-row">
          <label>
            Food Name *
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Protein Bar"
              className="name-input"
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Serving Size (grams)
            <input
              type="number"
              value={servingGrams}
              onChange={(e) => setServingGrams(e.target.value)}
              placeholder="Optional"
              min="0"
              step="1"
              className="grams-input"
            />
          </label>
          <span className="hint">Reference only - nutrients are per serving</span>
        </div>

        <div className="form-row checkbox-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
            />
            Share this food with all users
          </label>
        </div>
      </div>

      <div className="form-section">
        <h4>Nutrients (per serving) *</h4>
        <div className="nutrient-grid">
          <label>
            Calories *
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="Required"
              min="0"
              step="1"
            />
          </label>
          <label>
            Protein (g) *
            <input
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="Required"
              min="0"
              step="0.1"
            />
          </label>
          <label>
            Carbs (g) *
            <input
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="Required"
              min="0"
              step="0.1"
            />
          </label>
          <label>
            Fat (g) *
            <input
              type="number"
              value={totalFat}
              onChange={(e) => setTotalFat(e.target.value)}
              placeholder="Required"
              min="0"
              step="0.1"
            />
          </label>
        </div>

        <details className="optional-nutrients">
          <summary>Optional Nutrients</summary>
          <div className="nutrient-grid">
            <label>
              Fiber (g)
              <input
                type="number"
                value={fiber}
                onChange={(e) => setFiber(e.target.value)}
                min="0"
                step="0.1"
              />
            </label>
            <label>
              Added Sugar (g)
              <input
                type="number"
                value={addedSugar}
                onChange={(e) => setAddedSugar(e.target.value)}
                min="0"
                step="0.1"
              />
            </label>
            <label>
              Total Sugar (g)
              <input
                type="number"
                value={totalSugar}
                onChange={(e) => setTotalSugar(e.target.value)}
                min="0"
                step="0.1"
              />
            </label>
            <label>
              Saturated Fat (g)
              <input
                type="number"
                value={saturatedFat}
                onChange={(e) => setSaturatedFat(e.target.value)}
                min="0"
                step="0.1"
              />
            </label>
            <label>
              Sodium (mg)
              <input
                type="number"
                value={sodium}
                onChange={(e) => setSodium(e.target.value)}
                min="0"
                step="1"
              />
            </label>
          </div>
        </details>
      </div>

      <div className="form-section">
        <h4>Portions (optional)</h4>
        <p className="section-hint">Add named portions like "1 bar", "2 scoops", etc.</p>

        {portions.length > 0 && (
          <div className="portions-list">
            {portions.map((portion, index) => (
              <div key={index} className="portion-item">
                <span className="portion-desc">{portion.description}</span>
                <span className="portion-meta">
                  {portion.servingMultiplier !== 1 && `${portion.servingMultiplier}x `}
                  {portion.gramWeight && `(${portion.gramWeight}g)`}
                </span>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => handleRemovePortion(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {showAddPortion ? (
          <div className="add-portion-form">
            <input
              type="text"
              value={newPortionDesc}
              onChange={(e) => setNewPortionDesc(e.target.value)}
              placeholder="e.g., 1 bar, 2 scoops"
              className="portion-desc-input"
            />
            <input
              type="number"
              value={newPortionMultiplier}
              onChange={(e) => setNewPortionMultiplier(e.target.value)}
              placeholder="Servings"
              min="0.1"
              step="0.5"
              className="portion-mult-input"
              title="Number of servings this portion represents"
            />
            <input
              type="number"
              value={newPortionGrams}
              onChange={(e) => setNewPortionGrams(e.target.value)}
              placeholder="Grams (optional)"
              min="0"
              step="1"
              className="portion-grams-input"
            />
            <div className="portion-actions">
              <button type="button" onClick={handleAddPortion} className="add-btn">
                Add
              </button>
              <button type="button" onClick={() => setShowAddPortion(false)} className="cancel-small-btn">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="add-portion-btn"
            onClick={() => setShowAddPortion(true)}
          >
            + Add Portion
          </button>
        )}
      </div>

      <div className="form-actions">
        <button className="cancel-btn" onClick={onCancel} disabled={isLoading}>
          Cancel
        </button>
        <button className="save-btn" onClick={handleSubmit} disabled={!isValid || isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Food' : 'Create Food'}
        </button>
      </div>

      <style>{`
        .custom-food-form {
          padding: 1.5rem;
          border: 1px solid #444;
          border-radius: 8px;
        }
        .form-section {
          margin-bottom: 1.5rem;
        }
        .form-section h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: #ccc;
        }
        .form-row {
          margin-bottom: 1rem;
        }
        .form-row label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #888;
        }
        .name-input {
          padding: 0.75rem;
          font-size: 1rem;
        }
        .grams-input {
          width: 120px;
          padding: 0.75rem;
        }
        .hint {
          font-size: 0.8rem;
          color: #666;
          margin-top: 0.25rem;
        }
        .section-hint {
          font-size: 0.85rem;
          color: #666;
          margin: 0 0 1rem 0;
        }
        .checkbox-row {
          margin-top: 0.5rem;
        }
        .checkbox-label {
          display: flex;
          flex-direction: row !important;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          color: #ccc;
        }
        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .nutrient-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 1rem;
        }
        .nutrient-grid label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #888;
        }
        .nutrient-grid input {
          padding: 0.5rem;
        }
        .optional-nutrients {
          margin-top: 1rem;
          padding: 1rem;
          background: #1a1a1a;
          border-radius: 4px;
        }
        .optional-nutrients summary {
          cursor: pointer;
          color: #888;
          margin-bottom: 1rem;
        }
        .optional-nutrients[open] summary {
          margin-bottom: 1rem;
        }
        .portions-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .portion-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: #2a2a2a;
          border-radius: 4px;
        }
        .portion-desc {
          flex: 1;
        }
        .portion-meta {
          color: #888;
          font-size: 0.85rem;
        }
        .add-portion-form {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 1rem;
          background: #222;
          border-radius: 4px;
        }
        .portion-desc-input {
          flex: 1;
          min-width: 150px;
          padding: 0.5rem;
        }
        .portion-mult-input,
        .portion-grams-input {
          width: 100px;
          padding: 0.5rem;
        }
        .portion-actions {
          display: flex;
          gap: 0.5rem;
          width: 100%;
        }
        .add-btn {
          padding: 0.5rem 1rem;
          background: #646cff;
          color: white;
          border: none;
          cursor: pointer;
        }
        .cancel-small-btn {
          padding: 0.5rem 1rem;
          background: #333;
          border: none;
          cursor: pointer;
        }
        .add-portion-btn {
          width: 100%;
          padding: 0.75rem;
          background: #333;
          border: 1px dashed #555;
          color: #888;
          cursor: pointer;
          font-size: 0.95rem;
        }
        .add-portion-btn:hover {
          border-color: #666;
          color: #ccc;
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
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #333;
        }
        .cancel-btn {
          padding: 0.75rem 1.5rem;
          background: #333;
          border: none;
          cursor: pointer;
        }
        .save-btn {
          padding: 0.75rem 1.5rem;
          background: #646cff;
          color: white;
          border: none;
          cursor: pointer;
        }
        .save-btn:hover:not(:disabled) {
          background: #535bf2;
        }
        .save-btn:disabled,
        .cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
