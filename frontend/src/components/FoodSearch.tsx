import { useState, useEffect } from 'react';
import { useFoodSearch } from '../hooks/useFoodSearch';
import { useRecipes } from '../hooks/useRecipes';
import { useCustomFoods } from '../hooks/useCustomFoods';
import { FoodCard } from './FoodCard';
import { RecipeCard } from './RecipeCard';
import { CustomFoodCard } from './CustomFoodCard';
import type { FoodSummary, RecipeSummary, CustomFoodSummary } from '@muffintop/shared/types';

interface FoodSearchProps {
  onSelect?: (food: FoodSummary) => void;
  onSelectRecipe?: (recipe: RecipeSummary) => void;
  onSelectCustomFood?: (customFood: CustomFoodSummary) => void;
  includeRecipes?: boolean;
  includeCustomFoods?: boolean;
  placeholder?: string;
}

export function FoodSearch({
  onSelect,
  onSelectRecipe,
  onSelectCustomFood,
  includeRecipes = true,
  includeCustomFoods = true,
  placeholder = 'Search for a food...',
}: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [dataType, setDataType] = useState<'all' | 'foundation' | 'sr_legacy' | 'branded'>('all');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, error } = useFoodSearch(
    debouncedQuery.length >= 2 ? { q: debouncedQuery, dataType } : null
  );

  const { data: recipesData, isLoading: recipesLoading } = useRecipes(
    includeRecipes && debouncedQuery.length >= 2 ? { search: debouncedQuery, limit: 10 } : undefined
  );

  const { data: customFoodsData, isLoading: customFoodsLoading } = useCustomFoods(
    includeCustomFoods && debouncedQuery.length >= 2 ? { search: debouncedQuery, limit: 10 } : undefined
  );

  const recipes = includeRecipes ? recipesData?.recipes || [] : [];
  const customFoods = includeCustomFoods ? customFoodsData?.customFoods || [] : [];
  const showRecipes = includeRecipes && recipes.length > 0 && onSelectRecipe;
  const showCustomFoods = includeCustomFoods && customFoods.length > 0 && onSelectCustomFood;
  const isSearching = isLoading || (includeRecipes && recipesLoading) || (includeCustomFoods && customFoodsLoading);

  return (
    <div className="food-search">
      <div className="search-controls">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="search-input"
        />
        <select
          value={dataType}
          onChange={(e) => setDataType(e.target.value as typeof dataType)}
          className="filter-select"
        >
          <option value="all">All Sources</option>
          <option value="foundation">Foundation</option>
          <option value="sr_legacy">SR Legacy</option>
          <option value="branded">Branded</option>
        </select>
      </div>

      {isSearching && <div className="search-status">Searching...</div>}
      {error && <div className="search-error">Search failed. Please try again.</div>}

      {showRecipes && (
        <div className="recipe-results">
          <h4>Your Recipes</h4>
          <ul className="recipe-list">
            {recipes.map((recipe) => (
              <li key={recipe.id}>
                <RecipeCard recipe={recipe} onClick={() => onSelectRecipe(recipe)} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {showCustomFoods && (
        <div className="custom-food-results">
          <h4>Your Custom Foods</h4>
          <ul className="custom-food-list">
            {customFoods.map((customFood) => (
              <li key={customFood.id}>
                <CustomFoodCard customFood={customFood} onClick={() => onSelectCustomFood(customFood)} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {data && (
        <div className="search-results">
          {(showRecipes || showCustomFoods) && <h4>USDA Foods</h4>}
          {data.foods.length === 0 && debouncedQuery.length >= 2 && !showRecipes && !showCustomFoods ? (
            <p className="no-results">No foods found for "{debouncedQuery}"</p>
          ) : (
            <>
              {data.total > 0 && (
                <p className="results-count">
                  Showing {data.foods.length} of {data.total} results
                </p>
              )}
              <ul className="food-list">
                {data.foods.map((food) => (
                  <li key={food.fdcId}>
                    <FoodCard food={food} onClick={() => onSelect?.(food)} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <style>{`
        .food-search {
          width: 100%;
        }
        .search-controls {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .search-input {
          flex: 1;
          padding: 0.75rem;
          font-size: 1rem;
        }
        .filter-select {
          padding: 0.75rem;
          font-size: 1rem;
          min-width: 150px;
        }
        .search-status, .search-error, .no-results, .results-count {
          padding: 0.5rem 0;
          color: #888;
        }
        .search-error {
          color: #f44;
        }
        .food-list, .recipe-list, .custom-food-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .recipe-results, .custom-food-results {
          margin-bottom: 1.5rem;
          max-height: 300px;
          overflow-y: auto;
        }
        .recipe-results h4, .custom-food-results h4, .search-results h4 {
          margin: 0 0 0.75rem 0;
          font-size: 0.85rem;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
}
