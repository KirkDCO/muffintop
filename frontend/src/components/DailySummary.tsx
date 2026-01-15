import type { FoodLogEntry, DailyTarget, NutrientKey } from '@muffintop/shared/types';
import { useNutrients } from '../providers/NutrientProvider';
import { ProgressIndicator } from './ProgressIndicator';

interface DailySummaryProps {
  entries: FoodLogEntry[];
  date: string;
  target?: DailyTarget | null;
  activityCalories?: number;
}

export function DailySummary({
  entries,
  date,
  target,
  activityCalories = 0,
}: DailySummaryProps) {
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

  // Calculate calorie budget if target exists
  const calorieTarget = target ? target.basalCalories + activityCalories : null;

  // Get nutrients that have targets set
  const nutrientsWithTargets = target
    ? visibleNutrients.filter(
        (key) => key !== 'calories' && target.nutrientTargets[key as NutrientKey]
      )
    : [];

  return (
    <div className="daily-summary">
      <h3>{formatDate(date)}</h3>

      {/* Calorie progress if target set */}
      {calorieTarget && (
        <div className="calorie-section">
          <ProgressIndicator
            label="Calories"
            current={totals.calories || 0}
            target={calorieTarget}
            direction="max"
            unit=" kcal"
          />
          {activityCalories > 0 && (
            <p className="budget-breakdown">
              Base: {target!.basalCalories} + Activity: {activityCalories} ={' '}
              {calorieTarget} kcal budget
            </p>
          )}
        </div>
      )}

      {/* Nutrient progress indicators */}
      {nutrientsWithTargets.length > 0 && (
        <div className="nutrient-progress">
          {nutrientsWithTargets.map((key) => {
            const targetInfo = target!.nutrientTargets[key as NutrientKey]!;
            const def = getNutrientDef(key);
            return (
              <ProgressIndicator
                key={key}
                label={def.displayName}
                current={totals[key] || 0}
                target={targetInfo.value}
                direction={targetInfo.direction}
                unit={def.unit}
              />
            );
          })}
        </div>
      )}

      {/* Basic stats */}
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
        .calorie-section {
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #333;
        }
        .budget-breakdown {
          margin: 0.5rem 0 0 0;
          font-size: 0.8rem;
          color: #888;
        }
        .nutrient-progress {
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #333;
        }
        .summary-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .stat {
          display: flex;
          flex-direction: column;
        }
        .stat-value {
          font-size: 1.25rem;
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
