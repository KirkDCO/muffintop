import type { CustomFoodSummary } from '@muffintop/shared/types';
import { CustomFoodCard } from './CustomFoodCard';

interface CustomFoodListProps {
  customFoods: CustomFoodSummary[];
  currentUserId?: number;
  onSelect?: (customFood: CustomFoodSummary) => void;
  onEdit?: (customFood: CustomFoodSummary) => void;
  onDelete?: (customFood: CustomFoodSummary) => void;
  emptyMessage?: string;
}

export function CustomFoodList({
  customFoods,
  currentUserId,
  onSelect,
  onEdit,
  onDelete,
  emptyMessage = 'No custom foods found',
}: CustomFoodListProps) {
  if (customFoods.length === 0) {
    return <p className="empty-message">{emptyMessage}</p>;
  }

  return (
    <div className="custom-food-list">
      <ul className="custom-food-items">
        {customFoods.map((customFood) => (
          <li key={customFood.id}>
            <CustomFoodCard
              customFood={customFood}
              currentUserId={currentUserId}
              onClick={onSelect ? () => onSelect(customFood) : undefined}
              onEdit={onEdit ? () => onEdit(customFood) : undefined}
              onDelete={onDelete ? () => onDelete(customFood) : undefined}
            />
          </li>
        ))}
      </ul>

      <style>{`
        .custom-food-list {
          width: 100%;
        }
        .custom-food-items {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .empty-message {
          color: #888;
          text-align: center;
          padding: 2rem;
        }
      `}</style>
    </div>
  );
}
