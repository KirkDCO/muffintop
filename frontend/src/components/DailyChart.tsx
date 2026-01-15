import { useState, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useDailyStats } from '../hooks/useDailyStats';
import type { DailyTarget, NutrientKey } from '@muffintop/shared/types';

interface DailyChartProps {
  target?: DailyTarget | null;
}

type ChartMetric = NutrientKey;

const ALL_METRICS: { key: ChartMetric; label: string; color: string }[] = [
  { key: 'calories', label: 'Calories', color: '#646cff' },
  { key: 'protein', label: 'Protein', color: '#22c55e' },
  { key: 'carbs', label: 'Carbs', color: '#f59e0b' },
  { key: 'totalFat', label: 'Fat', color: '#ec4899' },
  { key: 'fiber', label: 'Fiber', color: '#8b5cf6' },
  { key: 'addedSugar', label: 'Added Sugar', color: '#ef4444' },
  { key: 'totalSugar', label: 'Sugar', color: '#f97316' },
  { key: 'saturatedFat', label: 'Sat Fat', color: '#d946ef' },
  { key: 'transFat', label: 'Trans Fat', color: '#a855f7' },
  { key: 'cholesterol', label: 'Cholesterol', color: '#6366f1' },
  { key: 'sodium', label: 'Sodium', color: '#0ea5e9' },
  { key: 'potassium', label: 'Potassium', color: '#14b8a6' },
  { key: 'calcium', label: 'Calcium', color: '#84cc16' },
  { key: 'iron', label: 'Iron', color: '#78716c' },
  { key: 'vitaminA', label: 'Vit A', color: '#fb923c' },
  { key: 'vitaminC', label: 'Vit C', color: '#facc15' },
  { key: 'vitaminD', label: 'Vit D', color: '#fbbf24' },
];

export function DailyChart({ target }: DailyChartProps) {
  // Filter metrics to only those with targets set
  const availableMetrics = ALL_METRICS.filter((m) => {
    if (!target) return false;
    if (m.key === 'calories') {
      return target.basalCalories > 0;
    }
    return target.nutrientTargets[m.key as NutrientKey]?.value != null;
  });

  const [selectedMetric, setSelectedMetric] = useState<ChartMetric | null>(null);
  const { data, isLoading } = useDailyStats({ days: 7 });

  // Set default metric when available metrics change
  useEffect(() => {
    if (availableMetrics.length > 0) {
      if (!selectedMetric || !availableMetrics.find((m) => m.key === selectedMetric)) {
        setSelectedMetric(availableMetrics[0].key);
      }
    } else {
      setSelectedMetric(null);
    }
  }, [target, availableMetrics.length]);

  if (isLoading) {
    return (
      <div className="daily-chart loading">
        <p>Loading chart...</p>
      </div>
    );
  }

  // Don't show chart if no targets are set
  if (availableMetrics.length === 0 || !selectedMetric) {
    return null;
  }

  if (!data || data.dailySummaries.length === 0) {
    return (
      <div className="daily-chart empty">
        <p>No data to display</p>
      </div>
    );
  }

  const metric = availableMetrics.find((m) => m.key === selectedMetric)!;

  // Get target value for the selected metric
  const getTargetForDay = (activityCalories: number): number | null => {
    if (!target) return null;
    if (selectedMetric === 'calories') {
      return target.basalCalories + activityCalories;
    }
    const nutrientTarget = target.nutrientTargets[selectedMetric as NutrientKey];
    return nutrientTarget?.value ?? null;
  };

  // Transform data for the chart
  const chartData = data.dailySummaries.map((day) => {
    const date = new Date(day.date + 'T00:00:00');
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

    return {
      date: day.date,
      dayName,
      value: Math.round(day.nutrients[selectedMetric] || 0),
      target: getTargetForDay(day.activityCalories),
      entryCount: day.entryCount,
      activityCalories: day.activityCalories,
    };
  });

  // Check if any day has a target set
  const hasTarget = chartData.some((d) => d.target !== null);

  // Check if calorie target varies (due to activity)
  const hasVaryingTarget =
    selectedMetric === 'calories' &&
    hasTarget &&
    chartData.some((d, i) => i > 0 && d.target !== chartData[0].target);

  // Calculate max value for Y axis (include targets if they're higher)
  const maxValue = Math.max(
    ...chartData.map((d) => d.value),
    ...chartData.map((d) => d.target || 0)
  );
  const yAxisMax = Math.ceil(maxValue * 1.1 / 100) * 100; // Round up to nearest 100

  const getUnit = () => {
    switch (selectedMetric) {
      case 'calories':
        return 'kcal';
      case 'cholesterol':
      case 'sodium':
      case 'potassium':
      case 'calcium':
      case 'iron':
        return 'mg';
      case 'vitaminA':
      case 'vitaminC':
      case 'vitaminD':
        return 'mcg';
      default:
        return 'g';
    }
  };

  return (
    <div className="daily-chart">
      <div className="chart-header">
        <h3>Last 7 Days</h3>
        <div className="metric-selector">
          {availableMetrics.map((m) => (
            <button
              key={m.key}
              className={`metric-btn ${selectedMetric === m.key ? 'active' : ''}`}
              onClick={() => setSelectedMetric(m.key)}
              style={
                selectedMetric === m.key
                  ? { backgroundColor: m.color, borderColor: m.color }
                  : {}
              }
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis
              dataKey="dayName"
              tick={{ fill: '#888', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#333' }}
            />
            <YAxis
              domain={[0, yAxisMax]}
              tick={{ fill: '#888', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: 4,
              }}
              labelStyle={{ color: '#888' }}
              formatter={(value: number, name: string) => {
                if (name === 'target') {
                  return [`${value} ${getUnit()}`, 'Target'];
                }
                return [`${value} ${getUnit()}`, metric.label];
              }}
              labelFormatter={(_, payload) => {
                if (payload && payload[0]) {
                  const item = payload[0].payload;
                  let label = `${item.date} (${item.entryCount} items)`;
                  if (selectedMetric === 'calories' && item.activityCalories > 0) {
                    label += ` +${item.activityCalories} activity`;
                  }
                  return label;
                }
                return '';
              }}
            />
            <Bar
              dataKey="value"
              fill={metric.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            {/* Target line with markers - rendered after Bar to appear in front */}
            {hasTarget && (
              <Line
                type="monotone"
                dataKey="target"
                stroke="#888"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#888', r: 4 }}
                activeDot={{ fill: '#fff', r: 5 }}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {hasTarget && (
        <p className="chart-legend">
          Target: {chartData[0].target} {getUnit()}
          {selectedMetric === 'calories' && hasVaryingTarget && ' (varies with activity)'}
          {selectedMetric === 'calories' && !hasVaryingTarget && ` (${target!.basalCalories} base)`}
        </p>
      )}

      <style>{`
        .daily-chart {
          padding: 1rem;
          background: #252525;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }
        .daily-chart.loading,
        .daily-chart.empty {
          text-align: center;
          color: #888;
          padding: 2rem;
        }
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .chart-header h3 {
          margin: 0;
          font-size: 1rem;
        }
        .metric-selector {
          display: flex;
          gap: 0.25rem;
        }
        .metric-btn {
          padding: 0.35rem 0.6rem;
          font-size: 0.75rem;
          background: transparent;
          border: 1px solid #444;
          border-radius: 4px;
          cursor: pointer;
          color: #aaa;
          transition: all 0.15s;
        }
        .metric-btn:hover {
          border-color: #666;
          color: #fff;
        }
        .metric-btn.active {
          color: white;
        }
        .chart-container {
          width: 100%;
        }
        .chart-legend {
          margin: 0.5rem 0 0 0;
          font-size: 0.8rem;
          color: #888;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
