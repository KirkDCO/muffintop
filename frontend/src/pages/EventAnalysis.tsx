import { useState, useMemo } from 'react';
import { useEvents } from '../hooks/useEvents';
import { useEventAnalysis } from '../hooks/useEventAnalysis';
import { useNutrients } from '../providers/NutrientProvider';
import {
  ALL_NUTRIENT_KEYS,
  NUTRIENT_REGISTRY,
  INTAKE_TYPES,
  type NutrientKey,
  type AnalysisMetricKey,
  type EventSelectionMode,
  type EventAnalysisResponse,
  type UserEvent,
} from '@muffintop/shared/types';

const ALL_METRICS: AnalysisMetricKey[] = [...ALL_NUTRIENT_KEYS, ...INTAKE_TYPES];

function getMetricLabel(key: AnalysisMetricKey): string {
  if (key === 'water') return 'Water';
  if (key === 'caffeine') return 'Caffeine';
  return NUTRIENT_REGISTRY[key as NutrientKey].displayName;
}

export function EventAnalysis() {
  const { data: events } = useEvents();
  const { visibleNutrients } = useNutrients();
  const analysis = useEventAnalysis();

  // Config state
  const [selectionMode, setSelectionMode] = useState<EventSelectionMode>('description');
  const [selectedDescription, setSelectedDescription] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [lookbackDays, setLookbackDays] = useState(3);
  const [selectedMetrics, setSelectedMetrics] = useState<Set<AnalysisMetricKey>>(
    () => new Set([...visibleNutrients])
  );
  const [showAllFoods, setShowAllFoods] = useState(false);

  // Distinct descriptions from events
  const descriptions = useMemo(() => {
    if (!events) return [];
    const set = new Set(events.map((e) => e.description));
    return Array.from(set).sort();
  }, [events]);

  // Events sorted for instance picker
  const sortedEvents = useMemo(() => {
    if (!events) return [];
    return [...events].sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  }, [events]);

  const toggleMetric = (key: AnalysisMetricKey) => {
    setSelectedMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleAnalyze = () => {
    analysis.mutate({
      selectionMode,
      eventDescription: selectionMode === 'description' ? selectedDescription : undefined,
      eventId: selectionMode === 'instance' ? (selectedEventId as number) : undefined,
      startDate,
      endDate,
      lookbackDays,
      metrics: Array.from(selectedMetrics),
    });
  };

  const canSubmit =
    (selectionMode === 'description' ? !!selectedDescription : !!selectedEventId) &&
    startDate &&
    endDate &&
    !analysis.isPending;

  const result = analysis.data;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <h2>Event Analysis</h2>
      <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>
        Compare nutrient intake and food choices before events against your baseline.
      </p>

      {/* Configuration panel */}
      <div style={{ background: '#1e1e1e', borderRadius: 8, padding: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Event selection */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Event Selection
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button
              onClick={() => setSelectionMode('description')}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 4,
                border: '1px solid #555',
                background: selectionMode === 'description' ? '#646cff' : 'transparent',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              By Description
            </button>
            <button
              onClick={() => setSelectionMode('instance')}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 4,
                border: '1px solid #555',
                background: selectionMode === 'instance' ? '#646cff' : 'transparent',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              By Individual Event
            </button>
          </div>

          {selectionMode === 'description' ? (
            <select
              value={selectedDescription}
              onChange={(e) => setSelectedDescription(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 4, background: '#2a2a2a', color: 'white', border: '1px solid #555' }}
            >
              <option value="">Select event description...</option>
              {descriptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : '')}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 4, background: '#2a2a2a', color: 'white', border: '1px solid #555' }}
            >
              <option value="">Select an event...</option>
              {sortedEvents.map((e: UserEvent) => (
                <option key={e.id} value={e.id}>
                  {e.eventDate} - {e.description}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Date range */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: 4, background: '#2a2a2a', color: 'white', border: '1px solid #555' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: 4, background: '#2a2a2a', color: 'white', border: '1px solid #555' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Lookback Days</label>
            <select
              value={lookbackDays}
              onChange={(e) => setLookbackDays(Number(e.target.value))}
              style={{ padding: '0.5rem', borderRadius: 4, background: '#2a2a2a', color: 'white', border: '1px solid #555' }}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n} day{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Metrics</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {ALL_METRICS.map((key) => (
              <label
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 4,
                  background: selectedMetrics.has(key) ? '#333' : 'transparent',
                  border: '1px solid #444',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedMetrics.has(key)}
                  onChange={() => toggleMetric(key)}
                />
                {getMetricLabel(key)}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!canSubmit}
          style={{
            padding: '0.6rem 1.5rem',
            borderRadius: 4,
            background: canSubmit ? '#646cff' : '#444',
            color: 'white',
            border: 'none',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontWeight: 600,
          }}
        >
          {analysis.isPending ? 'Analyzing...' : 'Analyze'}
        </button>

        {analysis.isError && (
          <p style={{ color: '#ff6b6b', marginTop: '0.75rem' }}>
            {analysis.error?.message || 'Analysis failed'}
          </p>
        )}
      </div>

      {/* Results */}
      {result && <AnalysisResults result={result} showAllFoods={showAllFoods} setShowAllFoods={setShowAllFoods} />}
    </div>
  );
}

function AnalysisResults({
  result,
  showAllFoods,
  setShowAllFoods,
}: {
  result: EventAnalysisResponse;
  showAllFoods: boolean;
  setShowAllFoods: (v: boolean) => void;
}) {
  const { nutrientAnalysis, foodFrequencyAnalysis } = result;
  const eventCount = nutrientAnalysis?.eventCount ?? foodFrequencyAnalysis.eventCount;
  const baselineCount = nutrientAnalysis?.baselineWindowCount ?? foodFrequencyAnalysis.baselineWindowCount;

  return (
    <div>
      {/* Summary */}
      <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#1e1e1e', borderRadius: 8 }}>
        <strong>
          Analyzed {eventCount} event{eventCount !== 1 ? 's' : ''}, compared against{' '}
          {baselineCount} baseline window{baselineCount !== 1 ? 's' : ''}
        </strong>
        {baselineCount < 30 && (
          <p style={{ color: '#f0a030', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Warning: Low baseline count ({baselineCount}). Results may not be reliable.
            Consider widening your date range.
          </p>
        )}
      </div>

      {/* Nutrient comparison table */}
      {nutrientAnalysis && nutrientAnalysis.comparisons.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3>Nutrient Comparison</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #444' }}>
                  <th style={thStyle}>Metric</th>
                  <th style={thStyleRight}>Pre-Event</th>
                  <th style={thStyleRight}>Baseline</th>
                  <th style={thStyleRight}>Diff %</th>
                  <th style={thStyleRight}>Effect Size</th>
                </tr>
              </thead>
              <tbody>
                {nutrientAnalysis.comparisons.map((c) => {
                  const highlight = Math.abs(c.effectSize) > 0.5;
                  return (
                    <tr
                      key={c.key}
                      style={{
                        borderBottom: '1px solid #333',
                        color: highlight ? '#f0a030' : 'inherit',
                      }}
                    >
                      <td style={tdStyle}>
                        {c.displayName} ({c.unit})
                      </td>
                      <td style={tdStyleNum}>
                        {c.preEvent.mean.toFixed(1)} &plusmn; {c.preEvent.stddev.toFixed(1)}
                      </td>
                      <td style={tdStyleNum}>
                        {c.baseline.mean.toFixed(1)} &plusmn; {c.baseline.stddev.toFixed(1)}
                      </td>
                      <td style={tdStyleNum}>
                        {c.percentDifference > 0 ? '+' : ''}
                        {c.percentDifference.toFixed(1)}%
                      </td>
                      <td style={tdStyleNum}>{c.effectSize.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Food frequency table */}
      {foodFrequencyAnalysis.foods.length > 0 && (
        <div>
          <h3>Food Frequency</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #444' }}>
                  <th style={thStyle}>Food</th>
                  <th style={thStyle}>Pre-Event %</th>
                  <th style={thStyle}>Baseline %</th>
                  <th style={thStyle}>Difference</th>
                </tr>
              </thead>
              <tbody>
                {(showAllFoods
                  ? foodFrequencyAnalysis.foods
                  : foodFrequencyAnalysis.foods.slice(0, 20)
                ).map((f) => (
                  <tr key={f.foodName} style={{ borderBottom: '1px solid #333' }}>
                    <td style={tdStyle}>{f.foodName}</td>
                    <td style={tdStyleNum}>{(f.preEventFrequency * 100).toFixed(1)}%</td>
                    <td style={tdStyleNum}>{(f.baselineFrequency * 100).toFixed(1)}%</td>
                    <td
                      style={{
                        ...tdStyleNum,
                        color:
                          f.frequencyDifference > 0.05
                            ? '#f0a030'
                            : f.frequencyDifference < -0.05
                              ? '#4a9eff'
                              : 'inherit',
                      }}
                    >
                      {f.frequencyDifference > 0 ? '+' : ''}
                      {(f.frequencyDifference * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {foodFrequencyAnalysis.foods.length > 20 && (
            <button
              onClick={() => setShowAllFoods(!showAllFoods)}
              style={{
                marginTop: '0.75rem',
                padding: '0.4rem 0.75rem',
                borderRadius: 4,
                background: 'transparent',
                border: '1px solid #555',
                color: '#aaa',
                cursor: 'pointer',
              }}
            >
              {showAllFoods
                ? 'Show top 20'
                : `Show all ${foodFrequencyAnalysis.foods.length} foods`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.5rem 0.75rem',
  whiteSpace: 'nowrap',
};

const thStyleRight: React.CSSProperties = {
  textAlign: 'right',
  padding: '0.5rem 0.75rem',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
};

const tdStyleNum: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
};
