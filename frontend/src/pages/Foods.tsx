import { useState } from 'react';
import { FoodSearch } from '../components/FoodSearch';
import { FoodDetail } from '../components/FoodDetail';
import type { FoodSummary } from '@feedbag/shared/types';

export function Foods() {
  const [selectedFood, setSelectedFood] = useState<FoodSummary | null>(null);

  return (
    <div className="foods-page">
      <h1>Browse Foods</h1>
      <p className="subtitle">Search the USDA food database for nutritional information</p>

      <div className="foods-layout">
        <div className="search-panel">
          <FoodSearch onSelect={setSelectedFood} />
        </div>

        {selectedFood && (
          <div className="detail-panel">
            <FoodDetail
              fdcId={selectedFood.fdcId}
              onClose={() => setSelectedFood(null)}
            />
          </div>
        )}
      </div>

      <style>{`
        .foods-page h1 {
          margin-bottom: 0.5rem;
        }
        .subtitle {
          color: #888;
          margin-bottom: 1.5rem;
        }
        .foods-layout {
          display: flex;
          gap: 2rem;
        }
        .search-panel {
          flex: 1;
          min-width: 0;
        }
        .detail-panel {
          flex-shrink: 0;
        }
        @media (max-width: 800px) {
          .foods-layout {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
