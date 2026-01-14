import type { FoodLogEntry } from '@muffintop/shared/types';

interface DailySummaryProps {
  entries: FoodLogEntry[];
  date: string;
}

export function DailySummary({ entries, date }: DailySummaryProps) {
  const totals = entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein,
      carbs: acc.carbs + entry.carbs,
      addedSugar: acc.addedSugar + (entry.addedSugar || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, addedSugar: 0 }
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
        <div className="stat">
          <span className="stat-value">{totals.calories.toFixed(0)}</span>
          <span className="stat-label">kcal</span>
        </div>
        <div className="stat">
          <span className="stat-value">{totals.protein.toFixed(0)}g</span>
          <span className="stat-label">protein</span>
        </div>
        <div className="stat">
          <span className="stat-value">{totals.carbs.toFixed(0)}g</span>
          <span className="stat-label">carbs</span>
        </div>
        <div className="stat">
          <span className="stat-value">{totals.addedSugar.toFixed(0)}g</span>
          <span className="stat-label">sugar</span>
        </div>
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
