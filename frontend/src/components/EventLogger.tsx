import { useState } from 'react';
import { useCreateEvent } from '../hooks/useEvents';
import { useRatedSeries, useUpsertRatedSeries } from '../hooks/useRatedSeries';
import type { RatingDirection } from '@muffintop/shared/types';

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

const NEW_SERIES = '__new__';

type EventType = 'discrete' | 'rating';

interface EventLoggerProps {
  onLogged?: () => void;
}

export function EventLogger({ onLogged }: EventLoggerProps) {
  const [eventType, setEventType] = useState<EventType>('discrete');
  const [date, setDate] = useState(getToday());
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#ff6b6b');
  const [error, setError] = useState<string | null>(null);

  // Rated-event state
  const [seriesChoice, setSeriesChoice] = useState<string>(NEW_SERIES);
  const [newSeriesName, setNewSeriesName] = useState('');
  const [direction, setDirection] = useState<RatingDirection>('higher_better');
  const [rating, setRating] = useState(5);

  const { data: ratedSeries } = useRatedSeries();
  const createEvent = useCreateEvent();
  const upsertSeries = useUpsertRatedSeries();

  const isNewSeries = seriesChoice === NEW_SERIES;
  const selectedSeries = ratedSeries?.find((s) => s.description === seriesChoice);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (eventType === 'discrete') {
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
      return;
    }

    // Rated event
    const seriesName = isNewSeries ? newSeriesName.trim() : seriesChoice;
    if (!seriesName) {
      setError('Please choose or name a rated series');
      return;
    }
    if (seriesName.length > 100) {
      setError('Series name must be 100 characters or less');
      return;
    }
    const seriesColor = isNewSeries ? color : selectedSeries?.color ?? color;
    const seriesDirection = isNewSeries ? direction : selectedSeries?.direction ?? 'higher_better';

    try {
      // Ensure series metadata reflects the chosen direction/color
      await upsertSeries.mutateAsync({
        description: seriesName,
        direction: seriesDirection,
        color: seriesColor,
      });
      await createEvent.mutateAsync({
        eventDate: date,
        description: seriesName,
        color: seriesColor,
        rating,
      });
      if (isNewSeries) {
        // Keep logging the just-created series going forward
        setSeriesChoice(seriesName);
        setNewSeriesName('');
      }
      onLogged?.();
    } catch (err) {
      console.error('Failed to log rating:', err);
      setError('Failed to save rating. Please try again.');
    }
  };

  const pending = createEvent.isPending || upsertSeries.isPending;
  const submitDisabled =
    pending ||
    (eventType === 'discrete'
      ? !description.trim()
      : isNewSeries
        ? !newSeriesName.trim()
        : !seriesChoice);

  return (
    <form className="event-logger" onSubmit={handleSubmit}>
      {/* Event type toggle */}
      <div className="type-toggle">
        <button
          type="button"
          className={eventType === 'discrete' ? 'active' : ''}
          onClick={() => setEventType('discrete')}
        >
          Event
        </button>
        <button
          type="button"
          className={eventType === 'rating' ? 'active' : ''}
          onClick={() => setEventType('rating')}
        >
          Daily rating
        </button>
      </div>

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

        {eventType === 'discrete' ? (
          <>
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
              <ColorPicker color={color} setColor={setColor} />
            </div>
          </>
        ) : (
          <>
            <div className="input-group description-group">
              <label htmlFor="series-select">Rated series</label>
              <select
                id="series-select"
                value={seriesChoice}
                onChange={(e) => setSeriesChoice(e.target.value)}
              >
                {ratedSeries?.map((s) => (
                  <option key={s.description} value={s.description}>
                    {s.description}
                  </option>
                ))}
                <option value={NEW_SERIES}>+ New series…</option>
              </select>
            </div>

            {isNewSeries && (
              <>
                <div className="input-group description-group">
                  <label htmlFor="new-series-name">Series name</label>
                  <input
                    id="new-series-name"
                    type="text"
                    value={newSeriesName}
                    onChange={(e) => setNewSeriesName(e.target.value)}
                    placeholder="e.g., Mood, Sleep quality, Joint pain"
                    maxLength={100}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="series-direction">10 means</label>
                  <select
                    id="series-direction"
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as RatingDirection)}
                  >
                    <option value="higher_better">Better (higher is good)</option>
                    <option value="higher_worse">Worse (higher is bad)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Color</label>
                  <ColorPicker color={color} setColor={setColor} />
                </div>
              </>
            )}

            <div className="input-group rating-group">
              <label htmlFor="rating-slider">Rating: {rating}</label>
              <input
                id="rating-slider"
                type="range"
                min={1}
                max={10}
                step={1}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              />
            </div>
          </>
        )}

        <button type="submit" disabled={submitDisabled}>
          {pending ? 'Saving…' : eventType === 'discrete' ? 'Add Event' : 'Add Rating'}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      <style>{`
        .event-logger {
          margin-top: 1rem;
        }
        .type-toggle {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        .type-toggle button {
          padding: 0.35rem 0.85rem;
          border-radius: 4px;
          border: 1px solid #444;
          background: transparent;
          color: #aaa;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .type-toggle button.active {
          background: #646cff;
          color: white;
          border-color: #646cff;
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
        .input-group input[type="text"],
        .input-group select {
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
        .description-group input,
        .description-group select {
          width: 100%;
        }
        .rating-group {
          min-width: 180px;
        }
        .rating-group input[type="range"] {
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

function ColorPicker({ color, setColor }: { color: string; setColor: (c: string) => void }) {
  return (
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
  );
}
