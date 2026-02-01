import { useState } from 'react';
import type { FoodLogEntry as FoodLogEntryType, MealCategory } from '@muffintop/shared/types';
import { useNutrients } from '../providers/NutrientProvider';

interface FoodLogEntryProps {
  entry: FoodLogEntryType;
  onEdit?: (entry: FoodLogEntryType) => void;
  onDelete?: (entryId: number) => void;
  onMove?: (entryId: number, newMeal: MealCategory) => void;
}

const MEAL_CATEGORIES: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function FoodLogEntry({ entry, onEdit, onDelete, onMove }: FoodLogEntryProps) {
  const { visibleNutrients, getNutrientDef } = useNutrients();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);

  const formatNumber = (val: number | null) => (val !== null ? val.toFixed(0) : '—');

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete?.(entry.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className="food-log-entry">
      <div className="entry-main">
        <span className="meal-badge">{entry.mealCategory}</span>
        <span className="food-name">{entry.foodName}</span>
        <span className="portion">{entry.portionDescription}</span>
      </div>
      <div className="entry-nutrients">
        {visibleNutrients.map((key) => {
          const def = getNutrientDef(key);
          return (
            <span key={key}>
              {formatNumber(entry.nutrients[key])}
              {def.unit === 'kcal' ? ' kcal' : `${def.unit} ${def.shortName}`}
            </span>
          );
        })}
      </div>
      <div className="entry-actions">
        {onEdit && (
          <button className="edit-btn" onClick={() => onEdit(entry)} title="Edit">
            ✎
          </button>
        )}
        {onMove && (
          <div className="move-container">
            <button
              className="move-btn"
              onClick={() => setShowMoveDropdown(!showMoveDropdown)}
              title="Move to another meal"
            >
              ↔
            </button>
            {showMoveDropdown && (
              <div className="move-dropdown">
                {MEAL_CATEGORIES.filter((meal) => meal !== entry.mealCategory).map((meal) => (
                  <button
                    key={meal}
                    className="move-option"
                    onClick={() => {
                      onMove(entry.id, meal);
                      setShowMoveDropdown(false);
                    }}
                  >
                    {meal}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {onDelete && (
          <button
            className={`delete-btn ${confirmDelete ? 'confirm' : ''}`}
            onClick={handleDelete}
            title={confirmDelete ? 'Click to confirm' : 'Delete'}
          >
            {confirmDelete ? '?' : '×'}
          </button>
        )}
      </div>

      <style>{`
        .food-log-entry {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          border: 1px solid #333;
          border-radius: 4px;
        }
        .entry-main {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .meal-badge {
          font-size: 0.7rem;
          text-transform: uppercase;
          padding: 0.2rem 0.4rem;
          background: #444;
          border-radius: 3px;
          color: #aaa;
        }
        .food-name {
          font-weight: 500;
          flex: 1;
        }
        .portion {
          color: #888;
          font-size: 0.9rem;
        }
        .entry-nutrients {
          display: flex;
          gap: 0.75rem;
          font-size: 0.85rem;
          color: #aaa;
        }
        .entry-actions {
          display: flex;
          gap: 0.25rem;
        }
        .edit-btn, .delete-btn {
          padding: 0.25rem 0.5rem;
          background: transparent;
          border: 1px solid #555;
          font-size: 1rem;
          cursor: pointer;
        }
        .edit-btn:hover {
          border-color: #646cff;
        }
        .delete-btn:hover {
          border-color: #f44;
          color: #f44;
        }
        .delete-btn.confirm {
          background: #f44;
          border-color: #f44;
          color: white;
        }
        .move-container {
          position: relative;
        }
        .move-btn {
          padding: 0.25rem 0.5rem;
          background: transparent;
          border: 1px solid #555;
          font-size: 1rem;
          cursor: pointer;
        }
        .move-btn:hover {
          border-color: #646cff;
        }
        .move-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: #1a1a1a;
          border: 1px solid #555;
          border-radius: 4px;
          z-index: 10;
          min-width: 100px;
        }
        .move-option {
          display: block;
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: transparent;
          border: none;
          text-align: left;
          text-transform: capitalize;
          cursor: pointer;
          color: inherit;
        }
        .move-option:hover {
          background: #333;
        }
      `}</style>
    </div>
  );
}
