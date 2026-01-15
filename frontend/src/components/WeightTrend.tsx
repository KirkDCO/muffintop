import { useWeightHistory, useDeleteWeight } from '../hooks/useWeightMetrics';
import type { WeightTrend as WeightTrendType, WeightEntry } from '@muffintop/shared/types';

const TREND_ICONS: Record<WeightTrendType, string> = {
  up: '\u2191', // ↑
  down: '\u2193', // ↓
  stable: '\u2194', // ↔
};

const TREND_COLORS: Record<WeightTrendType, string> = {
  up: '#f44336',
  down: '#4caf50',
  stable: '#888',
};

interface WeightTrendProps {
  limit?: number;
}

export function WeightTrend({ limit = 10 }: WeightTrendProps) {
  const { data, isLoading } = useWeightHistory();
  const deleteWeight = useDeleteWeight();

  if (isLoading) {
    return <div className="weight-trend loading">Loading weight history...</div>;
  }

  if (!data || data.entries.length === 0) {
    return (
      <div className="weight-trend empty">
        <p>No weight entries yet. Log your first weight above.</p>
      </div>
    );
  }

  const { latestValue, latestUnit, trend, entries } = data;
  const displayEntries = entries.slice(0, limit);

  const handleDelete = async (entry: WeightEntry) => {
    if (confirm(`Delete weight entry for ${entry.metricDate}?`)) {
      try {
        await deleteWeight.mutateAsync(entry.metricDate);
      } catch (err) {
        console.error('Failed to delete weight:', err);
      }
    }
  };

  return (
    <div className="weight-trend">
      <div className="current-weight">
        <div className="weight-display">
          <span className="weight-value">
            {latestValue?.toFixed(1)} {latestUnit}
          </span>
          {trend && (
            <span className="trend-indicator" style={{ color: TREND_COLORS[trend] }}>
              {TREND_ICONS[trend]}
            </span>
          )}
        </div>
        {trend && (
          <p className="trend-label">
            {trend === 'up' && 'Weight trending up'}
            {trend === 'down' && 'Weight trending down'}
            {trend === 'stable' && 'Weight stable'}
          </p>
        )}
      </div>

      <div className="weight-history">
        <h4>Recent Entries</h4>
        <div className="entries-list">
          {displayEntries.map((entry) => (
            <div key={entry.id} className="entry-row">
              <span className="entry-date">{entry.metricDate}</span>
              <span className="entry-value">
                {entry.weightValue.toFixed(1)} {entry.weightUnit}
              </span>
              <button
                className="delete-btn"
                onClick={() => handleDelete(entry)}
                disabled={deleteWeight.isPending}
                title="Delete"
              >
                x
              </button>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .weight-trend {
          margin-top: 1.5rem;
        }
        .weight-trend.loading,
        .weight-trend.empty {
          color: #888;
          text-align: center;
          padding: 1rem 0;
        }
        .current-weight {
          text-align: center;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #252525;
          border-radius: 8px;
        }
        .weight-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .weight-value {
          font-size: 2rem;
          font-weight: 600;
        }
        .trend-indicator {
          font-size: 1.5rem;
        }
        .trend-label {
          margin: 0.25rem 0 0 0;
          color: #888;
          font-size: 0.9rem;
        }
        .weight-history h4 {
          margin: 0 0 0.75rem 0;
          font-size: 0.9rem;
          color: #888;
        }
        .entries-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .entry-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          background: #252525;
          border-radius: 4px;
        }
        .entry-date {
          color: #888;
          font-size: 0.9rem;
        }
        .entry-value {
          font-weight: 500;
        }
        .delete-btn {
          padding: 0.25rem 0.5rem;
          background: transparent;
          border: 1px solid #555;
          border-radius: 4px;
          color: #888;
          cursor: pointer;
          font-size: 0.8rem;
        }
        .delete-btn:hover:not(:disabled) {
          border-color: #f44336;
          color: #f44336;
        }
        .delete-btn:disabled {
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}
