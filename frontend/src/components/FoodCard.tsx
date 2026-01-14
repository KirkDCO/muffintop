import type { FoodSummary } from '@feedbag/shared/types';

interface FoodCardProps {
  food: FoodSummary;
  onClick?: () => void;
}

export function FoodCard({ food, onClick }: FoodCardProps) {
  const formatNumber = (val: number | null) => (val !== null ? val.toFixed(1) : '—');

  return (
    <div className="food-card" onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="food-header">
        <span className="food-name">{food.description}</span>
        {food.brandOwner && <span className="brand">{food.brandOwner}</span>}
      </div>
      <div className="food-nutrients">
        <span className="nutrient">
          <strong>{formatNumber(food.calories)}</strong> kcal
        </span>
        <span className="nutrient">
          <strong>{formatNumber(food.protein)}</strong>g protein
        </span>
        <span className="nutrient">
          <strong>{formatNumber(food.carbs)}</strong>g carbs
        </span>
        <span className="nutrient">
          <strong>{formatNumber(food.addedSugar)}</strong>g sugar
        </span>
      </div>
      <span className="data-type">{food.dataType.replace('_', ' ')}</span>

      <style>{`
        .food-card {
          padding: 1rem;
          border: 1px solid #444;
          border-radius: 8px;
          cursor: ${onClick ? 'pointer' : 'default'};
          transition: border-color 0.2s;
        }
        .food-card:hover {
          border-color: ${onClick ? '#646cff' : '#444'};
        }
        .food-header {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
        }
        .food-name {
          font-weight: 500;
          font-size: 1rem;
        }
        .brand {
          font-size: 0.85rem;
          color: #888;
        }
        .food-nutrients {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        .nutrient {
          font-size: 0.9rem;
          color: #ccc;
        }
        .nutrient strong {
          color: white;
        }
        .data-type {
          font-size: 0.75rem;
          text-transform: capitalize;
          color: #666;
        }
      `}</style>
    </div>
  );
}
