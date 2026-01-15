import { useState } from 'react';
import { useUpsertWeight } from '../hooks/useWeightMetrics';
import type { WeightUnit } from '@muffintop/shared/types';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

interface WeightLoggerProps {
  latestValue?: number | null;
  latestUnit?: WeightUnit | null;
  onLogged?: () => void;
}

export function WeightLogger({ latestValue, latestUnit, onLogged }: WeightLoggerProps) {
  const [date, setDate] = useState(getToday());
  const [weight, setWeight] = useState(latestValue?.toString() ?? '');
  const [unit, setUnit] = useState<WeightUnit>(latestUnit ?? 'lb');
  const [error, setError] = useState<string | null>(null);

  const upsertWeight = useUpsertWeight();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue < 20 || weightValue > 1000) {
      setError('Please enter a valid weight between 20 and 1000');
      return;
    }

    try {
      await upsertWeight.mutateAsync({
        metricDate: date,
        weightValue,
        weightUnit: unit,
      });
      onLogged?.();
    } catch (err) {
      console.error('Failed to log weight:', err);
      setError('Failed to save weight. Please try again.');
    }
  };

  return (
    <form className="weight-logger" onSubmit={handleSubmit}>
      <div className="weight-inputs">
        <div className="input-group">
          <label htmlFor="weight-date">Date</label>
          <input
            id="weight-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={getToday()}
          />
        </div>

        <div className="input-group">
          <label htmlFor="weight-value">Weight</label>
          <div className="weight-value-input">
            <input
              id="weight-value"
              type="number"
              step="0.1"
              min="20"
              max="1000"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter weight"
            />
            <select value={unit} onChange={(e) => setUnit(e.target.value as WeightUnit)}>
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={upsertWeight.isPending || !weight}>
          {upsertWeight.isPending ? 'Saving...' : 'Log Weight'}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      <style>{`
        .weight-logger {
          margin-top: 1rem;
        }
        .weight-inputs {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
          flex-wrap: wrap;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .input-group label {
          font-size: 0.85rem;
          color: #888;
        }
        .input-group input[type="date"],
        .input-group input[type="number"] {
          padding: 0.5rem;
          background: #252525;
          border: 1px solid #444;
          border-radius: 4px;
          color: white;
          font-size: 1rem;
        }
        .weight-value-input {
          display: flex;
          gap: 0.5rem;
        }
        .weight-value-input input {
          width: 100px;
        }
        .weight-value-input select {
          padding: 0.5rem;
          background: #252525;
          border: 1px solid #444;
          border-radius: 4px;
          color: white;
          font-size: 1rem;
        }
        .weight-logger button {
          padding: 0.5rem 1rem;
          background: #646cff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .weight-logger button:hover:not(:disabled) {
          background: #535bf2;
        }
        .weight-logger button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .error-message {
          color: #f44336;
          margin-top: 0.5rem;
          font-size: 0.9rem;
        }
      `}</style>
    </form>
  );
}
