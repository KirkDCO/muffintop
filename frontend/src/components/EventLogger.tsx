import { useState } from 'react';
import { useCreateEvent } from '../hooks/useEvents';

function getToday(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const PRESET_COLORS = [
  { value: '#ff6b6b', label: 'Red' },
  { value: '#ffa94d', label: 'Orange' },
  { value: '#ffd43b', label: 'Yellow' },
  { value: '#69db7c', label: 'Green' },
  { value: '#74c0fc', label: 'Blue' },
  { value: '#b197fc', label: 'Purple' },
];

interface EventLoggerProps {
  onLogged?: () => void;
}

export function EventLogger({ onLogged }: EventLoggerProps) {
  const [date, setDate] = useState(getToday());
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#ff6b6b');
  const [error, setError] = useState<string | null>(null);

  const createEvent = useCreateEvent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    if (description.length > 100) {
      setError('Description must be 100 characters or less');
      return;
    }

    try {
      await createEvent.mutateAsync({
        eventDate: date,
        description: description.trim(),
        color,
      });
      setDescription('');
      onLogged?.();
    } catch (err) {
      console.error('Failed to log event:', err);
      setError('Failed to save event. Please try again.');
    }
  };

  return (
    <form className="event-logger" onSubmit={handleSubmit}>
      <div className="event-inputs">
        <div className="input-group">
          <label htmlFor="event-date">Date</label>
          <input
            id="event-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="input-group description-group">
          <label htmlFor="event-description">Description</label>
          <input
            id="event-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Cold, GI upset, Food poisoning"
            maxLength={100}
          />
        </div>

        <div className="input-group">
          <label htmlFor="event-color">Color</label>
          <div className="color-picker">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`color-swatch ${color === c.value ? 'selected' : ''}`}
                style={{ backgroundColor: c.value }}
                onClick={() => setColor(c.value)}
                title={c.label}
              />
            ))}
          </div>
        </div>

        <button type="submit" disabled={createEvent.isPending || !description.trim()}>
          {createEvent.isPending ? 'Saving...' : 'Add Event'}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      <style>{`
        .event-logger {
          margin-top: 1rem;
        }
        .event-inputs {
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
        .input-group input[type="text"] {
          padding: 0.5rem;
          background: #252525;
          border: 1px solid #444;
          border-radius: 4px;
          color: white;
          font-size: 1rem;
        }
        .description-group {
          flex: 1;
          min-width: 200px;
        }
        .description-group input {
          width: 100%;
        }
        .color-picker {
          display: flex;
          gap: 0.25rem;
        }
        .color-swatch {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          border: 2px solid transparent;
          cursor: pointer;
          padding: 0;
        }
        .color-swatch:hover {
          border-color: #888;
        }
        .color-swatch.selected {
          border-color: white;
        }
        .event-logger button[type="submit"] {
          padding: 0.5rem 1rem;
          background: #646cff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .event-logger button[type="submit"]:hover:not(:disabled) {
          background: #535bf2;
        }
        .event-logger button[type="submit"]:disabled {
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
