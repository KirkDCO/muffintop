import type { CustomFoodSummary } from '@muffintop/shared/types';

interface CustomFoodCardProps {
  customFood: CustomFoodSummary;
  currentUserId?: number;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CustomFoodCard({
  customFood,
  currentUserId,
  onClick,
  onEdit,
  onDelete,
}: CustomFoodCardProps) {
  const isOwner = currentUserId !== undefined && customFood.userId === currentUserId;
  const showActions = isOwner && (onEdit || onDelete);

  return (
    <div className="custom-food-card" onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="food-header">
        <div className="food-name-row">
          <span className="food-name">{customFood.name}</span>
          {customFood.isShared && <span className="shared-badge">Shared</span>}
        </div>
        <span className="food-meta">{Math.round(customFood.caloriesPerServing)} cal/serving</span>
      </div>
      {showActions && (
        <div className="food-actions">
          {onEdit && (
            <button
              className="action-btn edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              className="action-btn delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              Delete
            </button>
          )}
        </div>
      )}

      <style>{`
        .custom-food-card {
          padding: 1rem;
          border: 1px solid #444;
          border-radius: 8px;
          cursor: ${onClick ? 'pointer' : 'default'};
          transition: border-color 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .custom-food-card:hover {
          border-color: ${onClick ? '#646cff' : '#444'};
        }
        .food-header {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .food-name-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .food-name {
          font-weight: 500;
          font-size: 1rem;
        }
        .shared-badge {
          font-size: 0.7rem;
          padding: 0.15rem 0.4rem;
          background: #2a4a2a;
          color: #8c8;
          border-radius: 3px;
        }
        .food-meta {
          font-size: 0.85rem;
          color: #888;
        }
        .food-actions {
          display: flex;
          gap: 0.5rem;
        }
        .action-btn {
          padding: 0.4rem 0.75rem;
          font-size: 0.85rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .action-btn.edit {
          background: #333;
          color: #ccc;
        }
        .action-btn.edit:hover {
          background: #444;
        }
        .action-btn.delete {
          background: #632;
          color: #f99;
        }
        .action-btn.delete:hover {
          background: #843;
        }
      `}</style>
    </div>
  );
}
