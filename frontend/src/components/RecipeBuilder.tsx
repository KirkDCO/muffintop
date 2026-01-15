import { useState } from 'react';
import { FoodSearch } from './FoodSearch';
import { IngredientRow } from './IngredientRow';
import type { FoodSummary, CustomFoodSummary, RecipeSummary, CreateRecipeInput, CreateRecipeIngredientInput } from '@muffintop/shared/types';

interface RecipeIngredientDraft extends CreateRecipeIngredientInput {
  foodName: string;
}

interface RecipeBuilderProps {
  initialName?: string;
  initialServings?: number;
  initialIsShared?: boolean;
  initialIngredients?: RecipeIngredientDraft[];
  onSave: (input: CreateRecipeInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RecipeBuilder({
  initialName = '',
  initialServings = 1,
  initialIsShared = false,
  initialIngredients = [],
  onSave,
  onCancel,
  isLoading = false,
}: RecipeBuilderProps) {
  const [name, setName] = useState(initialName);
  const [servings, setServings] = useState(initialServings);
  const [isShared, setIsShared] = useState(initialIsShared);
  const [ingredients, setIngredients] = useState<RecipeIngredientDraft[]>(initialIngredients);
  const [showFoodSearch, setShowFoodSearch] = useState(false);

  const handleAddFood = (food: FoodSummary) => {
    setIngredients([
      ...ingredients,
      {
        foodId: food.fdcId,
        quantityGrams: 100,
        foodName: food.description,
      },
    ]);
    setShowFoodSearch(false);
  };

  const handleAddCustomFood = (customFood: CustomFoodSummary) => {
    setIngredients([
      ...ingredients,
      {
        customFoodId: customFood.id,
        quantityGrams: 1, // Custom foods use servings, not grams - default to 1 serving
        foodName: customFood.name,
      },
    ]);
    setShowFoodSearch(false);
  };

  const handleAddRecipe = (recipe: RecipeSummary) => {
    setIngredients([
      ...ingredients,
      {
        ingredientRecipeId: recipe.id,
        quantityGrams: 1, // Recipes use servings - default to 1 serving
        foodName: recipe.name,
      },
    ]);
    setShowFoodSearch(false);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handlePortionChange = (index: number, grams: number, displayQuantity: string) => {
    setIngredients(
      ingredients.map((ing, i) =>
        i === index
          ? { ...ing, quantityGrams: grams, displayQuantity: displayQuantity || undefined }
          : ing
      )
    );
  };

  const handleSubmit = () => {
    if (!name.trim() || ingredients.length === 0) return;

    const input: CreateRecipeInput = {
      name: name.trim(),
      servings,
      isShared,
      ingredients: ingredients.map((ing) => ({
        foodId: ing.foodId,
        customFoodId: ing.customFoodId,
        ingredientRecipeId: ing.ingredientRecipeId,
        quantityGrams: ing.quantityGrams,
        displayQuantity: ing.displayQuantity,
      })),
    };
    onSave(input);
  };

  const isValid = name.trim().length > 0 && ingredients.length > 0 && servings >= 1;

  return (
    <div className="recipe-builder">
      <div className="builder-form">
        <div className="form-row">
          <label>
            Recipe Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter recipe name"
              className="name-input"
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Number of Servings
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              step="1"
              className="servings-input"
            />
          </label>
        </div>

        <div className="form-row checkbox-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
            />
            Share this recipe with all users
          </label>
        </div>

        <div className="ingredients-section">
          <h4>Ingredients ({ingredients.length})</h4>

          {ingredients.length === 0 ? (
            <p className="no-ingredients">No ingredients added yet</p>
          ) : (
            <div className="ingredients-list">
              {ingredients.map((ing, index) => (
                <IngredientRow
                  key={index}
                  foodName={ing.foodName}
                  fdcId={ing.foodId}
                  customFoodId={ing.customFoodId}
                  ingredientRecipeId={ing.ingredientRecipeId}
                  quantityGrams={ing.quantityGrams}
                  displayQuantity={ing.displayQuantity}
                  onPortionChange={(grams, display) => handlePortionChange(index, grams, display)}
                  onRemove={() => handleRemoveIngredient(index)}
                />
              ))}
            </div>
          )}

          {showFoodSearch ? (
            <div className="food-search-container">
              <div className="search-header">
                <span>Search for ingredient</span>
                <button className="cancel-search" onClick={() => setShowFoodSearch(false)}>
                  Cancel
                </button>
              </div>
              <FoodSearch
                onSelect={handleAddFood}
                onSelectCustomFood={handleAddCustomFood}
                onSelectRecipe={handleAddRecipe}
                includeRecipes={true}
                placeholder="Search for an ingredient..."
              />
            </div>
          ) : (
            <button className="add-ingredient-btn" onClick={() => setShowFoodSearch(true)}>
              + Add Ingredient
            </button>
          )}
        </div>
      </div>

      <div className="builder-actions">
        <button className="cancel-btn" onClick={onCancel} disabled={isLoading}>
          Cancel
        </button>
        <button className="save-btn" onClick={handleSubmit} disabled={!isValid || isLoading}>
          {isLoading ? 'Saving...' : 'Save Recipe'}
        </button>
      </div>

      <style>{`
        .recipe-builder {
          padding: 1.5rem;
          border: 1px solid #444;
          border-radius: 8px;
        }
        .builder-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .form-row label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #888;
        }
        .name-input {
          padding: 0.75rem;
          font-size: 1rem;
        }
        .servings-input {
          padding: 0.75rem;
          width: 100px;
        }
        .checkbox-row {
          margin-top: -0.5rem;
        }
        .checkbox-label {
          display: flex;
          flex-direction: row !important;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          color: #ccc;
        }
        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .ingredients-section h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: #ccc;
        }
        .no-ingredients {
          color: #666;
          text-align: center;
          padding: 1rem;
          border: 1px dashed #333;
          border-radius: 4px;
        }
        .ingredients-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .food-search-container {
          border: 1px solid #444;
          border-radius: 4px;
          padding: 1rem;
          background: #222;
        }
        .search-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .cancel-search {
          background: #333;
          border: none;
          padding: 0.4rem 0.75rem;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .add-ingredient-btn {
          width: 100%;
          padding: 0.75rem;
          background: #333;
          border: 1px dashed #555;
          color: #888;
          cursor: pointer;
          font-size: 0.95rem;
        }
        .add-ingredient-btn:hover {
          border-color: #666;
          color: #ccc;
        }
        .builder-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #333;
        }
        .cancel-btn {
          padding: 0.75rem 1.5rem;
          background: #333;
          border: none;
          cursor: pointer;
        }
        .save-btn {
          padding: 0.75rem 1.5rem;
          background: #646cff;
          color: white;
          border: none;
          cursor: pointer;
        }
        .save-btn:hover:not(:disabled) {
          background: #535bf2;
        }
        .save-btn:disabled, .cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

// Export for use in TblspImport
export type { RecipeIngredientDraft };
