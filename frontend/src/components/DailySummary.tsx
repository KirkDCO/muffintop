import type { FoodLogEntry } from '@muffintop/shared/types';
import { useNutrients } from '../providers/NutrientProvider';

interface DailySummaryProps {
  entries: FoodLogEntry[];
  date: string;
}

export function DailySummary({ entries, date }: DailySummaryProps) {
  const { visibleNutrients, getNutrientDef } = useNutrients();

  // Sum all nutrients
  const totals = entries.reduce(
    (acc, entry) => {
      for (const key of visibleNutrients) {
        acc[key] = (acc[key] || 0) + (entry.nutrients[key] || 0);
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="daily-summary">
      <h3>{formatDate(date)}</h3>
      <div className="summary-stats">
        {visibleNutrients.map((key) => {
          const def = getNutrientDef(key);
          const value = totals[key] || 0;
          return (
            <div key={key} className="stat">
              <span className="stat-value">
                {value.toFixed(0)}
                {def.unit !== 'kcal' ? def.unit : ''}
              </span>
              <span className="stat-label">
                {def.unit === 'kcal' ? 'kcal' : def.shortName}
              </span>
            </div>
          );
        })}
      </div>
      <p className="entry-count">{entries.length} items logged</p>

      <style>{`
        .daily-summary {
          padding: 1.5rem;
          background: #252525;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }
        .daily-summary h3 {
          margin: 0 0 1rem 0;
        }
        .summary-stats {
          display: flex;
          gap: 2rem;
          margin-bottom: 0.5rem;
        }
        .stat {
          display: flex;
          flex-direction: column;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
        }
        .stat-label {
          font-size: 0.85rem;
          color: #888;
        }
        .entry-count {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
