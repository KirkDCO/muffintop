import type { RecentFood, CreateFoodLogInput, MealCategory } from '@muffintop/shared/types';

interface HideRecentFoodInput {
  foodId?: number;
  customFoodId?: number;
  recipeId?: number;
}

interface RecentFoodsProps {
  recentFoods: RecentFood[];
  date: string;
  mealCategory: MealCategory;
  onQuickLog: (input: CreateFoodLogInput) => void;
  onHide?: (input: HideRecentFoodInput) => void;
}

export function RecentFoods({ recentFoods, date, mealCategory, onQuickLog, onHide }: RecentFoodsProps) {
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
      portionDescription: `${food.typicalPortionGrams.toFixed(0)}g`,
    });
  };

  const handleHide = (e: React.MouseEvent, food: RecentFood) => {
    e.stopPropagation();
    if (onHide) {
      onHide({
        foodId: food.foodId ?? undefined,
        customFoodId: food.customFoodId ?? undefined,
        recipeId: food.recipeId ?? undefined,
      });
    }
  };

  return (
    <div className="recent-foods">
      <h4>Quick Add (Recent)</h4>
      <div className="recent-list">
        {recentFoods.slice(0, 12).map((food, idx) => (
          <div
            key={`${food.foodId}-${food.customFoodId}-${food.recipeId}-${idx}`}
            className="recent-item"
          >
            <button
              className="recent-item-content"
              onClick={() => handleQuickLog(food)}
              title={`Add ${food.typicalPortionGrams.toFixed(0)}g of ${food.name}`}
            >
              <span className="recent-name">{food.name}</span>
              <span className="recent-portion">{food.typicalPortionGrams.toFixed(0)}g</span>
            </button>
            {onHide && (
              <button
                className="recent-hide-btn"
                onClick={(e) => handleHide(e, food)}
                title="Remove from quick add"
              >
                x
              </button>
            )}
          </div>
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
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
        }
        .recent-item {
          position: relative;
          display: flex;
          min-width: 0;
          overflow: hidden;
          background: #333;
          border: 1px solid #444;
          border-radius: 4px;
        }
        .recent-item:hover {
          border-color: #646cff;
        }
        .recent-item-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
          min-width: 0;
          padding: 0.5rem 0.75rem;
          padding-right: 1.5rem;
          background: transparent;
          border: none;
          font-size: 0.85rem;
          text-align: left;
          cursor: pointer;
          color: inherit;
        }
        .recent-name {
          font-weight: 500;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .recent-portion {
          color: #888;
          font-size: 0.75rem;
        }
        .recent-hide-btn {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 16px;
          height: 16px;
          padding: 0;
          background: transparent;
          border: none;
          font-size: 0.7rem;
          color: #666;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
        }
        .recent-hide-btn:hover {
          background: #444;
          color: #f44;
        }
      `}</style>
    </div>
  );
}
