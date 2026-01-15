import type { TargetDirection } from '@muffintop/shared/types';

interface ProgressIndicatorProps {
  label: string;
  current: number;
  target: number;
  direction: TargetDirection;
  unit: string;
}

export function ProgressIndicator({
  label,
  current,
  target,
  direction,
  unit,
}: ProgressIndicatorProps) {
  const percentage = target > 0 ? (current / target) * 100 : 0;
  const isOver = percentage > 100;

  // For 'min' targets: green when met/over, yellow when close, red when far
  // For 'max' targets: green when under, yellow when close, red when over
  const getColor = () => {
    if (direction === 'min') {
      if (percentage >= 100) return '#4caf50'; // green - met
      if (percentage >= 75) return '#ff9800'; // yellow - close
      return '#f44336'; // red - far
    } else {
      if (percentage <= 75) return '#4caf50'; // green - plenty of room
      if (percentage <= 100) return '#ff9800'; // yellow - close to limit
      return '#f44336'; // red - over limit
    }
  };

  const getStatusText = () => {
    const remaining = target - current;
    if (direction === 'min') {
      if (isOver) {
        return `Goal met! +${Math.abs(remaining).toFixed(0)}${unit}`;
      }
      return `${remaining.toFixed(0)}${unit} to go`;
    } else {
      if (isOver) {
        return `${Math.abs(remaining).toFixed(0)}${unit} over`;
      }
      return `${remaining.toFixed(0)}${unit} remaining`;
    }
  };

  const displayPercentage = Math.min(percentage, 100);

  return (
    <div className="progress-indicator">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className="progress-values">
          {current.toFixed(0)} / {target}
          {unit}
        </span>
      </div>
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{
            width: `${displayPercentage}%`,
            backgroundColor: getColor(),
          }}
        />
      </div>
      <div className="progress-status" style={{ color: getColor() }}>
        {getStatusText()}
      </div>

      <style>{`
        .progress-indicator {
          margin-bottom: 0.75rem;
        }
        .progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
        }
        .progress-label {
          font-weight: 500;
        }
        .progress-values {
          color: #888;
        }
        .progress-bar-container {
          height: 8px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        .progress-status {
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
}
