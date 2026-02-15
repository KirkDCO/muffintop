import { useState, useEffect } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useTrendStats } from '../hooks/useTrendStats';
import type { TrendTimeRange, NutrientKey, DailyTarget, WeightUnit, EventDataPoint, TargetDirection } from '@muffintop/shared/types';

interface TrendChartProps {
  target?: DailyTarget | null;
  onDateSelect?: (date: string) => void;
}

const TIME_RANGES: { value: TrendTimeRange; label: string }[] = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: '3months', label: '3 Months' },
  { value: '6months', label: '6 Months' },
  { value: 'year', label: 'This Year' },
  { value: 'lastyear', label: 'Last Year' },
  { value: 'all', label: 'All Time' },
];

const ALL_NUTRIENTS: { key: NutrientKey; label: string; color: string; unit: string }[] = [
  { key: 'calories', label: 'Calories', color: '#646cff', unit: 'kcal' },
  { key: 'protein', label: 'Protein', color: '#22c55e', unit: 'g' },
  { key: 'carbs', label: 'Carbs', color: '#f59e0b', unit: 'g' },
  { key: 'totalFat', label: 'Fat', color: '#ec4899', unit: 'g' },
  { key: 'fiber', label: 'Fiber', color: '#8b5cf6', unit: 'g' },
  { key: 'addedSugar', label: 'Added Sugar', color: '#ef4444', unit: 'g' },
  { key: 'totalSugar', label: 'Sugar', color: '#f97316', unit: 'g' },
  { key: 'saturatedFat', label: 'Sat Fat', color: '#d946ef', unit: 'g' },
  { key: 'transFat', label: 'Trans Fat', color: '#a855f7', unit: 'g' },
  { key: 'cholesterol', label: 'Cholesterol', color: '#6366f1', unit: 'mg' },
  { key: 'sodium', label: 'Sodium', color: '#0ea5e9', unit: 'mg' },
  { key: 'potassium', label: 'Potassium', color: '#14b8a6', unit: 'mg' },
  { key: 'calcium', label: 'Calcium', color: '#84cc16', unit: 'mg' },
  { key: 'iron', label: 'Iron', color: '#78716c', unit: 'mg' },
  { key: 'vitaminA', label: 'Vit A', color: '#fb923c', unit: 'mcg' },
  { key: 'vitaminC', label: 'Vit C', color: '#facc15', unit: 'mcg' },
  { key: 'vitaminD', label: 'Vit D', color: '#fbbf24', unit: 'mcg' },
];

const WEIGHT_COLOR = '#06b6d4'; // Cyan for weight

// Custom clickable label for event markers
interface EventMarkerLabelProps {
  viewBox?: { x: number; y: number };
  color: string;
  date: string;
  description: string;
  onClick?: (date: string) => void;
}

function EventMarkerLabel({ viewBox, color, date, description, onClick }: EventMarkerLabelProps) {
  if (!viewBox) return null;
  const { x } = viewBox;

  return (
    <g
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={() => onClick?.(date)}
    >
      <circle
        cx={x}
        cy={8}
        r={6}
        fill={color}
      />
      <title>{description} - Click to go to {date}</title>
    </g>
  );
}

export function TrendChart({ target, onDateSelect }: TrendChartProps) {
  // Filter nutrients to only those with targets set
  const availableNutrients = ALL_NUTRIENTS.filter((n) => {
    if (!target) return false;
    if (n.key === 'calories') {
      return target.basalCalories > 0;
    }
    return target.nutrientTargets[n.key]?.value != null;
  });

  const [timeRange, setTimeRange] = useState<TrendTimeRange>('month');
  const [selectedNutrient, setSelectedNutrient] = useState<NutrientKey | null>(null);
  const [showWeight, setShowWeight] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  // Set default nutrient when available nutrients change
  useEffect(() => {
    if (availableNutrients.length > 0) {
      if (!selectedNutrient || !availableNutrients.find((n) => n.key === selectedNutrient)) {
        setSelectedNutrient(availableNutrients[0].key);
      }
    } else {
      setSelectedNutrient(null);
    }
  }, [target, availableNutrients.length]);

  const { data, isLoading } = useTrendStats({
    timeRange,
    nutrient: selectedNutrient || 'calories'
  });

  const nutrientConfig = availableNutrients.find((n) => n.key === selectedNutrient) || ALL_NUTRIENTS[0];

  if (isLoading) {
    return (
      <div className="trend-chart loading">
        <p>Loading trend data...</p>
      </div>
    );
  }

  // Don't show chart if no targets are set
  if (availableNutrients.length === 0 || !selectedNutrient) {
    return null;
  }

  if (!data) {
    return (
      <div className="trend-chart empty">
        <p>No trend data available</p>
      </div>
    );
  }

  // Determine preferred weight display unit from most recent entry
  const preferredWeightUnit: WeightUnit =
    data.weightData.length > 0
      ? data.weightData[data.weightData.length - 1].weightUnit
      : 'kg';
  const fromKg = (kg: number): number =>
    preferredWeightUnit === 'lb' ? kg / 0.453592 : kg;

  // Merge nutrient and weight data for the chart
  // Weight is sparse, so we need to align it with nutrient dates
  const weightByDate = new Map(data.weightData.map((w) => [w.date, w]));

  // Map activity calories by date for dynamic target calculation
  const activityByDate = new Map((data.activityData || []).map((a) => [a.date, a.activityCalories]));

  // For longer time ranges, aggregate data to reduce clutter
  const shouldAggregate = data.nutrientData.length > 60;

  let chartData: Array<{
    date: string;
    displayDate: string;
    nutrient: number | null;
    weight: number | null;
    weightUnit: string | null;
    target: number | null;
    fillBase: number | null;
    overFill: number | null;
    underFill: number | null;
  }>;

  // Only show target line for calories (not other nutrients)
  const showDynamicTarget = selectedNutrient === 'calories' && data.nutrientTarget;

  if (shouldAggregate) {
    // Weekly aggregation for longer periods
    const weeklyData = new Map<string, {
      nutrientSum: number;
      nutrientCount: number;
      weights: typeof data.weightData;
      activitySum: number;
      activityCount: number;
    }>();

    for (const point of data.nutrientData) {
      const d = new Date(point.date);
      // Get week start (Sunday)
      const weekStart = new Date(d);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, { nutrientSum: 0, nutrientCount: 0, weights: [], activitySum: 0, activityCount: 0 });
      }
      const week = weeklyData.get(weekKey)!;
      if (point.value !== null) {
        week.nutrientSum += point.value;
        week.nutrientCount++;
      }
      // Include activity for this day in weekly average
      const activity = activityByDate.get(point.date) || 0;
      week.activitySum += activity;
      week.activityCount++;
    }

    // Add weight data to weeks
    for (const w of data.weightData) {
      const d = new Date(w.date);
      const weekStart = new Date(d);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyData.get(weekKey)?.weights.push(w);
    }

    chartData = Array.from(weeklyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, week]) => {
        const lastWeight = week.weights[week.weights.length - 1];
        const avgActivity = week.activityCount > 0 ? week.activitySum / week.activityCount : 0;
        const nutrientVal = week.nutrientCount > 0 ? Math.round(week.nutrientSum / week.nutrientCount) : null;
        const targetVal = showDynamicTarget
          ? Math.round(data.nutrientTarget! + avgActivity)
          : (data.nutrientTarget ?? null);

        // Compute fill values for area between actual and target
        let fillBase: number | null = null;
        let overFill: number | null = null;
        let underFill: number | null = null;

        if (nutrientVal !== null && targetVal !== null) {
          if (nutrientVal > targetVal) {
            fillBase = targetVal;
            overFill = nutrientVal - targetVal;
            underFill = 0;
          } else {
            fillBase = nutrientVal;
            overFill = 0;
            underFill = targetVal - nutrientVal;
          }
        }

        return {
          date: weekStart,
          displayDate: new Date(weekStart + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          nutrient: nutrientVal,
          weight: lastWeight ? fromKg(lastWeight.weightKg) : null,
          weightUnit: lastWeight?.weightUnit ?? null,
          target: showDynamicTarget ? Math.round(data.nutrientTarget! + avgActivity) : targetVal,
          fillBase,
          overFill,
          underFill,
        };
      });
  } else {
    chartData = data.nutrientData.map((point) => {
      const w = weightByDate.get(point.date);
      const activity = activityByDate.get(point.date) || 0;
      const nutrientVal = point.value !== null ? Math.round(point.value) : null;
      const targetVal = showDynamicTarget
        ? Math.round(data.nutrientTarget! + activity)
        : (data.nutrientTarget ?? null);

      // Compute fill values for area between actual and target
      let fillBase: number | null = null;
      let overFill: number | null = null;
      let underFill: number | null = null;

      if (nutrientVal !== null && targetVal !== null) {
        if (nutrientVal > targetVal) {
          fillBase = targetVal;
          overFill = nutrientVal - targetVal;
          underFill = 0;
        } else {
          fillBase = nutrientVal;
          overFill = 0;
          underFill = targetVal - nutrientVal;
        }
      }

      return {
        date: point.date,
        displayDate: new Date(point.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        nutrient: nutrientVal,
        weight: w ? fromKg(w.weightKg) : null,
        weightUnit: w?.weightUnit ?? null,
        target: showDynamicTarget ? Math.round(data.nutrientTarget! + activity) : targetVal,
        fillBase,
        overFill,
        underFill,
      };
    });
  }

  // Calculate Y-axis domains
  const nutrientValues = chartData.map((d) => d.nutrient).filter((v): v is number => v !== null);
  const targetValues = chartData.map((d) => d.target).filter((v): v is number => v !== null);
  const weightValues = chartData.map((d) => d.weight).filter((v): v is number => v !== null);

  const nutrientMax = Math.max(...nutrientValues, ...targetValues, data.nutrientTarget || 0) * 1.1;
  const nutrientMin = 0;

  // Weight axis: show ±10% range around the data
  const weightMin = weightValues.length > 0 ? Math.min(...weightValues) * 0.95 : 50;
  const weightMax = weightValues.length > 0 ? Math.max(...weightValues) * 1.05 : 100;

  const hasWeightData = weightValues.length > 0;

  // Map events to chart display dates for matching with X-axis
  const eventData = data.eventData || [];
  const eventsByDisplayDate = new Map<string, EventDataPoint[]>();
  for (const event of eventData) {
    const displayDate = new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!eventsByDisplayDate.has(displayDate)) {
      eventsByDisplayDate.set(displayDate, []);
    }
    eventsByDisplayDate.get(displayDate)!.push(event);
  }
  const hasEventData = eventData.length > 0;

  return (
    <div className="trend-chart">
      <div className="chart-header">
        <h3>Trends</h3>
        <div className="chart-controls">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TrendTimeRange)}
            className="time-range-select"
          >
            {TIME_RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <select
            value={selectedNutrient}
            onChange={(e) => setSelectedNutrient(e.target.value as NutrientKey)}
            className="nutrient-select"
          >
            {availableNutrients.map((n) => (
              <option key={n.key} value={n.key}>
                {n.label}
              </option>
            ))}
          </select>

          <label className="weight-toggle">
            <input
              type="checkbox"
              checked={showWeight}
              onChange={(e) => setShowWeight(e.target.checked)}
            />
            Weight
          </label>

          <label className="weight-toggle">
            <input
              type="checkbox"
              checked={showEvents}
              onChange={(e) => setShowEvents(e.target.checked)}
            />
            Events
          </label>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={chartData} margin={{ top: 10, right: showWeight && hasWeightData ? 50 : 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis
              dataKey="displayDate"
              tick={{ fill: '#888', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#333' }}
              interval={shouldAggregate ? 0 : 'preserveStartEnd'}
              angle={shouldAggregate && chartData.length > 20 ? -45 : 0}
              textAnchor={shouldAggregate && chartData.length > 20 ? 'end' : 'middle'}
              height={shouldAggregate && chartData.length > 20 ? 60 : 30}
            />

            {/* Left Y-axis for nutrient */}
            <YAxis
              yAxisId="nutrient"
              orientation="left"
              domain={[nutrientMin, Math.ceil(nutrientMax / 100) * 100]}
              tick={{ fill: nutrientConfig.color, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={45}
            />

            {/* Right Y-axis for weight (only if showing weight and has data) */}
            {showWeight && hasWeightData && (
              <YAxis
                yAxisId="weight"
                orientation="right"
                domain={[Math.floor(weightMin), Math.ceil(weightMax)]}
                tick={{ fill: WEIGHT_COLOR, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
            )}

            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: 4,
              }}
              labelStyle={{ color: '#888' }}
              formatter={(value, name) => {
                if (value === null || value === undefined) return ['No data', name];
                const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                if (name === 'weight') {
                  return [`${numValue.toFixed(1)} ${preferredWeightUnit}`, 'Weight'];
                }
                return [`${Math.round(numValue)} ${nutrientConfig.unit}`, nutrientConfig.label];
              }}
              content={({ active, payload, label }) => {
                if (!active || !payload) return null;
                const eventsOnDate = eventsByDisplayDate.get(label as string);
                return (
                  <div style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: 4,
                    padding: '0.5rem',
                  }}>
                    <p style={{ color: '#888', margin: '0 0 0.25rem 0', fontSize: '0.85rem' }}>{label}</p>
                    {payload
                      .filter((entry) => !['fillBase', 'overFill', 'underFill'].includes(entry.dataKey as string))
                      .map((entry, index) => {
                      if (entry.value === null || entry.value === undefined) return null;
                      const value = typeof entry.value === 'number' ? entry.value : parseFloat(String(entry.value));
                      let displayValue: string;
                      let displayName: string;
                      if (entry.dataKey === 'weight') {
                        displayValue = `${value.toFixed(1)} ${preferredWeightUnit}`;
                        displayName = 'Weight';
                      } else if (entry.dataKey === 'target') {
                        displayValue = `${Math.round(value)} ${nutrientConfig.unit}`;
                        displayName = 'Target';
                      } else {
                        displayValue = `${Math.round(value)} ${nutrientConfig.unit}`;
                        displayName = nutrientConfig.label;
                      }
                      return (
                        <p key={index} style={{ color: entry.color, margin: '0.125rem 0', fontSize: '0.85rem' }}>
                          {displayName}: {displayValue}
                        </p>
                      );
                    })}
                    {showEvents && eventsOnDate && eventsOnDate.length > 0 && (
                      <div style={{ marginTop: '0.5rem', borderTop: '1px solid #444', paddingTop: '0.25rem' }}>
                        {eventsOnDate.map((event, idx) => (
                          <p key={idx} style={{ color: event.color, margin: '0.125rem 0', fontSize: '0.85rem' }}>
                            {'\u25CF'} {event.description}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {/* Conditional fill between actual and target */}
            {/* Colors are direction-aware and colorblind-friendly (blue/orange) */}
            {/* For 'max' targets: over=bad (orange), under=good (blue) */}
            {/* For 'min' targets: over=good (blue), under=bad (orange) */}
            {data.nutrientTarget && (() => {
              const direction: TargetDirection = data.nutrientTargetDirection || 'max';
              const goodColor = 'rgba(96, 165, 250, 0.6)';  // blue-400
              const badColor = 'rgba(251, 146, 60, 0.6)';   // orange-400
              const overColor = direction === 'max' ? badColor : goodColor;
              const underColor = direction === 'max' ? goodColor : badColor;
              return (
                <>
                  <Area
                    yAxisId="nutrient"
                    type="monotone"
                    dataKey="fillBase"
                    stackId="targetFill"
                    stroke="none"
                    fill="transparent"
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                  <Area
                    yAxisId="nutrient"
                    type="monotone"
                    dataKey="overFill"
                    stackId="targetFill"
                    stroke="none"
                    fill={overColor}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                  <Area
                    yAxisId="nutrient"
                    type="monotone"
                    dataKey="underFill"
                    stackId="targetFill"
                    stroke="none"
                    fill={underColor}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </>
              );
            })()}

            {/* Nutrient line */}
            <Line
              yAxisId="nutrient"
              type="monotone"
              dataKey="nutrient"
              stroke={nutrientConfig.color}
              strokeWidth={2}
              connectNulls={false}
              dot={false}
            />

            {/* Dynamic target line (basal + activity calories) */}
            {showDynamicTarget && (
              <Line
                yAxisId="nutrient"
                type="monotone"
                dataKey="target"
                stroke="#888"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={true}
                isAnimationActive={false}
              />
            )}

            {/* Static target reference line for non-calorie nutrients */}
            {data.nutrientTarget && selectedNutrient !== 'calories' && (
              <ReferenceLine
                yAxisId="nutrient"
                y={data.nutrientTarget}
                stroke="#888"
                strokeDasharray="5 5"
                strokeWidth={1}
              />
            )}

            {/* Weight line (only actual data points) */}
            {showWeight && hasWeightData && (
              <Line
                yAxisId="weight"
                type="monotone"
                dataKey="weight"
                stroke={WEIGHT_COLOR}
                strokeWidth={2}
                dot={{ fill: WEIGHT_COLOR, r: 4 }}
                activeDot={{ fill: '#fff', r: 5 }}
                connectNulls={true}
              />
            )}

            {/* Event markers as vertical lines */}
            {showEvents && hasEventData && Array.from(eventsByDisplayDate.entries()).map(([displayDate, events]) => {
              // Use the first event's color for the line
              const primaryEvent = events[0];
              const eventDescriptions = events.map(e => e.description).join(', ');
              return (
                <ReferenceLine
                  key={`event-${displayDate}`}
                  yAxisId="nutrient"
                  x={displayDate}
                  stroke={primaryEvent.color}
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  label={
                    <EventMarkerLabel
                      color={primaryEvent.color}
                      date={primaryEvent.date}
                      description={eventDescriptions}
                      onClick={onDateSelect}
                    />
                  }
                  ifOverflow="extendDomain"
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend">
        <span className="legend-item" style={{ color: nutrientConfig.color }}>
          {'\u25A0'} {nutrientConfig.label}
        </span>
        {data.nutrientTarget && (
          <span className="legend-item" style={{ color: '#888' }}>
            {'- - -'} Target {selectedNutrient === 'calories' ? '(basal + activity)' : `(${data.nutrientTarget} ${nutrientConfig.unit})`}
          </span>
        )}
        {showWeight && hasWeightData && (
          <span className="legend-item" style={{ color: WEIGHT_COLOR }}>
            {'\u25CF'} Weight
          </span>
        )}
        {showWeight && !hasWeightData && (
          <span className="legend-item muted">No weight data in this period</span>
        )}
        {showEvents && hasEventData && (
          <span className="legend-item" style={{ color: '#888' }}>
            {'\u2502'} Events ({eventData.length})
          </span>
        )}
        {showEvents && !hasEventData && (
          <span className="legend-item muted">No events in this period</span>
        )}
      </div>

      <style>{`
        .trend-chart {
          padding: 1rem;
          background: #252525;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }
        .trend-chart.loading,
        .trend-chart.empty {
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
        .chart-controls {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .time-range-select,
        .nutrient-select {
          padding: 0.35rem 0.5rem;
          font-size: 0.85rem;
          background: #1a1a1a;
          border: 1px solid #444;
          border-radius: 4px;
          color: white;
        }
        .weight-toggle {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.85rem;
          color: #888;
          cursor: pointer;
        }
        .weight-toggle input {
          cursor: pointer;
        }
        .chart-container {
          width: 100%;
        }
        .chart-legend {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 0.5rem;
          font-size: 0.8rem;
          flex-wrap: wrap;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .legend-item.muted {
          color: #555;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
