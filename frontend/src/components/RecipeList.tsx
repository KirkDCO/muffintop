import type { RecipeSummary } from '@muffintop/shared/types';
import { RecipeCard } from './RecipeCard';

interface RecipeListProps {
  recipes: RecipeSummary[];
  currentUserId?: number;
  onSelect?: (recipe: RecipeSummary) => void;
  onEdit?: (recipe: RecipeSummary) => void;
  onDelete?: (recipe: RecipeSummary) => void;
  emptyMessage?: string;
}

export function RecipeList({
  recipes,
  currentUserId,
  onSelect,
  onEdit,
  onDelete,
  emptyMessage = 'No recipes found',
}: RecipeListProps) {
  if (recipes.length === 0) {
    return <p className="empty-message">{emptyMessage}</p>;
  }

  return (
    <div className="recipe-list">
      <ul className="recipe-items">
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <RecipeCard
              recipe={recipe}
              currentUserId={currentUserId}
              onClick={onSelect ? () => onSelect(recipe) : undefined}
              onEdit={onEdit ? () => onEdit(recipe) : undefined}
              onDelete={onDelete ? () => onDelete(recipe) : undefined}
            />
          </li>
        ))}
      </ul>

      <style>{`
        .recipe-list {
          width: 100%;
        }
        .recipe-items {
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
