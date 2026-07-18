import { useWeightHistory } from '../hooks/useWeightMetrics';
import { WeightLogger } from '../components/WeightLogger';
import { WeightTrend } from '../components/WeightTrend';
import { EventLogger } from '../components/EventLogger';
import { EventList } from '../components/EventList';

export function Tracking() {
  const { data: weightData } = useWeightHistory();

  return (
    <div className="tracking">
      <h1>Tracking</h1>

      <section className="tracking-section">
        <h2>Weight Tracking</h2>
        <p className="section-description">
          Track your weight over time to monitor your progress.
        </p>

        <WeightLogger
          latestValue={weightData?.latestValue}
          latestUnit={weightData?.latestUnit}
        />

        <WeightTrend />
      </section>

      <section className="tracking-section">
        <h2>Event Tracking</h2>
        <p className="section-description">
          Log discrete health events (illness, GI issues, etc.) that appear as colored markers on your
          trends chart, or record a daily 1&ndash;10 rating for a series (mood, sleep, etc.) to analyze
          under Analysis &rarr; Rated correlation.
        </p>

        <EventLogger />
        <EventList />
      </section>

      <style>{`
        .tracking {
          max-width: 800px;
          margin: 0 auto;
        }
        .tracking h1 {
          margin-bottom: 2rem;
        }
        .tracking-section {
          background: #1a1a1a;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .tracking-section h2 {
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
        }
        .section-description {
          color: #888;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
