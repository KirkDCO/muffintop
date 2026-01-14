import { useState } from 'react';
import {
  ALL_NUTRIENT_KEYS,
  NUTRIENT_REGISTRY,
  DEFAULT_VISIBLE_NUTRIENTS,
  type NutrientKey,
} from '@muffintop/shared/types';

interface NutrientPreferencesEditorProps {
  selectedNutrients: NutrientKey[];
  onChange: (nutrients: NutrientKey[]) => void;
  disabled?: boolean;
}

export function NutrientPreferencesEditor({
  selectedNutrients,
  onChange,
  disabled = false,
}: NutrientPreferencesEditorProps) {
  const [localSelection, setLocalSelection] = useState<Set<NutrientKey>>(
    new Set(selectedNutrients)
  );

  const handleToggle = (key: NutrientKey) => {
    const newSelection = new Set(localSelection);
    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }
    setLocalSelection(newSelection);
    onChange(ALL_NUTRIENT_KEYS.filter((k) => newSelection.has(k)));
  };

  const handleSelectDefaults = () => {
    const newSelection = new Set(DEFAULT_VISIBLE_NUTRIENTS);
    setLocalSelection(newSelection);
    onChange([...DEFAULT_VISIBLE_NUTRIENTS]);
  };

  const handleSelectAll = () => {
    const newSelection = new Set(ALL_NUTRIENT_KEYS);
    setLocalSelection(newSelection);
    onChange([...ALL_NUTRIENT_KEYS]);
  };

  const handleSelectNone = () => {
    // Always keep at least calories selected
    const newSelection = new Set<NutrientKey>(['calories']);
    setLocalSelection(newSelection);
    onChange(['calories']);
  };

  // Group nutrients for better organization
  const nutrientGroups = [
    {
      label: 'Energy',
      keys: ['calories'] as NutrientKey[],
    },
    {
      label: 'Macronutrients',
      keys: ['protein', 'carbs', 'totalFat'] as NutrientKey[],
    },
    {
      label: 'Fats',
      keys: ['saturatedFat', 'transFat', 'cholesterol'] as NutrientKey[],
    },
    {
      label: 'Carbohydrates',
      keys: ['fiber', 'totalSugar', 'addedSugar'] as NutrientKey[],
    },
    {
      label: 'Minerals',
      keys: ['sodium', 'potassium', 'calcium', 'iron'] as NutrientKey[],
    },
    {
      label: 'Vitamins',
      keys: ['vitaminA', 'vitaminC', 'vitaminD'] as NutrientKey[],
    },
  ];

  return (
    <div className="nutrient-preferences-editor">
      <div className="editor-header">
        <h4>Select nutrients to display</h4>
        <div className="quick-actions">
          <button type="button" onClick={handleSelectDefaults} disabled={disabled}>
            Defaults
          </button>
          <button type="button" onClick={handleSelectAll} disabled={disabled}>
            All
          </button>
          <button type="button" onClick={handleSelectNone} disabled={disabled}>
            Minimal
          </button>
        </div>
      </div>

      <div className="nutrient-groups">
        {nutrientGroups.map((group) => (
          <div key={group.label} className="nutrient-group">
            <h5>{group.label}</h5>
            <div className="nutrient-options">
              {group.keys.map((key) => {
                const def = NUTRIENT_REGISTRY[key];
                return (
                  <label key={key} className="nutrient-option">
                    <input
                      type="checkbox"
                      checked={localSelection.has(key)}
                      onChange={() => handleToggle(key)}
                      disabled={disabled || (key === 'calories' && localSelection.size === 1)}
                    />
                    <span className="nutrient-name">{def.displayName}</span>
                    <span className="nutrient-unit">({def.unit})</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="selection-count">
        {localSelection.size} of {ALL_NUTRIENT_KEYS.length} nutrients selected
      </p>

      <style>{`
        .nutrient-preferences-editor {
          border: 1px solid #444;
          border-radius: 8px;
          padding: 1rem;
        }
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .editor-header h4 {
          margin: 0;
        }
        .quick-actions {
          display: flex;
          gap: 0.5rem;
        }
        .quick-actions button {
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
        }
        .nutrient-groups {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .nutrient-group {
          background: #252525;
          border-radius: 4px;
          padding: 0.75rem;
        }
        .nutrient-group h5 {
          margin: 0 0 0.5rem 0;
          font-size: 0.85rem;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .nutrient-options {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .nutrient-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        .nutrient-option input[disabled] {
          cursor: not-allowed;
        }
        .nutrient-name {
          flex: 1;
        }
        .nutrient-unit {
          color: #666;
          font-size: 0.85rem;
        }
        .selection-count {
          margin: 1rem 0 0 0;
          text-align: center;
          color: #888;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
