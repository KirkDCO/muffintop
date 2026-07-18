import { useMemo, useState } from 'react';
import { useRatedSeries } from '../hooks/useRatedSeries';
import { useEventCorrelation } from '../hooks/useEventCorrelation';
import { useNutrients } from '../providers/NutrientProvider';
import {
  ALL_NUTRIENT_KEYS,
  NUTRIENT_REGISTRY,
  INTAKE_TYPES,
  type NutrientKey,
  type AnalysisMetricKey,
  type EventCorrelationResponse,
  type MetricCorrelationGrid,
  type CorrelationCell,
  type RatingDirection,
} from '@muffintop/shared/types';

const ALL_METRICS: AnalysisMetricKey[] = [...ALL_NUTRIENT_KEYS, ...INTAKE_TYPES];
const MAX_LAG = 7;
const MAX_WINDOW = 7;

function getMetricLabel(key: AnalysisMetricKey): string {
  if (key === 'water') return 'Water';
  if (key === 'caffeine') return 'Caffeine';
  if (key === 'alcohol') return 'Alcohol';
  return NUTRIENT_REGISTRY[key as NutrientKey].displayName;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthsAgoStr(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Diverging color: orange for positive r, blue for negative, intensity by |r|. */
function cellColor(r: number): string {
  const mag = Math.min(1, Math.abs(r));
  const alpha = 0.12 + 0.88 * mag;
  return r >= 0 ? `rgba(251, 146, 60, ${alpha})` : `rgba(96, 165, 250, ${alpha})`;
}

/** Short direction-aware phrase for a metric's best correlation. */
function interpret(label: string, r: number, direction: RatingDirection, seriesName: string): string {
  if (Math.abs(r) < 0.05) return `no clear relationship with ${seriesName}`;
  const moreOfMetric = r >= 0;
  // higher rating good? positive r means higher metric ↔ higher rating
  const higherRatingIsGood = direction === 'higher_better';
  const betterWhenMore = moreOfMetric === higherRatingIsGood;
  return `more ${label} ↔ ${betterWhenMore ? 'better' : 'worse'} ${seriesName}`;
}

export function RatedCorrelation() {
  const { data: ratedSeries } = useRatedSeries();
  const { visibleNutrients } = useNutrients();
  const correlation = useEventCorrelation();

  const [series, setSeries] = useState('');
  const [startDate, setStartDate] = useState(() => monthsAgoStr(3));
  const [endDate, setEndDate] = useState(() => todayStr());
  const [normalizePerKcal, setNormalizePerKcal] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<Set<AnalysisMetricKey>>(
    () => new Set([...visibleNutrients])
  );
  const [expanded, setExpanded] = useState<AnalysisMetricKey | null>(null);
  const [showAllFoods, setShowAllFoods] = useState(false);

  const toggleMetric = (key: AnalysisMetricKey) => {
    setSelectedMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleAnalyze = () => {
    setExpanded(null);
    correlation.mutate({
      eventDescription: series,
      startDate,
      endDate,
      maxLag: MAX_LAG,
      maxWindow: MAX_WINDOW,
      metrics: Array.from(selectedMetrics),
      normalizePerKcal,
    });
  };

  const canSubmit = !!series && !!startDate && !!endDate && selectedMetrics.size > 0 && !correlation.isPending;
  const result = correlation.data;

  return (
    <div>
      <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>
        Correlate a daily 1&ndash;10 rating against your food and nutrient intake across a grid of
        time lags and averaging windows. Exploratory &mdash; use it to spot patterns, not to prove cause.
      </p>

      <div style={{ background: '#1e1e1e', borderRadius: 8, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Rated Series</label>
          <select
            value={series}
            onChange={(e) => setSeries(e.target.value)}
            style={selectStyle}
          >
            <option value="">Select a rated series…</option>
            {ratedSeries?.map((s) => (
              <option key={s.description} value={s.description}>
                {s.description} ({s.direction === 'higher_better' ? '10 = better' : '10 = worse'})
              </option>
            ))}
          </select>
          {ratedSeries && ratedSeries.length === 0 && (
            <p style={{ color: '#f0a030', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              No rated series yet. Log daily ratings from the dashboard first.
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', paddingBottom: '0.5rem' }}>
            <input
              type="checkbox"
              checked={normalizePerKcal}
              onChange={(e) => setNormalizePerKcal(e.target.checked)}
            />
            Per 1000 kcal (nutrient density)
          </label>
        </div>

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
                <input type="checkbox" checked={selectedMetrics.has(key)} onChange={() => toggleMetric(key)} />
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
          {correlation.isPending ? 'Analyzing…' : 'Analyze'}
        </button>

        {correlation.isError && (
          <p style={{ color: '#ff6b6b', marginTop: '0.75rem' }}>
            {correlation.error?.message || 'Analysis failed'}
          </p>
        )}
      </div>

      {result && (
        <CorrelationResults
          result={result}
          seriesName={series}
          expanded={expanded}
          setExpanded={setExpanded}
          showAllFoods={showAllFoods}
          setShowAllFoods={setShowAllFoods}
        />
      )}
    </div>
  );
}

function CorrelationResults({
  result,
  seriesName,
  expanded,
  setExpanded,
  showAllFoods,
  setShowAllFoods,
}: {
  result: EventCorrelationResponse;
  seriesName: string;
  expanded: AnalysisMetricKey | null;
  setExpanded: (k: AnalysisMetricKey | null) => void;
  showAllFoods: boolean;
  setShowAllFoods: (v: boolean) => void;
}) {
  const { metrics, foodComparisons, direction, ratingCount, pairedDayCount, minNThreshold } = result;
  const lowData = pairedDayCount < minNThreshold;

  return (
    <div>
      <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#1e1e1e', borderRadius: 8 }}>
        <strong>
          {ratingCount} rated day{ratingCount !== 1 ? 's' : ''}, {pairedDayCount} with food logged
        </strong>
        {result.normalizedPerKcal && (
          <span style={{ color: '#aaa', marginLeft: '0.5rem', fontSize: '0.85rem' }}>· nutrients per 1000 kcal</span>
        )}
        {lowData && (
          <p style={{ color: '#f0a030', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Few paired days ({pairedDayCount}). Correlations are unreliable &mdash; widen the date range or log more.
          </p>
        )}
        <p style={{ color: '#888', marginTop: '0.5rem', fontSize: '0.8rem' }}>
          Exploratory: many lag/window/metric combinations are tested, so some correlations will look
          strong by chance (q-values adjust for this). Same-day (lag 0) links can also run either
          direction causally.
        </p>
      </div>

      {/* Summary table */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3>Correlation Summary (best lag / window per metric)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #444' }}>
                <th style={thStyle}>Metric</th>
                <th style={thStyle}>Best lag / window</th>
                <th style={thStyleRight}>Pearson r</th>
                <th style={thStyleRight}>p</th>
                <th style={thStyleRight}>q (FDR)</th>
                <th style={thStyleRight}>Spearman &rho;</th>
                <th style={thStyleRight}>n</th>
                <th style={thStyle}>Interpretation</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => {
                const b = m.best;
                const sig = b.qValue < 0.05;
                const lowN = b.n < minNThreshold;
                return (
                  <tr
                    key={m.key}
                    style={{
                      borderBottom: '1px solid #333',
                      color: lowN ? '#777' : 'inherit',
                      fontWeight: sig ? 700 : 400,
                    }}
                  >
                    <td style={tdStyle}>{m.displayName} ({m.unit})</td>
                    <td style={tdStyle}>lag {b.lag}, {b.window}-day avg</td>
                    <td style={{ ...tdStyleNum, color: cellColor(b.pearson).replace(/[\d.]+\)$/, '1)') }}>
                      {b.pearson >= 0 ? '+' : ''}{b.pearson.toFixed(2)}
                    </td>
                    <td style={tdStyleNum}>{b.pearsonP.toFixed(3)}</td>
                    <td style={tdStyleNum}>{b.qValue.toFixed(3)}</td>
                    <td style={tdStyleNum}>{b.spearman >= 0 ? '+' : ''}{b.spearman.toFixed(2)}</td>
                    <td style={tdStyleNum}>{b.n}{lowN ? '*' : ''}</td>
                    <td style={{ ...tdStyle, color: '#aaa', fontWeight: 400 }}>
                      {interpret(m.displayName, b.pearson, direction, seriesName)}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => setExpanded(expanded === m.key ? null : m.key)}
                        style={linkButtonStyle}
                      >
                        {expanded === m.key ? 'Hide grid' : 'Grid'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.5rem' }}>
          Bold = q &lt; 0.05. * / grey = fewer than {minNThreshold} paired days (treat with caution).
        </p>
      </div>

      {/* Per-metric heatmap drill-down */}
      {expanded && (() => {
        const m = metrics.find((x) => x.key === expanded);
        if (!m) return null;
        return <Heatmap grid={m} maxLag={result.maxLag} maxWindow={result.maxWindow} minN={minNThreshold} />;
      })()}

      {/* Food comparison */}
      {foodComparisons.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3>Food choices vs. rating (same day)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #444' }}>
                  <th style={thStyle}>Food</th>
                  <th style={thStyleRight}>Days eaten</th>
                  <th style={thStyleRight}>Days not</th>
                  <th style={thStyleRight}>Avg rating eaten</th>
                  <th style={thStyleRight}>Avg rating not</th>
                  <th style={thStyleRight}>Difference</th>
                  <th style={thStyleRight}>Cohen's d</th>
                </tr>
              </thead>
              <tbody>
                {(showAllFoods ? foodComparisons : foodComparisons.slice(0, 20)).map((f) => (
                  <tr key={f.foodName} style={{ borderBottom: '1px solid #333' }}>
                    <td style={tdStyle}>{f.foodName}</td>
                    <td style={tdStyleNum}>{f.daysWith}</td>
                    <td style={tdStyleNum}>{f.daysWithout}</td>
                    <td style={tdStyleNum}>{f.meanRatingWith.toFixed(1)}</td>
                    <td style={tdStyleNum}>{f.meanRatingWithout.toFixed(1)}</td>
                    <td
                      style={{
                        ...tdStyleNum,
                        color: f.ratingDifference > 0 ? '#fb923c' : f.ratingDifference < 0 ? '#60a5fa' : 'inherit',
                      }}
                    >
                      {f.ratingDifference > 0 ? '+' : ''}{f.ratingDifference.toFixed(1)}
                    </td>
                    <td style={tdStyleNum}>{f.effectSize >= 0 ? '+' : ''}{f.effectSize.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {foodComparisons.length > 20 && (
            <button onClick={() => setShowAllFoods(!showAllFoods)} style={showAllStyle}>
              {showAllFoods ? 'Show top 20' : `Show all ${foodComparisons.length} foods`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Heatmap({
  grid,
  maxLag,
  maxWindow,
  minN,
}: {
  grid: MetricCorrelationGrid;
  maxLag: number;
  maxWindow: number;
  minN: number;
}) {
  const byKey = useMemo(() => {
    const map = new Map<string, CorrelationCell>();
    for (const c of grid.cells) map.set(`${c.lag}:${c.window}`, c);
    return map;
  }, [grid]);

  const lags = Array.from({ length: maxLag + 1 }, (_, i) => i);
  const windows = Array.from({ length: maxWindow }, (_, i) => i + 1);

  return (
    <div style={{ marginTop: '0.5rem', marginBottom: '1.5rem', padding: '1rem', background: '#1e1e1e', borderRadius: 8 }}>
      <h4 style={{ margin: '0 0 0.25rem 0' }}>
        {grid.displayName} &mdash; correlation grid
      </h4>
      <p style={{ color: '#888', fontSize: '0.8rem', margin: '0 0 0.75rem 0' }}>
        Columns = lag (days before the rating). Rows = averaging window. Cell shows Pearson r
        (orange = positive, blue = negative). Hatched = fewer than {minN} paired days.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...heatAxisTh }}>win \ lag</th>
              {lags.map((l) => (
                <th key={l} style={heatAxisTh}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {windows.map((w) => (
              <tr key={w}>
                <th style={heatAxisTh}>{w}d</th>
                {lags.map((l) => {
                  const cell = byKey.get(`${l}:${w}`);
                  if (!cell) return <td key={l} style={heatCellBase} />;
                  const lowN = cell.n < minN;
                  return (
                    <td
                      key={l}
                      title={`lag ${l}, ${w}-day avg\nr=${cell.pearson.toFixed(2)} (p=${cell.pearsonP.toFixed(3)}, q=${cell.qValue.toFixed(3)})\nρ=${cell.spearman.toFixed(2)}\nn=${cell.n}`}
                      style={{
                        ...heatCellBase,
                        background: cellColor(cell.pearson),
                        backgroundImage: lowN
                          ? 'repeating-linear-gradient(45deg, rgba(0,0,0,0.35) 0 3px, transparent 3px 6px)'
                          : undefined,
                        color: Math.abs(cell.pearson) > 0.45 ? '#111' : '#ddd',
                        opacity: lowN ? 0.55 : 1,
                        fontWeight: cell.qValue < 0.05 ? 700 : 400,
                      }}
                    >
                      {cell.pearson.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  borderRadius: 4,
  background: '#2a2a2a',
  color: 'white',
  border: '1px solid #555',
};
const inputStyle: React.CSSProperties = {
  padding: '0.5rem',
  borderRadius: 4,
  background: '#2a2a2a',
  color: 'white',
  border: '1px solid #555',
};
const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.25rem',
  fontSize: '0.9rem',
};
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' };
const thStyleRight: React.CSSProperties = { textAlign: 'right', padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' };
const tdStyle: React.CSSProperties = { padding: '0.5rem 0.75rem' };
const tdStyleNum: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
};
const linkButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #555',
  color: '#aaa',
  borderRadius: 4,
  padding: '0.2rem 0.5rem',
  cursor: 'pointer',
  fontSize: '0.8rem',
};
const showAllStyle: React.CSSProperties = {
  marginTop: '0.75rem',
  padding: '0.4rem 0.75rem',
  borderRadius: 4,
  background: 'transparent',
  border: '1px solid #555',
  color: '#aaa',
  cursor: 'pointer',
};
const heatAxisTh: React.CSSProperties = {
  padding: '0.3rem 0.45rem',
  fontSize: '0.75rem',
  color: '#888',
  textAlign: 'center',
  fontWeight: 400,
};
const heatCellBase: React.CSSProperties = {
  padding: '0.3rem 0.4rem',
  fontSize: '0.72rem',
  textAlign: 'center',
  fontVariantNumeric: 'tabular-nums',
  border: '1px solid #111',
  minWidth: 42,
};
