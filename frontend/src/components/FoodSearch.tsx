import { useState, useEffect } from 'react';
import { useFoodSearch } from '../hooks/useFoodSearch';
import { FoodCard } from './FoodCard';
import type { FoodSummary } from '@muffintop/shared/types';

interface FoodSearchProps {
  onSelect?: (food: FoodSummary) => void;
  placeholder?: string;
}

export function FoodSearch({ onSelect, placeholder = 'Search for a food...' }: FoodSearchProps) {
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

      {isLoading && <div className="search-status">Searching...</div>}
      {error && <div className="search-error">Search failed. Please try again.</div>}

      {data && (
        <div className="search-results">
          {data.foods.length === 0 && debouncedQuery.length >= 2 ? (
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
        .food-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
}
