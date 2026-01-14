import { useState } from 'react';
import { FoodSearch } from './FoodSearch';
import { FoodDetail } from './FoodDetail';
import type { FoodSummary, MealCategory, CreateFoodLogInput } from '@feedbag/shared/types';

interface LogFoodModalProps {
  date: string;
  onLog: (input: CreateFoodLogInput) => void;
  onClose: () => void;
}

export function LogFoodModal({ date, onLog, onClose }: LogFoodModalProps) {
  const [selectedFood, setSelectedFood] = useState<FoodSummary | null>(null);
  const [mealCategory, setMealCategory] = useState<MealCategory>('lunch');

  const handleLog = (portionGrams: number, portionAmount: number) => {
    if (!selectedFood) return;

    onLog({
      logDate: date,
      mealCategory,
      foodId: selectedFood.fdcId,
      portionAmount,
      portionGrams,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Log Food for {date}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="meal-selector">
          <label>Meal:</label>
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealCategory[]).map((meal) => (
            <button
              key={meal}
              className={`meal-btn ${mealCategory === meal ? 'active' : ''}`}
              onClick={() => setMealCategory(meal)}
            >
              {meal}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {selectedFood ? (
            <FoodDetail
              fdcId={selectedFood.fdcId}
              onLog={handleLog}
              onClose={() => setSelectedFood(null)}
            />
          ) : (
            <FoodSearch onSelect={setSelectedFood} placeholder="Search for a food to log..." />
          )}
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #1a1a1a;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow: auto;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #333;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
        }
        .close-btn {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
        }
        .meal-selector {
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid #333;
        }
        .meal-selector label {
          margin-right: 0.5rem;
        }
        .meal-btn {
          padding: 0.5rem 1rem;
          text-transform: capitalize;
          background: #333;
          border: none;
        }
        .meal-btn.active {
          background: #646cff;
          color: white;
        }
        .modal-body {
          padding: 1.5rem;
        }
      `}</style>
    </div>
  );
}
