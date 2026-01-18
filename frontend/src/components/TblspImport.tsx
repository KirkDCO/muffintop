import { useState, useEffect } from 'react';
import {
  useTblspStatus,
  useTblspRecipes,
  useTblspRecipe,
  type TblspRecipeSummary,
} from '../hooks/useTblsp';
import { useImportTblspRecipe } from '../hooks/useRecipes';
import { FoodSearch } from './FoodSearch';
import { PortionSelector } from './PortionSelector';
import type { FoodSummary, CustomFoodSummary, RecipeSummary, ImportTblspRecipeInput, ImportIngredientMapping } from '@muffintop/shared/types';

interface IngredientMapping {
  originalText: string;
  food: FoodSummary | null;
  customFood: CustomFoodSummary | null;
  recipe: RecipeSummary | null;
  quantityGrams: number; // For USDA: grams. For custom/recipe: servings.
  displayQuantity: string;
  skipped: boolean;
}

type ImportStep = 'browse' | 'map' | 'review';

interface TblspImportProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function TblspImport({ onComplete, onCancel }: TblspImportProps) {
  const [step, setStep] = useState<ImportStep>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [recipeName, setRecipeName] = useState('');
  const [servings, setServings] = useState(1);
  const [mappings, setMappings] = useState<IngredientMapping[]>([]);
  const [activeMappingIndex, setActiveMappingIndex] = useState<number | null>(null);
  const [initializedRecipeId, setInitializedRecipeId] = useState<number | null>(null);

  const { data: status } = useTblspStatus();
  const { data: recipesData, isLoading: recipesLoading } = useTblspRecipes(
    debouncedQuery ? { search: debouncedQuery } : undefined
  );
  const { data: selectedRecipe, isLoading: recipeLoading } = useTblspRecipe(selectedRecipeId);
  const importMutation = useImportTblspRecipe();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initialize mappings when recipe is loaded (only once per recipe)
  useEffect(() => {
    if (selectedRecipe && selectedRecipeId !== initializedRecipeId) {
      setInitializedRecipeId(selectedRecipeId);
      setRecipeName(selectedRecipe.title);
      setMappings(
        selectedRecipe.ingredients.map((ing) => ({
          originalText: ing.originalText,
          food: null,
          customFood: null,
          recipe: null,
          quantityGrams: 100, // Default for USDA, will be 1 for custom/recipe
          displayQuantity: ing.quantity || '',
          skipped: false,
        }))
      );
    }
  }, [selectedRecipe, selectedRecipeId, initializedRecipeId]);

  const handleSelectRecipe = (recipe: TblspRecipeSummary) => {
    setSelectedRecipeId(recipe.id);
    setStep('map');
  };

  const handleMapFood = (index: number, food: FoodSummary) => {
    setMappings(
      mappings.map((m, i) =>
        i === index ? { ...m, food, customFood: null, recipe: null, quantityGrams: 100, skipped: false } : m
      )
    );
    setActiveMappingIndex(null);
  };

  const handleMapCustomFood = (index: number, customFood: CustomFoodSummary) => {
    setMappings(
      mappings.map((m, i) =>
        i === index ? { ...m, food: null, customFood, recipe: null, quantityGrams: 1, skipped: false } : m
      )
    );
    setActiveMappingIndex(null);
  };

  const handleMapRecipe = (index: number, recipe: RecipeSummary) => {
    setMappings(
      mappings.map((m, i) =>
        i === index ? { ...m, food: null, customFood: null, recipe, quantityGrams: 1, skipped: false } : m
      )
    );
    setActiveMappingIndex(null);
  };

  const handleSkipIngredient = (index: number) => {
    setMappings(
      mappings.map((m, i) =>
        i === index ? { ...m, skipped: true, food: null, customFood: null, recipe: null } : m
      )
    );
    setActiveMappingIndex(null);
  };

  const handleUpdatePortion = (index: number, grams: number, displayQuantity: string) => {
    setMappings(
      mappings.map((m, i) =>
        i === index ? { ...m, quantityGrams: grams, displayQuantity } : m
      )
    );
  };

  const mappedCount = mappings.filter((m) => m.food !== null || m.customFood !== null || m.recipe !== null).length;
  const skippedCount = mappings.filter((m) => m.skipped).length;
  const canProceed = mappedCount > 0 && mappedCount + skippedCount === mappings.length;

  const handleSubmit = () => {
    if (!selectedRecipeId) return;

    const ingredientMappings: ImportIngredientMapping[] = mappings
      .filter((m) => (m.food !== null || m.customFood !== null || m.recipe !== null) && !m.skipped)
      .map((m) => ({
        originalText: m.originalText,
        foodId: m.food?.fdcId,
        customFoodId: m.customFood?.id,
        ingredientRecipeId: m.recipe?.id,
        quantityGrams: m.quantityGrams,
        displayQuantity: m.displayQuantity || undefined,
      }));

    const input: ImportTblspRecipeInput = {
      tblspRecipeId: selectedRecipeId,
      name: recipeName,
      servings,
      ingredients: ingredientMappings,
    };

    importMutation.mutate(input, {
      onSuccess: () => onComplete(),
    });
  };

  if (!status?.available) {
    return (
      <div className="tblsp-import">
        <div className="unavailable">
          <h3>tblsp Not Available</h3>
          <p>The tblsp recipe database is not configured or not accessible.</p>
          <button onClick={onCancel}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="tblsp-import">
      <div className="import-header">
        <h2>Import from tblsp</h2>
        <div className="step-indicator">
          <span className={step === 'browse' ? 'active' : ''}>1. Browse</span>
          <span className={step === 'map' ? 'active' : ''}>2. Map</span>
          <span className={step === 'review' ? 'active' : ''}>3. Review</span>
        </div>
      </div>

      {step === 'browse' && (
        <div className="browse-step">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tblsp recipes..."
            className="search-input"
          />

          {recipesLoading && <p className="status">Searching...</p>}

          {recipesData && (
            <ul className="recipe-list">
              {recipesData.recipes.length === 0 ? (
                <li className="no-results">No recipes found</li>
              ) : (
                recipesData.recipes.map((recipe) => (
                  <li key={recipe.id} onClick={() => handleSelectRecipe(recipe)}>
                    <span className="recipe-title">{recipe.title}</span>
                    {recipe.rating && (
                      <span className="recipe-rating">{'★'.repeat(recipe.rating)}</span>
                    )}
                  </li>
                ))
              )}
            </ul>
          )}

          <div className="step-actions">
            <button onClick={onCancel}>Cancel</button>
          </div>
        </div>
      )}

      {step === 'map' && (
        <div className="map-step">
          {recipeLoading ? (
            <p className="status">Loading recipe...</p>
          ) : (
            <>
              <div className="recipe-name-row">
                <label>
                  Recipe Name:
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    className="name-input"
                  />
                </label>
                <label>
                  Servings:
                  <input
                    type="number"
                    value={servings}
                    onChange={(e) => setServings(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    className="servings-input"
                  />
                </label>
              </div>

              <h4>Map Ingredients to Foods</h4>
              <p className="mapping-status">
                {mappedCount} of {mappings.length} mapped
                {skippedCount > 0 && ` (${skippedCount} skipped)`}
              </p>

              <div className="mappings-list">
                {mappings.map((mapping, index) => (
                  <div key={index} className={`mapping-row ${mapping.skipped ? 'skipped' : ''}`}>
                    <div className="original-ingredient">
                      <span className="original-text">{mapping.originalText}</span>
                    </div>

                    {mapping.skipped ? (
                      <div className="skipped-label">
                        <span>Skipped</span>
                        <button
                          className="undo-skip"
                          onClick={() =>
                            setMappings(
                              mappings.map((m, i) =>
                                i === index ? { ...m, skipped: false } : m
                              )
                            )
                          }
                        >
                          Undo
                        </button>
                      </div>
                    ) : activeMappingIndex === index ? (
                      <div className="search-section">
                        <FoodSearch
                          onSelect={(food) => handleMapFood(index, food)}
                          onSelectCustomFood={(customFood) => handleMapCustomFood(index, customFood)}
                          onSelectRecipe={(recipe) => handleMapRecipe(index, recipe)}
                          includeRecipes={true}
                          placeholder="Search for matching food..."
                        />
                        <div className="search-actions">
                          <button onClick={() => handleSkipIngredient(index)}>
                            Skip this ingredient
                          </button>
                          <button onClick={() => setActiveMappingIndex(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : mapping.food ? (
                      <div className="mapped-food">
                        <span className="food-name">{mapping.food.description}</span>
                        <PortionSelector
                          fdcId={mapping.food.fdcId}
                          initialValue={mapping.quantityGrams}
                          initialDisplay={mapping.displayQuantity}
                          onChange={(value, display) => handleUpdatePortion(index, value, display)}
                        />
                        <button
                          className="change-btn"
                          onClick={() => setActiveMappingIndex(index)}
                        >
                          Change
                        </button>
                      </div>
                    ) : mapping.customFood ? (
                      <div className="mapped-food">
                        <span className="food-name">{mapping.customFood.name}</span>
                        <PortionSelector
                          customFoodId={mapping.customFood.id}
                          initialValue={mapping.quantityGrams}
                          initialDisplay={mapping.displayQuantity}
                          onChange={(value, display) => handleUpdatePortion(index, value, display)}
                        />
                        <button
                          className="change-btn"
                          onClick={() => setActiveMappingIndex(index)}
                        >
                          Change
                        </button>
                      </div>
                    ) : mapping.recipe ? (
                      <div className="mapped-food">
                        <span className="food-name">{mapping.recipe.name}</span>
                        <PortionSelector
                          ingredientRecipeId={mapping.recipe.id}
                          initialValue={mapping.quantityGrams}
                          initialDisplay={mapping.displayQuantity}
                          onChange={(value, display) => handleUpdatePortion(index, value, display)}
                        />
                        <button
                          className="change-btn"
                          onClick={() => setActiveMappingIndex(index)}
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="unmapped">
                        <button
                          className="map-btn"
                          onClick={() => setActiveMappingIndex(index)}
                        >
                          Map to Food
                        </button>
                        <button
                          className="skip-btn"
                          onClick={() => handleSkipIngredient(index)}
                        >
                          Skip
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="step-actions">
                <button onClick={() => setStep('browse')}>Back</button>
                <button onClick={onCancel}>Cancel</button>
                <button
                  className="primary"
                  disabled={!canProceed}
                  onClick={() => setStep('review')}
                >
                  Review
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 'review' && (
        <div className="review-step">
          <h3>{recipeName}</h3>
          <p>{servings} serving{servings !== 1 ? 's' : ''}</p>

          <h4>Ingredients ({mappedCount})</h4>
          <ul className="review-ingredients">
            {mappings
              .filter((m) => (m.food || m.customFood || m.recipe) && !m.skipped)
              .map((m, i) => (
                <li key={i}>
                  <span className="food-name">
                    {m.food ? m.food.description : m.customFood ? m.customFood.name : m.recipe!.name}
                  </span>
                  <span className="qty">
                    {m.customFood || m.recipe
                      ? `${m.quantityGrams} serving(s)${m.displayQuantity && ` (${m.displayQuantity})`}`
                      : `${m.quantityGrams}g${m.displayQuantity && ` (${m.displayQuantity})`}`
                    }
                  </span>
                </li>
              ))}
          </ul>

          {skippedCount > 0 && (
            <>
              <h4>Skipped ({skippedCount})</h4>
              <ul className="skipped-ingredients">
                {mappings
                  .filter((m) => m.skipped)
                  .map((m, i) => (
                    <li key={i}>{m.originalText}</li>
                  ))}
              </ul>
            </>
          )}

          <div className="step-actions">
            <button onClick={() => setStep('map')}>Back</button>
            <button onClick={onCancel}>Cancel</button>
            <button
              className="primary"
              onClick={handleSubmit}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? 'Importing...' : 'Import Recipe'}
            </button>
          </div>

          {importMutation.isError && (
            <p className="error">Failed to import recipe. Please try again.</p>
          )}
        </div>
      )}

      <style>{`
        .tblsp-import {
          max-width: 700px;
          margin: 0 auto;
        }
        .import-header {
          margin-bottom: 1.5rem;
        }
        .import-header h2 {
          margin: 0 0 1rem 0;
        }
        .step-indicator {
          display: flex;
          gap: 1.5rem;
        }
        .step-indicator span {
          color: #666;
        }
        .step-indicator span.active {
          color: #646cff;
          font-weight: 500;
        }
        .unavailable {
          text-align: center;
          padding: 2rem;
        }
        .unavailable p {
          color: #888;
          margin-bottom: 1rem;
        }
        .search-input, .name-input {
          width: 100%;
          padding: 0.75rem;
          font-size: 1rem;
          margin-bottom: 1rem;
        }
        .servings-input {
          width: 80px;
          padding: 0.5rem;
          margin-left: 0.5rem;
        }
        .recipe-name-row {
          display: flex;
          gap: 2rem;
          align-items: flex-end;
          margin-bottom: 1.5rem;
        }
        .recipe-name-row label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .recipe-name-row label:first-child {
          flex: 1;
        }
        .status {
          color: #888;
        }
        .recipe-list {
          list-style: none;
          padding: 0;
          margin: 0;
          max-height: 400px;
          overflow-y: auto;
        }
        .recipe-list li {
          padding: 0.75rem;
          border: 1px solid #333;
          border-radius: 4px;
          margin-bottom: 0.5rem;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .recipe-list li:hover {
          border-color: #646cff;
        }
        .recipe-list li.no-results {
          color: #888;
          cursor: default;
          border: none;
        }
        .recipe-title {
          font-weight: 500;
        }
        .recipe-rating {
          color: #fa0;
        }
        h4 {
          margin: 1rem 0 0.5rem;
          color: #888;
        }
        .mapping-status {
          color: #888;
          margin-bottom: 1rem;
        }
        .mappings-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .mapping-row {
          border: 1px solid #333;
          border-radius: 4px;
          padding: 1rem;
        }
        .mapping-row.skipped {
          opacity: 0.6;
        }
        .original-ingredient {
          margin-bottom: 0.75rem;
        }
        .original-text {
          font-style: italic;
          color: #aaa;
        }
        .mapped-food {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .mapped-food .food-name {
          flex: 1;
          min-width: 150px;
        }
        .qty-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .qty-input {
          width: 70px;
          padding: 0.4rem;
        }
        .unit {
          color: #888;
        }
        .display-input {
          width: 100px;
          padding: 0.4rem;
        }
        .change-btn, .map-btn, .skip-btn, .undo-skip {
          padding: 0.4rem 0.75rem;
          font-size: 0.85rem;
          background: #333;
          border: none;
          cursor: pointer;
        }
        .skip-btn {
          background: transparent;
          color: #888;
        }
        .unmapped {
          display: flex;
          gap: 0.5rem;
        }
        .skipped-label {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: #888;
        }
        .search-section {
          margin-top: 0.5rem;
          border-top: 1px solid #333;
          padding-top: 0.75rem;
        }
        .search-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }
        .step-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #333;
        }
        .step-actions button {
          padding: 0.75rem 1.5rem;
          background: #333;
          border: none;
          cursor: pointer;
        }
        .step-actions button.primary {
          background: #646cff;
          color: white;
        }
        .step-actions button.primary:hover:not(:disabled) {
          background: #535bf2;
        }
        .step-actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .review-ingredients, .skipped-ingredients {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .review-ingredients li {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #333;
        }
        .review-ingredients .qty {
          color: #888;
        }
        .skipped-ingredients li {
          padding: 0.5rem 0;
          color: #666;
          font-style: italic;
        }
        .error {
          color: #f44;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
}
