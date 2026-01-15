import { useState, useEffect } from 'react';
import { useActivity, useUpsertActivity } from '../hooks/useActivity';

interface ActivityInputProps {
  date: string;
  basalCalories?: number;
}

export function ActivityInput({ date, basalCalories }: ActivityInputProps) {
  const { data, isLoading } = useActivity(date);
  const upsertActivity = useUpsertActivity();

  const currentEntry = data?.entries?.[0];
  const [calories, setCalories] = useState(currentEntry?.activityCalories || 0);
  const [isEditing, setIsEditing] = useState(false);

  // Update local state when data changes
  useEffect(() => {
    setCalories(currentEntry?.activityCalories || 0);
  }, [currentEntry]);

  const handleSave = async () => {
    try {
      await upsertActivity.mutateAsync({
        logDate: date,
        activityCalories: calories,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save activity:', err);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCalories(currentEntry?.activityCalories || 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const activityCalories = currentEntry?.activityCalories || 0;
  const totalBudget = basalCalories ? basalCalories + activityCalories : null;

  if (isLoading) {
    return (
      <div className="activity-input loading">
        <span>Loading activity...</span>
      </div>
    );
  }

  return (
    <div className="activity-input">
      {basalCalories && (
        <div className="calorie-budget-summary">
          <span className="budget-label">Daily Calorie Budget:</span>
          <span className="budget-calculation">
            {basalCalories} base + {activityCalories} activity = <strong>{totalBudget} kcal</strong>
          </span>
        </div>
      )}
      <div className="activity-header">
        <span className="activity-label">Activity Burned Today</span>
        {isEditing ? (
          <div className="activity-edit">
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(parseInt(e.target.value, 10) || 0)}
              onKeyDown={handleKeyDown}
              min={0}
              max={10000}
              autoFocus
            />
            <span className="unit">kcal</span>
            <button
              onClick={handleSave}
              disabled={upsertActivity.isPending}
              className="save-btn"
            >
              {upsertActivity.isPending ? '...' : 'Save'}
            </button>
            <button onClick={handleCancel} className="cancel-btn">
              Cancel
            </button>
          </div>
        ) : (
          <button className="activity-value" onClick={() => setIsEditing(true)}>
            {calories > 0 ? `${calories} kcal` : 'Add activity'}
          </button>
        )}
      </div>

      <style>{`
        .activity-input {
          padding: 1rem;
          background: #252525;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        .activity-input.loading {
          color: #888;
        }
        .calorie-budget-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 0.75rem;
          margin-bottom: 0.75rem;
          border-bottom: 1px solid #333;
        }
        .budget-label {
          color: #888;
          font-size: 0.9rem;
        }
        .budget-calculation {
          font-size: 0.9rem;
          color: #aaa;
        }
        .budget-calculation strong {
          color: #fff;
          font-size: 1rem;
        }
        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .activity-label {
          font-weight: 500;
        }
        .activity-value {
          background: none;
          border: 1px dashed #555;
          padding: 0.5rem 1rem;
          cursor: pointer;
          border-radius: 4px;
          color: inherit;
          font-size: 1rem;
        }
        .activity-value:hover {
          border-color: #888;
          background: #333;
        }
        .activity-edit {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .activity-edit input {
          width: 80px;
          padding: 0.5rem;
        }
        .unit {
          color: #888;
        }
        .save-btn {
          background: #4caf50;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }
        .save-btn:hover:not(:disabled) {
          background: #43a047;
        }
        .save-btn:disabled {
          opacity: 0.6;
        }
        .cancel-btn {
          background: none;
          border: 1px solid #555;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          color: inherit;
        }
        .cancel-btn:hover {
          background: #333;
        }
      `}</style>
    </div>
  );
}
