import { useState } from 'react';
import { FoodSearch } from './FoodSearch';
import { FoodDetail } from './FoodDetail';
import { RecipeDetail } from './RecipeDetail';
import { CustomFoodDetail } from './CustomFoodDetail';
import type { FoodSummary, RecipeSummary, CustomFoodSummary, MealCategory, CreateFoodLogInput } from '@muffintop/shared/types';

function getMealByTime(): MealCategory {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 9) return 'breakfast';
  if (hour >= 11 && hour < 13) return 'lunch';
  if (hour >= 18 && hour < 20) return 'dinner';
  return 'snack';
}

type SelectedItem =
  | { type: 'food'; data: FoodSummary }
  | { type: 'recipe'; data: RecipeSummary }
  | { type: 'customFood'; data: CustomFoodSummary }
  | null;

interface LogFoodModalProps {
  date: string;
  onLog: (input: CreateFoodLogInput) => void;
  onClose: () => void;
}

export function LogFoodModal({ date, onLog, onClose }: LogFoodModalProps) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [mealCategory, setMealCategory] = useState<MealCategory>(getMealByTime);

  const handleLogFood = (portionGrams: number, portionAmount: number, portionDescription: string) => {
    if (selectedItem?.type !== 'food') return;

    onLog({
      logDate: date,
      mealCategory,
      foodId: selectedItem.data.fdcId,
      portionAmount,
      portionGrams,
      portionDescription,
    });
  };

  const handleLogRecipe = (servings: number, portionDescription: string) => {
    if (selectedItem?.type !== 'recipe') return;

    onLog({
      logDate: date,
      mealCategory,
      recipeId: selectedItem.data.id,
      portionAmount: servings,
      portionGrams: servings, // portionGrams stores servings for recipes
      portionDescription,
    });
  };

  const handleLogCustomFood = (servings: number, portionDescription?: string) => {
    if (selectedItem?.type !== 'customFood') return;

    onLog({
      logDate: date,
      mealCategory,
      customFoodId: selectedItem.data.id,
      portionAmount: servings,
      portionGrams: servings, // portionGrams stores servings for custom foods
      portionDescription: portionDescription || `${servings} serving${servings !== 1 ? 's' : ''}`,
    });
  };

  const handleSelectFood = (food: FoodSummary) => {
    setSelectedItem({ type: 'food', data: food });
  };

  const handleSelectRecipe = (recipe: RecipeSummary) => {
    setSelectedItem({ type: 'recipe', data: recipe });
  };

  const handleSelectCustomFood = (customFood: CustomFoodSummary) => {
    setSelectedItem({ type: 'customFood', data: customFood });
  };

  const handleClearSelection = () => {
    setSelectedItem(null);
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
          {selectedItem?.type === 'food' ? (
            <FoodDetail
              fdcId={selectedItem.data.fdcId}
              onLog={handleLogFood}
              onClose={handleClearSelection}
            />
          ) : selectedItem?.type === 'recipe' ? (
            <RecipeDetail
              recipeId={selectedItem.data.id}
              onLog={handleLogRecipe}
              onClose={handleClearSelection}
            />
          ) : selectedItem?.type === 'customFood' ? (
            <CustomFoodDetail
              customFoodId={selectedItem.data.id}
              onLog={handleLogCustomFood}
              onClose={handleClearSelection}
            />
          ) : (
            <FoodSearch
              onSelect={handleSelectFood}
              onSelectRecipe={handleSelectRecipe}
              onSelectCustomFood={handleSelectCustomFood}
              placeholder="Search for a food, recipe, or custom food to log..."
            />
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
