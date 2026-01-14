import type { RecentFood, CreateFoodLogInput, MealCategory } from '@muffintop/shared/types';

interface RecentFoodsProps {
  recentFoods: RecentFood[];
  date: string;
  mealCategory: MealCategory;
  onQuickLog: (input: CreateFoodLogInput) => void;
}

export function RecentFoods({ recentFoods, date, mealCategory, onQuickLog }: RecentFoodsProps) {
  if (recentFoods.length === 0) {
    return null;
  }

  const handleQuickLog = (food: RecentFood) => {
    onQuickLog({
      logDate: date,
      mealCategory,
      foodId: food.foodId ?? undefined,
      customFoodId: food.customFoodId ?? undefined,
      recipeId: food.recipeId ?? undefined,
      portionAmount: 1,
      portionGrams: food.typicalPortionGrams,
    });
  };

  return (
    <div className="recent-foods">
      <h4>Quick Add (Recent)</h4>
      <div className="recent-list">
        {recentFoods.slice(0, 6).map((food, idx) => (
          <button
            key={`${food.foodId}-${food.customFoodId}-${food.recipeId}-${idx}`}
            className="recent-item"
            onClick={() => handleQuickLog(food)}
            title={`Add ${food.typicalPortionGrams.toFixed(0)}g of ${food.name}`}
          >
            <span className="recent-name">{food.name}</span>
            <span className="recent-portion">{food.typicalPortionGrams.toFixed(0)}g</span>
          </button>
        ))}
      </div>

      <style>{`
        .recent-foods {
          margin-bottom: 1.5rem;
        }
        .recent-foods h4 {
          margin: 0 0 0.75rem 0;
          font-size: 0.9rem;
          color: #888;
        }
        .recent-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .recent-item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0.5rem 0.75rem;
          background: #333;
          border: 1px solid #444;
          font-size: 0.85rem;
          text-align: left;
        }
        .recent-item:hover {
          border-color: #646cff;
        }
        .recent-name {
          font-weight: 500;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .recent-portion {
          color: #888;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}
