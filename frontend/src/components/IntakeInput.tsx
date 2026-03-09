import { useState } from 'react';
import { useIntake, useCreateIntake, useDeleteIntake } from '../hooks/useIntake';
import { ProgressIndicator } from './ProgressIndicator';
import {
  type IntakeType,
  type IntakeTarget,
  type WaterUnit,
  mlToFlOz,
  flOzToMl,
} from '@muffintop/shared/types';

interface IntakeInputProps {
  date: string;
  intakeType: IntakeType;
  target: IntakeTarget;
  waterUnit?: WaterUnit;
}

interface QuickAddOption {
  label: string;
  amount: number; // always in mL or mg (internal units)
}

function getQuickAddOptions(intakeType: IntakeType, waterUnit: WaterUnit): QuickAddOption[] {
  if (intakeType === 'water') {
    if (waterUnit === 'fl_oz') {
      return [
        { label: '8 oz glass', amount: flOzToMl(8) },
        { label: '16 oz bottle', amount: flOzToMl(16) },
        { label: '1L bottle', amount: 1000 },
      ];
    }
    return [
      { label: '250 mL glass', amount: 250 },
      { label: '500 mL bottle', amount: 500 },
      { label: '1L bottle', amount: 1000 },
    ];
  }
  if (intakeType === 'alcohol') {
    return [
      { label: 'Beer', amount: 1 },
      { label: 'Wine (glass)', amount: 1 },
      { label: 'Shot / Cocktail', amount: 1 },
    ];
  }
  // caffeine
  return [
    { label: 'Coffee (95mg)', amount: 95 },
    { label: 'Tea (47mg)', amount: 47 },
    { label: 'Energy drink (80mg)', amount: 80 },
  ];
}

function formatAmount(amount: number, intakeType: IntakeType, waterUnit: WaterUnit): string {
  if (intakeType === 'water' && waterUnit === 'fl_oz') {
    return `${mlToFlOz(amount).toFixed(1)} fl oz`;
  }
  if (intakeType === 'alcohol') {
    return `${amount % 1 === 0 ? amount : amount.toFixed(1)} drink${amount === 1 ? '' : 's'}`;
  }
  const unit = intakeType === 'water' ? 'mL' : 'mg';
  return `${Math.round(amount)} ${unit}`;
}

function getUnit(intakeType: IntakeType, waterUnit: WaterUnit): string {
  if (intakeType === 'water') {
    return waterUnit === 'fl_oz' ? ' fl oz' : ' mL';
  }
  if (intakeType === 'alcohol') {
    return ' drinks';
  }
  return ' mg';
}

function getLabel(intakeType: IntakeType): string {
  if (intakeType === 'water') return 'Water';
  if (intakeType === 'alcohol') return 'Alcohol';
  return 'Caffeine';
}

export function IntakeInput({ date, intakeType, target, waterUnit = 'ml' }: IntakeInputProps) {
  const { data, isLoading } = useIntake(date, intakeType);
  const createIntake = useCreateIntake();
  const deleteIntake = useDeleteIntake();

  const [customAmount, setCustomAmount] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const entries = data?.entries || [];
  const total = data?.total || 0;

  const quickAddOptions = getQuickAddOptions(intakeType, waterUnit);
  const unit = getUnit(intakeType, waterUnit);

  // For display, convert total and target if water + fl_oz
  const displayTotal =
    intakeType === 'water' && waterUnit === 'fl_oz' ? mlToFlOz(total) : total;
  const displayTarget =
    intakeType === 'water' && waterUnit === 'fl_oz' ? mlToFlOz(target.value) : target.value;

  const handleQuickAdd = async (amount: number) => {
    try {
      await createIntake.mutateAsync({
        logDate: date,
        intakeType,
        amount,
      });
    } catch (err) {
      console.error('Failed to add intake:', err);
    }
  };

  const handleCustomAdd = async () => {
    const value = parseFloat(customAmount);
    if (!value || value <= 0) return;

    // Convert from display unit to internal unit
    const internalAmount =
      intakeType === 'water' && waterUnit === 'fl_oz' ? flOzToMl(value) : value;

    try {
      await createIntake.mutateAsync({
        logDate: date,
        intakeType,
        amount: internalAmount,
      });
      setCustomAmount('');
    } catch (err) {
      console.error('Failed to add intake:', err);
    }
  };

  const handleDelete = async (entryId: number) => {
    try {
      await deleteIntake.mutateAsync({ entryId, logDate: date, intakeType });
    } catch (err) {
      console.error('Failed to delete intake:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomAdd();
    }
  };

  if (isLoading) {
    return (
      <div className="intake-input loading">
        <span>Loading {getLabel(intakeType).toLowerCase()}...</span>
      </div>
    );
  }

  return (
    <div className="intake-input">
      <ProgressIndicator
        label={getLabel(intakeType)}
        current={displayTotal}
        target={displayTarget}
        direction={target.direction}
        unit={unit}
      />

      <div className="quick-add-row">
        {quickAddOptions.map((opt) => (
          <button
            key={opt.label}
            className="quick-add-btn"
            onClick={() => handleQuickAdd(opt.amount)}
            disabled={createIntake.isPending}
          >
            + {opt.label}
          </button>
        ))}
      </div>

      <div className="custom-add-row">
        <input
          type="number"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Custom${unit}`}
          min={0}
          step={intakeType === 'water' ? (waterUnit === 'fl_oz' ? 1 : 50) : intakeType === 'alcohol' ? 0.5 : 5}
          className="custom-input"
        />
        <button
          className="add-btn"
          onClick={handleCustomAdd}
          disabled={createIntake.isPending || !customAmount}
        >
          Add
        </button>
      </div>

      {entries.length > 0 && (
        <div className="history-section">
          <button
            className="history-toggle"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? 'Hide' : 'Show'} history ({entries.length} entries)
          </button>

          {showHistory && (
            <div className="history-list">
              {entries.map((entry) => (
                <div key={entry.id} className="history-entry">
                  <span className="entry-amount">
                    {formatAmount(entry.amount, intakeType, waterUnit)}
                  </span>
                  <span className="entry-time">
                    {new Date(entry.createdAt + 'Z').toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(entry.id)}
                    disabled={deleteIntake.isPending}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .intake-input {
          padding: 1rem;
          background: #252525;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        .intake-input.loading {
          color: #888;
        }
        .quick-add-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }
        .quick-add-btn {
          padding: 0.4rem 0.75rem;
          background: #333;
          border: 1px solid #555;
          border-radius: 4px;
          color: inherit;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .quick-add-btn:hover:not(:disabled) {
          background: #444;
          border-color: #888;
        }
        .quick-add-btn:disabled {
          opacity: 0.5;
        }
        .custom-add-row {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .custom-input {
          width: 100px;
          padding: 0.4rem 0.5rem;
          font-size: 0.9rem;
        }
        .add-btn {
          padding: 0.4rem 1rem;
          background: #646cff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .add-btn:hover:not(:disabled) {
          background: #535bf2;
        }
        .add-btn:disabled {
          opacity: 0.5;
        }
        .history-section {
          margin-top: 0.75rem;
          border-top: 1px solid #333;
          padding-top: 0.5rem;
        }
        .history-toggle {
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          font-size: 0.8rem;
          padding: 0;
        }
        .history-toggle:hover {
          color: #aaa;
        }
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-top: 0.5rem;
        }
        .history-entry {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: #1a1a1a;
          border-radius: 4px;
          font-size: 0.85rem;
        }
        .entry-amount {
          flex: 1;
        }
        .entry-time {
          color: #888;
        }
        .delete-btn {
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          padding: 0.25rem;
          font-size: 0.8rem;
        }
        .delete-btn:hover:not(:disabled) {
          color: #f44336;
        }
      `}</style>
    </div>
  );
}
