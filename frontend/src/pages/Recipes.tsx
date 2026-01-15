import { useState, useEffect } from 'react';
import {
  useRecipes,
  useRecipe,
  useCreateRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
} from '../hooks/useRecipes';
import { useTblspStatus } from '../hooks/useTblsp';
import { useUser } from '../providers/UserProvider';
import { RecipeList } from '../components/RecipeList';
import { RecipeBuilder } from '../components/RecipeBuilder';
import { RecipeDetail } from '../components/RecipeDetail';
import { TblspImport } from '../components/TblspImport';
import type { RecipeSummary, CreateRecipeInput, Recipe } from '@muffintop/shared/types';

type ViewMode = 'list' | 'create' | 'edit' | 'detail' | 'import';

export function Recipes() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { currentUser } = useUser();
  const currentUserId = currentUser?.id;

  const { data: recipesData, isLoading } = useRecipes(
    debouncedQuery ? { search: debouncedQuery } : undefined
  );
  const { data: selectedRecipe } = useRecipe(selectedRecipeId);
  const { data: tblspStatus } = useTblspStatus();

  const createMutation = useCreateRecipe();
  const updateMutation = useUpdateRecipe();
  const deleteMutation = useDeleteRecipe();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectRecipe = (recipe: RecipeSummary) => {
    setSelectedRecipeId(recipe.id);
    setViewMode('detail');
  };

  const handleEditRecipe = (recipe: RecipeSummary) => {
    setSelectedRecipeId(recipe.id);
    setViewMode('edit');
  };

  const handleDeleteRecipe = (recipe: RecipeSummary) => {
    setDeleteError(null);
    deleteMutation.mutate(recipe.id, {
      onError: (error) => {
        const message = (error as { message?: string })?.message
          || 'Failed to delete recipe';
        setDeleteError(message);
        setTimeout(() => setDeleteError(null), 5000);
      },
    });
  };

  const handleCreate = async (input: CreateRecipeInput) => {
    await createMutation.mutateAsync(input);
    setViewMode('list');
  };

  const handleUpdate = (input: CreateRecipeInput) => {
    if (!selectedRecipeId) return;
    updateMutation.mutate(
      { recipeId: selectedRecipeId, input },
      { onSuccess: () => setViewMode('list') }
    );
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedRecipeId(null);
  };

  // Build initial ingredients for edit mode from selected recipe
  const getInitialIngredients = (recipe: Recipe) => {
    return recipe.ingredients.map((ing) => ({
      foodId: ing.foodId ?? undefined,
      customFoodId: ing.customFoodId ?? undefined,
      quantityGrams: ing.quantityGrams,
      displayQuantity: ing.displayQuantity ?? undefined,
      foodName: ing.foodName,
    }));
  };

  return (
    <div className="recipes-page">
      {viewMode === 'list' && (
        <>
          <div className="page-header">
            <h1>Recipes</h1>
            <div className="header-actions">
              <button className="primary-btn" onClick={() => setViewMode('create')}>
                + New Recipe
              </button>
              {tblspStatus?.available && (
                <button className="secondary-btn" onClick={() => setViewMode('import')}>
                  Import from tblsp
                </button>
              )}
            </div>
          </div>

          <div className="search-row">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your recipes..."
              className="search-input"
            />
          </div>

          {deleteError && (
            <div className="error-message">{deleteError}</div>
          )}

          {isLoading ? (
            <p className="status">Loading recipes...</p>
          ) : (
            <RecipeList
              recipes={recipesData?.recipes || []}
              currentUserId={currentUserId}
              onSelect={handleSelectRecipe}
              onEdit={handleEditRecipe}
              onDelete={handleDeleteRecipe}
              emptyMessage={
                debouncedQuery
                  ? `No recipes found for "${debouncedQuery}"`
                  : 'No recipes yet. Create one or import from tblsp!'
              }
            />
          )}
        </>
      )}

      {viewMode === 'create' && (
        <>
          <div className="page-header">
            <h1>Create Recipe</h1>
          </div>
          <RecipeBuilder
            onSave={handleCreate}
            onCancel={handleBack}
            isLoading={createMutation.isPending}
          />
        </>
      )}

      {viewMode === 'edit' && selectedRecipe && (
        <>
          <div className="page-header">
            <h1>Edit Recipe</h1>
          </div>
          <RecipeBuilder
            initialName={selectedRecipe.name}
            initialServings={selectedRecipe.servings}
            initialIsShared={selectedRecipe.isShared}
            initialIngredients={getInitialIngredients(selectedRecipe)}
            onSave={handleUpdate}
            onCancel={handleBack}
            isLoading={updateMutation.isPending}
          />
        </>
      )}

      {viewMode === 'detail' && selectedRecipeId && (
        <>
          <div className="page-header">
            <button className="back-btn" onClick={handleBack}>
              ← Back to Recipes
            </button>
          </div>
          <RecipeDetail
            recipeId={selectedRecipeId}
            currentUserId={currentUserId}
            onEdit={() => setViewMode('edit')}
            onClose={handleBack}
          />
        </>
      )}

      {viewMode === 'import' && (
        <>
          <div className="page-header">
            <button className="back-btn" onClick={handleBack}>
              ← Back to Recipes
            </button>
          </div>
          <TblspImport onComplete={handleBack} onCancel={handleBack} />
        </>
      )}

      <style>{`
        .recipes-page h1 {
          margin: 0;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .header-actions {
          display: flex;
          gap: 0.75rem;
        }
        .primary-btn {
          padding: 0.75rem 1.25rem;
          background: #646cff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.95rem;
        }
        .primary-btn:hover {
          background: #535bf2;
        }
        .secondary-btn {
          padding: 0.75rem 1.25rem;
          background: #333;
          color: #ccc;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.95rem;
        }
        .secondary-btn:hover {
          background: #444;
        }
        .back-btn {
          background: transparent;
          border: none;
          color: #888;
          cursor: pointer;
          padding: 0;
          font-size: 0.95rem;
        }
        .back-btn:hover {
          color: #ccc;
        }
        .search-row {
          margin-bottom: 1rem;
        }
        .search-input {
          width: 100%;
          padding: 0.75rem;
          font-size: 1rem;
        }
        .status {
          color: #888;
        }
        .error-message {
          padding: 0.75rem 1rem;
          margin-bottom: 1rem;
          background: #4a1c1c;
          border: 1px solid #8b3333;
          border-radius: 4px;
          color: #ff9999;
        }
      `}</style>
    </div>
  );
}
